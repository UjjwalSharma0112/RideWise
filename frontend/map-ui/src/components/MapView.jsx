import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";


const createIcon = (color = "blue") =>
  new L.Icon({
    iconUrl: `marker-icon-${color}.png`,

    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

const PathMap = ({ path }) => {
  const map = useMap();
  useEffect(() => {
    if (path.length > 0) {
      const bounds = L.latLngBounds(path.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds);
    }
  }, [path]);
  return null;
};

export default function MapView() {
  const [path, setPath] = useState([]);
  const [passenger,setPassenger]=useState();
  const [driver,setDriver]=useState();
  useEffect(() => {
    const getPath = async () => {
      try {
        const response = await axios.post("http://localhost:3001/shared-route", {
          driverFrom: "Nehru Colony, Dehradun",
          driverTo: "ISBT Dehradun",
          passengerFrom: "Race Course, Dehradun",
          passengerTo: "Clock Tower, Dehradun"
        });
        const { path, driver, passenger } = response.data;
        console.log("🚗 Driver:", driver);
        console.log("🧍 Passenger:", passenger);
        console.log("🗺️ Path:", path);
    
        setPath(path);
        setDriver(driver);
        setPassenger(passenger);
        
      } catch (err) {
        console.error("Failed to fetch path", err);
      }
    };
    getPath();
  }, []);

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <MapContainer center={[30.3255, 78.0421]} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
       {path.length > 0 && (
  <>
    {/* Driver Start & End */}
    <Marker position={[driver.from.lat, driver.from.lng]} icon={createIcon("black")}>
    </Marker>
    <Marker position={[driver.to.lat, driver.to.lng]} icon={createIcon("blue")}>
    </Marker>

    {/* Passenger Start & End */}
    <Marker position={[passenger.from.lat, passenger.from.lng]} icon={createIcon("gold")}>
    </Marker>
    <Marker position={[passenger.to.lat, passenger.to.lng]} icon={createIcon("green")}>
    </Marker>

    {/* Route Line */}
    <Polyline positions={path.map(p => [p.lat, p.lng])} color="blue" />
    <PathMap path={path} />
  </>
)}

      </MapContainer>
    </div>
  );
}
