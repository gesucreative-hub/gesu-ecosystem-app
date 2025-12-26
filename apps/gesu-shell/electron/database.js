/**
 * SQLite Database Connection using sql.js
 * Pure JavaScript SQLite - no native compilation needed
 * Supports multi-user with separate databases per user
 */
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;
let dbPath = null;
let currentUserId = null; // Track current user

// SQL.js will be loaded dynamically
let initSqlJs = null;
let SQL = null;

/**
 * Initialize the database connection (async)
 * @param {string|null} userId - User ID for multi-user support, null for default
 * @param {string} workspaceRoot - Base workspace root path
 */
export async function initDatabase(userId = null, workspaceRoot = null) {
  // If we already have the correct database loaded, return it
  if (db && currentUserId === userId) return db;

  // Close existing database if switching users
  if (db && currentUserId !== userId) {
    console.log('[Database] Switching from user', currentUserId, 'to', userId);
    closeDatabase();
  }

  // Dynamically import sql.js if not loaded
  if (!initSqlJs) {
    const sqlJs = await import('sql.js');
    initSqlJs = sqlJs.default;
  }

  // Determine database path based on user
  if (workspaceRoot && userId !== 'fallback') {
    // Multi-user mode: users/{userId}/gesu-database.db
    const userDir = userId || 'default';
    const userWorkspace = path.join(workspaceRoot, 'users', userDir);

    // Ensure user workspace exists
    if (!fs.existsSync(userWorkspace)) {
      fs.mkdirSync(userWorkspace, { recursive: true });
    }

    dbPath = path.join(userWorkspace, 'gesu-database.db');
  } else {
    // Fallback: single database in userData
    const userDataPath = app.getPath('userData');
    dbPath = path.join(userDataPath, 'gesu-ecosystem.db');
  }

  console.log('[Database] Initializing database at:', dbPath);

  // Initialize SQL.js if not already done
  if (!SQL) {
    SQL = await initSqlJs({
      // Locate the WASM file
      locateFile: (file) => {
        // Try to find the WASM file in node_modules
        const wasmPath = path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file);
        if (fs.existsSync(wasmPath)) return wasmPath;
        // Fallback to default
        return `https://sql.js.org/dist/${file}`;
      }
    });
  }

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('[Database] Loaded existing database for user:', userId || 'default');
  } else {
    db = new SQL.Database();
    console.log('[Database] Created new database for user:', userId || 'default');
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Create tables
  db.run(SCHEMA);

  // Save database to file
  saveDatabase();

  // Update current user tracking
  currentUserId = userId;

  console.log('[Database] Database initialized successfully');

  return db;
}

/**
 * Get the active database connection
 */
export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Save database to file
 */
export function saveDatabase() {
  if (!db || !dbPath) return;

  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  console.log('[Database] Database saved to disk');
}

/**
 * Close the database connection
 */
export function closeDatabase() {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    dbPath = null;
    currentUserId = null;
    console.log('[Database] Database connection closed');
  }
}

/**
 * Switch to a different user's database
 * @param {string|null} userId - User ID to switch to
 * @param {string} workspaceRoot - Workspace root path
 */
export async function switchUserDatabase(userId, workspaceRoot) {
  console.log('[Database] Switching to user database:', userId || 'default');
  return await initDatabase(userId, workspaceRoot);
}

/**
 * Get the current user ID for the active database
 */
export function getCurrentUserId() {
  return currentUserId;
}

// Schema definition
const SCHEMA = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TEXT NOT NULL,
  last_login TEXT NOT NULL
);

-- Activity sessions (focus, breaks, idle time)
CREATE TABLE IF NOT EXISTS activity_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  type TEXT NOT NULL CHECK(type IN ('focus', 'break', 'idle')),
  task_id TEXT,
  project_id TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- App usage tracking
CREATE TABLE IF NOT EXISTS app_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  app_name TEXT NOT NULL,
  window_title TEXT,
  duration INTEGER NOT NULL,
  category TEXT CHECK(category IN ('productive', 'neutral', 'distracting')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Daily metrics (aggregated stats)
CREATE TABLE IF NOT EXISTS daily_metrics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  focus_time INTEGER DEFAULT 0,
  productive_time INTEGER DEFAULT 0,
  task_completions INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  UNIQUE(user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Task completions
CREATE TABLE IF NOT EXISTS task_completions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  duration INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_type TEXT NOT NULL,
  earned_at TEXT NOT NULL,
  metadata TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`;
