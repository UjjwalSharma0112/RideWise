import solver from 'javascript-lp-solver';
import db from '../db.js';
import haversine from './haversine.js'; // Calculates distance between 2 lat/lng points

const MAX_DISTANCE_METERS = 1500;//can use relative distance 

// 1. Load users from DB
const users = db.prepare(`SELECT * FROM users WHERE status = 'waiting'`).all();
const passengers = users.filter(u => u.type === 'passenger');
const drivers = users.filter(u => u.type === 'driver');

// 2. Build ILP model
const model = {
  optimize: 'score',
  opType: 'max',
  constraints: {},
  variables: {}
};

// 3. Add variables and constraints
for (let p of passengers) {
  for (let d of drivers) {
    const pickupDist = haversine(p.from_lat, p.from_lng, d.from_lat, d.from_lng);
    const dropoffDist = haversine(p.to_lat, p.to_lng, d.to_lat, d.to_lng);

    if (pickupDist > MAX_DISTANCE_METERS || dropoffDist > MAX_DISTANCE_METERS) continue;

    const varName = `x_${p.id}_${d.id}`;
    const score = 20000 - (pickupDist + dropoffDist); // higher score for closer total trip

    model.variables[varName] = {
      score,
      [`p_${p.id}`]: 1,
      [`d_${d.id}`]: 1
    };

    if (!model.constraints[`p_${p.id}`]) {
      model.constraints[`p_${p.id}`] = { max: 1 };
    }

    if (!model.constraints[`d_${d.id}`]) {
      model.constraints[`d_${d.id}`] = { max: d.capacity };
    }
  }
}

// 4. Solve the ILP
const results = solver.Solve(model);

// 5. Update DB and print matches
Object.keys(results).forEach(key => {
  if (!key.startsWith('x_') || results[key] !== 1) return;

  const [, pid, did] = key.split('_');
  db.prepare(`UPDATE users SET status = 'matched' WHERE id IN (?, ?);`).run(pid, did);

  console.log(`✅ Matched passenger ${pid} with driver ${did}`);
});
