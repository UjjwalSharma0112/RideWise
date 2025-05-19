import { Coordinates } from '../types';

// Default coordinates for Dehradun, India
export const DEHRADUN_COORDINATES: Coordinates = {
  lat: 30.3165,
  lng: 78.0322
};

export const DEFAULT_ZOOM = 13;

// Helper to format coordinates for display
export const formatCoordinates = (coords: Coordinates | null): string => {
  if (!coords) return 'Not set';
  return `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
};

// Calculate the center point between two coordinates
export const getCenter = (coord1: Coordinates, coord2: Coordinates): Coordinates => {
  return {
    lat: (coord1.lat + coord2.lat) / 2,
    lng: (coord1.lng + coord2.lng) / 2
  };
};

// Calculate appropriate zoom level to show both points
export const calculateZoom = (coord1: Coordinates, coord2: Coordinates): number => {
  const latDiff = Math.abs(coord1.lat - coord2.lat);
  const lngDiff = Math.abs(coord1.lng - coord2.lng);
  const maxDiff = Math.max(latDiff, lngDiff);
  
  // Simple algorithm to determine zoom level based on distance
  if (maxDiff > 0.1) return 10;
  if (maxDiff > 0.05) return 11;
  if (maxDiff > 0.01) return 12;
  return 13;
};