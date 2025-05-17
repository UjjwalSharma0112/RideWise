// db.js
import Database from 'better-sqlite3';

const db = new Database('carpool.db');

// Create users table if not exists
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  type TEXT CHECK(type IN ('passenger', 'driver')),
  lat REAL,
  lng REAL,
  score INTEGER DEFAULT -999,
  status TEXT DEFAULT 'waiting'
);
`);

export default db;
