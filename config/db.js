import admin from "firebase-admin";
import serviceAccount from "./firebaseServiceAccount.json" with { type: "json" };

// Initialize Firebase Admin with explicit configuration
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
  // Explicitly avoid deprecated features
  databaseURL: undefined, // We're using Firestore, not Realtime Database
});

console.log('Firebase Admin initialized');

const db = admin.firestore();
const auth = admin.auth();

export { db, auth };
export default db;