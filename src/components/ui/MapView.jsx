import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

// Component to handle map clicks for location selection
function LocationSelector({ currentLocation, setCurrentLocation }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setCurrentLocation((prev) => ({
        ...prev,
        coordinates: `${lat.toFixed(6)},${lng.toFixed(6)}`,
      }));
    },
  });
  return null;
}

// Reusable Map Component
function MapView({ currentLocation, setCurrentLocation, center, zoom }) {
  // If coordinates exist, show marker there
  const [lat, lng] = currentLocation.coordinates
    ? currentLocation.coordinates.split(',').map(Number)
    : [13.7563, 100.5018]; // Default to Bangkok if no coords

  const mapCenter = currentLocation.coordinates && !isNaN(lat) && !isNaN(lng) 
    ? [lat, lng] 
    : [13.7563, 100.5018];

  return (
    <MapContainer
      center={mapCenter}
      zoom={13}
      style={{ height: '300px', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {/* Click listener */}
      <LocationSelector currentLocation={currentLocation} setCurrentLocation={setCurrentLocation} />
      
      {/* Marker */}
      {currentLocation.coordinates && !isNaN(lat) && !isNaN(lng) && (
        <Marker position={[lat, lng]} />
      )}
    </MapContainer>
  );
}

export default MapView;
