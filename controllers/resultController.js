import db from "../config/db.js";
import admin from "firebase-admin";

const eventsRef = db.collection("events");

// Helper: compute score based on grade and position
const computeScore = (grade, position) => {
  const g = String(grade || "").toUpperCase();
  const p = Number(position);
  const table = {
    A: { 1: 8, 2: 7, 3: 6 },
    B: { 1: 6, 2: 5, 3: 4 },
  };
  if (!table[g] || !table[g][p]) return null;
  return table[g][p];
};

// Helper: add a timeout to async operations to avoid hanging requests
const withTimeout = (promise, ms, label = "operation") => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`${label} timeout after ${ms}ms`)),
      ms
    );
  });
  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    timeoutPromise,
  ]);
};

// ✅ Create new event (Admin only)
export const createEvent = async (req, res) => {
  try {
    const { id, name } = req.body;

    await eventsRef.doc(id).set({
      name,
      participants: [],
      results: [],
      extraAwards: [],
      status: "not_published",
      createdBy: req.user?.uid || null,
      createdAt: new Date().toISOString(),
    });

    res.json({ success: true, message: "Event created ✅" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEvents = async (req, res) => {
  try {
    const snapshot = await eventsRef.get();
    let events = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (req.user) {
      events = events.filter((event) => event.createdBy === req.user.uid);
    }

    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const eventRef = db.collection("events").doc(id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    return res.status(200).json({
      id: eventDoc.id,
      ...eventDoc.data(),
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getCandidates = async (req, res) => {
  try {
    const { id } = req.params;

    const candidatesSnapshot = await admin
      .firestore()
      .collection("events")
      .doc(id)
      .collection("candidates")
      .get();

    const candidates = candidatesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({
      eventId: id,
      candidates: candidates,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const { candidates } = req.body || {};

    // Validate payload
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res
        .status(400)
        .json({ error: "Candidates are required and must be a non-empty array" });
    }

    // Normalize and validate each candidate
    const normalized = candidates.map((c, idx) => {
      if (!c || typeof c.name !== "string" || !c.name.trim()) {
        throw new Error(`Candidate[${idx}] must include a non-empty 'name'`);
      }
      return {
        name: c.name.trim(),
        nameKey: c.name.trim().toLowerCase(), // used for uniqueness (case-insensitive)
        id: typeof c.id === "string" && c.id.trim() ? c.id.trim() : null,
      };
    });

    // Check duplicates within the incoming payload
    const seen = new Set();
    const dupInPayload = [];
    for (const c of normalized) {
      if (seen.has(c.nameKey)) dupInPayload.push(c.name);
      seen.add(c.nameKey);
    }
    if (dupInPayload.length) {
      return res.status(400).json({
        error: `Duplicate candidate names in payload: ${[...new Set(dupInPayload)].join(", ")}`,
      });
    }

    const eventDoc = await eventsRef.doc(id).get();
    if (!eventDoc.exists)
      return res.status(404).json({ error: "Event not found" });

    const batch = admin.firestore().batch();

    // Load existing candidates for this event and block duplicates
    const existingSnapshot = await admin
      .firestore()
      .collection("events")
      .doc(id)
      .collection("candidates")
      .get();

    const existingNameKeys = new Set(
      existingSnapshot.docs
        .map((d) => (d.data()?.name || ""))
        .map((n) => n.trim().toLowerCase())
    );

    const conflicts = normalized
      .filter((c) => existingNameKeys.has(c.nameKey))
      .map((c) => c.name);
    if (conflicts.length) {
      return res.status(400).json({
        error: `Candidate names already exist: ${[...new Set(conflicts)].join(", ")}`,
      });
    }

    // Commit batch insert
    for (const c of normalized) {
      const candidateRef = admin
        .firestore()
        .collection("events")
        .doc(id)
        .collection("candidates")
        .doc(); // auto-id

      batch.set(candidateRef, {
        name: c.name, // preserve original casing
        id: c.id || candidateRef.id,
      });
    }

    await batch.commit();
    res.json({ success: true, message: "Candidates added ✅" });
  } catch (error) {
    const msg = error?.message || "Failed to add candidates";
    const status = msg.startsWith("Candidate[") ? 400 : 500;
    res.status(status).json({ error: msg });
  }
};

// ✅ Get teams of an event with calculated scores from published results
export const getTeams = async (req, res) => {
  try {
    const { id } = req.params;

    // Get teams from subcollection
    const teamsSnapshot = await admin
      .firestore()
      .collection("events")
      .doc(id)
      .collection("teams")
      .get();

    const teams = teamsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get event data to access results
    const eventDoc = await eventsRef.doc(id).get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    const eventData = eventDoc.data();
    const results = eventData.results || [];

    // Get published programs to filter results
    const programsSnapshot = await admin
      .firestore()
      .collection("events")
      .doc(id)
      .collection("programs")
      .get();

    const publishedPrograms = new Set();
    programsSnapshot.docs.forEach(doc => {
      const programData = doc.data();
      if (programData.status === "published") {
        publishedPrograms.add(programData.title);
      }
    });

    // Filter results to only include published programs
    const publishedResults = results.filter(result => 
      publishedPrograms.has(result.programName)
    );

    // Calculate total scores for each team
    const teamScores = {};
    
    // Initialize all teams with 0 score - try multiple possible team name properties
    teams.forEach(team => {
      const teamKey = team.name || team.teamName || team.title;
      teamScores[teamKey] = {
        totalScore: 0,
        resultsCount: 0,
        programResults: []
      };
    });

    // Sum up scores from published results - try multiple possible team properties
    publishedResults.forEach(result => {
      const teamName = result.participantTeam || result.teamName || result.team || result.participantName;
      
      // Try to find matching team by checking all possible team name variations
      let matchingTeamKey = null;
      for (const [key, value] of Object.entries(teamScores)) {
        if (key === teamName) {
          matchingTeamKey = key;
          break;
        }
      }
      
      if (matchingTeamKey) {
        teamScores[matchingTeamKey].totalScore += result.score || 0;
        teamScores[matchingTeamKey].resultsCount += 1;
        teamScores[matchingTeamKey].programResults.push({
          programName: result.programName,
          position: result.position,
          grade: result.grade,
          score: result.score
        });
      } else {
        console.log(`No matching team found for result:`, { 
          teamName, 
          availableTeams: Object.keys(teamScores) 
        });
      }
    });

    // Add calculated scores to teams
    const teamsWithScores = teams.map(team => {
      const teamKey = team.name || team.teamName || team.title;
      return {
        ...team,
        totalScore: teamScores[teamKey]?.totalScore || 0,
        resultsCount: teamScores[teamKey]?.resultsCount || 0,
        programResults: teamScores[teamKey]?.programResults || []
      };
    });

    // Sort teams by total score (highest first)
    teamsWithScores.sort((a, b) => b.totalScore - a.totalScore);

    res.json({
      eventId: id,
      teams: teamsWithScores,
      totalPublishedPrograms: publishedPrograms.size,
      totalResults: publishedResults.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Add teams (Admin only)
// ✅ Add teams (Admin only)
export const addTeams = async (req, res) => {
  try {
    const { id } = req.params;
    let teams = req.body;

    if (process.env.NODE_ENV !== "production") {
      console.log(`[addTeams] incoming eventId=${id}`);
      console.log(`[addTeams] raw body type=${typeof req.body}`, req.body);
    }

    // If body is wrapped in { teams: [...] }, unwrap it
    if (req.body.teams) {
      teams = req.body.teams;
    }

    // Validate input
    if (!Array.isArray(teams)) {
      return res.status(400).json({ error: "Teams must be sent as an array" });
    }

    if (teams.length === 0) {
      return res.status(400).json({ error: "At least one team is required" });
    }

    for (const team of teams) {
      if (!team.name) {
        return res.status(400).json({ error: "Each team must have a name" });
      }
    }

    // Check if event exists
    const eventDoc = await withTimeout(
      eventsRef.doc(id).get(),
      10000,
      "Fetch event"
    );
    if (!eventDoc.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Add teams to the "teams" subcollection
    const batch = admin.firestore().batch();

    teams.forEach((team) => {
      const teamRef = admin
        .firestore()
        .collection("events")
        .doc(id)
        .collection("teams")
        .doc(); // Auto-generate ID

      batch.set(teamRef, {
        id: team.id || teamRef.id,
        name: team.name,
        description: team.description || "",
        createdAt: new Date(),
      });
    });

    await withTimeout(batch.commit(), 15000, "Add teams commit");

    return res.json({ success: true, message: "Teams added ✅" });
  } catch (error) {
    console.error("Error adding teams:", error);
    const msg = error?.message || "Failed to add teams";
    // Distinguish timeouts for clearer client feedback
    const status = msg.includes("timeout") ? 504 : 500;
    return res.status(status).json({ error: msg });
  }
};

export const saveResults = async (req, res) => {
  try {
    const { id } = req.params;
    const { results, extraAwards } = req.body || {};

    const docRef = eventsRef.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "Event not found" });

    if (!Array.isArray(results) || results.length === 0) {
      return res
        .status(400)
        .json({ error: "Results are required and must be a non-empty array" });
    }

    // Validate and normalize results
    const normalizedResults = results.map((r, idx) => {
      const {
        programName,
        position,
        participantId,
        participantName,
        grade,
        score,
        category,
      } = r || {};

      if (!programName || typeof programName !== "string" || !programName.trim()) {
        throw new Error(`Result[${idx}]: 'programName' is required`);
      }

      const pos = Number(position);
      if (![1, 2, 3].includes(pos)) {
        throw new Error(`Result[${idx}]: 'position' must be 1, 2, or 3`);
      }

      const g = String(grade || "").toUpperCase();
      if (!g || !["A", "B"].includes(g)) {
        throw new Error(`Result[${idx}]: 'grade' must be 'A' or 'B'`);
      }

      const expected = computeScore(g, pos);
      if (expected == null) {
        throw new Error(`Result[${idx}]: invalid grade/position combo`);
      }

      let finalScore = score;
      if (finalScore == null) {
        finalScore = expected;
      }
      if (!Number.isInteger(finalScore)) {
        throw new Error(`Result[${idx}]: 'score' must be an integer`);
      }
      if (finalScore !== expected) {
        throw new Error(
          `Result[${idx}]: 'score' must be ${expected} for position ${pos} with grade ${g}`
        );
      }

      return {
        programName: programName.trim(),
        position: pos,
        participantId: participantId || null,
        participantName: participantName || null,
        grade: g,
        score: finalScore,
        category: category || null,
      };
    });

    await docRef.set(
      {
        results: normalizedResults,
        extraAwards: Array.isArray(extraAwards) ? extraAwards : [],
        status: "not_published",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    res.json({ success: true, message: "Results saved (draft) ✅" });
  } catch (error) {
    const status = error.message?.startsWith("Result[") ? 400 : 500;
    res.status(status).json({ error: error.message || "Failed to save results" });
  }
};

export const getResults = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await eventsRef.doc(id).get();

    if (!doc.exists) return res.status(404).json({ error: "Event not found" });

    const data = doc.data();
    const results = data.results || [];

    // Group results by program name
    const groupedResults = {};
    results.forEach(result => {
      const programName = result.programName;
      if (!groupedResults[programName]) {
        groupedResults[programName] = [];
      }
      
      // Remove programName from individual result object since it's now the key
      const { programName: _, ...resultWithoutProgramName } = result;
      groupedResults[programName].push(resultWithoutProgramName);
    });

    res.json({
      eventId: id,
      status: data.status,
      results: groupedResults,
      extraAwards: data.extraAwards || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get published results only (Public)
export const getPublishedResults = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await eventsRef.doc(id).get();

    if (!doc.exists) return res.status(404).json({ error: "Event not found" });

    const data = doc.data();

    // Get all programs for this event to check individual program status
    const programsSnapshot = await admin
      .firestore()
      .collection("events")
      .doc(id)
      .collection("programs")
      .get();

    const publishedPrograms = new Set();
    programsSnapshot.docs.forEach(doc => {
      const programData = doc.data();
      if (programData.status === "published") {
        publishedPrograms.add(programData.title);
      }
    });

    // Check if there are any published programs
    if (publishedPrograms.size === 0) {
      return res.status(404).json({ 
        error: "No published results available for this event" 
      });
    }

    const results = data.results || [];

    // Filter results to only include published programs
    const publishedResults = results.filter(result => 
      publishedPrograms.has(result.programName)
    );

    // Group published results by program name
    const groupedResults = {};
    publishedResults.forEach(result => {
      const programName = result.programName;
      if (!groupedResults[programName]) {
        groupedResults[programName] = [];
      }
      
      // Remove programName from individual result object since it's now the key
      const { programName: _, ...resultWithoutProgramName } = result;
      groupedResults[programName].push(resultWithoutProgramName);
    });

    res.json({
      eventId: id,
      status: data.status,
      results: groupedResults,
      extraAwards: data.extraAwards || [],
      publishedAt: data.publishedAt || null,
      totalPrograms: programsSnapshot.docs.length,
      publishedPrograms: publishedPrograms.size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Publish event results (Admin only)
export const publishEventResults = async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = eventsRef.doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Event not found" });

    await docRef.set(
      { status: "published", publishedAt: new Date().toISOString() },
      { merge: true }
    );

    return res
      .status(200)
      .json({ success: true, message: "Results published successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Publish program results (Admin only)
export const publishProgramResults = async (req, res) => {
  try {
    const { eventId, programId } = req.params;

    // Check if event exists
    const eventDoc = await admin
      .firestore()
      .collection("events")
      .doc(eventId)
      .get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if program exists
    const programRef = admin
      .firestore()
      .collection("events")
      .doc(eventId)
      .collection("programs")
      .doc(programId);

    const programDoc = await programRef.get();
    if (!programDoc.exists) {
      return res.status(404).json({ error: "Program not found" });
    }

    const programData = programDoc.data();

    // Check if program has results
    if (!programData.results || programData.results.length === 0) {
      return res.status(400).json({ 
        error: "Program has no results to publish. Please enter results first using the scores endpoint." 
      });
    }

    // Update program with published status
    await programRef.update({
      status: "published",
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: "Program results published successfully",
      programTitle: programData.title,
      resultsCount: programData.results.length
    });
  } catch (error) {
    console.error("Error publishing program results:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const addProgram = async (req, res) => {
  const eventId = req.params.id;
  const { title, candidates: selectedCandidates, results } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  if (!selectedCandidates || !Array.isArray(selectedCandidates)) {
    return res
      .status(400)
      .json({ error: "Candidates are required and must be an array" });
  }

  // Validate that each candidate has name and team
  for (const candidate of selectedCandidates) {
    if (!candidate.name || !candidate.team) {
      return res.status(400).json({
        error: "Each candidate must have both 'name' and 'team' properties",
      });
    }
  }

  try {
    // Get existing candidates
    const candidatesSnapshot = await admin
      .firestore()
      .collection("events")
      .doc(eventId)
      .collection("candidates")
      .get();

    // Get existing teams
    const teamsSnapshot = await admin
      .firestore()
      .collection("events")
      .doc(eventId)
      .collection("teams")
      .get();

    console.log("Raw candidate documents:");
    candidatesSnapshot.docs.forEach((doc) => {
      console.log("Document ID:", doc.id, "Data:", doc.data());
    });

    console.log("Raw team documents:");
    teamsSnapshot.docs.forEach((doc) => {
      console.log("Team ID:", doc.id, "Data:", doc.data());
    });

    const existingCandidates = candidatesSnapshot.docs.map(
      (doc) => doc.data().name
    );
    const existingTeams = teamsSnapshot.docs.map((doc) => doc.data().name);

    console.log("Event ID:", eventId);
    console.log("Existing candidates:", existingCandidates);
    console.log("Existing teams:", existingTeams);
    console.log("Selected candidates:", selectedCandidates);

    // Check that all selected candidates exist
    const invalidCandidates = selectedCandidates.filter(
      (c) => !existingCandidates.includes(c.name)
    );
    if (invalidCandidates.length) {
      return res.status(400).json({
        error: `Invalid candidates: ${invalidCandidates
          .map((c) => c.name)
          .join(", ")}`,
      });
    }

    // Check that all teams exist
    const invalidTeams = selectedCandidates.filter(
      (c) => !existingTeams.includes(c.team)
    );
    if (invalidTeams.length) {
      return res.status(400).json({
        error: `Invalid teams: ${[
          ...new Set(invalidTeams.map((c) => c.team)),
        ].join(", ")}`,
      });
    }

    if (results) {
      const invalidResults = Object.keys(results).filter(
        (r) => !existingCandidates.includes(r)
      );
      if (invalidResults.length) {
        return res.status(400).json({
          error: `Results include invalid candidates: ${invalidResults.join(
            ", "
          )}`,
        });
      }
    }

    const programRef = admin
      .firestore()
      .collection("events")
      .doc(eventId)
      .collection("programs")
      .doc();

    const programData = {
      id: programRef.id,
      title,
      candidates: selectedCandidates,
      results: results || null,
      createdAt: new Date(),
    };

    await programRef.set(programData);
    res
      .status(201)
      .json({ message: "Program added successfully", program: programData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add program" });
  }
};

export const getPrograms = async (req, res) => {
  const eventId = req.params.id;

  try {
    const programsSnapshot = await admin
      .firestore()
      .collection("events")
      .doc(eventId)
      .collection("programs")
      .get();
    const programs = programsSnapshot.docs.map((doc) => doc.data());

    if (!programs.length) {
      return res
        .status(404)
        .json({ error: "No programs found for this event" });
    }

    res.json(programs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch programs" });
  }
};

// New function for score-based result input
export const updateProgramResultsByScore = async (req, res) => {
  const { eventId, programId } = req.params;
  const { scores } = req.body;

  // Expected format: { "Candidate Name": 8, "Another Name": 7, "Third": 6 }
  // Where numbers are the scores that determine both position and grade:
  // 8 = 1st Place with A grade
  // 7 = 1st Place with B grade OR 2nd Place with A grade
  // 6 = 2nd Place with B grade OR 3rd Place with A grade  
  // 5 = 3rd Place with B grade

  if (!scores || typeof scores !== 'object') {
    return res.status(400).json({ error: "Scores are required and must be an object with candidate names as keys and scores as values" });
  }

  try {
    const eventDoc = await admin
      .firestore()
      .collection("events")
      .doc(eventId)
      .get();
    if (!eventDoc.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    const programRef = admin
      .firestore()
      .collection("events")
      .doc(eventId)
      .collection("programs")
      .doc(programId);

    const programDoc = await programRef.get();
    if (!programDoc.exists) {
      return res.status(404).json({ error: "Program not found" });
    }

    const programData = programDoc.data();
    
    // Get existing candidates for validation
    const candidatesSnapshot = await admin
      .firestore()
      .collection("events")
      .doc(eventId)
      .collection("candidates")
      .get();

    const existingCandidates = candidatesSnapshot.docs.map(
      (doc) => doc.data().name
    );

    // Create a map of candidate name to team from program candidates
    const candidateTeamMap = {};
    if (programData.candidates) {
      programData.candidates.forEach(candidate => {
        candidateTeamMap[candidate.name] = candidate.team;
      });
    }

    // Validate all candidates exist
    const invalidCandidates = Object.keys(scores).filter(
      (candidateName) => !existingCandidates.includes(candidateName)
    );
    if (invalidCandidates.length) {
      return res.status(400).json({
        error: `Scores include invalid candidates: ${invalidCandidates.join(", ")}`,
      });
    }

    // Validate scores are numbers and are valid values
    const validScores = [8, 7, 6, 5];
    const invalidScores = Object.entries(scores).filter(
      ([name, score]) => !validScores.includes(Number(score))
    );
    if (invalidScores.length) {
      return res.status(400).json({
        error: `Scores must be one of: 8, 7, 6, 5. Invalid scores for: ${invalidScores.map(([name]) => name).join(", ")}`,
      });
    }

    // Helper function to determine position and grade from score
    const getPositionAndGrade = (score) => {
      switch (Number(score)) {
        case 8: return { position: 1, grade: 'A' };
        case 7: return { position: 1, grade: 'B' }; // Can also be 2nd A, but we'll default to 1st B
        case 6: return { position: 2, grade: 'B' }; // Can also be 3rd A, but we'll default to 2nd B  
        case 5: return { position: 3, grade: 'B' };
        default: return { position: null, grade: null };
      }
    };

    // Process scores and assign positions/grades
    const scoreEntries = Object.entries(scores).map(([name, score]) => {
      const { position, grade } = getPositionAndGrade(score);
      return {
        name,
        score: Number(score),
        position,
        grade,
        team: candidateTeamMap[name] || "Unknown Team"
      };
    });

    // Sort by score descending (highest score first)
    scoreEntries.sort((a, b) => b.score - a.score);

    // For cases where we have multiple people with score 7 or 6, we need to assign different positions
    // Group by score and assign positions within each score group
    const processedResults = [];
    const scoreGroups = {};
    
    // Group candidates by score
    scoreEntries.forEach(entry => {
      if (!scoreGroups[entry.score]) {
        scoreGroups[entry.score] = [];
      }
      scoreGroups[entry.score].push(entry);
    });

    // Process each score group and assign positions
    Object.keys(scoreGroups).sort((a, b) => b - a).forEach(score => {
      const group = scoreGroups[score];
      const scoreNum = Number(score);
      
      if (scoreNum === 7) {
        // For score 7: first gets 1st B, second gets 2nd A, etc.
        group.forEach((entry, index) => {
          if (index === 0) {
            entry.position = 1;
            entry.grade = 'B';
          } else {
            entry.position = 2;
            entry.grade = 'A';
          }
          processedResults.push(entry);
        });
      } else if (scoreNum === 6) {
        // For score 6: first gets 2nd B, second gets 3rd A, etc.
        group.forEach((entry, index) => {
          if (index === 0) {
            entry.position = 2;
            entry.grade = 'B';
          } else {
            entry.position = 3;
            entry.grade = 'A';
          }
          processedResults.push(entry);
        });
      } else {
        // For scores 8 and 5, just add as is
        group.forEach(entry => {
          processedResults.push(entry);
        });
      }
    });

    // Create enhanced results for program storage
    const enhancedResults = processedResults.map(result => ({
      name: result.name,
      team: result.team,
      score: result.score,
      position: `${result.position}${getOrdinalSuffix(result.position)} Place`,
      grade: result.grade
    }));

    // Update the program with enhanced results
    await programRef.update({
      results: enhancedResults,
      updatedAt: new Date(),
    });

    // Save to main event results collection
    const mainEventResults = processedResults
      .filter(result => [1, 2, 3].includes(result.position)) // Only top 3
      .map(result => ({
        programName: programData.title,
        position: result.position,
        participantName: result.name,
        participantTeam: result.team,
        grade: result.grade,
        score: result.score,
        category: null
      }));

    // Update main event results
    if (mainEventResults.length > 0) {
      const eventRef = admin.firestore().collection("events").doc(eventId);
      const eventData = eventDoc.data();
      const existingResults = eventData.results || [];
      
      // Remove any existing results for this program to avoid duplicates
      const filteredResults = existingResults.filter(
        result => result.programName !== programData.title
      );
      
      // Add new results
      const updatedResults = [...filteredResults, ...mainEventResults];
      
      await eventRef.update({
        results: updatedResults,
        updatedAt: new Date().toISOString(),
      });
    }

    res.json({ 
      message: "Program results updated successfully with score-based input",
      resultsWithPositions: enhancedResults,
      mainEventResultsAdded: mainEventResults.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update program results" });
  }
};

// Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
const getOrdinalSuffix = (number) => {
  const j = number % 10;
  const k = number % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};
