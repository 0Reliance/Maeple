/**
 * MAEPLE API Server
 *
 * Local PostgreSQL-backed API for authentication and data storage.
 * Designed for beta testing with multiple users.
 */

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.API_PORT || 3001;
const JWT_SECRET =
  process.env.JWT_SECRET || "maeple-beta-secret-2025-change-in-production";
const JWT_EXPIRES_IN = "7d";

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth-specific rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 auth requests per windowMs
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "maeple",
  user: process.env.DB_USER || "maeple_user",
  password: process.env.DB_PASSWORD || "maeple_beta_2025",
});

// Enhanced logging middleware with performance tracking
app.use((req, res, next) => {
  const start = Date.now();

  // Track request metrics
  performanceMetrics.requests.total++;
  if (req.path.startsWith("/api/auth")) {
    performanceMetrics.requests.auth++;
  } else if (req.path.startsWith("/api/entries")) {
    performanceMetrics.requests.entries++;
  }

  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.path} - Request received`
  );

  // Override res.json to add logging and metrics
  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - start;

    // Track response time
    performanceMetrics.responseTimes.push(duration);
    if (performanceMetrics.responseTimes.length > 100) {
      performanceMetrics.responseTimes =
        performanceMetrics.responseTimes.slice(-50); // Keep last 50
    }

    // Track errors
    if (res.statusCode >= 400) {
      performanceMetrics.requests.errors++;
    }

    console.log(
      `[${new Date().toISOString()}] ${req.method} ${
        req.path
      } - Response sent (${duration}ms)`
    );
    console.log(`Response data:`, JSON.stringify(data, null, 2));
    return originalJson.call(this, data);
  };

  // Track errors
  const originalStatus = res.status;
  res.status = function (code) {
    if (code >= 400) {
      performanceMetrics.requests.errors++;
    }
    return originalStatus.call(this, code);
  };

  next();
});

app.use(
  cors({
    origin: [
      "http://localhost:4173",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:3000",
      "https://maeple.0reliance.com",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

// Auth middleware
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

// ============================================
// HEALTH CHECK & SYSTEM MONITORING
// ============================================

// Performance metrics storage
const performanceMetrics = {
  startTime: Date.now(),
  requests: {
    total: 0,
    auth: 0,
    entries: 0,
    errors: 0,
  },
  responseTimes: [],
  databaseConnections: 0,
  lastError: null,
};

// Enhanced health check with detailed monitoring
app.get("/api/health", async (req, res) => {
  const startTime = Date.now();

  try {
    // Test database connectivity
    const dbStart = Date.now();
    await pool.query("SELECT 1");
    const dbResponseTime = Date.now() - dbStart;

    // Calculate system metrics
    const uptime = Date.now() - performanceMetrics.startTime;
    const avgResponseTime =
      performanceMetrics.responseTimes.length > 0
        ? performanceMetrics.responseTimes.reduce((a, b) => a + b, 0) /
          performanceMetrics.responseTimes.length
        : 0;

    // Memory usage
    const memUsage = process.memoryUsage();

    // Database connection info
    const totalConnections = pool.totalCount || 0;
    const idleConnections = pool.idleCount || 0;
    const waitingConnections = pool.waitingCount || 0;

    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: uptime,
      performance: {
        totalRequests: performanceMetrics.requests.total,
        authRequests: performanceMetrics.requests.auth,
        entriesRequests: performanceMetrics.requests.entries,
        errors: performanceMetrics.requests.errors,
        averageResponseTime: Math.round(avgResponseTime),
        responseTimeSamples: performanceMetrics.responseTimes.slice(-10), // Last 10 samples
      },
      database: {
        status: "connected",
        responseTime: dbResponseTime,
        connections: {
          total: totalConnections,
          idle: idleConnections,
          waiting: waitingConnections,
        },
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024) + " MB",
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + " MB",
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + " MB",
          external: Math.round(memUsage.external / 1024 / 1024) + " MB",
        },
        cpu: process.cpuUsage(),
      },
      lastError: performanceMetrics.lastError,
    };

    console.log(
      `[Health] System health check completed in ${Date.now() - startTime}ms`
    );
    res.json(healthData);
  } catch (error) {
    const errorResponse = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: {
        status: "disconnected",
        error: error.message,
      },
      system: {
        uptime: Date.now() - performanceMetrics.startTime,
        lastError: error.message,
      },
    };

    console.error("[Health] Health check failed:", error.message);
    res.status(503).json(errorResponse);
  }
});

// Simple health check for load balancers
app.get("/api/health/simple", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Performance metrics endpoint
app.get("/api/metrics", (req, res) => {
  const metrics = {
    ...performanceMetrics,
    uptime: Date.now() - performanceMetrics.startTime,
    timestamp: new Date().toISOString(),
  };

  res.json(metrics);
});

// ============================================
// AUTH ENDPOINTS
// ============================================

// Apply stricter rate limiting to auth routes
app.use("/api/auth", authLimiter);

// Sign up
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, displayName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  try {
    // Check if user exists
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name, created_at",
      [email.toLowerCase(), passwordHash, displayName || email.split("@")[0]]
    );

    const user = result.rows[0];

    // Create JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // Create default settings
    await pool.query("INSERT INTO user_settings (user_id) VALUES ($1)", [
      user.id,
    ]);

    console.log(`[Auth] New user signed up: ${user.email}`);

    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        createdAt: user.created_at,
      },
      token,
    };

    // Ensure response is sent and connection is closed
    res.status(201).json(responseData);
    res.end();
    return;
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ error: "Failed to create account" });
  }
});

// Sign in
app.post("/api/auth/signin", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const result = await pool.query(
      "SELECT id, email, password_hash, display_name, created_at FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Create JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    console.log(`[Auth] User signed in: ${user.email}`);

    const responseData = {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        createdAt: user.created_at,
      },
      token,
    };

    // Ensure response is sent and connection is closed
    res.json(responseData);
    res.end();
    return;
  } catch (error) {
    console.error("Signin error:", error);
    return res.status(500).json({ error: "Failed to sign in" });
  }
});

// Get current user
app.get("/api/auth/me", authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      displayName: req.user.display_name,
    },
  });
});

// Sign out (client-side token deletion, but we can track it)
app.post("/api/auth/signout", authenticateToken, (req, res) => {
  console.log(`[Auth] User signed out: ${req.user.email}`);
  res.json({ success: true });
});

// Change password
app.post("/api/auth/change-password", authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new password required" });
  }

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ error: "New password must be at least 6 characters" });
  }

  try {
    const result = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [req.user.id]
    );
    const validPassword = await bcrypt.compare(
      currentPassword,
      result.rows[0].password_hash
    );

    if (!validPassword) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [newPasswordHash, req.user.id]
    );

    console.log(`[Auth] Password changed for: ${req.user.email}`);
    res.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Delete account
app.delete("/api/auth/account", authenticateToken, async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [req.user.id]);
    console.log(`[Auth] Account deleted: ${req.user.email}`);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

// ============================================
// ENTRIES ENDPOINTS
// ============================================

// Get all entries for user
app.get("/api/entries", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, user_id, timestamp, raw_text, mood, mood_label, medications, symptoms, tags, activity_types, strengths, neuro_metrics, sleep, notes, ai_strategies, ai_reasoning, created_at, updated_at FROM health_entries WHERE user_id = $1 ORDER BY timestamp DESC",
      [req.user.id]
    );

    // Transform to match frontend format
    const entries = result.rows.map((row) => ({
      id: row.id,
      type: "journal",
      timestamp: row.timestamp,
      rawText: row.raw_text,
      mood: row.mood,
      moodLabel: row.mood_label,
      medications: row.medications || [],
      symptoms: row.symptoms || [],
      tags: row.tags || [],
      activityTypes: row.activity_types || [],
      strengths: row.strengths || [],
      neuroMetrics: row.neuro_metrics || {},
      sleep: row.sleep || {},
      notes: row.notes || "",
      aiStrategies: row.ai_strategies || [],
      aiReasoning: row.ai_reasoning || "",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json({ entries });
  } catch (error) {
    console.error("Get entries error:", error);
    res.status(500).json({ error: "Failed to get entries" });
  }
});

// Create entry
app.post("/api/entries", authenticateToken, async (req, res) => {
  const { entry } = req.body;

  if (!entry) {
    return res.status(400).json({ error: "Entry data required" });
  }

  try {
    const entryId = entry.id || uuidv4();
    console.log("Creating entry with ID:", entryId);
    console.log("Entry data:", JSON.stringify(entry, null, 2));

    const result = await pool.query(
      `INSERT INTO health_entries (
        id, user_id, timestamp, raw_text, mood, mood_label, medications, symptoms, tags, 
        activity_types, strengths, neuro_metrics, sleep, notes, ai_strategies, ai_reasoning
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) 
      RETURNING id, created_at, updated_at`,
      [
        entryId,
        req.user.id,
        entry.timestamp || new Date(),
        entry.rawText || "",
        entry.mood || null,
        entry.moodLabel || "",
        JSON.stringify(entry.medications || []),
        JSON.stringify(entry.symptoms || []),
        entry.tags || [],
        entry.activityTypes || [],
        entry.strengths || [],
        JSON.stringify(entry.neuroMetrics || {}),
        JSON.stringify(entry.sleep || {}),
        entry.notes || "",
        JSON.stringify(entry.aiStrategies || []),
        entry.aiReasoning || "",
      ]
    );

    const saved = result.rows[0];
    res.status(201).json({
      entry: {
        id: saved.id,
        ...entry,
        createdAt: saved.created_at,
        updatedAt: saved.updated_at,
      },
    });
  } catch (error) {
    console.error("Create entry error:", error);
    res.status(500).json({ error: "Failed to create entry" });
  }
});

// Update entry
app.put("/api/entries/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { entry } = req.body;

  if (!entry) {
    return res.status(400).json({ error: "Entry data required" });
  }

  try {
    const result = await pool.query(
      `UPDATE health_entries SET 
        timestamp = $1, raw_text = $2, mood = $3, mood_label = $4, medications = $5, symptoms = $6,
        tags = $7, activity_types = $8, strengths = $9, neuro_metrics = $10, sleep = $11,
        notes = $12, ai_strategies = $13, ai_reasoning = $14, updated_at = NOW()
      WHERE id = $15 AND user_id = $16 RETURNING id, created_at, updated_at`,
      [
        entry.timestamp || new Date(),
        entry.rawText || "",
        entry.mood || null,
        entry.moodLabel || "",
        JSON.stringify(entry.medications || []),
        JSON.stringify(entry.symptoms || []),
        entry.tags || [],
        entry.activityTypes || [],
        entry.strengths || [],
        JSON.stringify(entry.neuroMetrics || {}),
        JSON.stringify(entry.sleep || {}),
        entry.notes || "",
        JSON.stringify(entry.aiStrategies || []),
        entry.aiReasoning || "",
        id,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    const saved = result.rows[0];
    res.json({
      entry: {
        id: saved.id,
        ...entry,
        createdAt: saved.created_at,
        updatedAt: saved.updated_at,
      },
    });
  } catch (error) {
    console.error("Update entry error:", error);
    res.status(500).json({ error: "Failed to update entry" });
  }
});

// Delete entry
app.delete("/api/entries/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM health_entries WHERE id = $1 AND user_id = $2 RETURNING id",
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Entry not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Delete entry error:", error);
    res.status(500).json({ error: "Failed to delete entry" });
  }
});

// Bulk sync entries (for initial migration from localStorage)
app.post("/api/entries/sync", authenticateToken, async (req, res) => {
  const { entries } = req.body;

  if (!Array.isArray(entries)) {
    return res.status(400).json({ error: "Entries array required" });
  }

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      let synced = 0;
      for (const entry of entries) {
        const entryId = entry.id || uuidv4();
        await client.query(
          `INSERT INTO health_entries (
            id, user_id, timestamp, raw_text, mood, mood_label, medications, symptoms, tags,
            activity_types, strengths, neuro_metrics, sleep, notes, ai_strategies, ai_reasoning, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO UPDATE SET 
            timestamp = EXCLUDED.timestamp, raw_text = EXCLUDED.raw_text, mood = EXCLUDED.mood,
            mood_label = EXCLUDED.mood_label, medications = EXCLUDED.medications, symptoms = EXCLUDED.symptoms,
            tags = EXCLUDED.tags, activity_types = EXCLUDED.activity_types, strengths = EXCLUDED.strengths,
            neuro_metrics = EXCLUDED.neuro_metrics, sleep = EXCLUDED.sleep, notes = EXCLUDED.notes,
            ai_strategies = EXCLUDED.ai_strategies, ai_reasoning = EXCLUDED.ai_reasoning, updated_at = NOW()`,
          [
            entryId,
            req.user.id,
            entry.timestamp || new Date(),
            entry.rawText || "",
            entry.mood || null,
            entry.moodLabel || "",
            JSON.stringify(entry.medications || []),
            JSON.stringify(entry.symptoms || []),
            entry.tags || [],
            entry.activityTypes || [],
            entry.strengths || [],
            JSON.stringify(entry.neuroMetrics || {}),
            JSON.stringify(entry.sleep || {}),
            entry.notes || "",
            JSON.stringify(entry.aiStrategies || []),
            entry.aiReasoning || "",
            entry.timestamp || new Date(),
          ]
        );
        synced++;
      }

      await client.query("COMMIT");
      console.log(`[Sync] Synced ${synced} entries for: ${req.user.email}`);
      res.json({ success: true, synced });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Sync entries error:", error);
    res.status(500).json({ error: "Failed to sync entries" });
  }
});

// ============================================
// SETTINGS ENDPOINTS
// ============================================

// Get user settings
app.get("/api/settings", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT settings FROM user_settings WHERE user_id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      // Create default settings if none exist
      await pool.query(
        "INSERT INTO user_settings (user_id, settings) VALUES ($1, $2)",
        [req.user.id, JSON.stringify({})]
      );
      return res.json({ settings: {} });
    }

    res.json({ settings: result.rows[0].settings });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ error: "Failed to get settings" });
  }
});

// Update user settings
app.put("/api/settings", authenticateToken, async (req, res) => {
  const { settings } = req.body;

  if (!settings) {
    return res.status(400).json({ error: "Settings data required" });
  }

  try {
    await pool.query(
      `INSERT INTO user_settings (user_id, settings) VALUES ($1, $2) 
       ON CONFLICT (user_id) DO UPDATE SET settings = $2, updated_at = NOW()`,
      [req.user.id, JSON.stringify(settings)]
    );

    res.json({ success: true, settings });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// ============================================
// SETTINGS ENDPOINTS
// ============================================

// ... existing code ...

// ============================================
// CLIENT LOGS ENDPOINT
// ============================================

app.post("/api/logs", async (req, res) => {
  const { logs } = req.body;

  if (!logs || !Array.isArray(logs)) {
    return res.status(400).json({ error: "Logs array required" });
  }

  try {
    const logDir = path.join(__dirname, "logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }

    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const filename = `client-logs-${timestamp}-${uuidv4().substring(0, 8)}.json`;
    const filepath = path.join(logDir, filename);

    fs.writeFileSync(filepath, JSON.stringify({
      serverReceived: new Date().toISOString(),
      clientIp: req.ip,
      userAgent: req.headers["user-agent"],
      logs
    }, null, 2));

    console.log(`[Logs] Received ${logs.length} logs from client and saved to ${filename}`);
    res.json({ success: true, filename });
  } catch (error) {
    console.error("Save logs error:", error);
    res.status(500).json({ error: "Failed to save logs" });
  }
});

// ============================================
// 404 HANDLER FOR ALL ROUTES
// ============================================

// Handle 404 for all routes - this must be the LAST middleware
app.use((req, res) => {
  console.log(`[404] Unmatched route: ${req.method} ${req.path}`);

  if (req.path.startsWith("/api/")) {
    // Return JSON for API routes
    return res.status(404).json({
      error: "API endpoint not found",
      message: `The endpoint ${req.method} ${req.path} does not exist`,
      availableEndpoints: {
        health: [
          {
            method: "GET",
            path: "/api/health",
            description: "Full health check",
          },
          {
            method: "GET",
            path: "/api/health/simple",
            description: "Simple health check",
          },
          {
            method: "GET",
            path: "/api/metrics",
            description: "Performance metrics",
          },
        ],
        auth: [
          {
            method: "POST",
            path: "/api/auth/signup",
            description: "Create new account",
          },
          {
            method: "POST",
            path: "/api/auth/signin",
            description: "Sign in existing user",
          },
          {
            method: "GET",
            path: "/api/auth/me",
            description: "Get current user",
          },
          {
            method: "POST",
            path: "/api/auth/signout",
            description: "Sign out user",
          },
          {
            method: "POST",
            path: "/api/auth/change-password",
            description: "Change password",
          },
          {
            method: "DELETE",
            path: "/api/auth/account",
            description: "Delete account",
          },
        ],
        entries: [
          {
            method: "GET",
            path: "/api/entries",
            description: "List all entries",
          },
          {
            method: "POST",
            path: "/api/entries",
            description: "Create new entry",
          },
          {
            method: "PUT",
            path: "/api/entries/:id",
            description: "Update existing entry",
          },
          {
            method: "DELETE",
            path: "/api/entries/:id",
            description: "Delete entry",
          },
          {
            method: "POST",
            path: "/api/entries/sync",
            description: "Bulk sync entries",
          },
        ],
        settings: [
          {
            method: "GET",
            path: "/api/settings",
            description: "Get user settings",
          },
          {
            method: "PUT",
            path: "/api/settings",
            description: "Update user settings",
          },
        ],
      },
    });
  } else {
    // Return HTML for non-API routes (fallback)
    res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Error</title>
</head>
<body>
<pre>Cannot ${req.method} ${req.path}</pre>
</body>
</html>`);
  }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║           MAEPLE API Server v1.0.1                ║
║═══════════════════════════════════════════════════║
║  Local:   http://localhost:${PORT}                   ║
║  Network: http://0.0.0.0:${PORT}                     ║
║                                                   ║
║  Endpoints:                                       ║
║    GET  /api/health          - Health check       ║
║    POST /api/auth/signup     - Create account     ║
║    POST /api/auth/signin     - Sign in            ║
║    GET  /api/auth/me         - Current user       ║
║    POST /api/auth/signout    - Sign out           ║
║    GET  /api/entries         - List entries       ║
║    POST /api/entries         - Create entry       ║
║    PUT  /api/entries/:id     - Update entry       ║
║    DELETE /api/entries/:id   - Delete entry       ║
║    POST /api/entries/sync    - Bulk sync          ║
║    GET  /api/settings        - Get settings       ║
║    PUT  /api/settings        - Update settings    ║
║                                                   ║
║  Features:                                        ║
║    ✓ JSON 404 responses for API routes             ║
║    ✓ Enhanced error documentation                   ║
╚═══════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down...");
  await pool.end();
  process.exit(0);
});
