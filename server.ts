import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("fluencyflow.db");
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
const isRailwayRuntime = Boolean(
  process.env.RAILWAY_ENVIRONMENT_NAME
  || process.env.RAILWAY_PUBLIC_DOMAIN
  || process.env.RAILWAY_STATIC_URL
);
const isProductionRuntime = process.env.NODE_ENV === "production" || isRailwayRuntime;

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    xp INTEGER DEFAULT 0,
    level TEXT DEFAULT 'A0',
    streak INTEGER DEFAULT 0,
    last_active DATE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    text TEXT,
    sender TEXT,
    feedback TEXT, -- 'up', 'down', or NULL
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS user_progress (
    userId INTEGER,
    word TEXT,
    interval INTEGER DEFAULT 1, -- in days
    ease_factor REAL DEFAULT 2.5,
    next_review DATE,
    last_result TEXT, -- 'correct' or 'wrong'
    PRIMARY KEY(userId, word),
    FOREIGN KEY(userId) REFERENCES users(id)
  );
`);

// Add default user if not exists
const defaultEmail = 'mamatovo354@gmail.com';
const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(defaultEmail);
if (!existingUser) {
  const hashedPassword = bcrypt.hashSync('password123', 10);
  db.prepare('INSERT INTO users (email, password, name, xp, level, streak) VALUES (?, ?, ?, ?, ?, ?)')
    .run(defaultEmail, hashedPassword, 'Aleks', 2450, 'B2', 12);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json());
  app.use(cors());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "FluencyFlow Server is running" });
  });

  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const info = db.prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)").run(email, hashedPassword, name);
      const token = jwt.sign({ id: info.lastInsertRowid, email }, JWT_SECRET);
      res.json({ token, user: { id: info.lastInsertRowid, email, name, xp: 0, level: 'A0', streak: 0 } });
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, email }, JWT_SECRET);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  });

  app.get("/api/auth/me", authenticate, (req: any, res) => {
    const user = db.prepare("SELECT id, email, name, xp, level, streak FROM users WHERE id = ?").get(req.user.id);
    res.json(user);
  });

  app.get("/api/chat/history", authenticate, (req: any, res) => {
    const messages = db.prepare("SELECT * FROM messages WHERE userId = ? ORDER BY timestamp ASC").all(req.user.id);
    res.json(messages);
  });

  app.post("/api/chat/save", authenticate, (req: any, res) => {
    const { text, sender } = req.body;
    db.prepare("INSERT INTO messages (userId, text, sender) VALUES (?, ?, ?)").run(req.user.id, text, sender);
    res.json({ success: true });
  });

  app.post("/api/chat/feedback", authenticate, (req: any, res) => {
    const { messageId, feedback } = req.body;
    db.prepare("UPDATE messages SET feedback = ? WHERE id = ? AND userId = ?").run(feedback, messageId, req.user.id);
    res.json({ success: true });
  });

  app.get("/api/progress", authenticate, (req: any, res) => {
    const progress = db.prepare("SELECT * FROM user_progress WHERE userId = ?").all(req.user.id);
    res.json(progress);
  });

  app.post("/api/progress/update", authenticate, (req: any, res) => {
    const { word, result } = req.body;
    const existing: any = db.prepare("SELECT * FROM user_progress WHERE userId = ? AND word = ?").get(req.user.id, word);
    
    let interval = 1;
    let easeFactor = 2.5;
    
    if (existing) {
      if (result === 'correct') {
        interval = Math.ceil(existing.interval * existing.ease_factor);
        easeFactor = existing.ease_factor + 0.1;
      } else {
        interval = 1;
        easeFactor = Math.max(1.3, existing.ease_factor - 0.2);
      }
    }
    
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);
    
    db.prepare(`
      INSERT OR REPLACE INTO user_progress (userId, word, interval, ease_factor, next_review, last_result)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, word, interval, easeFactor, nextReview.toISOString().split('T')[0], result);
    
    res.json({ success: true, nextReview });
  });

  // Vite middleware for development
  if (!isProductionRuntime) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${isProductionRuntime ? "production" : "development"} mode`);
  });
}

startServer();
