"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BiSolidLeftArrow } from "react-icons/bi";
import { FaBicycle, FaCar, FaTrain } from "react-icons/fa6";
import { FaWalking, FaRecycle, FaExclamationCircle, FaArrowAltCircleDown } from "react-icons/fa";
import { maxBy, minBy, uniq } from 'lodash';
import { Feature, Point, GeoJsonProperties } from 'geojson';
import Image from "next/image";
import polyline from "@mapbox/polyline";
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { lineString, point } from '@turf/helpers';
import booleanIntersects from '@turf/boolean-intersects';
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

import startEndIcon from "@/assets/images/start_end_icon.png";
import switchStartEndIcon from "@/assets/images/switch_start_end_icon.png";
import bikeIcon from "@/assets/images/bike_icon.png";
import evIcon from "@/assets/images/ev_icon.png";
import start from "@/assets/images/start.png";
import dest from "@/assets/images/dest.png";
import Icon from '@/components/Icon';
import Button from "@/components/Button";
import Input from '@/components/Input';
import { WEATHER_CONDITION_ICONS } from '@/constants/icons';
import { co2Emissions, transitEmissions } from "@/utils/formula";
import decodeToGeoJSON from "@/utils/decodeToGeoJSON";

import ShowWeatherModal from "./ShowWeatherModal";
import DirectionModal from "./DirectionModal";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "";

const loadImage = [
  { icon: bikeIcon, key: 'bike' },
  { icon: evIcon, key: 'ev' },
  { icon: start, key: 'start' },
  { icon: dest, key: 'dest' }
]

interface Toggles {
  parks: boolean;
  'ev-stations': boolean;
  bikes: boolean;
  busyness: boolean;
  'air-quality': boolean;
}

interface Coordinates {
  lng: number;
  lat: number;
}

const methods = [
  { method: 'walking', icon: FaWalking, iconAlert: FaRecycle, color: '#0FD892', mesg: 'Free of emissions' }, 
  { method: 'bicycling', icon: FaBicycle, iconAlert: FaRecycle, color: '#0FD892', mesg: 'Fast and clean' },
  { method: 'driving', icon: FaCar, iconAlert: FaExclamationCircle, color: '#FF281B', mesg: 'Highest emissions' },
  { method: 'transit', icon: FaTrain, iconAlert: FaArrowAltCircleDown, color: '#FFC800', mesg: 'A few emissions' },
]

type MvpFeatures<T extends keyof Toggles> = {
  key: T,
  label: string,
  api: string,
  layer: any,
}

const mvpFeatures: MvpFeatures<keyof Toggles>[] = [
  {
    key: 'parks',
    label: 'Parks',
    api: '/parks',
    layer: {
      type: 'fill',
      paint: {
        "fill-color": "#00674C",
        "fill-opacity": 0.5,
        "fill-outline-color": "#006400",
      },
    } 
  },
  {
    key: 'ev-stations',
    api: '/EV-charging',
    label: "EV Charging Stations",
    layer: {
      layout: {
        "icon-image": "ev-icon",
        "icon-size": 1,
        "icon-allow-overlap": true,
      },
      type: "symbol"
    },
  },
  {
    key: 'bikes',
    api: '/bikes',
    label: 'Bike Stations',
    layer: {
      layout: {
        "icon-image": "bike-icon",
        "icon-size": 1,
        "icon-allow-overlap": true,
      },
      type: "symbol"
    },
  },
  {
    key: 'busyness',
    api: '/manhattan?data=busyness',
    label: 'Busyness',
    layer: {
      type: "fill",
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['get', 'busyness'],
          // min, color
          1, '#B7E4C7',    
          100, '#95D5B2',   
          200, '#FFE066', 
          300, '#FAA307', 
          400, '#F48C06', 
          500, '#D00000', 
        ],
        'fill-opacity': 0.8
      },
    }
  },
  {
    key: 'air-quality',
    label: "Air Quality",
    api: '/manhattan?data=air-quality',
    layer: {
      type: "heatmap",
      paint: {
        "heatmap-weight": [
          "interpolate",
          ["linear"],
          ["get", "aqi"],
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
    }
  }
] 


// console.log(ML_API_URL)

export default function Map() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>();
  const [toggles, setToggles] = useState<Toggles>({
    parks: false,
    'ev-stations': false,
    bikes: false,
    busyness: false,
    'air-quality': false,
  });
  const [startLocation, setStartLocation] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [isToggleOpen, setIsToggleOpen] = useState<boolean>(true);
  const [startCoords, setStartCoords] = useState<Coordinates | null>(null);
  const [destCoords, setDestCoords] = useState<Coordinates | null>(null);
  const [isInValid, setIsInVaildPos] = useState<boolean>();
  const [routes, setDirectionData] = useState<any>();
  const [tool, setTool] = useState<any>();
  const [isOpen, setOpen] = useState<boolean>();
  const [clickPoints, setClickPoints] = useState<Feature<Point, GeoJsonProperties>[]>([]);
  const [navigation, setNavigation] = useState<any>()
  const [featuresData, setFeatureData] = useState<any>({})
  const [isLoadingDirection, setIsLoadingDirection] = useState(false);


  const navLineGeo = useMemo(() => navigation && decodeToGeoJSON(navigation?.overview_polyline?.points), [navigation])

  const allMethodsRouteCoords = useMemo(() => {
    const paths: number[][][][] = []
    methods.forEach(({ method }) => {
      const routeCoords = routes?.[method]?.routes?.map((element: any) => {
        let allRoutes: number[][] = []
        element.legs[0].steps.forEach((step: any) => {
          const decoded = polyline.decode(step.polyline.points);
          const stepCoords = decoded.map(([lat, lng]) => [lng, lat]); // GeoJSON location [lng, lat]
          allRoutes = allRoutes.concat(stepCoords)
        })
        return allRoutes
      })
      paths.push(routeCoords)
    })
    return paths
  }, [routes]);

  // find the zones where the routes will pass.
  const allMethodPassedZones = useMemo(() => allMethodsRouteCoords.map(((routeCoords: any) => routeCoords?.map((r: any) => lineString(r))
    .map((route: any) => featuresData.busyness.features?.filter((feature: any) =>
    booleanIntersects(feature, route))
  ))), [allMethodsRouteCoords, featuresData.busyness])

  const greenScoreforEachRoute = useMemo(() => (allMethodPassedZones || []).map((methodRoutedata: any) => {
    return (
      methodRoutedata?.map((zones: any) => zones?.reduce((res: number, d: any) => {
        res = res + +d.properties.aqi + +d.properties.busyness
        return res
      }, 0))
  )}), [allMethodPassedZones])

  useEffect(() => {
    const fetchDirection = async () => {
      setIsLoadingDirection(true);
      try {
        const res = await fetch('/api/directions', 
          { 
            method: 'POST', 
            body: JSON.stringify({
              origin: startCoords,
              destination: destCoords,
            }), 
          }
        )
        const data = await res.json();
        setDirectionData(data);
      } catch (err) {
        console.error("Failed to fetch weather", err);
      } finally {
        setIsLoadingDirection(false); 
      }
    };
    if (startCoords && destCoords) {
      fetchDirection()
    }
  }, [startCoords, destCoords])

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/prakhardayal/cmclwuguo003s01sbhx3le5c4",
      center: [-73.968285, 40.785091],
      zoom: 12,
    });

    loadImage.forEach(({ icon, key }) => {
      map.loadImage(icon.src, (error, image) => {
        if (error) throw error;
        if (image) {
          map.addImage(`${key}-icon`, image);
        }
      });
    })

    mapInstanceRef.current = map;

    return () => map.remove();
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    
    const handleClick = async (e: any) => {
      const { lng, lat } = e.lngLat;
      const pt = point([lng, lat]);
      const isInManhattan = featuresData.busyness.features.some((region: any) =>
        booleanPointInPolygon(pt, region)
      );

      if (isInManhattan) {
        setIsInVaildPos(false);
        if (!mapboxgl.accessToken) {
          console.error("Mapbox access token is missing");
          return;
        }

        setClickPoints((prev) => {
          const newPoint: Feature<Point, GeoJsonProperties> = {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
            properties: {
              icon: prev.length === 0 ? "start-icon" : "dest-icon",
            },
          };

          if (prev.length >= 2) {
            return [newPoint];
          } else {
            return [...prev, newPoint];
          }
        });

        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
              new URLSearchParams({
                access_token: mapboxgl.accessToken,
                limit: "1",
              })
          );
          const data = await response.json();
          const address =
            data.features && data.features.length > 0
              ? data.features[0].place_name
              : `(${lng.toFixed(6)}, ${lat.toFixed(6)})`;

          if (!startCoords) {
            setStartCoords({ lng, lat });
            setStartLocation(address);
          } else if (!destCoords) {
            setDestCoords({ lng, lat });
            setDestination(address);
          }
        } catch (error) {
          console.error("Failed to reverse geocode:", error);
        }
      } else {
        setIsInVaildPos(true);
      }
    };

    if (featuresData.busyness && clickPoints.length != 2) {
      map.on('click', handleClick);
    }

    return () => {
      map.off('click', handleClick);
    };

  }, [featuresData.busyness, clickPoints, startCoords, destCoords])

  // add start point and dest point icon
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const addClickPoints = () => {
      if (!map.getSource("click-points")) {
        map.addSource("click-points", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: clickPoints,
          },
        });

        map.addLayer({
          id: "click-points-layer",
          type: "symbol",
          source: "click-points",
          layout: {
            "icon-image": ["get", "icon"],
            "icon-size": 0.33,
            "icon-allow-overlap": true,
          },
        });
      } else {
        const source = map.getSource("click-points") as mapboxgl.GeoJSONSource;;
        if (source) {
          source.setData({
            type: "FeatureCollection",
            features: clickPoints,
          });
        }
      }
    };

    if (!map.loaded()) {
      map.on("load", addClickPoints);
    } else {
      addClickPoints();
    }

    return () => {
      map.off("load", addClickPoints);
    };
  }, [clickPoints]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    const fetchData = async ({ api, key }: { api: string, key: string }) => {
      try {
        const res = await fetch(`/api/${api}`, { method: "POST" });
        const geojson = await res.json();
        if (geojson.features) {
          setFeatureData((prev: any) => ({
            ...prev,
            [key]: geojson,
          }));
        } else {
          console.error("Invalid GeoJSON data");
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    const setLayerVisibility = (
      map: mapboxgl.Map,
      layerId: string,
      visibility: "visible" | "none"
    ) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", visibility);
      }
    };

    mvpFeatures.forEach((feature) => {
      const visibility = toggles[feature.key] ? "visible" : "none";
      
      if (!featuresData[feature.key]) {
        fetchData({ api: feature.api, key: feature.key })
      }

      if (toggles[feature.key]) {
        if (featuresData[feature.key] && !map.getSource(feature.key)) {
          map.addSource(feature.key, {
            type: "geojson",
            data: featuresData[feature.key],
          });

          map.addLayer({
            id: `${feature.key}-layer`,
            source: feature.key,
            ...feature.layer,
            visibility
          });
        } else {
          setLayerVisibility(map, `${feature.key}-layer`, visibility);
        }
      } else {
        setLayerVisibility(map, `${feature.key}-layer`, visibility);
      }
    })
    
  }, [toggles]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    if (navLineGeo) {
      const source = map.getSource('route');
      
      if (source && 'setData' in source) {
        source.setData(navLineGeo);
      } else {
        map.addSource('route', {
          type: 'geojson',
          data: navLineGeo
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
            'line-color': '#3887be',
            'line-width': 5,
            'line-opacity': 0.75
          }
        });
      }
    } else {
      if (map.getLayer("route")) {
        map.removeLayer("route");
      }
      if (map.getSource("route")) {
        map.removeSource("route");
      }
    }
  }, [navLineGeo]);

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

  const handleToggleSlide = () => {
    setIsToggleOpen(!isToggleOpen);
  };

  const handleClear = () => {
    setStartLocation("");
    setDestination("");
    setStartCoords(null);
    setDestCoords(null);
    setDirectionData(null);
    setClickPoints([])
    setTool('')
    setNavigation(undefined)
  };

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
            className="flex flex-col gap-1 rounded-sm bg-[#00674CBF] p-2"
          >
            {mvpFeatures.map(({ key, label }) => (
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
              <Input
                disabled={true}
                placeholder="Start Location (Click on Map)"
                value={startLocation}
                width="full"
              />
              <Input
                disabled={true}
                placeholder="Your Destination (Click on Map)"
                value={destination}
                width="full"
              />
              {isInValid && <div className="text-red-500 text-xs">Invaild position, the position is only available in Manhattan</div>}
            </div>
            <Image
              src={switchStartEndIcon}
              alt="Switch Icon"
              width={24}
              height={24}
              className="cursor-pointer"
              onClick={() => {
                setClickPoints(prev => {
                  if (prev.length !== 2) return prev;
                  const [first, second] = prev;
                  const updated = [
                    { ...first, properties: { icon: second.properties?.icon } },
                    { ...second, properties: { icon: first.properties?.icon }},
                  ];
                  return updated;
                })
                
                const temp = startLocation;
                setStartLocation(destination);
                setDestination(temp);
                const tempCoords = startCoords;
                setStartCoords(destCoords);
                setDestCoords(tempCoords);
              }}
            />
          </div>
          {startCoords && destCoords && (
            isLoadingDirection ? (
             <div className="py-3">Loading...</div>
          ) : (
             <div className="flex flex-col gap-3">
                {methods.map(({ method, color, icon, iconAlert, mesg }, i) => {
                  const paths = routes?.[method]?.routes
                  const maxTime = paths.length > 1 ? maxBy(paths, (n: any) => n.legs?.[0].duration.value) : paths[0]?.legs?.[0].duration.text
                  const minTime = paths.length > 1 && minBy(paths, (n: any) => n.legs?.[0].duration.value)
                  const maxEmissions = co2Emissions(paths.length > 1 ? maxBy(paths, (n: any) => n.legs?.[0].distance.value).legs?.[0].distance.value : paths?.[0].legs?.[0].distance.value)
                  const minEmissions = co2Emissions(paths.length > 1 && minBy(paths, (n: any) => n.legs?.[0].distance.value).legs?.[0].distance.value)
                  const transitCO2Arr = method == "transit" && uniq(transitEmissions(paths))
                  const isActive = tool?.method === method
                  const isEqual = minEmissions == maxEmissions
                  return (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: isActive ? color : 'white',
                        boxShadow: '0px 2px 4px 0px #00000040',
                        color: isActive ? 'white' : color,
                      }}
                      className={`py-2 px-3 rounded-lg cursor-pointer transition-all duration-250`}
                      onClick={() => setTool({ method, greenScores: greenScoreforEachRoute[i], paths })}
                      key={i}
                    >
                      <div className="flex gap-[10px] items-center">
                        <Icon icon={icon} className="inherit" size="1.5rem" />
                        <p className={`text-sm text-${isActive ? 'white' : 'black'}`}>{paths.length > 1 ? (Math.floor(minTime?.legs?.[0].duration.value / 60) + ' - ' + Math.floor(maxTime?.legs?.[0].duration.value / 60) + ' mins') : maxTime}</p>
                      </div>
                      <div
                        className="flex items-center gap-2 w-[8.875rem]"
                      >
                        <Icon icon={iconAlert} className="inherit" size="1.25rem" />
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                          }}
                        >
                          <span
                            className={`font-bold`}
                          >
                            {method === 'driving' ? (minEmissions ?
                             isEqual ? minEmissions : `${minEmissions} - ${maxEmissions}` : maxEmissions
                            ) : transitCO2Arr ? transitCO2Arr.join(' - ') : 0} kg CO₂
                            
                          </span>
                          <span className="text-xs leading-[1.5]">
                            {mesg}
                          </span>
                        </div>
                      </div>
                    </div>
                )})}
              </div>
          ))}
            <div className="flex justify-between mt-2">
              <Button
                onClick={handleClear}
              >
                Clear
              </Button>
              {tool && (
                <Button onClick={() => setOpen(true)}>
                  Show Directions
                </Button>
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
        {isOpen && (
          <DirectionModal data={tool} setOpen={setOpen} setNavigation={setNavigation} navigation={navigation} />
        )}
      </div>

      {showModal && (
        <ShowWeatherModal current={current} hourly={hourly} setShowModal={setShowModal} />
      )}

    </div>
  );
}