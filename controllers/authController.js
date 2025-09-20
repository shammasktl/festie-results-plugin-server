import fetch from "node-fetch";
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.FIREBASE_API_KEY;

// Signup function
export const signup = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Create user in Firebase Authentication
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          displayName,
          returnSecureToken: true,
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ 
        error: data.error.message || "Failed to create user" 
      });
    }

    // Optional: Set custom claims or save additional user data
    try {
      await admin.auth().setCustomUserClaims(data.localId, { role: "user" });
    } catch (claimError) {
      console.log("Could not set custom claims:", claimError.message);
    }

    res.status(201).json({
      success: true,
      message: "User created successfully ✅",
      user: {
        uid: data.localId,
        email: data.email,
        displayName: displayName || null,
      },
      token: data.idToken,
      refreshToken: data.refreshToken,
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Login function
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Sign in with Firebase Authentication
    const response = await fetch(
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

    const data = await response.json();

    if (data.error) {
      return res.status(401).json({ 
        error: data.error.message || "Invalid credentials" 
      });
    }

    res.json({
      success: true,
      message: "Login successful ✅",
      user: {
        uid: data.localId,
        email: data.email,
      },
      token: data.idToken,
      refreshToken: data.refreshToken,
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get current user profile
export const getProfile = async (req, res) => {
  try {
    // req.user is set by verifyToken middleware
    const { uid, email, name } = req.user;

    res.json({
      success: true,
      user: {
        uid,
        email,
        displayName: name || null,
        role: req.user.role || "user",
      },
    });

  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Refresh token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    const response = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(401).json({ 
        error: data.error.message || "Invalid refresh token" 
      });
    }

    res.json({
      success: true,
      token: data.id_token,
      refreshToken: data.refresh_token,
    });

  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
