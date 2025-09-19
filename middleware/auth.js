import admin from "firebase-admin";

// Middleware to verify Firebase ID Token
export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // attach user info
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};
