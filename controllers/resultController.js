// Dummy data (later connect to DB)
const mockEvents = [
  { id: "dance-2025", name: "Dance Competition" },
  { id: "music-2025", name: "Music Night" },
  { id: "drama-2025", name: "Drama Contest" },
];

const mockParticipants = {
  "dance-2025": ["Axis", "Chronicle", "Bursa", "Nexus"],
  "music-2025": ["Ankara", "Adala", "Waqif"],
  "drama-2025": ["Team X", "Team Y", "Team Z"],
};

export const getEvents = (req, res) => {
  res.json(mockEvents);
};

export const getParticipants = (req, res) => {
  const { id } = req.params;
  res.json({
    eventId: id,
    participants: mockParticipants[id] || [],
  });
};

export const saveResults = (req, res) => {
  const { id } = req.params;
  const { results, extraAwards } = req.body;

  console.log("Results Saved:", { id, results, extraAwards });

  // TODO: save to DB later
  res.json({ success: true, message: "Results saved successfully" });
};
