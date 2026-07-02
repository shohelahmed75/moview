const express = require("express");
const cors = require("cors");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || "flickerbox-secret-key-12345";

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, "database.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Failed to connect to SQLite database:", err.message);
  } else {
    console.log("Connected to SQLite database at:", dbPath);
    initializeTables();
  }
});

function dbRun(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function dbGet(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function initializeTables() {
  try {
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS watchlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        imdbID TEXT NOT NULL,
        title TEXT NOT NULL,
        year TEXT,
        poster TEXT,
        runtime INTEGER,
        imdbRating REAL,
        userRating INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id),
        UNIQUE(user_id, imdbID)
      )
    `);
    console.log("Database tables initialized successfully.");
  } catch (err) {
    console.error("Error creating database tables:", err.message);
  }
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token is missing" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
}

app.post("/api/auth/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const existingUser = await dbGet("SELECT id FROM users WHERE username = ?", [username]);
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await dbRun(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)",
      [username, passwordHash]
    );

    const userId = result.lastID;
    const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: "30d" });

    res.status(201).json({
      user: { id: userId, username },
      token,
    });
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ error: "Server error during registration" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const user = await dbGet("SELECT * FROM users WHERE username = ?", [username]);
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "30d" });

    res.json({
      user: { id: user.id, username: user.username },
      token,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error during login" });
  }
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  res.json({ user: req.user });
});

app.get("/api/watchlist", authenticateToken, async (req, res) => {
  try {
    const rows = await dbAll(
      "SELECT imdbID, title, year, poster, runtime, imdbRating, userRating FROM watchlist WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching watchlist:", err.message);
    res.status(500).json({ error: "Database error while fetching watchlist" });
  }
});

app.post("/api/watchlist", authenticateToken, async (req, res) => {
  const { imdbID, title, year, poster, runtime, imdbRating, userRating } = req.body;

  if (!imdbID || !title) {
    return res.status(400).json({ error: "imdbID and title are required" });
  }

  try {
    
    const existing = await dbGet(
      "SELECT id FROM watchlist WHERE user_id = ? AND imdbID = ?",
      [req.user.id, imdbID]
    );

    if (existing) {
      
      await dbRun(
        "UPDATE watchlist SET userRating = ? WHERE user_id = ? AND imdbID = ?",
        [userRating, req.user.id, imdbID]
      );
    } else {
      
      await dbRun(
        `INSERT INTO watchlist (user_id, imdbID, title, year, poster, runtime, imdbRating, userRating)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [req.user.id, imdbID, title, year, poster, runtime, imdbRating, userRating]
      );
    }

    res.status(201).json({ imdbID, title, year, poster, runtime, imdbRating, userRating });
  } catch (err) {
    console.error("Error adding to watchlist:", err.message);
    res.status(500).json({ error: "Database error while adding to watchlist" });
  }
});

app.delete("/api/watchlist/:imdbID", authenticateToken, async (req, res) => {
  const { imdbID } = req.params;

  try {
    const result = await dbRun(
      "DELETE FROM watchlist WHERE user_id = ? AND imdbID = ?",
      [req.user.id, imdbID]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Movie not found in your watchlist" });
    }

    res.json({ success: true, message: "Movie removed from watchlist" });
  } catch (err) {
    console.error("Error deleting from watchlist:", err.message);
    res.status(500).json({ error: "Database error while deleting from watchlist" });
  }
});

const buildPath = path.join(__dirname, "../build");
app.use(express.static(buildPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(buildPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`FlickerBox fullstack server running on port ${PORT}`);
});
