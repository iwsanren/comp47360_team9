"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BiSolidLeftArrow } from "react-icons/bi";
import { FaBicycle, FaCar, FaTrain } from "react-icons/fa6";
import { FaWalking, FaRecycle, FaExclamationCircle, FaArrowAltCircleDown, FaLeaf } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { IconType } from "react-icons";
import { Feature, Point, GeoJsonProperties } from 'geojson';
import polyline from "@mapbox/polyline";
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { lineString, point } from '@turf/helpers';
import booleanIntersects from '@turf/boolean-intersects';
import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

import bikeIcon from "@/assets/images/bike_icon.png";
import evIcon from "@/assets/images/ev_icon.png";
import start from "@/assets/images/start.png";
import dest from "@/assets/images/dest.png";
import Icon from '@/components/Icon';
import Button from "@/components/Button";
import Text from "@/components/Text";
import Filter from "@/components/Filter";
import Toggle from "@/components/Toggle";
import Heading from "@/components/Heading";
import { WEATHER_CONDITION_ICONS } from '@/constants/icons';
import { evStations, parks } from "@/constants/mapData";
import decodeToGeoJSON from "@/utils/decodeToGeoJSON";
import { api, handleAPIError } from '@/utils/apiClient';
import getNextHourInNY from "@/utils/getNextHourInNY";
import fetchData from "@/utils/fetchData";

import ShowWeatherModal from "./ShowWeatherModal";
import DirectionModal from "./DirectionModal";
import DirectionSection from "./DirectionSection";
import PredictionSection from "./PredictionSection";
import Legend from "./Legend";
import Introduction from "./Introduction";

const key = 'busyness-prediction'

const clearPredictedBusynessLayer = (map: mapboxgl.Map | null) => {
  if(!map) return
  if (map.getLayer(`${key}-layer`)) {
      map.removeLayer(`${key}-layer`);
      map.removeLayer(`${key}-border-layer`);
  }
  if (map.getSource(key)) {
    map.removeSource(key);
  }
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "";

const loadImage = [
  { icon: bikeIcon, key: 'bike' },
  { icon: evIcon, key: 'ev' },
  { icon: start, key: 'start' },
  { icon: dest, key: 'dest' }
]

export interface Toggles {
  parks: boolean;
  'evStations': boolean;
  bikes: boolean;
  busyness: boolean;
  'air-quality': boolean;
}

export interface Coordinates {
  lng: number;
  lat: number;
}

export interface TransportMethod {
  method: string;
  icon: IconType;
  iconAlert: IconType;
  color: string;
  blindColor: string;
  mesg: string;
  info?: string;
}

const methods: TransportMethod[] = [
  { method: 'walking', icon: FaWalking, iconAlert: FaRecycle, color: '#0fd892', blindColor: '#009E73', mesg: 'Free of emissions' }, 
  { method: 'bicycling', icon: FaBicycle, iconAlert: FaRecycle, color: '#0fd892', blindColor: '#009E73', mesg: 'Fast and clean', info: 'The CO₂ emissions generated is calculated by using a normal bike.' },
  { method: 'driving', icon: FaCar, iconAlert: FaExclamationCircle, color: '#ff281b', blindColor: '#D55E00', mesg: 'Highest emissions', info: 'The CO₂ emissions generated is calculated by using a petrol car.' },
  { method: 'transit', icon: FaTrain, iconAlert: FaArrowAltCircleDown, color: '#FFC800', blindColor: '#E69F00', mesg: 'A few emissions' },
]

export type MvpFeatures<T extends keyof Toggles> = {
  key: T,
  label: string,
  api: string,
  layer: any,
  details?: any,
}

const busynessLayerSetting: any = {
  type: "fill",
  paint: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'combined_busyness'],
      // min, color
      1, '#B7E4C7',    
      100, '#95D5B2',   
      200, '#FFE066', 
      300, '#FAA307', 
      400, '#F48C06', 
      500, '#D00000', 
    ],
    'fill-color-transition': {
      duration: 1000, 
      delay: 0
    },
    'fill-opacity': 0.8
  },
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
    },
    details: [
      { key: 'name' },
    ]
  },
  {
    key: 'evStations',
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
    details: [
      { key: 'name' },
      { key: 'operator' },
      { key: 'access' },
      { key: 'capacity' },
    ]
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
    details: [
      { key: 'name' },
      { label: 'Available Bikes', key: 'bikes_available' },
      { label: 'Available Docks', key: 'docks_available' },
    ]
  },
  {
    key: 'busyness',
    api: '/manhattan?data=busyness',
    label: 'Busyness',
    layer: busynessLayerSetting
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

export default function Map() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>();
  const [toggles, setToggles] = useState<Toggles>({
    parks: false,
    evStations: false,
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
  const [featuresData, setFeatureData] = useState<any>({
    parks,
    evStations,
  })
  const [isLoadingDirection, setIsLoadingDirection] = useState(false);
  const [isPredictionMode, setPredictionMode] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [timestamp, setTime] = useState(getNextHourInNY());
  const [isLoading, setIsLoading] = useState<boolean>()
  const [isMapLoading, setIsMapLoading] = useState<boolean>(true)

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
    .map((route: any) => (isPredictionMode ? featuresData?.predictedBusyness?.features : featuresData.busyness.features)?.filter((feature: any) =>
    booleanIntersects(feature, route))
  ))), [allMethodsRouteCoords, featuresData.busyness, featuresData?.predictedBusyness?.features, isPredictionMode])

  const greenScoreforEachRoute = useMemo(() => (allMethodPassedZones || []).map((methodRoutedata: any) => {
    return (
      methodRoutedata?.map((zones: any) => {
        const { aqiSum, busySum } = (zones || []).reduce(
          (acc: any, zone: any) => {
            const aqi = +zone?.properties?.aqi || 1;
            const busy = +zone?.properties?.normalised_busyness || 0;

            acc.aqiSum += (aqi - 1) / 4; // AQI: 1~5 → 0~1
            acc.busySum += busy;         // Busyness: 0~1
            return acc;
          },
          { aqiSum: 0, busySum: 0 }
        );
        const count = zones?.length;
        const aqi_normalised = aqiSum / count;
        const busy_normalised = busySum / count;

        const pollutionScore =
          aqi_normalised * 0.15 +
          busy_normalised * 0.35;

        return pollutionScore;
      })
  )}), [allMethodPassedZones])

  const fetchDirection = async () => {
    setIsLoadingDirection(true);
    try {
      // Using the new API client
      const { data } = await api.post('/api/directions', {
        origin: startCoords,
        destination: destCoords,
        isPredictionMode,
        timestamp,
      });
      setDirectionData(data);
    } catch (err) {
      const errorInfo = handleAPIError(err as Error, 'Fetch directions');
      console.error("Failed to fetch direction", errorInfo);
      // Can add user notification logic here
      // toast.error(errorInfo.userMessage);
    } finally {
      setIsLoadingDirection(false); 
    }
  };

  // fetch directions data
  useEffect(() => {
    if (startCoords && destCoords && !isPredictionMode) {
      setTool(undefined)
      fetchDirection()
    }
  }, [startCoords, destCoords, isPredictionMode])

  // load the map
  useEffect(() => {
    if (!mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/prakhardayal/cmclwuguo003s01sbhx3le5c4",
      center: [-73.968285, 40.785091],
      zoom: 12,
    });

    map.getCanvas().style.cursor = "pointer";

    mapInstanceRef.current = map;

    loadImage.forEach(({ icon, key }) => {
      map.loadImage(icon.src, (error, image) => {
        if (error) throw error;
        if (image) {
          map.addImage(`${key}-icon`, image);
        }
      });
    })

    const fetchAndAdd = async () => {
      const map = mapInstanceRef.current;
      if (!map) return; 

      const tasks = mvpFeatures.map(async (feature) => {
        // get the data
        let data = featuresData[feature.key];

        try {
          const res = await fetch(`/api${feature.api}`, { method: 'POST' });
          data = await res.json();
          if (!data?.features) throw new Error("Invalid GeoJSON");
          setFeatureData((prev: any) => ({ ...prev, [feature.key]: data }));
        } catch (e) {
          console.error(`Failed to fetch ${feature.key}`, e);
          return; // skip this one
        }

        // add to layer
        if (!map?.getSource(feature.key)) {
          map?.addSource(feature.key, {
            type: 'geojson',
            data,
          });
        }

        if (!map.getLayer(`${feature.key}-layer`)) {
          map.addLayer({
            id: `${feature.key}-layer`,
            source: feature.key,
            ...feature.layer,
            layout: {
              ...feature.layer.layout,
              visibility: 'none'
            }
          });

          if (feature.layer.type === 'fill') {
            map.addLayer({
              id: `${feature.key}-border-layer`,
              type: 'line',
              source: feature.key,
              paint: {
                'line-color': 'black',
                'line-width': 1.5
              },
              layout: {
                visibility: 'none'
              }
            });
          }
        }

        if (feature.details) {
          const popup = new mapboxgl.Popup({
            closeButton: true,
          });

          // ➕ click event
          map.on("click", `${feature.key}-layer`, (e: any) => {
            const isTypeFill = feature.layer.type === 'fill'
            const coordinates = e.features[0].geometry.coordinates;
            const props = e.features[0].properties;
            const infoList = feature.details
              .map(({ key, label }: { key: string; label: string }) => {
                const value = props[key as keyof typeof props];
                if (key === 'name' && value) {
                  return `<div><b>${value}</b></div>`;
                }
                if (value) {
                  return `<div class="capitalize">${label || key}: ${value}</div>`;
                }
                return null;
              })
            .filter(Boolean);
            const contentHTML = infoList.length > 0 ? infoList.join('') : `<div>No available information</div>`;
            popup.setLngLat(isTypeFill ? e.lngLat : coordinates)
                 .setHTML(`<div class="flex flex-col gap-1">${contentHTML}</div>`)
                 .addTo(map);

          });
        }
      });

      await Promise.all(tasks);
    };

    if (!map.isStyleLoaded()) {
      map.once('load', fetchAndAdd);
    } else {
      fetchAndAdd();
    }

    return () => map.remove();
  }, []);

  // click on map
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

    if (featuresData.busyness && clickPoints.length != 2 && !toggles.bikes && !toggles.parks && !toggles.evStations) {
      map.on('click', handleClick);
    }

    return () => {
      map.off('click', handleClick);
    };

  }, [featuresData.busyness, clickPoints, startCoords, destCoords, toggles.bikes, toggles.parks, toggles.evStations])

  // add start point and dest point icon
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const addClickPoints = () => {
      if (clickPoints.length === 0) {
        if (map.getLayer("click-points-layer")) {
          map.removeLayer("click-points-layer");
        }
        if (map.getSource("click-points")) {
          map.removeSource("click-points");
        }
        return
      }
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

        map.moveLayer("click-points-layer");
      } else {
        const source = map.getSource("click-points") as mapboxgl.GeoJSONSource;;
        if (source) {
          source.setData({
            type: "FeatureCollection",
            features: clickPoints,
          });
        }
        // prevent layer from being covered
        if (map.getLayer("click-points-layer")) {
          map.moveLayer("click-points-layer");
        }
      }
    };

    if (!map?.isStyleLoaded()) {
      map?.once("style.load", addClickPoints);
    } else {
      addClickPoints();
    }

    return () => {
      map?.off("load", addClickPoints);
    };
  }, [clickPoints]);

  // handle to show features
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

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
      setLayerVisibility(map, `${feature.key}-layer`, visibility);
      if (feature.layer.type === 'fill') {
        setLayerVisibility(map, `${feature.key}-border-layer`, visibility);
      }
    })
    
  }, [toggles]);

  // add path on map
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
            'line-opacity': 1
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

  // fetch weather data
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
    if (!isPredictionMode) {
      setIsToggleOpen(prev => !prev);
    }
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
    setFeatureData((prev: any) => ({ ...prev, predictedBusyness: false}))
    clearPredictedBusynessLayer(mapInstanceRef.current)
  };

  const handleShowPrediction = async () => {
    const map = mapInstanceRef.current
    fetchDirection()
    if (!map) return;
    setFeatureData((prev: any) => ({ ...prev, predictedBusyness: false }));
    setIsLoading(true);
    try {
      const predictedBusyness = await fetchData(`/api/manhattan?timestamp=${timestamp}`);
      setFeatureData((prev: any) => ({ ...prev, predictedBusyness }));

      const source = map.getSource(key);
      const layerId = `${key}-layer`;

      if (predictedBusyness && source && 'setData' in source) {
        // If the source exists, update its data
        source.setData(predictedBusyness);
      } else {
        // If source doesn't exist, add it
        if (!source) {
          map.addSource(key, {
            type: "geojson",
            data: predictedBusyness,
          });
        }

        // If layer already exists, remove it to avoid duplication
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }

        if (map.getLayer(`${key}-border-layer`)) {
          map.removeLayer(layerId);
        }

        // Add the layer but keep it hidden while loading
        map.addLayer({
          id: layerId,
          source: key,
          ...busynessLayerSetting,
        });

        map.addLayer({
          id: `${key}-border-layer`,
          type: 'line',
          source: key,
          paint: {
            'line-color': 'black',
            'line-width': 1.5
          },
        });
      }
      // Show the layer after data is loaded
    } catch (err) {
      console.error("Prediction load failed:", err);
    } finally {
      // Always turn off loading state
      if (map.getLayer("click-points-layer")) {
        map.moveLayer("click-points-layer");
      }
      setIsLoading(false);
    }
  };
  return (
    <div>
      {isMapLoading && (
        <Introduction setIsMapLoading={setIsMapLoading} />
      )}
      <div className={`relative duration-250 overflow-hidden`} style={{ pointerEvents: featuresData.busyness ? 'auto' : 'none' }}>
        <div className="hidden lg:flex absolute items-center top-[50%] transform translate-y-[-50%] right-0 z-3">
          <div
            onClick={handleToggleSlide}
            className={isPredictionMode ? `cursor-not-allowed opacity-50` : `cursor-pointer`}
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
                transform: (isToggleOpen && !isPredictionMode) ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s',
              }}
              size=".75rem"
            />
          </div>

          {!isPredictionMode && (
            <Filter className={isToggleOpen ? 'w-[187px]' : 'w-0 !p-0'} setToggles={setToggles} toggles={toggles} mvpFeatures={mvpFeatures} />
          )}
        </div>

        <div
          className="relative z-3 lg:absolute lg:shadow-lg lg:left-4 lg:bottom-3 lg:rounded-[20px] lg:top-[55px] bg-white"
        >
          <div
            className="mt-[43px] lg:rounded-b-[20px] relative bottom-0 left-0 right-0 pt-3 px-4 lg:px-6 lg:py-4 lg:absolute bg-green-200"
          >
            <Text className="font-bold text-green-800">Current Weather</Text>
            <div className="flex items-center justify-between lg:mt-2">
              <div className="flex items-center gap-3 lg:gap-4">
                {current ? (
                  <>
                    <div className="text-[2.5em] lg:text-6xl">
                      <Icon icon={WEATHER_CONDITION_ICONS[current?.weather?.[0]?.icon]} />
                    </div>
                    <Heading className="lg:!text-5xl">{current.main.temp.toFixed(1)}°F</Heading>
                  </>
                ) : (
                  <span>Loading...</span>
                )}
              </div>
              <div className="relative group inline-block">
                <Button
                  onClick={() => setShowModal(true)}
                >
                  Forecast
                </Button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-[#00b386] text-white text-sm rounded py-1 px-2 z-50 whitespace-nowrap shadow-md">
                  ☁️ Clouds are gossiping again... 👀
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 lg:p-6">
            <div className="flex justify-between items-center mb-4 ">
              <Heading className="text-green-800" level={2}>{isPredictionMode ? 'Prediction Mode' : 'Get Directions'}</Heading>
              <Toggle
                isDisabled={isLoading}
                onClick={() => {
                  clearPredictedBusynessLayer(mapInstanceRef.current)
                  setPredictionMode(prev => !prev)
                  handleClear()
                  setShowFilter(false)
                  setToggles(prev => {
                    const newToggles = Object.fromEntries(
                      Object.keys(prev).map(key => [key, false])
                    ) as unknown as Toggles;

                    return newToggles;
                  });
                }}
                isActive={isPredictionMode}
              >
                <div className="absolute top-full right-0 lg:left-[50%] lg:-translate-x-1/2 translate-y-2 w-[180px] py-1 px-2 text-sm/[21px] bg-white rounded-sm drop-shadow-lg">Switch to {isPredictionMode ? 'direction' : 'predict'} model.</div>
              </Toggle>
            </div>
            <div className="flex flex-col gap-4 lg:gap-3">
              {isPredictionMode && (
                <PredictionSection
                  setTime={setTime}
                  timestamp={timestamp}
                  layerName={key}
                  map={mapInstanceRef.current}
                  busynessLayerSetting={busynessLayerSetting}
                  setFeatureData={setFeatureData}
                />
              )}
              <DirectionSection
                setClickPoints={setClickPoints}
                setStartLocation={setStartLocation}
                setStartCoords={setStartCoords}
                setDestCoords={setDestCoords}
                destCoords={destCoords}
                startLocation={startLocation}
                startCoords={startCoords}
                setDestination={setDestination}
                destination={destination}
                isLoadingDirection={isLoadingDirection || isLoading}
                tool={tool}
                methods={methods}
                setTool={setTool}
                routes={routes}
                greenScoreforEachRoute={greenScoreforEachRoute}
                isInValid={isInValid}
              />
              <div className="flex justify-between">
                <Button onClick={handleClear}>Clear</Button>
                {isPredictionMode && !featuresData.predictedBusyness && (
                  <Button isDisabled={isLoading} onClick={handleShowPrediction}>Get Prediction</Button>
                )} 
                {(isPredictionMode ? (tool && featuresData.predictedBusyness && !isLoading) : tool) && (
                  <Button onClick={() => setOpen(true)}>Show Directions</Button>
                )}
              </div>
            </div>
            {isOpen && (
              <DirectionModal data={tool} setOpen={setOpen} setNavigation={setNavigation} navigation={navigation} />
            )}
          </div>
          
          <div ref={mapRef} className="relative h-[555px] lg:min-h-[850px] lg:h-[100dvh] font-roboto">
            <div className="lg:hidden absolute top-2 left-2 z-5">
              {!isPredictionMode && (
                <Button
                  onClick={() => {
                    setShowFilter(prev => !prev)
                  }}
                  className={`${showFilter ? 'text-white bg-green-700' : '!text-green-800 bg-white'} `}
                >
                  {showFilter && 'Close '}Filter
                </Button>
              )}
              {showFilter && (
                <Filter className="mt-2 bg-green-700" setToggles={setToggles} toggles={toggles} mvpFeatures={mvpFeatures} />
              )}
            </div>
          </div>
          {(featuresData.predictedBusyness || toggles.busyness)&& (
            <Legend />
          )}
          {showModal && (
            <>
              <div className="absolute left-0 right-0 top-0 bottom-0 bg-[rgba(0,0,0,0.5)] z-10" />
              <ShowWeatherModal current={current} hourly={hourly} setShowModal={setShowModal} />
            </>
          )}

        </div>
        
        <div ref={mapRef} className="relative h-[555px] lg:min-h-[850px] lg:h-[100dvh] font-roboto">
          <div className="lg:hidden absolute top-2 left-2 z-5">
            {!isPredictionMode && (
              <Button
                onClick={() => {
                  setShowFilter(prev => !prev)
                }}
                className={`${showFilter ? 'text-white bg-green-700' : '!text-green-800 bg-white'} `}
              >
                {showFilter && 'Close '}Filter
              </Button>
            )}
            {showFilter && (
              <Filter className="mt-2 bg-green-700" setToggles={setToggles} toggles={toggles} mvpFeatures={mvpFeatures} />
            )}
          </div>
        </div>
        {(featuresData.predictedBusyness || toggles.busyness)&& (
          <Legend />
        )}
        {showModal && (
          <>
            <div className="absolute left-0 right-0 top-0 bottom-0 bg-[rgba(0,0,0,0.5)] z-10" />
            <ShowWeatherModal current={current} hourly={hourly} setShowModal={setShowModal} />
          </>
        )}
      </div>
    </div>
  );
}