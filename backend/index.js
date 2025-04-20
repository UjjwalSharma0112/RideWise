// Backend (Node.js/Express with real OSM graph + NLP-based geocoding)
import express from 'express';
import cors from 'cors';
import fs from 'fs'
import fetch from 'node-fetch';
import geocode from "./geocode.js";

const app = express();

app.use(cors());
app.use(express.json());

const graph = JSON.parse(fs.readFileSync('./Dehradun,India.json'));

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function findNearestNode(lat, lng) {
  let nearest = null, minDist = Infinity;
  for (let id in graph.nodes) {
    const node = graph.nodes[id];
    const dist = haversine(lat, lng, node.lat, node.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = id;
    }
  }
  return nearest;
}

function dijkstra(start, end) {
  const dist = {}, prev = {}, visited = new Set();
  const nodes = Object.keys(graph.nodes);
  for (let node of nodes) dist[node] = Infinity;
  dist[start] = 0;

  while (visited.size < nodes.length) {
    // Find unvisited node with min distance
    let u = nodes.filter(n => !visited.has(n)).reduce((a, b) => dist[a] < dist[b] ? a : b, null);

    if (!u || dist[u] === Infinity) break; // No more reachable nodes
    visited.add(u);

    if (u === end) break;

    const neighbors = graph.edges[u];
    if (!neighbors) continue;

    for (let neighbor of neighbors) {
      let alt = dist[u] + neighbor.weight;
      if (alt < dist[neighbor.to]) {
        dist[neighbor.to] = alt;
        prev[neighbor.to] = u;
      }
    }
  }

  // Reconstruct path
  let path = [], u = end;
  while (u && prev[u] !== undefined) {
    path.unshift(u);
    u = prev[u];
  }
  if (u === start) path.unshift(start); // Add start only if reachable

  return path.length ? path : null;
}

function aStar(start, goal) {
  const openSet = new Set([start]);
  const cameFrom = {};
  const gScore = {};
  const fScore = {};

  for (let node in graph.nodes) {
    gScore[node] = Infinity;
    fScore[node] = Infinity;
  }

  gScore[start] = 0;
  fScore[start] = haversine(
    graph.nodes[start].lat,
    graph.nodes[start].lng,
    graph.nodes[goal].lat,
    graph.nodes[goal].lng
  );

  while (openSet.size > 0) {
    let current = [...openSet].reduce((a, b) =>
      fScore[a] < fScore[b] ? a : b
    );

    if (current === goal) {
      const path = [];
      while (current) {
        path.unshift(current);
        current = cameFrom[current];
      }
      return path;
    }

    openSet.delete(current);

    for (let neighbor of graph.edges[current] || []) {
      const tentativeGScore = gScore[current] + neighbor.weight;
      if (tentativeGScore < gScore[neighbor.to]) {
        cameFrom[neighbor.to] = current;
        gScore[neighbor.to] = tentativeGScore;
        fScore[neighbor.to] =
          tentativeGScore +
          haversine(
            graph.nodes[neighbor.to].lat,
            graph.nodes[neighbor.to].lng,
            graph.nodes[goal].lat,
            graph.nodes[goal].lng
          );
        openSet.add(neighbor.to);
      }
    }
  }

  return null; // no path found
}


function extractFromTo(text) {
  const match = text.match(/from (.+?) to (.+)/i);
  return match ? { from: match[1], to: match[2] } : null;
}
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

  const fromNode = findNearestNode(fromCoords.lat, fromCoords.lng);
  const toNode = findNearestNode(toCoords.lat, toCoords.lng);
  const path = aStar(fromNode, toNode);
  const latLngPath = path.map(id => graph.nodes[id]);
  console.log(fromNode);
  console.log(toNode);
  console.log(path);
  console.log(latLngPath);
  res.json({ path: latLngPath });
});
app.post("/shared-route", async (req, res) => {
  const { driverFrom, driverTo, passengerFrom, passengerTo } = req.body;

  try {
    const [driverFromCoords, driverToCoords, passengerFromCoords, passengerToCoords] = await Promise.all([
      geocode(driverFrom),
      geocode(driverTo),
      geocode(passengerFrom),
      geocode(passengerTo)
    ]);

    const startNode = findNearestNode(driverFromCoords.lat, driverFromCoords.lng);
    const pickupNode = findNearestNode(passengerFromCoords.lat, passengerFromCoords.lng);
    const dropNode = findNearestNode(passengerToCoords.lat, passengerToCoords.lng);
    const endNode = findNearestNode(driverToCoords.lat, driverToCoords.lng);

    const path1 = aStar(startNode, pickupNode);
    const path2 = aStar(pickupNode, dropNode);
    const path3 = aStar(dropNode, endNode); 
  
    const fullPath = [...path1, ...path2.slice(1), ...path3.slice(1)]; // Avoid node duplication
    const latLngPath = fullPath.map(id => graph.nodes[id]);

    res.json({ path: latLngPath ,passenger:{from:passengerFromCoords,to:passengerToCoords},driver:{from:driverFromCoords,to:driverToCoords}});
  } catch (err) {
    console.error("Error in shared-route:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log('Backend running on http://localhost:3001'));


