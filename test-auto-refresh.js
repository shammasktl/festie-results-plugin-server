import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = "http://localhost:5000";
const API_KEY = process.env.FIREBASE_API_KEY;

async function testAutoRefresh() {
  try {
    console.log("🧪 Testing Auto-Refresh Mechanism\n");

    // Step 1: Login to get valid tokens
    console.log("1️⃣ Logging in to get initial tokens...");
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: "test@example.com", // Replace with valid test account
        password: "password123",   // Replace with valid password
      }),
    });

    if (!loginResponse.ok) {
      console.log("❌ Login failed - create a test user first");
      return;
    }

    const loginData = await loginResponse.json();
    console.log("✅ Login successful");

    // Extract cookies from Set-Cookie headers
    const setCookieHeaders = loginResponse.headers.raw()['set-cookie'] || [];
    const cookies = setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');
    
    console.log("🍪 Cookies received:", cookies);

    // Step 2: Wait a moment, then test protected route
    console.log("\n2️⃣ Testing protected route with valid token...");
    const profileResponse = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: "GET",
      headers: { 
        "Cookie": cookies,
      },
      credentials: "include",
    });

    if (profileResponse.ok) {
      console.log("✅ Protected route accessible with current token");
    } else {
      console.log("❌ Protected route failed:", await profileResponse.text());
      return;
    }

    // Step 3: Manually expire the token by creating an invalid one
    console.log("\n3️⃣ Simulating expired token...");
    
    // Create expired/invalid token cookie
    const expiredCookie = cookies.replace(/token=[^;]+/, 'token=expired_token_simulation');
    
    console.log("🧪 Making request with simulated expired token...");
    const expiredResponse = await fetch(`${BASE_URL}/api/auth/profile`, {
      method: "GET",
      headers: { 
        "Cookie": expiredCookie,
      },
      credentials: "include",
    });

    const newCookies = expiredResponse.headers.raw()['set-cookie'];
    if (newCookies && newCookies.length > 0) {
      console.log("✅ Auto-refresh triggered! New cookies set:");
      newCookies.forEach(cookie => console.log("   ", cookie.split(';')[0]));
      
      if (expiredResponse.ok) {
        console.log("✅ Request succeeded after auto-refresh");
      } else {
        console.log("⚠️ Request failed even after auto-refresh");
      }
    } else {
      console.log("❌ Auto-refresh did not trigger or failed");
      console.log("Response status:", expiredResponse.status);
      console.log("Response body:", await expiredResponse.text());
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testAutoRefresh();