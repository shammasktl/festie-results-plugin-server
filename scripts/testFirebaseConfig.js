import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.FIREBASE_API_KEY;

async function testFirebaseConfig() {
  console.log("🔍 Testing Firebase Configuration...");
  console.log("API Key:", API_KEY ? `${API_KEY.substring(0, 10)}...` : "NOT FOUND");
  
  // Generate a unique email for testing
  const testEmail = `test-${Date.now()}@test.com`;
  const testPassword = "test123456";
  
  try {
    // Test if the API key works by making a signup request
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          returnSecureToken: true,
        }),
      }
    );

    const data = await response.json();
    
    if (data.error) {
      if (data.error.message === "CONFIGURATION_NOT_FOUND") {
        console.log("❌ Firebase Authentication is not enabled");
        console.log("📝 Follow these steps:");
        console.log("1. Go to Firebase Console");
        console.log("2. Enable Authentication");
        console.log("3. Enable Email/Password sign-in method");
        console.log("4. Get the correct Web API Key");
      } else if (data.error.message === "EMAIL_EXISTS") {
        console.log("✅ Firebase Configuration is working!");
        console.log("💡 The test email already exists (this is normal)");
        console.log("🧹 You can clean up test users in Firebase Console → Authentication → Users");
      } else {
        console.log("⚠️  Error:", data.error.message);
        console.log("💡 This might still indicate Firebase is working, just with different settings");
      }
    } else {
      console.log("✅ Firebase Configuration is working perfectly!");
      console.log("👤 Test user created successfully");
      console.log("🧹 You may want to delete test users from Firebase Console → Authentication → Users");
      console.log("📧 Test email used:", testEmail);
    }
    
  } catch (error) {
    console.log("❌ Network error:", error.message);
    console.log("🔧 Check your internet connection and API key");
  }
}

testFirebaseConfig();
