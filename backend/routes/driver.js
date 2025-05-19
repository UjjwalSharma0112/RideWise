import express from 'express';
import { addDriver,decreaseCapacity,getUserById, markUserMatched, updateMatchedContact } from '../utils/user.js';
import PathFinder from '../utils/pathFinder.js';
import db from "../db.js";
import haversine from '../utils/haversine.js';
const router = express.Router(); // ✅ call the function

// Example GET route

router.post('/init',(req,res)=>{
  const data=req.body;
  addDriver(data.id,data.contact,data.from,data.to,data.from_lat,data.from_lng,data.to_lat,data.to_lng,data.capacity)
  console.log("reached here");
  res.json({message:"Added the driver loooking for passenger"})
})
router.get('/check-passenger', (req, res) => {
  const driverUserId = req.query.userId;
  if (!driverUserId) return res.status(400).json({ error: 'Missing userId' });

  const driver = getUserById(driverUserId); // must return driver object or null
  if (!driver) return res.status(404).json({ error: 'Driver not found' });

  const stmt = db.prepare(`SELECT * FROM users WHERE status = 'waiting'`);
  const users = stmt.all();
  const passengers = users.filter(u => u.type === 'passenger');
  const matches = [];
  console.log(passengers)
  for (const p of passengers) {
    const pickupDist = haversine(driver.from_lat, driver.from_lng, p.from_lat, p.from_lng);
    const dropDist = haversine(driver.to_lat, driver.to_lng, p.to_lat, p.to_lng);

    if (pickupDist > 5000 || dropDist > 5000) continue;

    if (driver.capacity <= 0) break;

    matches.push({ id: p.id, contact: p.contact });

    updateMatchedContact(p.id, driver.contact);
    updateMatchedContact(driver.id, p.contact);
    markUserMatched(p.id);
    decreaseCapacity(driverUserId);

    driver.capacity -= 1;

    break; // ❗️stop after first match
  }

  return res.json({ matches });
});

router.post('/modified-path',async(req,res)=>{
  const data=req.body;
  const passengerId=data.passengerId;
  const driverId=data.driverId;
  const passenger=getUserById(passengerId);
  const driver=getUserById(driverId);
  const driverFrom={lat:driver.from_lat,lng:driver.from_lng};
  const driverTo={lat:driver.to_lat,lng:driver.to_lng};
  const passengerFrom={lat:passenger.from_lat,lng:passenger.from_lng};
  const passengerTo={lat:passenger.to_lat,lng:passenger.to_lng};
  const pf=new PathFinder()
  const startNode = pf.findNearestNode(driverFrom.lat, driverFrom.lng);
  const pickupNode = pf.findNearestNode(passengerFrom.lat, passengerFrom.lng);
  const dropNode = pf.findNearestNode(passengerTo.lat, passengerTo.lng);
  const endNode = pf.findNearestNode(driverTo.lat, driverTo.lng);
  const path1 = pf.aStar(startNode, pickupNode);
  const path2 = pf.aStar(pickupNode, dropNode);
  const path3 = pf.aStar(dropNode, endNode); 
  
  const fullPath = [...path1, ...path2.slice(1), ...path3.slice(1)]; // Avoid node duplication
  const latLngPath = fullPath.map(id => pf.graph.nodes[id]);
  res.json({path:latLngPath,passenger:{passengerFrom,passengerTo},driver:{driverFrom,driverTo}})
})
router.get('/natural-route',async(req,res)=>{
  
  const userId=req.query.userId;
  console.log(userId)
  const user=getUserById(userId);
  console.log(user)
  const fromCoords = { lat: user.from_lat, lng: user.from_lng };
  const toCoords = { lat: user.to_lat, lng: user.to_lng };

  const pf=new PathFinder()
  const fromNode = pf.findNearestNode(fromCoords.lat, fromCoords.lng);
  const toNode = pf.findNearestNode(toCoords.lat, toCoords.lng);
  const path = pf.aStar(fromNode, toNode);
  const latLngPath = path.map(id => pf.graph.nodes[id]);
  console.log(fromNode);
  console.log(toNode);
  console.log(path);
  console.log(latLngPath);
  res.json({ path: latLngPath });
})
export default router;
