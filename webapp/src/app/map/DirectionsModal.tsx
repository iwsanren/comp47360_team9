import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import polyline from '@mapbox/polyline';
import 'mapbox-gl/dist/mapbox-gl.css';

interface DirectionsModalProps {
  route: any;
  onClose: () => void;
}

export default function DirectionsModal({ route, onClose }: DirectionsModalProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize the map
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/prakhardayal/cmclwuguo003s01sbhx3le5c4', // Use the same custom style as main map
      center: [-73.968285, 40.785091], // Manhattan center
      zoom: 12,
      accessToken: process.env.NEXT_PUBLIC_PRAKHAR_MAPBOX_API_KEY || process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "",
      interactive: true, // Allow zoom but we can disable drag if needed
      dragPan: false, // Disable dragging as requested
    });

    mapInstanceRef.current = map;

    map.on('load', () => {
      let coordinates: [number, number][] = [];

      // Try to decode polyline if available
      if (route.polyline) {
        try {
          const decoded = polyline.decode(route.polyline);
          coordinates = decoded.map((coord: [number, number]) => [coord[1], coord[0]]); // Convert to [lng, lat]
        } catch (error) {
          console.warn('Failed to decode polyline:', error);
        }
      }

      // Fallback: use start and destination coordinates
      if (coordinates.length === 0 && route.startCoords && route.destCoords) {
        coordinates = [
          [route.startCoords.lng, route.startCoords.lat],
          [route.destCoords.lng, route.destCoords.lat]
        ];
      }

      // Add route line if we have coordinates
      if (coordinates.length >= 2) {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coordinates
            }
          }
        });

        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#FF0000', // Red color like in your reference image
            'line-width': 4
          }
        });

        // Add start marker (green)
        new mapboxgl.Marker({ color: '#0FD892' })
          .setLngLat(coordinates[0])
          .addTo(map);

        // Add end marker (red) 
        new mapboxgl.Marker({ color: '#FF281B' })
          .setLngLat(coordinates[coordinates.length - 1])
          .addTo(map);

        // Fit map to route bounds
        const bounds = new mapboxgl.LngLatBounds();
        coordinates.forEach((coord: [number, number]) => bounds.extend(coord));
        map.fitBounds(bounds, { padding: 50 });
      }
    });

    return () => map.remove();
  }, [route]);

  if (!route) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#00674C] flex items-center gap-2">
            {route.mode === 'driving' && '🚗'}
            {route.mode === 'walking' && '🚶'}
            {route.mode === 'bicycling' && '🚴'}
            {route.mode === 'transit' && '🚇'}
            {route.mode === 'taxi' && '🚕'}
            {route.mode === 'subway' && '🚇'}
            {route.mode.charAt(0).toUpperCase() + route.mode.slice(1)} Directions
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none"
            style={{ padding: '0', lineHeight: '1' }}
          >
            ×
          </button>
        </div>
        
        <div className="flex gap-6 h-96">
          {/* Left side - Map */}
          <div className="flex-1">
            <div ref={mapRef} className="w-full h-full rounded-lg" />
          </div>

          {/* Right side - Route Info */}
          <div className="flex-1 flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-3">Route Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold">{route.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-semibold">{route.distance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">From:</span>
                  <span className="font-semibold text-sm">{route.startCoords ? `${route.startCoords.lat.toFixed(4)}, ${route.startCoords.lng.toFixed(4)}` : 'Start Location'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">To:</span>
                  <span className="font-semibold text-sm">{route.destCoords ? `${route.destCoords.lat.toFixed(4)}, ${route.destCoords.lng.toFixed(4)}` : 'Destination'}</span>
                </div>
              </div>
            </div>

            {/* Directions */}
            <div className="flex-1 overflow-y-auto">
              <h3 className="font-semibold mb-2">Directions</h3>
              <div className="space-y-2">
                {route.steps?.map((step: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: '#0FD892' }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">
                        {step.html_instructions ? 
                          <div dangerouslySetInnerHTML={{ __html: step.html_instructions }} /> :
                          step.maneuver?.instruction || step.instruction || `Step ${index + 1}: Continue on route`
                        }
                      </div>
                      {step.distance && (
                        <div className="text-xs text-gray-500 mt-1">
                          {step.distance.text} • {step.duration?.text || 'N/A'}
                        </div>
                      )}
                    </div>
                  </div>
                )) || (
                  <p className="text-sm text-gray-500">Route details not available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
