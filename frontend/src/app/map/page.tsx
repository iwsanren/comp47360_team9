"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import Image from "next/image";
import startEndIcon from "@/assets/images/start_end_icon.png";
import switchStartEndIcon from "@/assets/images/switch_start_end_icon.png";
import { WEATHER_CONDITION_ICONS } from '@/constants/icons';
import Icon from '@/components/Icon';
import Header from "@/components/Header";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "";

interface Toggles {
  parks: boolean;
  ev: boolean;
  bikes: boolean;
  busyness: boolean;
  air: boolean;
}

export default function Map() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [manhattanTime, setManhattanTime] = useState<string>("");
  const [toggles, setToggles] = useState<Toggles>({
    parks: false,
    ev: false,
    bikes: false,
    busyness: false,
    air: false,
  });
  const [startLocation, setStartLocation] = useState<string>("");
  const [destination, setDestination] = useState<string>("");

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-73.994167, 40.728333],
      zoom: 12,
    });

    map.on("load", () => {
      map.setPaintProperty("road-motorway-trunk", "line-color", "#ccd5ae");
      map.setPaintProperty("road-primary", "line-color", "#5a9367");
      map.setPaintProperty("road-secondary-tertiary", "line-color", "#99c49a");
      map.setPaintProperty("road-street", "line-color", "#99c49a");
      map.setPaintProperty("road-minor", "line-color", "#99c49a");

      map.setPaintProperty("building", "fill-color", "#b5e48c");
      map.setPaintProperty("building", "fill-opacity", 1);
      map.setPaintProperty("building-outline", "line-color", "#76c893");

      map.setPaintProperty("settlement-label", "text-color", [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        "#40916c",
        "#2b9348"
      ]);
      map.setPaintProperty("state-label", "text-color", [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        "#40916c",
        "#2b9348"
      ]);
      map.setPaintProperty("country-label", "text-color", [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        "#40916c",
        "#2b9348"
      ]);
    });

    return () => map.remove();
  }, []);

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

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = `${now.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
        weekday: "long",
        timeZone: "America/New_York",
      })} ${now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "America/New_York",
      })}`;
      setManhattanTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const current = weatherData?.current;
  const hourly = weatherData?.hourly?.list || [];

  const toggleNames = [
    { key: "parks", label: "Parks" },
    { key: "ev", label: "EV Charging" },
    { key: "bikes", label: "Bike Stations" },
    { key: "busyness", label: "Busyness" },
    { key: "air", label: "Air Quality" },
  ] as const;

  return (
    <div className="w-screen h-screen relative font-roboto bg-gray-100">
      <div ref={mapRef} className="absolute inset-0 z-0" />
      <Header />

      {/* Toggle Container */}
      <div
        className="absolute z-10 right-4 top-68 shadow-md"
        style={{
          width: 186,
          height: 172,
          padding: 8,
          borderRadius: 4,
          backgroundColor: "#00674CBF",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {toggleNames.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between text-white text-sm px-2">
            <span>{label}</span>
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
                  left: toggles[key] ? 8 : 28,
                  fontSize: toggles[key] ? 12 : 12,
                  color: toggles[key] ? "#0FD892" : "#A6A6A6",
                  fontWeight: "bold",
                }}
              >
                {toggles[key] ? "ON" : "OFF"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Side Panel */}
      <div
        className="absolute z-10 shadow-lg p-4"
        style={{ width: 474, height: 683, top: 58, left: 16, borderRadius: 20, backgroundColor: "#FFFFFF", position: "relative" }}
      >
        <h2 className="mb-4 font-bold text-[30px] leading-[32px] text-[#00674C]">Get Directions</h2>
        <div className="flex gap-2 relative">
          <div className="flex flex-col items-center pt-3">
            <Image src={startEndIcon} alt="Start and End Icon" width={32} height={100} />
          </div>
          <div className="flex flex-col gap-2 relative">
            <input
              type="text"
              placeholder="Start Location"
              className="rounded-sm"
              style={{
                width: 330,
                height: 59,
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
              className="rounded-sm"
              style={{
                width: 330,
                height: 59,
                backgroundColor: "#F1F5F7",
                padding: "16px 24px",
                border: "none",
                outline: "none",
              }}
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            <div
              className="absolute"
              style={{
                right: "-34px",
                top: "50%",
                transform: "translateY(-50%)",
              }}
            >
              <Image
                src={switchStartEndIcon}
                alt="Switch Icon"
                width={24}
                height={24}
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>
        <button
          className="text-white opacity-50 mt-4"
          style={{
            width: 180,
            height: 43,
            borderRadius: 4,
            padding: "8px 24px",
            backgroundColor: startLocation && destination ? "#0AAC82" : "#0FD892",
          }}
        >
          Show Directions
        </button>
        {/* Weather Card at the bottom of Side Panel */}
        <div
          className="px-6 py-4"
          style={{
            width: 474,
            height: 118,
            backgroundColor: "#E9F8F3",
            borderBottomRightRadius: "20px",
            borderBottomLeftRadius: "20px",
            position: "absolute",
            bottom: 0,
            left: 0,
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
                onClick={() => setShowModal(true)}
                style={{
                  width: 119,
                  height: 43,
                  borderRadius: "4px",
                  padding: "8px 24px",
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

      {/* Forecast Modal */}
      {showModal && (
        <div
          className="absolute shadow-xl py-6 px-8 overflow-y-auto z-30"
          style={{
            width: 630,
            height: 600,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: "#E0EEE9",
            borderRadius: 8,
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-700">{manhattanTime}</p>
            <button
              onClick={() => setShowModal(false)}
              className="text-xl text-gray-600 hover:text-black"
            >
              ✕
            </button>
          </div>
          {current && (
            <div className="flex items-center gap-4 mb-4">
              <Icon size="3.75rem" icon={WEATHER_CONDITION_ICONS[current.weather[0].icon]} />
              <h1 className="text-4xl font-bold">
                {current.main.temp.toFixed(1)}°F
              </h1>
              <div className="ml-auto text-right text-gray-700 text-sm">
                <p>Humidity: {current.main.humidity}%</p>
                <p>Wind: {current.wind.speed} miles/h</p>
                <p>Feel like: {current.main.feels_like.toFixed(1)}°F</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-6 gap-[10px]">
            {hourly.slice(0, 18).map((hour: any, idx: number) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow-md text-center relative"
              >
                <div className="flex flex-col gap-[10px] py-[12px]">
                  <Icon className="mx-auto" size="2.5rem" icon={WEATHER_CONDITION_ICONS[hour.weather[0].icon]} />
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 18,
                      lineHeight: 1.5,
                      letterSpacing: 0,
                      color: "#000000",
                      textAlign: 'center'
                    }}
                  >
                    {hour.main.temp.toFixed(1)}°F
                  </div>
                </div>
                <p
                  className="text-sm text-white w-full px-[12px] py-[6px]"
                  style={{
                    backgroundColor: "#0FD892",
                  }}
                >
                  {new Date(hour.dt * 1000).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                    timeZone: "America/New_York",
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}