import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';
import L from 'leaflet';

// Fix Leaflet Default Icon Issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

// Component to handle map clicks and manual location selection
function LocationSelector({ currentLocation, setCurrentLocation }) {
  const map = useMap();

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setCurrentLocation((prev) => ({
        ...prev,
        coordinates: `${lat.toFixed(6)},${lng.toFixed(6)}`,
      }));
      map.flyTo([lat, lng], map.getZoom());
    },
  });
  return null;
}

// Component to add the Search Control
function SearchField({ setCurrentLocation, currentLocation }) {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();

    const searchControl = new GeoSearchControl({
      provider: provider,
      style: 'bar', // 'bar' or 'button'
      showMarker: false, // We use our own marker
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateUtils: true,
      searchLabel: 'ค้นหาสถานที่...',
    });

    map.addControl(searchControl);

    // Event listener when a user selects a result
    const onShowLocation = (result) => {
      if (result.location) {
        // Extract lat/lng
        const { y: lat, x: lng } = result.location;
        setCurrentLocation((prev) => ({
             ...prev,
             coordinates: `${parseFloat(lat).toFixed(6)},${parseFloat(lng).toFixed(6)}`
        }));
      }
    };

    map.on('geosearch/showlocation', onShowLocation);

    return () => {
      map.removeControl(searchControl);
      map.off('geosearch/showlocation', onShowLocation);
    };
  }, [map, setCurrentLocation]); // Removed currentLocation dependency

  return null;
}

const MapView = ({ currentLocation, setCurrentLocation }) => {
  // Parse coordinates or default to Bangkok
  const position = currentLocation.coordinates
    ? currentLocation.coordinates.split(',').map(Number)
    : [13.7563, 100.5018];

  return (
    <MapContainer
      center={position}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
      />
      <LocationSelector
        currentLocation={currentLocation}
        setCurrentLocation={setCurrentLocation}
      />
      <SearchField 
        currentLocation={currentLocation}
        setCurrentLocation={setCurrentLocation} 
       />
      {currentLocation.coordinates && (
        <Marker position={position} />
      )}
    </MapContainer>
  );
};

export default MapView;
