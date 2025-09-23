import fetch from "node-fetch";

// Test refresh token endpoint
async function testRefreshToken() {
  try {
    console.log("🔄 Testing refresh token endpoint...");
    
    // Test with missing refresh token
    console.log("\n1. Testing with missing refresh token:");
    let response = await fetch("http://localhost:5000/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    
    let data = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", data);
    
    // Test with invalid refresh token
    console.log("\n2. Testing with invalid refresh token:");
    response = await fetch("http://localhost:5000/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refreshToken: "invalid_token_123"
      }),
    });
    
    data = await response.json();
    console.log("Status:", response.status);
    console.log("Response:", data);
    
    // Test with malformed request
    console.log("\n3. Testing with malformed request body:");
    response = await fetch("http://localhost:5000/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid json",
    });
    
    data = await response.text(); // Use text since it might not be JSON
    console.log("Status:", response.status);
    console.log("Response:", data);
    
  } catch (error) {
    console.error("❌ Test error:", error.message);
  }
}

testRefreshToken();
