"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BiSolidLeftArrow } from "react-icons/bi";
import { FaBicycle, FaCar, FaTrain } from "react-icons/fa6";
import { FaWalking, FaRecycle, FaExclamationCircle, FaArrowAltCircleDown } from "react-icons/fa";
import { IconType } from "react-icons";
import polyline from "@mapbox/polyline";
import { lineString } from '@turf/helpers';
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
import Heading from "@/components/Heading";
import { WEATHER_CONDITION_ICONS } from '@/constants/icons';
import { evStations, parks } from "@/constants/mapData";
import decodeToGeoJSON from "@/utils/decodeToGeoJSON";

import ShowWeatherModal from "./ShowWeatherModal";
import DirectionModal from "./DirectionModal";
import DirectionSection from "./DirectionSection";
import Legend from "./Legend";
import Introduction from "./Introduction";

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
  co2?: boolean
}

const methods: TransportMethod[] = [
  { method: 'walking', icon: FaWalking, iconAlert: FaRecycle, color: '#0fd892', blindColor: '#009E73', mesg: 'No emissions' }, 
  { method: 'bicycling', icon: FaBicycle, iconAlert: FaRecycle, color: '#0fd892', blindColor: '#009E73', mesg: 'No emissions', info: 'The CO₂ emissions are calculated based on the use of a standard non-electric bicycle.' },
  { method: 'driving', icon: FaCar, iconAlert: FaExclamationCircle, color: '#ff281b', blindColor: '#D55E00', mesg: 'High emissions', info: 'The CO₂ emissions generated is calculated by using a petrol car.', co2: true },
  { method: 'transit', icon: FaTrain, iconAlert: FaArrowAltCircleDown, color: '#FFC800', blindColor: '#E69F00', mesg: 'Low emissions', co2: true },
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
      'match',
      ['get', 'combined_level'],
      'very quiet', '#B7E4C7',   
      'quiet', '#95D5B2',   
      'normal', '#FFE066', 
      'busy', '#F77F00', 
      'very busy', '#FF4D4D',
      'extremely busy', '#D00000',
      '#FFE066'
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
  const [featuresData, setFeatureData] = useState<any>({ parks, evStations })
  const [navigation, setNavigation] = useState<any>()
  const [isOpen, setOpen] = useState<boolean>();
  const [routes, setDirectionData] = useState<any>();
  const [isMapLoading, setIsMapLoading] = useState<boolean>(true)
  const [isPredictionMode, setPredictionMode] = useState(false);
  const [isToggleOpen, setIsToggleOpen] = useState<boolean>(true);
  const [tool, setTool] = useState<any>();
  const [showFilter, setShowFilter] = useState(false);

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
    setIsToggleOpen(prev => !prev);
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
            <DirectionSection
              tool={tool}
              methods={methods}
              setTool={setTool}
              routes={routes}
              greenScoreforEachRoute={greenScoreforEachRoute}
              map={mapInstanceRef.current}
              featuresData={featuresData}
              toggles={toggles}
              busynessLayerSetting={busynessLayerSetting}
              setFeatureData={setFeatureData}
              setDirectionData={setDirectionData}
              setShowFilter={setShowFilter}
              setPredictionMode={setPredictionMode}
              setNavigation={setNavigation}
              isPredictionMode={isPredictionMode}
              setToggles={setToggles}
              setOpen={setOpen}
            />
            {isOpen && (
              <DirectionModal data={tool} setOpen={setOpen} setNavigation={setNavigation} navigation={navigation} />
            )}
          </div>
        </div>
        
        <div ref={mapRef} className="relative h-[555px] lg:min-h-[950px] lg:h-[100dvh] font-roboto">
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