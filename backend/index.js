// Backend (Node.js/Express with real OSM graph + NLP-based geocoding)
import express from 'express';
import cors from 'cors';
import geocode from "./geocode.js";
import { extractFromTo } from './utils.js';
import PathFinder from './pathFinder.js';
import { addUser,getWaitingUser } from './user.js';
const app = express();

app.use(cors());
app.use(express.json());


// const extracted={from:"Nehru Colony",to:"Paltan Bazaar"};
// const myFunc = async (extracted) => {
//   console.log("📍 Geocoding FROM:", extracted.from);
//   const fromCoords = await geocode(extracted.from);
//   console.log("✅ Got fromCoords:", fromCoords);

//   console.log("📍 Geocoding TO:", extracted.to);
//   const toCoords = await geocode(extracted.to);
//   console.log("✅ Got toCoords:", toCoords);

//   const fromNode = findNearestNode(fromCoords.lat, fromCoords.lng);
//   const toNode = findNearestNode(toCoords.lat, toCoords.lng);
//   const path = aStar(fromNode, toNode);

//   const latLngPath = path.map(id => graph.nodes[id]);
//   console.log("➡️  From Node:", fromNode);
//   console.log("➡️  To Node:", toNode);
//   console.log("🧭 Path:", path);
//   console.log("📌 LatLng Path:", latLngPath);
// };
// myFunc(extracted)


app.post('/natural-route', async (req, res) => {
  const { message } = req.body;
  const extracted = extractFromTo(message);
  if (!extracted) return res.status(400).json({ error: 'Invalid input format' });

  const fromCoords = await geocode(extracted.from);
  const toCoords = await geocode(extracted.to);
  if (!fromCoords || !toCoords) return res.status(404).json({ error: 'Could not geocode locations' });
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
});


app.post("/shared-route", async (req, res) => {
  const { driverFrom, driverTo, passengerFrom, passengerTo } = req.body;
  const pf=new PathFinder()
  try {
    const [driverFromCoords, driverToCoords, passengerFromCoords, passengerToCoords] = await Promise.all([
      geocode(driverFrom),
      geocode(driverTo),
      geocode(passengerFrom),
      geocode(passengerTo)
    ]);

    const startNode = pf.findNearestNode(driverFromCoords.lat, driverFromCoords.lng);
    const pickupNode = pf.findNearestNode(passengerFromCoords.lat, passengerFromCoords.lng);
    const dropNode = pf.findNearestNode(passengerToCoords.lat, passengerToCoords.lng);
    const endNode = pf.findNearestNode(driverToCoords.lat, driverToCoords.lng);

    const path1 = pf.aStar(startNode, pickupNode);
    const path2 = pf.aStar(pickupNode, dropNode);
    const path3 = pf.aStar(dropNode, endNode); 
  
    const fullPath = [...path1, ...path2.slice(1), ...path3.slice(1)]; // Avoid node duplication
    const latLngPath = fullPath.map(id => pf.graph.nodes[id]);

    res.json({ path: latLngPath ,passenger:{from:passengerFromCoords,to:passengerToCoords},driver:{from:driverFromCoords,to:driverToCoords}});
  } catch (err) {
    console.error("Error in shared-route:", err);
    res.status(500).json({ error: err.message });
  }
});

const port=process.env.PORT
app.listen(port, () => console.log(`Backend running on ${port}`));


