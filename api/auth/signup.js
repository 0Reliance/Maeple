/**
 * Vercel Serverless Function: Sign Up
 * Handles user registration
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { Pool } = require("pg");

const JWT_SECRET =
  process.env.JWT_SECRET || "maeple-beta-secret-2025-change-in-production";
const JWT_EXPIRES_IN = "7d";

// Database connection for serverless
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password, displayName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  const client = await pool.connect();

  try {
    // Check if user exists
    const existing = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await client.query(
      "INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name, created_at",
      [
        email.toLowerCase(),
        passwordHash,
        displayName || email.split("@")[0],
      ]
    );

    const user = result.rows[0];

    // Create JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // Create default settings
    await client.query("INSERT INTO user_settings (user_id) VALUES ($1)", [
      user.id,
    ]);

    console.log(`[Auth] New user signed up: ${user.email}`);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        createdAt: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Failed to create account" });
  } finally {
    client.release();
  }
}