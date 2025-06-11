# 🚗 RideWise

**RideWise** is a smart, map-based carpooling web application that enables users to request rides by selecting pickup and drop-off locations on a live map. It simulates real-time driver matching and route planning, combining geospatial intelligence with modern web technologies.

---

## 🌐 Tech Stack

- **Frontend:** React, TypeScript, Leaflet.js
- **Mapping & Geolocation:** OpenStreetMap (OSM), Reverse & Forward Geocoding
- **Pathfinding Algorithm:** A* Algorithm
- **Map Data Handling:** Osynx (OSM → JSON conversion)
- **Backend / Database:** SQLite3 (lightweight relational database)

---

## ✨ Features

- 🗺️ **Interactive Map UI** using Leaflet with OSM tiles  
- 📍 **Pickup & Drop-off Selection** with geocoding/reverse-geocoding support  
- 🚗 **Simulated Driver Matching** with periodic polling  
- 🧭 **Optimal Route Calculation** using A* pathfinding algorithm  
- 🧠 **Map Data Preprocessing** with [Osynx](https://github.com/Osynx/OSM-to-Graph) to convert OSM data into navigable JSON graph format  
- 💾 **Persistent Ride Data** using SQLite3

---

## UI
![image](https://github.com/user-attachments/assets/677ea6f4-d47e-4181-b6a4-b1b3807e649d)



---
## System Architexture
![image](https://github.com/user-attachments/assets/68d1a526-e410-488d-ba3f-acf0fac487fe)
![image](https://github.com/user-attachments/assets/8d564d97-53ef-4a17-98c5-162552c469d1)
