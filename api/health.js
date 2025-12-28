/**
 * Vercel Serverless Function: Health Check
 * Returns API health status
 */

const { Pool } = require("pg");

// Database connection for serverless
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Test database connectivity
    await pool.query("SELECT 1");

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: {
        status: "connected",
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: {
        status: "disconnected",
        error: error.message,
      },
    });
  }
}