const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'smartpantry.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    stock INTEGER NOT NULL,
    unit TEXT NOT NULL,
    expired_at TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory(user_id);
  CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(user_id, category);

  CREATE TABLE IF NOT EXISTS shopping (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit TEXT NOT NULL,
    is_bought INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_shopping_user ON shopping(user_id);

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    dedupe_key TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_dedupe ON notifications(user_id, dedupe_key) WHERE dedupe_key IS NOT NULL;

  CREATE TABLE IF NOT EXISTS revoked_tokens (
    jti TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    revoked_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS id_counters (
    prefix TEXT PRIMARY KEY,
    value INTEGER NOT NULL DEFAULT 0
  );
`);

module.exports = db;
