import React, { useState, useCallback, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents
} from 'react-leaflet';
import { Icon } from 'leaflet';
import { Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { driverRequest, getNaturalRoute, getSharedRoute, pollPassenger } from '../services/api';
import { DEHRADUN_COORDINATES, DEFAULT_ZOOM, formatCoordinates } from '../utils/mapUtils';

// Define necessary types
interface Coordinates {
  lat: number;
  lng: number;
}

interface PassengerData {
  from_lat: number;
  from_lng: number;
  to_lat: number;
  to_lng: number;
  contact: string;
}

interface PassengerRouteInfo {
  passengerFrom: Coordinates;
  passengerTo: Coordinates;
}

// --- Reverse Geocoding ---
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
  );
  const data = await response.json();
  return data.display_name || 'Unknown location';
}

// --- Marker Icons ---
const startIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const passengerIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const passengerPickupIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const passengerDropIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapClickHandlerProps {
  onLocationSelect: (coords: Coordinates) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
};

interface DriverMapProps {
  onRouteSubmit: () => void;
}

type PassengerMatch = {
  id: string;
  contact: string;
};

const DriverMap: React.FC<DriverMapProps> = ({ onRouteSubmit }) => {
  const [routeStart, setRouteStart] = useState<Coordinates | null>(null);
  const [routeEnd, setRouteEnd] = useState<Coordinates | null>(null);
  const [passengers, setPassengers] = useState<PassengerData[]>([]);
  const [passengerRouteInfo, setPassengerRouteInfo] = useState<PassengerRouteInfo[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sourceText, setSourceText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [naturalRoutePath, setNaturalRoutePath] = useState<Coordinates[]>([]);
  const [sharedRoute, setSharedRoute] = useState<Coordinates[]>([]);
  const [matchedPassenger, setMatchedPassenger] = useState<PassengerMatch | null>(null);

  const handleLocationSelect = useCallback(async (coords: Coordinates) => {
    if (!routeStart) {
      setRouteStart(coords);
      const name = await reverseGeocode(coords.lat, coords.lng);
      setSourceText(name);
      toast.success('Route start set!');
    } else if (!routeEnd) {
      setRouteEnd(coords);
      const name = await reverseGeocode(coords.lat, coords.lng);
      setDestinationText(name);
      toast.success('Route end set!');
    }
  }, [routeStart, routeEnd]);

  const handleSubmit = async () => {
    if (!routeStart || !routeEnd) {
      toast.error('Set both start and end points');
      return;
    }

    setIsSubmitting(true);
    setCountdown(30);
    setPassengers([]);
    setPassengerRouteInfo([]);
    setSharedRoute([]);
    setNaturalRoutePath([]);
    toast.success('Route submitted. Searching for passengers...');

    try {
      await driverRequest(4, routeStart, routeEnd, sourceText, destinationText);
      onRouteSubmit();

      let pollingInterval: NodeJS.Timeout;

      const startPolling = () => {
        pollingInterval = setInterval(async () => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(pollingInterval);

              if (!passengers || passengers.length === 0) {
                getNaturalRoute(routeStart, routeEnd)
                  .then((data) => {
                    const path = Array.isArray(data.path)
                      ? data.path.map((p: { lat: number; lng: number }) => ({ lat: p.lat, lng: p.lng }))
                      : [];
                    setNaturalRoutePath(path);
                    setSharedRoute([]); // Clear shared route
                    toast('No passengers found. Showing natural route.');
                  })
                  .catch(() => toast.error('Could not fetch natural route.'));
              }

              setIsSubmitting(false);
              return 0;
            }

            return prev - 1;
          });

          try {
            const result = await pollPassenger(setMatchedPassenger);
            if (result?.matches && result.matches.length > 0) {
              const matched = result.matches[0];

              toast.success(`Passenger matched: 📞 ${matched.contact}`);

              const shared = await getSharedRoute(matched.id);
              
              // Handle shared route path
              setSharedRoute(Array.isArray(shared.path) ? shared.path : []);
              
              // Handle conventional passenger data format (if present)
              if (Array.isArray(shared.passenger)) {
                setPassengers(shared.passenger);
              }
              
              // Handle new passenger route info format
              if (Array.isArray(shared.passenger) && shared.passenger.length > 0 && 
                  shared.passenger[0].passengerFrom && shared.passenger[0].passengerTo) {
                setPassengerRouteInfo(shared.passenger);
              } else if (shared.passenger && typeof shared.passenger === 'object' && 
                         shared.passenger.passengerFrom && shared.passenger.passengerTo) {
                // Handle case where passenger is a single object, not in array
                setPassengerRouteInfo([shared.passenger as PassengerRouteInfo]);
              }

              clearInterval(pollingInterval);
              setIsSubmitting(false);
              setCountdown(0);
            }
          } catch (err) {
            console.error('Polling failed:', err);
          }
        }, 1000);
      };

      startPolling();
    } catch (err) {
      toast.error('Submission failed');
      setIsSubmitting(false);
      setCountdown(0);
    }
  };

  const resetLocations = () => {
    setRouteStart(null);
    setRouteEnd(null);
    setPassengers([]);
    setPassengerRouteInfo([]);
    setSourceText('');
    setDestinationText('');
    setCountdown(0);
    setIsSubmitting(false);
    setNaturalRoutePath([]);
    setSharedRoute([]);
    toast.success('Route reset');
  };

  return (
    <div className="relative flex flex-col space-y-4">
      {countdown > 0 && (
        <div className="absolute inset-0 bg-black bg-opacity-60 z-[9999] flex items-center justify-center pointer-events-auto">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-xs mx-auto">
            <p className="text-lg font-semibold mb-2">Matching passengers...</p>
            <p className="text-sm text-gray-700">Time remaining: {countdown}s</p>
          </div>
        </div>
      )}

      <div className="h-[60vh] rounded-lg overflow-hidden shadow-lg border border-gray-200">
        <MapContainer
          center={DEHRADUN_COORDINATES}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={handleLocationSelect} />

          {routeStart && (
            <Marker position={routeStart} icon={startIcon}>
              <Popup>
                <div className="font-semibold">🚗 Driver Start</div>
                <div className="text-sm text-gray-600">{sourceText || "Starting Point"}</div>
              </Popup>
            </Marker>
          )}
          
          {routeEnd && (
            <Marker position={routeEnd} icon={endIcon}>
              <Popup>
                <div className="font-semibold">🏁 Driver Destination</div>
                <div className="text-sm text-gray-600">{destinationText || "Ending Point"}</div>
              </Popup>
            </Marker>
          )}

          {/* Display traditional passenger markers */}
          {Array.isArray(passengers) && passengers.map((p, idx) => (
            <React.Fragment key={`passenger-${idx}`}>
              <Marker
                position={{ lat: p.from_lat, lng: p.from_lng }}
                icon={passengerIcon}
              >
                <Popup>
                  <div className="font-semibold">👤 Passenger Pickup</div>
                  <div className="text-sm font-medium">Contact: {p.contact}</div>
                  <div className="text-xs text-gray-600 mt-1">Traditional Format</div>
                </Popup>
              </Marker>
              <Marker
                position={{ lat: p.to_lat, lng: p.to_lng }}
                icon={passengerIcon}
              >
                <Popup>
                  <div className="font-semibold">🛑 Passenger Drop-off</div>
                  <div className="text-sm font-medium">Contact: {p.contact}</div>
                  <div className="text-xs text-gray-600 mt-1">Traditional Format</div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}

          {/* Display passenger route info markers */}
          {Array.isArray(passengerRouteInfo) && passengerRouteInfo.map((p, idx) => (
            <React.Fragment key={`passenger-route-${idx}`}>
              <Marker
                position={p.passengerFrom}
                icon={passengerPickupIcon}
              >
                <Popup>
                  <div className="font-semibold">🚶 Passenger Pickup</div>
                  <div className="text-sm font-medium">Location #{idx + 1}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Coordinates: {p.passengerFrom.lat.toFixed(6)}, {p.passengerFrom.lng.toFixed(6)}
                  </div>
                </Popup>
              </Marker>
              <Marker
                position={p.passengerTo}
                icon={passengerDropIcon}
              >
                <Popup>
                  <div className="font-semibold">📍 Passenger Destination</div>
                  <div className="text-sm font-medium">Location #{idx + 1}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Coordinates: {p.passengerTo.lat.toFixed(6)}, {p.passengerTo.lng.toFixed(6)}
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}

          {naturalRoutePath.length > 0 && (
            <Polyline
              positions={naturalRoutePath}
              pathOptions={{ color: 'purple', weight: 4 }}
            />
          )}

          {sharedRoute.length > 0 && (
            <Polyline
              positions={sharedRoute}
              pathOptions={{ color: 'green', weight: 4, dashArray: '8, 8' }}
            />
          )}
        </MapContainer>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-md space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Source (auto-filled or type)"
            className="border p-2 rounded w-full"
          />
          <input
            type="text"
            value={destinationText}
            onChange={(e) => setDestinationText(e.target.value)}
            placeholder="Destination (auto-filled or type)"
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Legend for map markers */}
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm font-semibold mb-2">Map Legend:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              <span>🚗 Driver Start</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
              <span>🏁 Driver Destination</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
              <span>🚶 Passenger Pickup</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-1"></div>
              <span>📍 Passenger Destination</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Users className="text-blue-500" size={20} />
          <div>
            <p className="text-sm font-medium text-gray-700">Potential Passengers</p>
            <p className="text-sm text-gray-500">
              {`${passengers.length + passengerRouteInfo.length} found`}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={resetLocations}
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-md w-1/3"
          >
            Reset
          </button>
          <button
            onClick={handleSubmit}
            disabled={!routeStart || !routeEnd || isSubmitting}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md w-2/3 disabled:bg-blue-300"
          >
            {isSubmitting ? 'Searching...' : 'Submit Route'}
          </button>
        </div>
        {matchedPassenger&&(
          <div className="bg-green-100 text-green-700 p-3 rounded-md">
            <p> Passenger found!</p>
            <p>📞 Contact: {matchedPassenger.contact}</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default DriverMap;