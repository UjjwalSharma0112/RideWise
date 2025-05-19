import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import toast from 'react-hot-toast';
import { checkDriverFound, passengerRequest } from '../services/api';
import { Coordinates } from '../types';
import { DEHRADUN_COORDINATES, DEFAULT_ZOOM } from '../utils/mapUtils';

const pickupIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const dropoffIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
    { headers: { 'User-Agent': 'CarpoolingApp/1.0' } }
  );
  if (!res.ok) throw new Error('Failed to get address');
  const data = await res.json();
  return data.display_name || 'Unknown location';
}

async function geocodePlace(place: string): Promise<Coordinates> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=jsonv2&limit=1`,
    { headers: { 'User-Agent': 'CarpoolingApp/1.0' } }
  );
  if (!res.ok) throw new Error('Failed to geocode');
  const data = await res.json();
  if (data.length === 0) throw new Error('Place not found');
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

type LocationInfo = {
  coords: Coordinates;
  name: string;
};

type DriverInfo = {
  status: string;
  driverContact: number;
};

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

const MapRecenter: React.FC<{ center: Coordinates }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom(), { animate: true });
  }, [center.lat, center.lng, map]);
  return null;
};

interface PassengerMapProps {
  onRouteSubmit: () => void;
}

const PassengerMap: React.FC<PassengerMapProps> = ({ onRouteSubmit }) => {
  const [pickupLocation, setPickupLocation] = useState<LocationInfo | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<LocationInfo | null>(null);
  const [pickupInput, setPickupInput] = useState('');
  const [dropoffInput, setDropoffInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [driverInfo, setDriverInfo] = useState<DriverInfo | null>(null);

  // Polling driver info every 5 seconds if driver not found yet
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (driverInfo === null) {
      intervalId = setInterval(() => {
        checkDriverFound(setDriverInfo);
      }, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [driverInfo]);

  const handleLocationSelect = useCallback(
    async (coords: Coordinates) => {
      try {
        const name = await reverseGeocode(coords.lat, coords.lng);
        const locationInfo = { coords, name };

        if (!pickupLocation) {
          setPickupLocation(locationInfo);
          setPickupInput(name);
          toast.success(`Pickup: ${name}`);
        } else if (!dropoffLocation) {
          setDropoffLocation(locationInfo);
          setDropoffInput(name);
          toast.success(`Dropoff: ${name}`);
        }
      } catch {
        toast.error('Failed to reverse geocode');
      }
    },
    [pickupLocation, dropoffLocation]
  );

  const handleManualSubmit = async () => {
    if (!pickupInput || !dropoffInput) {
      toast.error('Please fill both pickup and dropoff fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const pickupCoords = await geocodePlace(pickupInput);
      const dropoffCoords = await geocodePlace(dropoffInput);

      const pickupName = await reverseGeocode(pickupCoords.lat, pickupCoords.lng);
      const dropoffName = await reverseGeocode(dropoffCoords.lat, dropoffCoords.lng);

      setPickupLocation({ coords: pickupCoords, name: pickupName });
      setDropoffLocation({ coords: dropoffCoords, name: dropoffName });

      await passengerRequest(pickupCoords, dropoffCoords, pickupName, dropoffName);

      toast.success('Your ride request has been submitted!');
      onRouteSubmit();

      // Reset driverInfo to null to start polling for driver
      setDriverInfo(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetLocations = () => {
    setPickupLocation(null);
    setDropoffLocation(null);
    setPickupInput('');
    setDropoffInput('');
    setDriverInfo(null);
    toast.success('Locations reset');
  };

  // Determine map center based on dropoff, pickup, or default coords
  const mapCenter = dropoffLocation?.coords || pickupLocation?.coords || DEHRADUN_COORDINATES;

  return (
    <div className="flex flex-col space-y-4">
      <div className="h-[60vh] rounded-lg overflow-hidden shadow-lg border border-gray-200">
        <MapContainer center={mapCenter} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          {pickupLocation && (
            <Marker position={pickupLocation.coords} icon={pickupIcon}>
              <Popup>Pickup: {pickupLocation.name}</Popup>
            </Marker>
          )}
          {dropoffLocation && (
            <Marker position={dropoffLocation.coords} icon={dropoffIcon}>
              <Popup>Dropoff: {dropoffLocation.name}</Popup>
            </Marker>
          )}
          {(pickupLocation || dropoffLocation) && <MapRecenter center={mapCenter} />}
        </MapContainer>
      </div>

      <div className="bg-white rounded-lg p-4 shadow-md space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
            <input
              className="w-full px-3 py-2 border rounded-md text-sm"
              type="text"
              placeholder="Enter pickup address"
              value={pickupInput}
              onChange={(e) => setPickupInput(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dropoff Location</label>
            <input
              className="w-full px-3 py-2 border rounded-md text-sm"
              type="text"
              placeholder="Enter dropoff address"
              value={dropoffInput}
              onChange={(e) => setDropoffInput(e.target.value)}
            />
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-md w-1/3"
            onClick={resetLocations}
          >
            Reset
          </button>
          <button
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md w-2/3 disabled:bg-blue-300"
            onClick={handleManualSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Ride Request'}
          </button>
        </div>

        {driverInfo === null && (
          <p className="text-yellow-600">Waiting for a driver to accept your request...</p>
        )}
        {driverInfo && (
          <div className="bg-green-100 text-green-700 p-3 rounded-md">
            <p>🚗 Driver found!</p>
            <p>📞 Contact: {driverInfo.driverContact}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PassengerMap;
