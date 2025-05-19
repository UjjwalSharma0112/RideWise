// utils/reverseGeocode.ts
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'CarpoolingApp/1.0' } // Required by Nominatim usage policy
  });

  if (!response.ok) throw new Error('Failed to fetch location name');
  const data = await response.json();
  return data.display_name || 'Unknown location';
}
