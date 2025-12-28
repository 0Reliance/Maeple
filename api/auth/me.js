/**
 * Vercel Serverless Function: Get Current User
 * Returns authenticated user information
 */

const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const JWT_SECRET =
  process.env.JWT_SECRET || "maeple-beta-secret-2025-change-in-production";

// Database connection for serverless
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

// Auth middleware function
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verify user still exists
    const result = await pool.query(
      "SELECT id, email, display_name FROM users WHERE id = $1",
      [decoded.userId]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Authenticate token
  await authenticateToken(req, res, () => {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        displayName: req.user.display_name,
      },
    });
  });
}