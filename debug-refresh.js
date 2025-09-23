import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.FIREBASE_API_KEY;

async function testRefreshTokenAPI() {
  console.log("🧪 Testing Firebase Secure Token API directly\n");
  
  // This is a sample refresh token - replace with a real one from your login
  const sampleRefreshToken = "REPLACE_WITH_REAL_REFRESH_TOKEN";
  
  if (sampleRefreshToken === "REPLACE_WITH_REAL_REFRESH_TOKEN") {
    console.log("❓ To test properly:");
    console.log("1. Login to your app to get a refresh token");
    console.log("2. Replace 'REPLACE_WITH_REAL_REFRESH_TOKEN' in this script");
    console.log("3. Run this test again");
    return;
  }

  try {
    console.log("🔄 Testing form-encoded refresh token request...");
    
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: sampleRefreshToken,
    }).toString();

    console.log("📝 Request body:", body);
    console.log("🔑 API Key:", API_KEY ? "Present" : "Missing");

    const response = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${API_KEY}`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      }
    );

    console.log("📊 Response status:", response.status);
    console.log("📋 Response headers:", Object.fromEntries(response.headers));
    
    const data = await response.json();
    console.log("📄 Response data:", data);

    if (response.ok && data.id_token) {
      console.log("✅ Firebase refresh token API working correctly");
    } else {
      console.log("❌ Firebase refresh token API failed");
    }

  } catch (error) {
    console.error("❌ Request failed:", error.message);
  }
}

testRefreshTokenAPI();