import admin from "firebase-admin";
import serviceAccount from "./firebaseServiceAccount.json" with { type: "json" };

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log('Firebase Admin initialized');

const db = admin.firestore();
const auth = admin.auth();

export { db, auth };