import db from "../config/db.js";

const eventsRef = db.collection("events");

export const getEvents = async (req, res) => {
  try {
    const snapshot = await eventsRef.get();
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await eventsRef.doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    const data = doc.data();
    res.json({
      eventId: id,
      participants: data.participants || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const saveResults = async (req, res) => {
  try {
    const { id } = req.params;
    const { results, extraAwards } = req.body;

    await eventsRef.doc(id).set(
      {
        results,
        extraAwards,
      },
      { merge: true } // don't overwrite entire doc
    );

    res.json({ success: true, message: "Results saved to Firestore ✅" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
