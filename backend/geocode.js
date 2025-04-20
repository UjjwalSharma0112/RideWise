import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { config } from "dotenv";
config();
const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY; // 🔑 Replace this!
const CACHE_FILE = path.join("./", "geocode-cache.json");

// Load cache from disk (or start fresh)
let cache = {};
if (fs.existsSync(CACHE_FILE)) {
  cache = JSON.parse(fs.readFileSync(CACHE_FILE));
}

function saveCache() {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function geocode(placeName) {
  if (cache[placeName]) {
    console.log(`📦 Using cached coordinates for: ${placeName}`);
    return cache[placeName];
  }

  const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
    placeName
  )}&key=${OPENCAGE_API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.results.length === 0) {
      throw new Error("No results found for the location.");
    }

    const { lat, lng } = data.results[0].geometry;
    const coords = { lat, lng };

    // Save to cache
    cache[placeName] = coords;
    saveCache();

    console.log(`✅ Geocoded and cached: ${placeName}`);
    return coords;
  } catch (err) {
    console.error(`❌ Geocoding failed for "${placeName}":`, err.message);
    return null;
  }
}

export default geocode;
