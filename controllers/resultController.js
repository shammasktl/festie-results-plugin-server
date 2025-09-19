import db from "../config/db.js";

const eventsRef = db.collection("events");

// ✅ Get all events
export const getEvents = async (req, res) => {
  try {
    const snapshot = await eventsRef.get();
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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
    });

    res.json({ success: true, message: "Event created ✅" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get participants of an event
export const getParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await eventsRef.doc(id).get();

    if (!doc.exists) return res.status(404).json({ error: "Event not found" });

    const data = doc.data();
    res.json({
      eventId: id,
      participants: data.participants || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Add participants (Admin only)
export const addParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const { participants } = req.body; // array of {id, name}

    const docRef = eventsRef.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) return res.status(404).json({ error: "Event not found" });

    await docRef.update({
      participants: admin.firestore.FieldValue.arrayUnion(...participants),
    });

    res.json({ success: true, message: "Participants added ✅" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Save results (status stays "not_published")
export const saveResults = async (req, res) => {
  try {
    const { id } = req.params;
    const { results, extraAwards } = req.body;

    const docRef = eventsRef.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) return res.status(404).json({ error: "Event not found" });

    await docRef.update({
      results,
      extraAwards,
      status: "not_published", // always draft until published
    });

    res.json({ success: true, message: "Results saved (draft) ✅" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get results (regardless of status)
export const getResults = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await eventsRef.doc(id).get();

    if (!doc.exists) return res.status(404).json({ error: "Event not found" });

    const data = doc.data();
    res.json({
      eventId: id,
      status: data.status,
      results: data.results || [],
      extraAwards: data.extraAwards || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
