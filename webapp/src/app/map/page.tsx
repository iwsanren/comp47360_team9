"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BiSolidLeftArrow } from "react-icons/bi";
import { FaBicycle, FaCar, FaTrain } from "react-icons/fa6";
import { FaWalking, FaRecycle, FaExclamationCircle, FaArrowAltCircleDown } from "react-icons/fa";
import { maxBy, minBy } from 'lodash';
import { Feature, Point, GeoJsonProperties } from 'geojson';

import Image from "next/image";

import polyline from "@mapbox/polyline";
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { lineString } from '@turf/helpers';
import booleanIntersects from '@turf/boolean-intersects';

import mapboxgl from "mapbox-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

import startEndIcon from "@/assets/images/start_end_icon.png";
import switchStartEndIcon from "@/assets/images/switch_start_end_icon.png";
import bikeIcon from "@/assets/images/bike_icon.png";
import evIcon from "@/assets/images/ev_icon.png";
import start from "@/assets/images/start.png";
import dest from "@/assets/images/dest.png";

import { WEATHER_CONDITION_ICONS } from '@/constants/icons';

import Icon from '@/components/Icon';
import Button from "@/components/Button";

import { co2Emissions, transitEmissions } from "@/utils/formula";

import ShowWeatherModal from "./ShowWeatherModal";
import DirectionModal from "./DirectionModal";
import decodeToGeoJSON from "@/utils/decodeToGeoJSON";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "";

const loadImage = [
  { icon: bikeIcon, key: 'bike' },
  { icon: evIcon, key: 'ev' },
  { icon: start, key: 'start' },
  { icon: dest, key: 'dest' }
]

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

const toggleNames = [
  { key: "parks", label: "Parks" },
  { key: "ev", label: "EV charging Stations" },
  { key: "bikes", label: "Bike Stations" },
  { key: "busyness", label: "Busyness" },
  { key: "air", label: "Air Quality" },
] as const;

const methods = [
  { method: 'walking', icon: FaWalking, iconAlert: FaRecycle, color: '#0FD892', mesg: 'Free of emissions' }, 
  { method: 'bicycling', icon: FaBicycle, iconAlert: FaRecycle, color: '#0FD892', mesg: 'Fast and clean' },
  { method: 'driving', icon: FaCar, iconAlert: FaExclamationCircle, color: '#FF281B', mesg: 'Highest emissions' },
  { method: 'transit', icon: FaTrain, iconAlert: FaArrowAltCircleDown, color: '#FFC800', mesg: 'A few emissions' },
]

export default function Map() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const startLocationRef = useRef<any>(null);
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
  const [isInValid, setIsInVaildPos] = useState<boolean>();
  const [routes, setDirectionData] = useState<any>();
  const [busyness, setBusyness] = useState<any>();
  const [tool, setTool] = useState<any>();
  const [isOpen, setOpen] = useState<boolean>();
  const [clickPoints, setClickPoints] = useState<Feature<Point, GeoJsonProperties>[]>([]);
  const [navigation, setNavigation] = useState<any>()
  const navLineGeo = useMemo(() => navigation && decodeToGeoJSON(navigation?.overview_polyline?.points), [navigation])
  // console.log(navLineGeo, navigation?.overview_polyline)
  const allMethodsRouteCoords = useMemo(() => {
    const paths: number[][][][] = []
    methods.forEach(({ method }) => {
      const routeCoords = routes?.[method].routes?.map((element: any) => {
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

  const allMethodPassedZones = useMemo(() => allMethodsRouteCoords.map(((routeCoords: any) => routeCoords?.map((r: any) => lineString(r))
    .map((route: any) => busyness.features?.filter((feature: any) =>
    booleanIntersects(feature, route))
  ))), [allMethodsRouteCoords, busyness])

  const greenScoreforEachRoute = useMemo(() => (allMethodPassedZones || []).map((methodRoutedata: any) => {
    return (
      methodRoutedata?.map((zones: any) => zones?.reduce((res: number, d: any) => {
        res = res + +d.properties.aqi + +d.properties.busyness
        return res
      }, 0))
  )}), [allMethodPassedZones])

  useEffect(() => {
    const fetchDirection = async () => {
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
      }
    };
    if (startCoords && destCoords) {
      fetchDirection()
    }
  }, [startCoords, destCoords])

  // console.log(routes)

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
    startLocationRef.current = startLocation;
}, [startLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    
    map.on('click', async (e) => {
      const { lng, lat } = e.lngLat;

      setClickPoints((prev) => {
        const newPoint: Feature<Point, GeoJsonProperties> = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [e.lngLat.lng, e.lngLat.lat],
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
      // const pt = point([lng, lat]);
      // const isInManhattan = booleanPointInPolygon(pt, manhattanPolygon);
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

          if (!startLocationRef.current) {
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
        // setIsInVaildPos(true)
      }
    });

  }, [])

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
    if (toggles.parks) {

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

    if (!busyness) {
      const fetchParks = async () => {
        try {
          const res = await fetch("/api/manhattan?data=busyness", { method: "POST" });
          const geojson = await res.json();
          if (geojson.features) {
            setBusyness(geojson);
          } else {
            console.error("Invalid busyness GeoJSON data");
          }
        } catch (error) {
          console.error("Failed to fetch busyness data:", error);
        }
      };
      fetchParks();
    }
    if (toggles.busyness) {

    }
  }, [toggles.busyness, busyness]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
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

    if (toggles.parks) {

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
  }
}, [navLineGeo]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    if (!airQualityData) {
      const fetchAirQuality = async () => {
        try {
          const res = await fetch("/api/manhattan?data=air-quality", { method: "POST" });
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
    if (toggles.air) {

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
              {isInValid && <div className="text-red-500 text-xs">Invaild position, the position is only available in Manhattan</div>}
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
          {routes && (
            <div className="flex flex-col gap-3">
              {methods.map(({ method, color, icon, iconAlert, mesg }, i) => {
                const paths = routes?.[method]?.routes
                const maxTime = paths.length > 1 ? maxBy(paths, (n: any) => n.legs?.[0].duration.value) : paths[0]?.legs?.[0].duration.text
                const minTime = paths.length > 1 && minBy(paths, (n: any) => n.legs?.[0].duration.value)
                const maxEmissions = co2Emissions(paths.length > 1 ? maxBy(paths, (n: any) => n.legs?.[0].distance.value).legs?.[0].distance.value : paths.legs?.[0].distance.value.legs?.[0].distance.value)
                const minEmissions = co2Emissions(paths.length > 1 && minBy(paths, (n: any) => n.legs?.[0].distance.value).legs?.[0].distance.value)
                const transitCO2Arr = method == "transit" && transitEmissions(paths)
                const isActive = tool?.method === method
                
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
                    className={`py-2 px-3 rounded-lg cursor-pointer transition-all duration-250ms`}
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
                          {method === 'driving' ? (
                            `${minEmissions} - ${maxEmissions}`
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
          )}
          {tool && (
            <div className="flex justify-between mt-2">
              <button
                className="text-white hover:bg-[#0AAC82] focus:bg-[#0AAC82] disabled:bg-[#0FD892]"
                style={{
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

              <Button onClick={() => setOpen(true)}>
                Show Directions
              </Button>
            </div>
          )}
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