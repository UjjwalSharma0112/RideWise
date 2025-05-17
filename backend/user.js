import db from './db.js';

export function addUser(id, type, lat, lng) {
  const stmt = db.prepare(`
    INSERT INTO users (id, type, lat, lng)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, type, lat, lng);
}
export function getWaitingUser(){
  const stmt = db.prepare(`SELECT * FROM users WHERE status = 'waiting'`);
  return stmt.all();
}

export function markUsersMatched(ids) {
  const stmt = db.prepare(`UPDATE users SET status = 'matched' WHERE id = ?`);
  const tx = db.transaction((ids) => {
    for (const id of ids) stmt.run(id);
  });
  tx(ids);
}
export function removeUser(userId) {
  const stmt = db.prepare(`DELETE FROM users WHERE id = ?`);
  const result = stmt.run(userId);
}