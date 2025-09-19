import admin from "firebase-admin";
import serviceAccount from "./config/firebaseServiceAccount.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function setAdmin(uid) {
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  console.log("Admin role set for UID:", uid);
}

setAdmin("FIREBASE_USER_UID_HERE");
