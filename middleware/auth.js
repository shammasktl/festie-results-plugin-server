import admin from "firebase-admin";
import fetch from "node-fetch";

// Helper: timeout wrapper for async ops
const withTimeout = async (promise, ms, label = "operation") => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`${label} timeout after ${ms}ms`)),
      ms
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
};

// ✅ Verify Token Middleware
export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const headerToken = authHeader && authHeader.split(" ")[0]?.toLowerCase() === "bearer"
    ? authHeader.split(" ")[1]
    : undefined;
  const cookieToken = req.cookies?.token;
  const token = headerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  // Check if token is empty string or just whitespace
  if (!token.trim()) {
    return res.status(401).json({ error: "Invalid token format" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // attach decoded claims (uid, email, role, etc.)
    next();
  } catch (error) {
    // Only log meaningful errors (not empty/invalid tokens)
    if (!error.message.includes('argument-error')) {
      console.error("verifyToken: token verification failed:", error?.code || error?.message);
    }
    
    // Attempt auto-refresh if token expired and refresh token cookie exists
    const errCode = error?.code || error?.message || "unknown";
    const refreshCookie = req.cookies?.refreshToken;
    const apiKey = process.env.FIREBASE_API_KEY;
    const isExpired = String(errCode).includes("id-token-expired");

    if (isExpired && refreshCookie && apiKey) {
      try {
        // Use form-encoded body per Firebase Secure Token API and add timeout
        const body = new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshCookie,
        }).toString();

        const fetchPromise = fetch(
          `https://securetoken.googleapis.com/v1/token?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body,
          }
        );

        const resp = await withTimeout(fetchPromise, 8000, "Token auto-refresh");
        const data = await resp.json();
        
        // Enhanced logging for debugging
        if (process.env.NODE_ENV !== "production") {
          console.log("🔄 Auto-refresh attempt:");
          console.log("  - Request URL:", `https://securetoken.googleapis.com/v1/token?key=${apiKey ? 'present' : 'missing'}`);
          console.log("  - Response status:", resp.status);
          console.log("  - Response ok:", resp.ok);
          console.log("  - Has error:", !!data.error);
          if (data.error) {
            console.log("  - Error details:", data.error);
          }
        }
        
        if (!resp.ok || data.error) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("Auto-refresh failed:", data.error || resp.statusText);
          }
          return res.status(403).json({ error: "Invalid or expired token" });
        }

        // Set fresh cookies
        const isProd = process.env.NODE_ENV === "production";
        const sameSite = process.env.COOKIE_SAMESITE || (isProd ? "none" : "lax");
        const secure = process.env.COOKIE_SECURE
          ? process.env.COOKIE_SECURE.toLowerCase() === "true"
          : isProd;
        res.cookie("token", data.id_token, {
          httpOnly: true,
          sameSite: sameSite,
          secure: secure,
          maxAge: 24 * 60 * 60 * 1000,
        });
        res.cookie("refreshToken", data.refresh_token, {
          httpOnly: true,
          sameSite: sameSite,
          secure: secure,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // Verify new token and continue
        const decoded = await admin.auth().verifyIdToken(data.id_token);
        req.user = decoded;
        return next();
      } catch (refreshErr) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("verifyToken: auto-refresh exception:", refreshErr?.message || refreshErr);
        }
        return res.status(403).json({ error: "Invalid or expired token" });
      }
    }

    // Log error code for diagnostics (does not leak token)
    if (process.env.NODE_ENV !== "production") {
      console.warn("verifyToken: token verification failed:", errCode);
    }
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

export const verifyTokenOptional = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const headerToken = authHeader && authHeader.split(" ")[0]?.toLowerCase() === "bearer"
    ? authHeader.split(" ")[1]
    : undefined;
  const cookieToken = req.cookies?.token;
  const token = headerToken || cookieToken;

  if (!token) {
    return next(); // no token → just continue
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
  } catch (error) {
    // ignore invalid tokens → treat as public
  }

  next();
};

// middleware/auth.js
export const verifySession = async (req, res, next) => {
  try {
    const sessionCookie =
      req.cookies.session || req.headers.authorization?.split(" ")[1];

    const decodedClaims = await admin
      .auth()
      .verifySessionCookie(sessionCookie, true);
    req.user = decodedClaims;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// ✅ Role-based Authorization Middleware
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: `Only ${role}s are allowed` });
    }

    next();
  };
};
