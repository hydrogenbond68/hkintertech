import React, { useEffect, useState } from 'react';

// Safe wrapper that loads react-leaflet lazily so a missing API key or
// network failure never breaks the rest of the app.
export const MapView = ({ orders = [], center = [-1.286389, 36.817223], zoom = 12, height = '460px' }) => {
  const [LeafletReady, setLeafletReady] = useState(false);
  const [MapComponent, setMapComponent] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const mod = await import('react-leaflet');
        await import('leaflet/dist/leaflet.css');
        if (cancelled) return;
        setMapComponent(() => () => (
          <mod.MapContainer center={center} zoom={zoom} style={{ height, width: '100%' }} scrollWheelZoom>
            <mod.TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {orders.map((order) => {
              const lat = order.lat ?? order.latitude;
              const lng = order.lng ?? order.longitude;
              if (lat == null || lng == null) return null;
              return (
                <mod.Marker key={order.id} position={[lat, lng]}>
                  <mod.Popup>
                    <div>
                      <strong>Order #{order.order_number || order.id}</strong>
                      <div>{order.status || 'pending'}</div>
                      <div>{order.total_amount ? `KES ${order.total_amount}` : ''}</div>
                    </div>
                  </mod.Popup>
                </mod.Marker>
              );
            })}
          </mod.MapContainer>
        ));
        setLeafletReady(true);
      } catch (err) {
        console.warn('[MapView] Leaflet unavailable, using fallback:', err.message);
        if (!cancelled) setLeafletReady(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [center, zoom, height, orders]);

  if (!LeafletReady || !MapComponent) {
    return (
      <div className="w-full bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm" style={{ height }}>
        Map unavailable — showing {orders.length} tracked order(s) as a list.
        <div className="w-full mt-3 space-y-2 px-4">
          {orders.map((order) => {
            const lat = order.lat ?? order.latitude;
            const lng = order.lng ?? order.longitude;
            return (
              <div key={order.id} className="flex justify-between bg-white p-2 rounded border">
                <span>Order #{order.order_number || order.id}</span>
                <span className="font-medium">{order.status || 'pending'}</span>
                <span className="text-gray-500">{lat != null && lng != null ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'No GPS'}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return <MapComponent />;
};

export default MapView;