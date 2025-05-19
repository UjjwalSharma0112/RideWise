import Database from 'better-sqlite3';

const db = new Database('carpool.db');

// Single users table with type column
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  type TEXT CHECK(type IN ('passenger', 'driver')),
  contact TEXT,
  matchedContact TEXT,

  from_location TEXT,
  to_location TEXT,
  from_lat REAL,
  from_lng REAL,
  to_lat REAL,
  to_lng REAL,

  score INTEGER DEFAULT -999,
  status TEXT DEFAULT 'waiting',
  capacity INTEGER   -- Only applicable for drivers
);
`);

export default db;
