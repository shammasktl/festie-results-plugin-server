import db from "../config/db.js";
import admin from "firebase-admin";

const eventsRef = db.collection("events");

// Helper: compute score based on grade and position with new scoring system (1-11)
const computeScore = (grade, position) => {
  const g = String(grade || "").toUpperCase();
  const p = Number(position);
  
  // New scoring system mapping:
  // Score 11 = 1st Place with A grade
  // Score 10 = 2nd Place with A grade  
  // Score 9 = 3rd Place with A grade
  // Score 8 = A grade without position
  // Score 7 = 1st Place with B grade
  // Score 6 = 2nd Place with B grade
  // Score 5 = 3rd Place with B grade
  // Score 4 = B grade without position
  // Score 3 = 1st Place without grade
  // Score 2 = 2nd Place without grade
  // Score 1 = 3rd Place without grade
  
  if (g === "A" && p === 1) return 11;
  if (g === "A" && p === 2) return 10;
  if (g === "A" && p === 3) return 9;
  if (g === "A" && (!p || p === 0)) return 8; // A grade only
  if (g === "B" && p === 1) return 7;
  if (g === "B" && p === 2) return 6;
  if (g === "B" && p === 3) return 5;
  if (g === "B" && (!p || p === 0)) return 4; // B grade only
  if (!g && p === 1) return 3; // Position only
  if (!g && p === 2) return 2; // Position only
  if (!g && p === 3) return 1; // Position only
  
  return null; // Invalid combination
};

// Helper: get position and grade from score (reverse mapping)
const getPositionGradeFromScore = (score) => {
  const scoreMap = {
    11: { position: "1st Place", grade: "A" },
    10: { position: "2nd Place", grade: "A" },
    9: { position: "3rd Place", grade: "A" },
    8: { position: null, grade: "A" },
    7: { position: "1st Place", grade: "B" },
    6: { position: "2nd Place", grade: "B" },
    5: { position: "3rd Place", grade: "B" },
    4: { position: null, grade: "B" },
    3: { position: "1st Place", grade: null },
    2: { position: "2nd Place", grade: null },
    1: { position: "3rd Place", grade: null }
  };
  
  return scoreMap[score] || { position: null, grade: null };
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
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Event name is required" });
    }

    // Generate unique event ID
    const generateEventId = (eventName) => {
      const cleanName = eventName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 30); // Limit length
      
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
      const randomSuffix = Math.random().toString(36).substring(2, 6); // 4 random characters
      
      return `${cleanName}_${timestamp}_${randomSuffix}`;
    };

    const eventId = generateEventId(name);

    const eventData = {
      name: name.trim(),
      participants: [],
      results: [],
      extraAwards: [],
      status: "not_published",
      createdBy: req.user?.uid || null,
      createdAt: new Date().toISOString(),
    };

    await eventsRef.doc(eventId).set(eventData);

    res.json({ 
      success: true, 
      message: "Event created ✅", 
      eventId: eventId,
      event: { id: eventId, ...eventData }
    });
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
      if (!c.team || typeof c.team !== "string" || !c.team.trim()) {
        throw new Error(`Candidate[${idx}] must include a non-empty 'team'`);
      }
      return {
        name: c.name.trim(),
        team: c.team.trim(),
        nameKey: c.name.trim().toLowerCase(), // used for uniqueness (case-insensitive)
        id: typeof c.id === "string" && c.id.trim() ? c.id.trim() : null,
      };
    });

    // Get existing teams to validate team names
    const teamsSnapshot = await admin
      .firestore()
      .collection("events")
      .doc(id)
      .collection("teams")
      .get();

    const existingTeams = new Set(
      teamsSnapshot.docs.map(doc => doc.data().name)
    );

    // Validate that all teams exist
    const invalidTeams = normalized.filter(c => !existingTeams.has(c.team));
    if (invalidTeams.length) {
      const uniqueInvalidTeams = [...new Set(invalidTeams.map(c => c.team))];
      return res.status(400).json({
        error: `Invalid team names: ${uniqueInvalidTeams.join(", ")}. Please add these teams first using the teams endpoint.`
      });
    }

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
        team: c.team, // team assignment
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
        programResults: {},  // Changed to object to group by program
        programs: new Set()  // Track unique programs this team participated in
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
        teamScores[matchingTeamKey].programs.add(result.programName);
        
        // Group results by program
        if (!teamScores[matchingTeamKey].programResults[result.programName]) {
          teamScores[matchingTeamKey].programResults[result.programName] = [];
        }
        teamScores[matchingTeamKey].programResults[result.programName].push({
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
      const teamData = teamScores[teamKey];
      
      return {
        ...team,
        totalScore: teamData?.totalScore || 0,
        resultsCount: teamData?.resultsCount || 0,
        programsCount: teamData?.programs.size || 0,  // Count of unique programs
        programs: teamData?.programResults || {}  // Results grouped by program
      };
    });

    // Sort teams by total score (highest first)
    teamsWithScores.sort((a, b) => b.totalScore - a.totalScore);

    res.json({
      eventId: id,
      teams: teamsWithScores,
      totalPublishedPrograms: publishedPrograms.size,
      totalResults: publishedResults.length,
      summary: {
        totalTeams: teams.length,
        teamsWithResults: teamsWithScores.filter(team => team.resultsCount > 0).length,
        programsWithResults: publishedPrograms.size
      }
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

      // Handle new scoring system (1-11) with flexible position/grade validation
      const pos = position ? Number(position) : null;
      const g = grade ? String(grade).toUpperCase() : null;

      // Validate position if provided
      if (pos !== null && ![1, 2, 3].includes(pos)) {
        throw new Error(`Result[${idx}]: 'position' must be 1, 2, or 3, or null`);
      }

      // Validate grade if provided
      if (g !== null && !["A", "B"].includes(g)) {
        throw new Error(`Result[${idx}]: 'grade' must be 'A', 'B', or null`);
      }

      // Calculate expected score based on position and grade
      const expected = computeScore(g, pos);
      if (expected == null) {
        throw new Error(`Result[${idx}]: invalid grade/position combination`);
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
          `Result[${idx}]: 'score' must be ${expected} for position ${pos} with grade ${g} (New scoring: 1-11)`
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

  try {
    // Get existing candidates with their team assignments
    const candidatesSnapshot = await admin
      .firestore()
      .collection("events")
      .doc(eventId)
      .collection("candidates")
      .get();

    // Create a map of candidate name to candidate data (including team)
    const candidateMap = {};
    candidatesSnapshot.docs.forEach((doc) => {
      const candidateData = doc.data();
      candidateMap[candidateData.name] = {
        name: candidateData.name,
        team: candidateData.team,
        id: candidateData.id || doc.id
      };
    });

    // Process selectedCandidates - they can be just names or objects with name/team
    const processedCandidates = selectedCandidates.map((candidate, index) => {
      let candidateName;
      
      // Handle both string names and objects
      if (typeof candidate === 'string') {
        candidateName = candidate;
      } else if (candidate && candidate.name) {
        candidateName = candidate.name;
      } else {
        throw new Error(`Candidate[${index}] must be a string name or object with 'name' property`);
      }

      // Look up the candidate in our database
      const existingCandidate = candidateMap[candidateName];
      if (!existingCandidate) {
        throw new Error(`Candidate '${candidateName}' not found in event candidates`);
      }

      // Return candidate with automatically populated team
      return {
        name: existingCandidate.name,
        team: existingCandidate.team,
        id: existingCandidate.id
      };
    });

    // Validate results if provided
    if (results) {
      const candidateNames = processedCandidates.map(c => c.name);
      const invalidResults = Object.keys(results).filter(
        (r) => !candidateNames.includes(r)
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
      candidates: processedCandidates, // Now includes automatically populated teams
      results: results || null,
      createdAt: new Date(),
    };

    await programRef.set(programData);
    res
      .status(201)
      .json({ 
        message: "Program added successfully", 
        program: programData,
        candidatesWithTeams: processedCandidates.length
      });
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

  // Updated scoring system (1-11):
  // Score 11 = 1st Place with A grade
  // Score 10 = 2nd Place with A grade  
  // Score 9 = 3rd Place with A grade
  // Score 8 = A grade without position
  // Score 7 = 1st Place with B grade
  // Score 6 = 2nd Place with B grade
  // Score 5 = 3rd Place with B grade
  // Score 4 = B grade without position
  // Score 3 = 1st Place without grade
  // Score 2 = 2nd Place without grade
  // Score 1 = 3rd Place without grade

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

    // Validate scores are numbers and are valid values (1-11)
    const validScores = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    const invalidScores = Object.entries(scores).filter(
      ([name, score]) => !validScores.includes(Number(score))
    );
    if (invalidScores.length) {
      return res.status(400).json({
        error: `Scores must be one of: 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1. Invalid scores for: ${invalidScores.map(([name]) => name).join(", ")}`,
      });
    }

    // Process scores and assign positions/grades using the helper function
    const processedResults = Object.entries(scores).map(([name, score]) => {
      const { position, grade } = getPositionGradeFromScore(Number(score));
      return {
        name,
        score: Number(score),
        position,
        grade,
        team: candidateTeamMap[name] || "Unknown Team"
      };
    });

    // Sort by score descending (highest score first)
    processedResults.sort((a, b) => b.score - a.score);

    // Create enhanced results for program storage
    const enhancedResults = processedResults.map(result => ({
      name: result.name,
      team: result.team,
      score: result.score,
      position: result.position,
      grade: result.grade
    }));

    // Update the program with enhanced results
    await programRef.update({
      results: enhancedResults,
      updatedAt: new Date(),
    });

    // Save to main event results collection (only results with positions)
    const mainEventResults = processedResults
      .filter(result => result.position !== null) // Only results with positions
      .map(result => ({
        programName: programData.title,
        position: result.position === "1st Place" ? 1 : result.position === "2nd Place" ? 2 : result.position === "3rd Place" ? 3 : null,
        participantName: result.name,
        participantTeam: result.team,
        grade: result.grade,
        score: result.score,
        category: null
      }))
      .filter(result => result.position !== null); // Final filter to ensure valid positions

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
      message: "Program results updated successfully with new scoring system (1-11)",
      resultsWithPositions: enhancedResults,
      mainEventResultsAdded: mainEventResults.length,
      scoringSystem: "Scores 1-11: 11=1st A, 10=2nd A, 9=3rd A, 8=A grade only, 7=1st B, 6=2nd B, 5=3rd B, 4=B grade only, 3=1st only, 2=2nd only, 1=3rd only"
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

// Strategic results selection for team ranking manipulation
export const getStrategicResults = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 5, raiseTeam, lowerTeam } = req.query;
    
    if (!raiseTeam && !lowerTeam) {
      return res.status(400).json({ 
        error: "Either raiseTeam or lowerTeam parameter is required" 
      });
    }

    if (raiseTeam && lowerTeam) {
      return res.status(400).json({ 
        error: "Cannot use both raiseTeam and lowerTeam parameters together" 
      });
    }

    const doc = await eventsRef.doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Event not found" });

    // Get teams data
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

    // Get all programs with their results and status
    const programsSnapshot = await admin
      .firestore()
      .collection("events")
      .doc(id)
      .collection("programs")
      .get();

    const allPrograms = [];
    const publishedPrograms = new Set();
    const unpublishedPrograms = [];

    programsSnapshot.docs.forEach(doc => {
      const programData = doc.data();
      allPrograms.push(programData);
      
      if (programData.status === "published") {
        publishedPrograms.add(programData.title);
      } else if (programData.results && programData.results.length > 0) {
        // Only consider programs that have results
        unpublishedPrograms.push(programData);
      }
    });

    // Calculate current team scores from published program results
    const currentTeamScores = {};
    teams.forEach(team => {
      const teamKey = team.name || team.teamName || team.title;
      currentTeamScores[teamKey] = 0;
    });

    // Sum scores from published programs
    allPrograms.forEach(program => {
      if (program.status === "published" && program.results) {
        program.results.forEach(result => {
          const teamName = result.team;
          if (currentTeamScores[teamName] !== undefined) {
            currentTeamScores[teamName] += result.score || 0;
          }
        });
      }
    });

    const targetTeam = raiseTeam || lowerTeam;
    
    // Validate team exists
    if (currentTeamScores[targetTeam] === undefined) {
      return res.status(400).json({ error: `Team '${targetTeam}' not found` });
    }

    // Find strategic programs
    let strategicPrograms = [];

    if (raiseTeam) {
      // Strategy: Find programs that will help raiseTeam move up
      strategicPrograms = findRaiseTeamPrograms(
        unpublishedPrograms, 
        raiseTeam, 
        Number(limit)
      );
    } else {
      // Strategy: Find programs that will help lowerTeam move down
      strategicPrograms = findLowerTeamPrograms(
        unpublishedPrograms, 
        lowerTeam, 
        Number(limit)
      );
    }

    // Format the results
    const strategicResults = {};
    let totalPointsGained = 0;
    
    strategicPrograms.forEach(program => {
      strategicResults[program.title] = {
        programId: program.id,
        title: program.title,
        candidates: program.candidates || [],
        results: program.results || [],
        status: program.status || "active",
        createdAt: program.createdAt
      };

      // Calculate total points this program would add for projection
      if (program.results) {
        program.results.forEach(result => {
          const teamName = result.team;
          if (currentTeamScores[teamName] !== undefined) {
            if (raiseTeam && teamName === raiseTeam) {
              totalPointsGained += result.score || 0;
            } else if (lowerTeam && teamName !== lowerTeam) {
              totalPointsGained += result.score || 0;
            }
          }
        });
      }
    });

    // Calculate projected rankings if these programs were published
    const projectedTeamScores = { ...currentTeamScores };
    strategicPrograms.forEach(program => {
      if (program.results) {
        program.results.forEach(result => {
          const teamName = result.team;
          if (projectedTeamScores[teamName] !== undefined) {
            projectedTeamScores[teamName] += result.score || 0;
          }
        });
      }
    });

    // Sort teams by projected scores
    const projectedRankings = Object.entries(projectedTeamScores)
      .sort(([,a], [,b]) => b - a)
      .map(([teamName, score], index) => ({
        rank: index + 1,
        team: teamName,
        score,
        currentScore: currentTeamScores[teamName]
      }));

    res.json({
      eventId: id,
      strategy: raiseTeam ? `raise-${raiseTeam}` : `lower-${lowerTeam}`,
      targetTeam,
      programs: strategicResults,
      selectedPrograms: strategicPrograms.length,
      requestedLimit: Number(limit),
      totalUnpublishedPrograms: unpublishedPrograms.length,
      currentRankings: Object.entries(currentTeamScores)
        .sort(([,a], [,b]) => b - a)
        .map(([teamName, score], index) => ({
          rank: index + 1,
          team: teamName,
          score
        })),
      projectedRankings,
      impact: {
        targetTeamCurrentRank: Object.entries(currentTeamScores)
          .sort(([,a], [,b]) => b - a)
          .findIndex(([team]) => team === targetTeam) + 1,
        targetTeamProjectedRank: projectedRankings.find(r => r.team === targetTeam)?.rank,
        rankChange: calculateRankChange(currentTeamScores, projectedTeamScores, targetTeam),
        pointsGained: totalPointsGained
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper function to find programs that help raise a team's ranking
const findRaiseTeamPrograms = (unpublishedPrograms, raiseTeam, limit) => {
  // Strategy: Prioritize programs where raiseTeam has good results
  const raiseTeamPrograms = unpublishedPrograms.filter(program => {
    if (!program.results || !Array.isArray(program.results)) return false;
    
    // Check if the raiseTeam has any results in this program
    return program.results.some(result => result.team === raiseTeam);
  });

  // Calculate total score the raiseTeam would get from each program
  const programsWithScores = raiseTeamPrograms.map(program => {
    const teamScore = program.results
      .filter(result => result.team === raiseTeam)
      .reduce((total, result) => total + (result.score || 0), 0);
    
    return {
      ...program,
      teamScore
    };
  });

  // Sort by team score descending (programs where raiseTeam scores highest first)
  programsWithScores.sort((a, b) => b.teamScore - a.teamScore);

  // Take top programs up to limit
  return programsWithScores.slice(0, limit);
};

// Helper function to find programs that help lower a team's ranking  
const findLowerTeamPrograms = (unpublishedPrograms, lowerTeam, limit) => {
  // Strategy: Prioritize programs where other teams have good results (not the lowerTeam)
  const otherTeamPrograms = unpublishedPrograms.filter(program => {
    if (!program.results || !Array.isArray(program.results)) return false;
    
    // Check if other teams (not lowerTeam) have results in this program
    return program.results.some(result => result.team !== lowerTeam);
  });

  // Calculate total score other teams would get from each program
  const programsWithScores = otherTeamPrograms.map(program => {
    const otherTeamsScore = program.results
      .filter(result => result.team !== lowerTeam)
      .reduce((total, result) => total + (result.score || 0), 0);
    
    return {
      ...program,
      otherTeamsScore
    };
  });

  // Sort by other teams score descending (programs where other teams score highest first)
  programsWithScores.sort((a, b) => b.otherTeamsScore - a.otherTeamsScore);

  // Take top programs up to limit
  return programsWithScores.slice(0, limit);
};

// Helper function to calculate rank change
const calculateRankChange = (currentScores, projectedScores, targetTeam) => {
  const currentRank = Object.entries(currentScores)
    .sort(([,a], [,b]) => b - a)
    .findIndex(([team]) => team === targetTeam) + 1;
    
  const projectedRank = Object.entries(projectedScores)
    .sort(([,a], [,b]) => b - a)
    .findIndex(([team]) => team === targetTeam) + 1;
    
  return {
    current: currentRank,
    projected: projectedRank,
    change: currentRank - projectedRank,
    direction: currentRank > projectedRank ? 'improved' : currentRank < projectedRank ? 'declined' : 'unchanged'
  };
};
