export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RouteData {
  start: Coordinates;
  end: Coordinates;
}

export interface PassengerData {
  to_lng: number;
  to_lat: number;
  contact: number;
  from_lng: number;
  from_lat: number;
  id: string;
  pickup: Coordinates;
  dropoff: Coordinates;
}

export type UserRole = 'passenger' | 'driver';