/**
 * Database Schema and Initialization
 * SQLite database for user data, activity tracking, and metrics
 */

export const DATABASE_VERSION = 1;

export const SCHEMA = `
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
  duration INTEGER NOT NULL, -- seconds
  category TEXT CHECK(category IN ('productive', 'neutral', 'distracting')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Daily metrics (aggregated stats)
CREATE TABLE IF NOT EXISTS daily_metrics (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD format
  focus_time INTEGER DEFAULT 0, -- seconds
  productive_time INTEGER DEFAULT 0, -- seconds
  task_completions INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  UNIQUE(user_id, date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Task completions (links to existing workflow system)
CREATE TABLE IF NOT EXISTS task_completions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  duration INTEGER, -- seconds spent on task
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Achievements and gamification
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_type TEXT NOT NULL,
  earned_at TEXT NOT NULL,
  metadata TEXT, -- JSON for additional data
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_time ON activity_sessions(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_app_usage_user_time ON app_usage(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON daily_metrics(user_id, date);
CREATE INDEX IF NOT EXISTS idx_task_completions_user ON task_completions(user_id, completed_at);
`;
