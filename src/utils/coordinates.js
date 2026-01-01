/**
 * Coordinate utilities for map-related functions
 */

/**
 * Parse coordinate string to [lat, lng] array
 * @param {string} coordStr - Coordinate string in format "lat, lng" or "lat,lng"
 * @returns {number[]|null} [lat, lng] array or null if invalid
 */
export function parseCoordinates(coordStr) {
  if (!coordStr || typeof coordStr !== 'string') return null;
  
  const parts = coordStr.split(',').map(s => s.trim());
  if (parts.length !== 2) return null;
  
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  
  if (isNaN(lat) || isNaN(lng)) return null;
  
  return [lat, lng];
}

/**
 * Calculate simple distance score between two points (not actual distance)
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance score (lower = closer)
 */
export function getDistanceScore(lat1, lng1, lat2, lng2) {
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  return dLat * dLat + dLng * dLng;
}

/**
 * Open Google Maps directions in new tab
 * @param {number} lat - Destination latitude
 * @param {number} lng - Destination longitude
 */
export function openGoogleMapsDirections(lat, lng) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(url, '_blank');
}

/**
 * Format coordinates for display
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted coordinate string
 */
export function formatCoordinates(lat, lng, decimals = 6) {
  return `${lat.toFixed(decimals)}, ${lng.toFixed(decimals)}`;
}
