import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Crisp custom agricultural map pin icon using Leaflet divIcon
const createCustomPin = (label = 'Farm Location') => {
  return L.divIcon({
    className: 'custom-farm-pin',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="background-color: #059669; color: white; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.25); white-space: nowrap; border: 1px solid white;">
          ${label}
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #059669;"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

function ClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const MapPicker = ({
  latitude = 20.5937,
  longitude = 78.9629,
  onLocationSelect,
  height = '320px',
  interactive = true,
  markerLabel = 'Farm Location'
}) => {
  const [pos, setPos] = useState([latitude, longitude]);

  useEffect(() => {
    if (latitude && longitude) {
      setPos([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const handleMapClick = (lat, lng) => {
    if (!interactive) return;
    const roundedLat = parseFloat(lat.toFixed(6));
    const roundedLng = parseFloat(lng.toFixed(6));
    setPos([roundedLat, roundedLng]);
    if (onLocationSelect) {
      onLocationSelect(roundedLat, roundedLng);
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-inner">
      <MapContainer
        center={pos}
        zoom={pos[0] === 20.5937 ? 5 : 12}
        style={{ height, width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {interactive && <ClickHandler onSelect={handleMapClick} />}
        <Marker position={pos} icon={createCustomPin(markerLabel)} />
      </MapContainer>

      {interactive && (
        <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 text-[11px] text-slate-700 flex items-center justify-between z-[400]">
          <span className="flex items-center space-x-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>Click anywhere to adjust coordinates</span>
          </span>
          <span className="font-mono text-emerald-800 font-bold">
            {pos[0]?.toFixed(4)}° N, {pos[1]?.toFixed(4)}° E
          </span>
        </div>
      )}
    </div>
  );
};

export default MapPicker;
