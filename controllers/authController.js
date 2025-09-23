import fetch from "node-fetch";
import admin from "firebase-admin";
import db from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.FIREBASE_API_KEY;
const isProd = process.env.NODE_ENV === "production";
const cookieSameSite = (process.env.COOKIE_SAMESITE || (isProd ? "none" : "lax"));
const cookieSecure = (process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE.toLowerCase() === "true"
  : isProd);

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

    // Set cookies
    res.cookie("token", data.idToken, {
      httpOnly: true,
      sameSite: cookieSameSite,
      secure: cookieSecure,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
    res.cookie("refreshToken", data.refreshToken, {
      httpOnly: true,
      sameSite: cookieSameSite,
      secure: cookieSecure,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

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

    res.cookie("token", data.idToken, {
      httpOnly: true,
      sameSite: cookieSameSite,
      secure: cookieSecure,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
    res.cookie("refreshToken", data.refreshToken, {
      httpOnly: true,
      sameSite: cookieSameSite,
      secure: cookieSecure,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

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

    // Fetch events created by this user
    const snap = await db
      .collection("events")
      .where("createdBy", "==", uid)
      .get();
    const myEvents = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    res.json({
      success: true,
      user: {
        uid,
        email,
        displayName: name || null,
        role: req.user.role || "user",
        events: myEvents,
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
    // Debug logging
    console.log("🔍 Request headers:", req.headers);
    console.log("🔍 Request body:", req.body);
    console.log("🔍 Request body type:", typeof req.body);
    
    // Check if req.body exists
    if (!req.body) {
      return res.status(400).json({ 
        error: "Request body is missing or not parsed as JSON",
        details: "Make sure Content-Type is application/json" 
      });
    }
    
  const bodyToken = req.body?.refreshToken;
  const cookieToken = req.cookies?.refreshToken;
  const refreshToken = bodyToken || cookieToken;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required" });
    }

    if (!API_KEY) {
      console.error("❌ Firebase API Key is missing from environment variables");
      return res.status(500).json({ error: "Server configuration error: Missing API key" });
    }

    console.log("🔄 Attempting to refresh token...");
    
    // Use form-encoded format per Firebase Secure Token API specification
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString();
    
    const response = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      }
    );

    const data = await response.json();
    
    console.log("🔄 Firebase response status:", response.status);
    console.log("🔄 Firebase response data:", data);

    if (data.error) {
      console.error("❌ Firebase refresh token error:", data.error);
      return res.status(401).json({ 
        error: data.error.message || "Invalid refresh token" 
      });
    }

    console.log("✅ Token refreshed successfully");
    res.cookie("token", data.id_token, {
      httpOnly: true,
      sameSite: cookieSameSite,
      secure: cookieSecure,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
    res.cookie("refreshToken", data.refresh_token, {
      httpOnly: true,
      sameSite: cookieSameSite,
      secure: cookieSecure,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token: data.id_token,
      refreshToken: data.refresh_token,
    });

  } catch (error) {
    console.error("❌ Refresh token error:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      details: error.message 
    });
  }
};


// controllers/authController.js
export const sessionLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "ID token required" });
    }

    // 7 days in ms
    const expiresIn = 7 * 24 * 60 * 60 * 1000;

    const sessionCookie = await admin
      .auth()
      .createSessionCookie(idToken, { expiresIn });

    // Set cookie in response (optional, for web clients)
    res.cookie("session", sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
      success: true,
      message: "Session cookie created ✅",
      sessionCookie,
    });
  } catch (error) {
    console.error("Session login error:", error);
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// Logout: clear cookies
export const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: cookieSameSite,
    secure: cookieSecure,
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: cookieSameSite,
    secure: cookieSecure,
  });
  return res.json({ success: true, message: "Logged out" });
};
