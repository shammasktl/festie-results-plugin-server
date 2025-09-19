import admin from "firebase-admin";
import serviceAccount from "./firebaseServiceAccount.json" with { type: "json" };

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

export default db;
