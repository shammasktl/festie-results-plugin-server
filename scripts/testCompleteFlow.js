import fetch from "node-fetch";

// Test the complete flow: signup -> refresh token
async function testCompleteFlow() {
  try {
    console.log("🔐 Testing complete authentication flow...");
    
    // Step 1: Sign up to get a valid refresh token
    console.log("\n1. Creating a new user to get valid tokens...");
    const signupResponse = await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: "test123456",
        displayName: "Test User"
      }),
    });
    
    const signupData = await signupResponse.json();
    console.log("Signup Status:", signupResponse.status);
    
    if (signupResponse.status !== 201) {
      console.log("❌ Signup failed:", signupData);
      return;
    }
    
    console.log("✅ Signup successful, got tokens");
    const refreshToken = signupData.refreshToken;
    
    // Step 2: Test refresh token endpoint
    console.log("\n2. Testing refresh token endpoint with valid token...");
    const refreshResponse = await fetch("http://localhost:5000/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refreshToken: refreshToken
      }),
    });
    
    const refreshData = await refreshResponse.json();
    console.log("Refresh Status:", refreshResponse.status);
    console.log("Refresh Response:", refreshData);
    
    if (refreshResponse.status === 200) {
      console.log("✅ Refresh token endpoint working correctly!");
    } else {
      console.log("❌ Refresh token failed");
    }
    
  } catch (error) {
    console.error("❌ Test error:", error.message);
  }
}

testCompleteFlow();
