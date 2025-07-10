"use client";

import { useEffect, useRef, useState } from "react";
import { BiSolidLeftArrow } from "react-icons/bi";
import { FaWalking } from "react-icons/fa";
import { FaBicycle, FaCar } from "react-icons/fa6";
import { FaCarAlt } from "react-icons/fa";
import { FaTrain } from "react-icons/fa6";
import { FaRecycle } from "react-icons/fa";
import { FaExclamationCircle } from "react-icons/fa";
import { FaArrowAltCircleDown } from "react-icons/fa";
import { FaLeaf } from "react-icons/fa";
import mapboxgl from "mapbox-gl";
import Image from "next/image";

import startEndIcon from "@/assets/images/start_end_icon.png";
import switchStartEndIcon from "@/assets/images/switch_start_end_icon.png";
import bikeIcon from "@/assets/images/bike_icon.png";
import evIcon from "@/assets/images/ev_icon.png";
import { WEATHER_CONDITION_ICONS } from '@/constants/icons';

import Icon from '@/components/Icon';

import 'mapbox-gl/dist/mapbox-gl.css';

import ShowWeatherModal from "./ShowWeatherModal";
import DirectionsModal from "./DirectionsModal";
import useFetchData from "@/hooks/useFetchData";
import { calculateCarbonEmission, formatEmission, parseDistanceToKm } from "@/utils/carbonEmissions";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_PRAKHAR_MAPBOX_API_KEY || process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "";

interface Toggles {
  parks: boolean;
  ev: boolean;
  bikes: boolean;
  busyness: boolean;
  air: boolean;
}

interface Coordinates {
  lng: number;
  lat: number;
}

export default function Map() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [toggles, setToggles] = useState<Toggles>({
    parks: false,
    ev: false,
    bikes: false,
    busyness: false,
    air: false,
  });
  const [startLocation, setStartLocation] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [parksData, setParksData] = useState<any>(null);
  const [bikesData, setBikesData] = useState<any>(null);
  const [evData, setEvData] = useState<any>(null);
  const [airQualityData, setAirQualityData] = useState<any>(null);
  const [isToggleOpen, setIsToggleOpen] = useState<boolean>(true);
  const [startCoords, setStartCoords] = useState<Coordinates | null>(null);
  const [destCoords, setDestCoords] = useState<Coordinates | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);
  const [hasSelectedRoute, setHasSelectedRoute] = useState(false);

  const { data: directionsData, loading: directionsLoading } = useFetchData('/api/directions', { origin: startCoords, destination: destCoords })

  // Debug log to see the API response structure
  useEffect(() => {
    if (directionsData) {
      console.log('Directions API Response:', directionsData);
    }
  }, [directionsData]);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/prakhardayal/cmclwuguo003s01sbhx3le5c4",
      center: [-73.968285, 40.785091],
      zoom: 12,
    });

    map.loadImage(bikeIcon.src, (error, image) => {
      if (error) {
        console.error("Failed to load bike icon:", error);
        return;
      }
      if (image) {
        map.addImage("bike-icon", image);
      }
    });

    map.loadImage(evIcon.src, (error, image) => {
      if (error) {
        console.error("Failed to load EV icon:", error);
        return;
      }
      if (image) {
        map.addImage("ev-icon", image);
      }
    });

    map.on('click', async (e) => {
      const { lng, lat } = e.lngLat;

      if (
        lng >= -74.0479 &&
        lng <= -73.9067 &&
        lat >= 40.6829 &&
        lat <= 40.8790
      ) {
        if (!mapboxgl.accessToken) {
          console.error("Mapbox access token is missing");
          return;
        }

        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
            new URLSearchParams({
              access_token: mapboxgl.accessToken,
              limit: "1",
            })
          );
          const data = await response.json();
          const address = data.features && data.features.length > 0
            ? data.features[0].place_name
            : `(${lng.toFixed(6)}, ${lat.toFixed(6)})`;

          if (!startLocation) {
            setStartCoords({ lng, lat });
            setStartLocation(address);
          } else {
            setDestCoords({ lng, lat });
            setDestination(address);
          }
        } catch (error) {
          console.error("Failed to reverse geocode:", error);
        }
      } else {
        console.error("Clicked location is outside Manhattan");
      }
    });

    mapInstanceRef.current = map;

    return () => map.remove();
  }, [startLocation, destination]);

  console.log(Boolean(startLocation), destination, startCoords)

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    if (toggles.parks) {
      if (!parksData) {
        const fetchParks = async () => {
          try {
            const res = await fetch("/api/parks", { method: "POST" });
            const geojson = await res.json();
            if (geojson.features) {
              setParksData(geojson);
            } else {
              console.error("Invalid parks GeoJSON data");
            }
          } catch (error) {
            console.error("Failed to fetch parks data:", error);
          }
        };
        fetchParks();
      }

      if (parksData && !map.getSource("parks")) {
        map.addSource("parks", {
          type: "geojson",
          data: parksData,
        });

        map.addLayer({
          id: "parks-layer",
          type: "fill",
          source: "parks",
          paint: {
            "fill-color": "#00674C",
            "fill-opacity": 0.5,
            "fill-outline-color": "#006400",
          },
          layout: {
            visibility: "visible",
          },
        });
      }
    } else {
      if (map.getLayer("parks-layer")) {
        map.removeLayer("parks-layer");
      }
      if (map.getSource("parks")) {
        map.removeSource("parks");
      }
    }
  }, [toggles.parks, parksData]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    if (toggles.bikes) {
      if (!bikesData) {
        const fetchBikes = async () => {
          try {
            const res = await fetch("/api/bikes", { method: "POST" });
            const geojson = await res.json();
            if (geojson.features) {
              setBikesData(geojson);
            } else {
              console.error("Invalid bikes GeoJSON data");
            }
          } catch (error) {
            console.error("Failed to fetch bikes data:", error);
          }
        };
        fetchBikes();
      }

      if (bikesData && !map.getSource("bikes")) {
        map.addSource("bikes", {
          type: "geojson",
          data: bikesData,
        });

        map.addLayer({
          id: "bikes-layer",
          type: "symbol",
          source: "bikes",
          layout: {
            "icon-image": "bike-icon",
            "icon-size": 1,
            "icon-allow-overlap": true,
            visibility: "visible",
          },
        });
      }
    } else {
      if (map.getLayer("bikes-layer")) {
        map.removeLayer("bikes-layer");
      }
      if (map.getSource("bikes")) {
        map.removeSource("bikes");
      }
    }
  }, [toggles.bikes, bikesData]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    if (toggles.ev) {
      if (!evData) {
        const fetchEVStations = async () => {
          try {
            const res = await fetch("/api/EV-charging", { method: "POST" });
            const geojson = await res.json();
            if (geojson.features) {
              setEvData(geojson);
            } else {
              console.error("Invalid EV stations GeoJSON data");
            }
          } catch (error) {
            console.error("Failed to fetch EV stations data:", error);
          }
        };
        fetchEVStations();
      }

      if (evData && !map.getSource("ev-stations")) {
        map.addSource("ev-stations", {
          type: "geojson",
          data: evData,
        });

        map.addLayer({
          id: "ev-stations-layer",
          type: "symbol",
          source: "ev-stations",
          layout: {
            "icon-image": "ev-icon",
            "icon-size": 1,
            "icon-allow-overlap": true,
            visibility: "visible",
          },
        });
      }
    } else {
      if (map.getLayer("ev-stations-layer")) {
        map.removeLayer("ev-stations-layer");
      }
      if (map.getSource("ev-stations")) {
        map.removeSource("ev-stations");
      }
    }
  }, [toggles.ev, evData]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    if (toggles.air) {
      if (!airQualityData) {
        const fetchAirQuality = async () => {
          try {
            const res = await fetch("/api/airquality", { method: "POST" });
            const geojson = await res.json();
            if (geojson.features) {
              setAirQualityData(geojson);
            } else {
              console.error("Invalid air quality GeoJSON data");
            }
          } catch (error) {
            console.error("Failed to fetch air quality data:", error);
          }
        };
        fetchAirQuality();
      }

      if (airQualityData && !map.getSource("air-quality")) {
        map.addSource("air-quality", {
          type: "geojson",
          data: airQualityData,
        });

        map.addLayer({
          id: "air-quality-heatmap",
          type: "heatmap",
          source: "air-quality",
          paint: {
            "heatmap-weight": [
              "interpolate",
              ["linear"],
              ["get", "value"],
              0, 0,
              5, 1
            ],
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0, "rgba(0, 0, 255, 0)",
              0.3, "rgb(0, 0, 255)",
              0.5, "rgb(0, 255, 0)",
              0.75, "rgb(255, 255, 0)",
              1, "rgb(255, 0, 0)"
            ],
            "heatmap-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0, 1,
              3, 25,
              9, 50,
              12, 75,
              15, 100
            ],
            "heatmap-intensity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0, 1,
              15, 3
            ],
            "heatmap-opacity": 0.8
          }
        });
      }
    } else {
      if (map.getLayer("air-quality-heatmap")) {
        map.removeLayer("air-quality-heatmap");
      }
      if (map.getSource("air-quality")) {
        map.removeSource("air-quality");
      }
    }
  }, [toggles.air, airQualityData]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch("/api/weather", { method: "POST" });
        const data = await res.json();
        setWeatherData(data);
      } catch (err) {
        console.error("Failed to fetch weather", err);
      }
    };

    fetchWeather();
  }, []);

  const current = weatherData?.current;
  const hourly = weatherData?.hourly?.list || [];

  const toggleNames = [
    { key: "parks", label: "Parks" },
    { key: "ev", label: "EV charging Stations" },
    { key: "bikes", label: "Bike Stations" },
    { key: "busyness", label: "Busyness" },
    { key: "air", label: "Air Quality" },
  ] as const;

  const handleToggleSlide = () => {
    setIsToggleOpen(!isToggleOpen);
  };

  const handleClear = () => {
    setStartLocation("");
    setDestination("");
    setStartCoords(null);
    setDestCoords(null);
    setHasSelectedRoute(false);
  };

  const handleRouteClick = (modeKey: string) => {
    // 找到选中的交通方式，并传递完整的路线数据
    if (directionsData && startCoords && destCoords) {
      const apiResponse = directionsData[modeKey] as any;
      if (apiResponse && apiResponse.routes && apiResponse.routes.length > 0) {
        const modeData = transportModes.find(mode => mode.key === modeKey);
        setSelectedRoute({
          mode: modeKey,
          modeData: modeData,
          routes: apiResponse.routes,
          startCoords,
          destCoords
        });
        setHasSelectedRoute(true);
      }
    }
  };

  const handleShowDirections = () => {
    if (selectedRoute) {
      setShowDirectionsModal(true);
    }
  };

  const transportModes = [
    { 
      key: 'walking', 
      icon: FaWalking, 
      color: '#0FD892', 
      emissionIcon: FaRecycle 
    },
    { 
      key: 'bicycling', 
      icon: FaBicycle, 
      color: '#0FD892', 
      emissionIcon: FaRecycle 
    },
    { 
      key: 'driving', 
      icon: FaCarAlt, 
      color: '#FF281B', 
      emissionIcon: FaExclamationCircle 
    },
    { 
      key: 'transit', 
      icon: FaTrain, 
      color: '#FFC800', 
      emissionIcon: FaArrowAltCircleDown 
    }
  ];

  return (
    <div className="relative">
      <div ref={mapRef} className="min-h-[750px] h-[100dvh]" />

      <div className="absolute flex items-center top-[50%] transform translate-y-[-50%] right-0">
        <div
          onClick={handleToggleSlide}
          className="cursor-pointer"
          style={{
            borderTopLeftRadius: 4,
            borderBottomLeftRadius: 4,
            backgroundColor: "#00674CBF",
            padding: '1.125rem 0.125rem',
            color: 'white',
          }}
        >
          <BiSolidLeftArrow
            style={{
              transform: isToggleOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
            size=".75rem"
          />
        </div>

        {isToggleOpen && (
          <div
            style={{
              padding: 8,
              borderRadius: 0,
              backgroundColor: "#00674CBF",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {toggleNames.map(({ key, label }) => (
              <div key={key} className="flex gap-1 items-center text-white text-sm px-2">
                <span
                  style={{
                    fontWeight: 700,
                    fontStyle: "normal",
                    fontSize: "12px",
                    lineHeight: "18px",
                    letterSpacing: "0%",
                    textAlign: 'right',
                    flex: 1,
                  }}
                >
                  {label}
                </span>
                <div className="relative flex items-center">
                  <div
                    onClick={() => setToggles(prev => ({ ...prev, [key]: !prev[key] }))}
                    className="relative cursor-pointer"
                    style={{
                      width: 52,
                      height: 28,
                      borderRadius: 24,
                      backgroundColor: toggles[key] ? "#0FD892" : "#F0F0F0",
                      transition: "background-color 0.3s",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 2,
                        left: toggles[key] ? 26 : 2,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        backgroundColor: toggles[key] ? "#FFFFFF" : "#D9D9D9",
                        transition: "left 0.3s",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        top: 8,
                        left: toggles[key] ? 7 : 28,
                        width: toggles[key] ? 17 : 22,
                        height: 12,
                        fontSize: 12,
                        fontWeight: 700,
                        fontStyle: "normal",
                        lineHeight: "12px",
                        letterSpacing: "0%",
                        color: toggles[key] ? "#FFFFFF" : "#A6A6A6",
                        opacity: 1,
                        transform: "rotate(0deg)",
                      }}
                    >
                      {toggles[key] ? "ON" : "OFF"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="absolute shadow-lg p-6"
        style={{ top: 55, left: 16, bottom: 12, borderRadius: 20, backgroundColor: "#FFFFFF" }}
      >
        <h2 className="mb-4 font-bold text-[30px] leading-[32px] text-[#00674C]">Get Directions</h2>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3 items-center pr-4">
            <Image src={startEndIcon} alt="Start and End Icon" width={32} height={100} />
            <div className="w-[330px] flex flex-col gap-3">
              <input
                type="text"
                placeholder="Start Location"
                className="rounded-sm leading-[24px] lg:leading-[27px]"
                style={{
                  width: '100%',
                  backgroundColor: "#F1F5F7",
                  padding: "16px 24px",
                  border: "none",
                  outline: "none",
                }}
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
              />
              <input
                type="text"
                placeholder="Enter Your Destination"
                className="rounded-sm leading-[24px] lg:leading-[27px]"
                style={{
                  width: '100%',
                  backgroundColor: "#F1F5F7",
                  padding: "16px 24px",
                  border: "none",
                  outline: "none",
                }}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            <Image
              src={switchStartEndIcon}
              alt="Switch Icon"
              width={24}
              height={24}
              className="cursor-pointer"
              onClick={() => {
                const temp = startLocation;
                setStartLocation(destination);
                setDestination(temp);
                const tempCoords = startCoords;
                setStartCoords(destCoords);
                setDestCoords(tempCoords);
              }}
            />
          </div>
          <div className="flex flex-col gap-3">
            {directionsLoading && startCoords && destCoords ? (
              <div className="text-center py-8 text-gray-500">
                Loading directions...
              </div>
            ) : directionsData && startCoords && destCoords ? (
              (() => {
                // 收集所有路线数据
                const allRoutes = transportModes.map((mode) => {
                  const apiResponse = directionsData[mode.key] as any;
                  if (!apiResponse || !apiResponse.routes || apiResponse.routes.length === 0) {
                    return null;
                  }

                  const route = apiResponse.routes[0];
                  const leg = route.legs[0];
                  const duration = leg.duration?.text || 'N/A';
                  const distance = leg.distance?.text || 'N/A';
                  
                  const distanceKm = parseDistanceToKm(distance);
                  const emissionData = calculateCarbonEmission(mode.key, distanceKm);
                  
                  return {
                    mode,
                    duration,
                    distance,
                    emissionData,
                    steps: leg.steps || [],
                    polyline: route.overview_polyline?.points || '',
                    routeData: route
                  };
                }).filter(Boolean);

                // 按碳排放量排序（最低的在前面）
                allRoutes.sort((a, b) => a!.emissionData.amount - b!.emissionData.amount);

                return allRoutes.map((routeInfo, index) => {
                  if (!routeInfo) return null;
                  
                  const { mode, duration, distance, emissionData, steps, polyline } = routeInfo;
                  const IconComponent = mode.icon;
                  const EmissionIcon = mode.emissionIcon;
                  const isSelected = selectedRoute && selectedRoute.mode === mode.key;
                  const isGreenest = index === 0; // 第一个是最环保的

                  return (
                    <div
                      key={mode.key}
                      onClick={() => handleRouteClick(mode.key)}
                      className="cursor-pointer hover:bg-gray-50"
                      style={{
                        width: 426,
                        height: 57,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transform: 'rotate(0deg)',
                        opacity: 1,
                        borderRadius: '8px',
                        padding: '8px 12px',
                        background: isSelected ? '#E8F5E8' : '#FFFFFF',
                        boxShadow: isSelected ? '0px 2px 8px 0px #0FD89240' : '0px 2px 4px 0px #00000040',
                        border: isSelected ? '2px solid #0FD892' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IconComponent size="24" style={{ color: mode.color, marginTop: '6px' }} />
                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>
                          {duration}
                        </span>
                        {isGreenest && (
                          <FaLeaf size="16" style={{ color: '#0FD892', marginLeft: '4px' }} title="Most eco-friendly option" />
                        )}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <EmissionIcon size="20" style={{ color: emissionData.color, marginTop: '6px' }} />
                        <div
                          style={{
                            width: 95,
                            height: 41,
                            transform: 'rotate(0deg)',
                            opacity: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              fontStyle: 'normal',
                              fontSize: '13px',
                              lineHeight: '24px',
                              letterSpacing: '0%',
                              color: emissionData.color,
                            }}
                          >
                            {formatEmission(emissionData.amount)}
                          </span>
                          <span
                            style={{
                              fontWeight: 400,
                              fontStyle: 'normal',
                              fontSize: '12px',
                              lineHeight: '18px',
                              letterSpacing: '0%',
                              color: '#000000',
                            }}
                          >
                            {emissionData.description}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()
            ) : (
              // Fallback static cards when no route data is available
              transportModes.map((mode) => {
                const IconComponent = mode.icon;
                const EmissionIcon = mode.emissionIcon;
                const emissionData = calculateCarbonEmission(mode.key, 0);

                return (
                  <div
                    key={mode.key}
                    style={{
                      width: 426,
                      height: 57,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transform: 'rotate(0deg)',
                      opacity: 0.6,
                      borderRadius: '8px',
                      padding: '8px 12px',
                      background: '#F5F5F5',
                      boxShadow: '0px 2px 4px 0px #00000020',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconComponent size="24" style={{ color: mode.color, marginTop: '6px' }} />
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#999' }}>
                        Select route
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <EmissionIcon size="20" style={{ color: emissionData.color, marginTop: '6px' }} />
                      <div
                        style={{
                          width: 95,
                          height: 41,
                          transform: 'rotate(0deg)',
                          opacity: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontStyle: 'normal',
                            fontSize: '13px',
                            lineHeight: '24px',
                            letterSpacing: '0%',
                            color: emissionData.color,
                          }}
                        >
                          {formatEmission(emissionData.amount)}
                        </span>
                        <span
                          style={{
                            fontWeight: 400,
                            fontStyle: 'normal',
                            fontSize: '12px',
                            lineHeight: '18px',
                            letterSpacing: '0%',
                            color: '#000000',
                          }}
                        >
                          {emissionData.description}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex justify-end gap-38 mt-2">
            <button
              className="text-white hover:bg-[#0AAC82] focus:bg-[#0AAC82] disabled:bg-[#0FD892]"
              style={{
                width: 91,
                height: 43,
                borderRadius: 4,
                padding: "8px 24px",
                backgroundColor: "#0FD892",
                opacity: 1,
                transform: "rotate(0deg)",
              }}
              onClick={handleClear}
            >
              Clear
            </button>
            {hasSelectedRoute && (
              <button
                className="text-white hover:bg-[#0AAC82] focus:bg-[#0AAC82]"
                style={{
                  width: 180,
                  height: 43,
                  borderRadius: 4,
                  padding: "8px 24px",
                  backgroundColor: "#0AAC82",
                }}
                onClick={handleShowDirections}
              >
                Show Directions
              </button>
            )}
          </div>
        </div>
        <div
          className="px-6 py-4"
          style={{
            backgroundColor: "#E9F8F3",
            borderBottomRightRadius: "20px",
            borderBottomLeftRadius: "20px",
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <p className="font-bold text-[18px] leading-[27px] text-[#00674C]">Current Weather</p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {current ? (
                <>
                  <Icon size="3.75rem" icon={WEATHER_CONDITION_ICONS[current.weather[0].icon]} />
                  <span className="text-4xl font-bold">{current.main.temp.toFixed(1)}°F</span>
                </>
              ) : (
                <span>Loading...</span>
              )}
            </div>
            <div className="relative group inline-block">
              <button
                className="py-1 px-6"
                onClick={() => setShowModal(true)}
                style={{
                  width: 119,
                  height: 43,
                  borderRadius: "4px",
                  backgroundColor: "#0FD892",
                  color: "white",
                }}
              >
                Forecast
              </button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-[#00b386] text-white text-sm rounded py-1 px-2 z-50 whitespace-nowrap shadow-md">
                ☁️ Clouds are gossiping again... 👀
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <ShowWeatherModal current={current} hourly={hourly} setShowModal={setShowModal} />
      )}
      
      {showDirectionsModal && selectedRoute && (
        <DirectionsModal 
          route={selectedRoute} 
          onClose={() => setShowDirectionsModal(false)} 
        />
      )}
    </div>
  );
}