import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const BookingMap = ({ pickup, dropoff, distance }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !pickup?.lat || !dropoff?.lat) return;

    // Initialize map
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(
        [(pickup.lat + dropoff.lat) / 2, (pickup.lng + dropoff.lng) / 2],
        10
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapInstanceRef.current);
    }

    // Clear existing markers and lines
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    // Add pickup marker
    const pickupMarker = L.marker([pickup.lat, pickup.lng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(mapInstanceRef.current);
    pickupMarker.bindPopup('<b>Pickup</b><br>' + (pickup.address || 'Pickup Location')).openPopup();

    // Add dropoff marker
    const dropoffMarker = L.marker([dropoff.lat, dropoff.lng], {
      icon: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(mapInstanceRef.current);
    dropoffMarker.bindPopup('<b>Dropoff</b><br>' + (dropoff.address || 'Dropoff Location'));

    // Add line between points
    const polyline = L.polyline(
      [[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]],
      { color: '#3b82f6', weight: 3, opacity: 0.7 }
    ).addTo(mapInstanceRef.current);

    // Fit map to show both markers
    const group = new L.FeatureGroup([pickupMarker, dropoffMarker, polyline]);
    mapInstanceRef.current.fitBounds(group.getBounds().pad(0.2));

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.eachLayer((layer) => {
          if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            mapInstanceRef.current.removeLayer(layer);
          }
        });
      }
    };
  }, [pickup, dropoff]);

  if (!pickup?.lat || !dropoff?.lat) {
    return (
      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Enter coordinates to see map</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-semibold text-gray-700">Route Preview</h4>
        {distance && (
          <span className="text-sm text-indigo-600 font-medium">{distance} km</span>
        )}
      </div>
      <div ref={mapRef} className="h-64 rounded-lg border border-gray-300" />
      <div className="mt-2 flex items-center justify-center space-x-6 text-xs text-gray-600">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span>Pickup</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span>Dropoff</span>
        </div>
        <div className="flex items-center">
          <div className="w-8 h-0.5 bg-blue-500 mr-2"></div>
          <span>Route</span>
        </div>
      </div>
    </div>
  );
};

export default BookingMap;

