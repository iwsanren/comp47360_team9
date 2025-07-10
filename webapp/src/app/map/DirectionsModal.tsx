import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import polyline from '@mapbox/polyline';
import 'mapbox-gl/dist/mapbox-gl.css';
import { calculateCarbonEmission, formatEmission, parseDistanceToKm } from "@/utils/carbonEmissions";

interface DirectionsModalProps {
  route: any;
  onClose: () => void;
}

export default function DirectionsModal({ route, onClose }: DirectionsModalProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  // 获取路线颜色
  const getRouteColor = (mode: string) => {
    switch (mode) {
      case 'walking': return '#0FD892'; // 绿色
      case 'bicycling': return '#2196F3'; // 蓝色
      case 'transit': return '#FFC800'; // 黄色
      case 'driving': return '#FF281B'; // 红色
      default: return '#FF281B';
    }
  };

  useEffect(() => {
    if (!mapRef.current || !route.routes || route.routes.length === 0) return;

    // Initialize the map
    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/prakhardayal/cmclwuguo003s01sbhx3le5c4',
      center: [-73.968285, 40.785091],
      zoom: 12,
      accessToken: process.env.NEXT_PUBLIC_PRAKHAR_MAPBOX_API_KEY || process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "",
      interactive: true,
      dragPan: false,
    });

    mapInstanceRef.current = map;

    const updateMapRoute = (routeIndex: number) => {
      const selectedRoute = route.routes[routeIndex];
      if (!selectedRoute) return;

      // 清除现有的路线
      if (map.getSource('route')) {
        map.removeLayer('route');
        map.removeSource('route');
      }

      let coordinates: [number, number][] = [];

      // 解码polyline
      if (selectedRoute.overview_polyline?.points) {
        try {
          const decoded = polyline.decode(selectedRoute.overview_polyline.points);
          coordinates = decoded.map((coord: [number, number]) => [coord[1], coord[0]]);
        } catch (error) {
          console.warn('Failed to decode polyline:', error);
        }
      }

      // 备用方案：使用起终点坐标
      if (coordinates.length === 0 && route.startCoords && route.destCoords) {
        coordinates = [
          [route.startCoords.lng, route.startCoords.lat],
          [route.destCoords.lng, route.destCoords.lat]
        ];
      }

      // 添加路线
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
            'line-color': getRouteColor(route.mode),
            'line-width': 4
          }
        });

        // 添加起终点标记
        const markers = document.querySelectorAll('.route-marker');
        markers.forEach(marker => marker.remove());

        // 起点标记（绿色）
        new mapboxgl.Marker({ color: '#0FD892' })
          .setLngLat(coordinates[0])
          .addTo(map)
          .getElement().classList.add('route-marker');

        // 终点标记（红色）
        new mapboxgl.Marker({ color: '#FF281B' })
          .setLngLat(coordinates[coordinates.length - 1])
          .addTo(map)
          .getElement().classList.add('route-marker');

        // 调整地图视野
        const bounds = new mapboxgl.LngLatBounds();
        coordinates.forEach((coord: [number, number]) => bounds.extend(coord));
        map.fitBounds(bounds, { padding: 50 });
      }
    };

    map.on('load', () => {
      updateMapRoute(selectedRouteIndex);
    });

    // 当选择的路线改变时更新地图
    if (map.isStyleLoaded()) {
      updateMapRoute(selectedRouteIndex);
    }

    return () => map.remove();
  }, [route, selectedRouteIndex]);

  if (!route || !route.routes || route.routes.length === 0) return null;

  const currentRoute = route.routes[selectedRouteIndex];
  const currentLeg = currentRoute?.legs?.[0];

  // 计算当前路线的碳排放
  const distance = currentLeg?.distance?.text || 'N/A';
  const distanceKm = parseDistanceToKm(distance);
  const emissionData = calculateCarbonEmission(route.mode, distanceKm);

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999, backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#00674C] flex items-center gap-2">
            {route.mode === 'driving' && '🚗'}
            {route.mode === 'walking' && '🚶'}
            {route.mode === 'bicycling' && '🚴'}
            {route.mode === 'transit' && '🚇'}
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

        {/* Route Selection Tabs */}
        <div className="flex gap-2 mb-4">
          {route.routes.map((routeItem: any, index: number) => {
            const routeData = route.routes[index];
            const leg = routeData?.legs?.[0];
            const duration = leg?.duration?.text || 'N/A';
            const distance = leg?.distance?.text || 'N/A';
            const distanceKm = parseDistanceToKm(distance);
            const emission = calculateCarbonEmission(route.mode, distanceKm);
            const isSelected = selectedRouteIndex === index;
            const isGreenest = index === 0; // 第一条路线是最环保的

            return (
              <button
                key={index}
                onClick={() => setSelectedRouteIndex(index)}
                className="px-4 py-2 rounded flex items-center gap-2"
                style={{
                  backgroundColor: isSelected ? '#0FD892' : '#6B7280',
                  color: 'white'
                }}
              >
                Route {index + 1}
                {isGreenest && <span>🌿</span>}
                <div className="text-xs">
                  <div>{duration}</div>
                  <div>{distance}</div>
                </div>
              </button>
            );
          })}
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
                  <span className="font-semibold">{currentLeg?.duration?.text || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-semibold">{distance}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Carbon Emission:</span>
                  <span className="font-semibold">{formatEmission(emissionData.amount)}</span>
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
                {currentLeg?.steps?.map((step: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-2 bg-gray-50 rounded">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: getRouteColor(route.mode) }}
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
