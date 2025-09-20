import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

// Your Firebase Web API Key (get it from Firebase Console -> Project Settings -> General -> Web API Key)
const API_KEY = process.env.FIREBASE_API_KEY;

// Replace with the email/password of a test user in Firebase Authentication
const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;

async function getToken() {
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const data = await res.json();

    if (data.error) {
      console.error("❌ Error:", data.error.message);
      return;
    }

    console.log("✅ ID Token:", data.idToken);
    console.log("Refresh Token:", data.refreshToken);
    console.log("User UID:", data.localId);
  } catch (err) {
    console.error("Error fetching token:", err.message);
  }
}

getToken();
