import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

// Utility: Parse Coordinates
const parseCoordinates = (coordStr) => {
  if (!coordStr) return [0, 0];
  const fixed = coordStr.replace(/\//g, ',').replace(/\s+/g, '');
  const parts = fixed.split(',');
  if (parts.length < 2) return [0, 0];
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  return isNaN(lat) || isNaN(lng) ? [0, 0] : [lat, lng];
};

// Icons
const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3177/3177361.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

// Map Adjuster (Handles zooming and fitting bounds)
const MapAdjuster = React.memo(({ userPosition, locations, isMapView, singleLocation }) => {
  const map = useMap();

  useEffect(() => {
     // Scenario 1: Single Location (MappingDetail)
    if (singleLocation) {
        if (singleLocation[0] !== 0 && singleLocation[1] !== 0) {
            map.setView(singleLocation, 16);
        }
        return;
    }

    // Scenario 2: Multiple Locations (Mapping)
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (userPosition) {
        map.setView(userPosition, 16);
      } else if (locations && locations.length) {
        const allCoords = locations
          .map((loc) => parseCoordinates(loc.coordinates))
          .filter((coord) => coord[0] !== 0 || coord[1] !== 0);
        if (allCoords.length) {
          const bounds = L.latLngBounds(allCoords);
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
          }
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [userPosition, locations, map, isMapView, singleLocation]);
  return null;
});

const UserMapView = ({ 
    locations = [], 
    userPosition = null, 
    isMapView = true, 
    singleLocation = null, 
    singleLocationName = '',
    onMarkerClick = null 
}) => {
  const navigate = useNavigate();
  // Default center
  const center = singleLocation ? singleLocation : (userPosition || [13.7563, 100.5018]);
  const zoom = singleLocation ? 16 : 12;

  const handleMarkerClick = (id) => {
      if (onMarkerClick) {
          onMarkerClick(id);
      } else {
          navigate(`/mappingdetail/${id}`);
      }
  };

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <MapAdjuster
        userPosition={userPosition}
        locations={locations}
        isMapView={isMapView}
        singleLocation={singleLocation}
      />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
      <ZoomControl position="bottomright" />
      
      {/* User Position Marker */}
      {userPosition && (
        <Marker position={userPosition} icon={userIcon}>
          <Tooltip direction="top" offset={[0, -15]} opacity={1} permanent>
            <span>คุณอยู่ตรงนี้</span>
          </Tooltip>
        </Marker>
      )}

      {/* Multiple Locations Markers */}
      {!singleLocation && locations.map((loc) => {
        const coords = parseCoordinates(loc.coordinates);
        if (coords[0] || coords[1]) {
          return (
            <Marker
              key={loc.id}
              position={coords}
              icon={customIcon}
              eventHandlers={{ click: () => handleMarkerClick(loc.id) }}
            >
              <Tooltip direction="top" offset={[0, -15]} opacity={1} permanent>
                <span>{loc.name}</span>
              </Tooltip>
            </Marker>
          );
        }
        return null;
      })}

       {/* Single Location Marker */}
       {singleLocation && singleLocation[0] !== 0 && (
           <Marker position={singleLocation} icon={customIcon}>
               <Tooltip direction="top" offset={[0, -15]} opacity={1} permanent>
                   <span>{singleLocationName}</span>
               </Tooltip>
           </Marker>
       )}

    </MapContainer>
  );
};

export default UserMapView;
