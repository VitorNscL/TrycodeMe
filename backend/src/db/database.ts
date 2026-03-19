import Database from 'better-sqlite3';
import { env } from '../config/env.js';

export const db = new Database(env.DB_PATH);
db.pragma('journal_mode = WAL');

function ensureColumn(table: string, column: string, definition: string) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((entry) => entry.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  display_name TEXT NOT NULL,
  nickname TEXT,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user',
  provider TEXT NOT NULL DEFAULT 'local',
  specialty TEXT DEFAULT '',
  certifications TEXT DEFAULT '[]',
  active_hours INTEGER NOT NULL DEFAULT 0,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  exercises_completed INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  learn_outcomes TEXT NOT NULL,
  language TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  type TEXT NOT NULL,
  tags TEXT NOT NULL,
  keywords TEXT NOT NULL,
  featured INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'published',
  author_id INTEGER NOT NULL,
  author_label TEXT DEFAULT '',
  sections TEXT NOT NULL,
  exercise_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  language TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  type TEXT NOT NULL,
  prompt TEXT NOT NULL,
  starter_code TEXT DEFAULT '',
  solution TEXT DEFAULT '',
  test_config TEXT NOT NULL,
  featured INTEGER NOT NULL DEFAULT 0,
  author_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  lesson_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  progress_percent INTEGER NOT NULL DEFAULT 0,
  started_at TEXT,
  last_accessed_at TEXT,
  completed_at TEXT,
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS support_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS competitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  starts_at TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS competition_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  competition_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  best_score INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  UNIQUE(competition_id, user_id)
);

CREATE TABLE IF NOT EXISTS duels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  challenger_id INTEGER NOT NULL,
  opponent_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  winner_id INTEGER,
  difficulty TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

ensureColumn('users', 'active_minutes', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('users', 'last_active_ping', 'TEXT');
ensureColumn('lessons', 'thumbnail_url', "TEXT DEFAULT ''");
ensureColumn('exercises', 'thumbnail_url', "TEXT DEFAULT ''");
ensureColumn('duels', 'mode', "TEXT NOT NULL DEFAULT 'code'");
ensureColumn('duels', 'started_at', 'TEXT');
ensureColumn('duels', 'completed_at', 'TEXT');
