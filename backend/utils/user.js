import db from '../db.js';

export function  addPassenger(id, contact, from, to, f_lat, f_lng, t_lat, t_lng) {
  const stmt = db.prepare(`
    INSERT INTO users (id, type, contact, from_location, to_location, from_lat, from_lng, to_lat, to_lng)
    VALUES (?, 'passenger', ?, ?, ?, ?, ?, ?, ?);
  `);
   stmt.run(id, contact, from, to, f_lat, f_lng, t_lat, t_lng);
}
export function addDriver(id, contact, from, to, f_lat, f_lng, t_lat, t_lng, capacity) {
  const stmt = db.prepare(`
    INSERT INTO users (
      id, type, contact, from_location, to_location, 
      from_lat, from_lng, to_lat, to_lng, capacity
    ) VALUES (?, 'driver', ?, ?, ?, ?, ?, ?, ?, ?);
  `);

  stmt.run(id, contact, from, to, f_lat, f_lng, t_lat, t_lng, capacity);
}
export function getWaitingUser(){
  const stmt = db.prepare(`SELECT * FROM users WHERE status = 'waiting'`);
  return stmt.all();
}
export function getUserById(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const stmt = db.prepare(`SELECT * FROM users WHERE id = ?`);
  const user = stmt.get(userId);

  if (!user) {
    console.warn(`No user found with ID: ${userId}`);
  }

  return user;
}
export function decreaseCapacity(userId){
  const stmt=db.prepare(`UPDATE users SET capacity=capacity-1 WHERE id=? `);
  stmt.run(userId)
}

export function markUserMatched(id) {
  const stmt = db.prepare(`UPDATE users SET status = 'matched' WHERE id = ?`);
  stmt.run(id)
}
export function removeUser(userId) {
  const stmt = db.prepare(`DELETE FROM users WHERE id = ?`);
  const result = stmt.run(userId);
}
export function updateMatchedContact(userId, data) {
  const stmt = db.prepare(`UPDATE users SET matchedContact=? WHERE id=?`)
  try {
    stmt.run(data, userId);

  } catch (error) {
    console.error('Failed to update matchedContact:', error);
    throw error;
  }

}