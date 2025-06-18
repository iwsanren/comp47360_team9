"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "";

export default function Home() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [manhattanTime, setManhattanTime] = useState<string>("");

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-73.994167, 40.728333], // Manhattan
      zoom: 12,
    });

    return () => map.remove();
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch("/api/weather", {
          method: "POST",
        });
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

  return (
    <div className="w-screen h-screen relative font-sans bg-gray-100">
      {/* Map */}
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* Header */}
      <div className="absolute top-0 left-0 w-full h-14 bg-[#00b386] text-white flex items-center px-4 z-20">
        <div className="font-bold text-lg">🌐 LUNA</div>
      </div>

      {/* Side Panel */}
      <div
        className="absolute z-10 bg-white rounded-lg shadow-lg p-4"
        style={{ width: 474, height: 610, top: 80, left: 16 }}
      >
        <h2 className="text-2xl font-semibold text-green-800 mb-4">
          Get Directions
        </h2>

        <input
          type="text"
          placeholder="Start Location"
          className="w-full border mb-2 px-3 py-2 rounded bg-gray-100"
        />
        <input
          type="text"
          placeholder="Enter Your Destination"
          className="w-full border mb-4 px-3 py-2 rounded bg-gray-100"
        />

        <button className="bg-[#00b386] text-white px-4 py-2 rounded w-full">
          Get Directions
        </button>

        {/* Weather Card */}
        <div className="mt-65 p-4 bg-green-50 rounded">
          <p className="text-sm text-gray-500">Current Weather</p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {current ? (
                <>
                  <img
                    src={`https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`}
                    alt="weather icon"
                    className="w-10 h-10"
                  />
                  <span className="text-3xl font-bold">
                    {current.main.temp.toFixed(1)}°F
                  </span>
                </>
              ) : (
                <span>Loading...</span>
              )}
            </div>

            {/* Tooltip Wrapper */}
            <div className="relative group inline-block">
              <button
                onClick={() => setShowModal(true)}
                className="bg-[#00b386] text-white px-3 py-1 rounded"
              >
                Forecast
              </button>
              {/* Custom Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-[#00b386] text-white text-sm rounded py-1 px-2 z-50 whitespace-nowrap shadow-md">
                ☁️ Clouds are gossiping again... 👀
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green rotate-45"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forecast Modal */}
      {showModal && (
        <div className="absolute top-16 left-1/4 z-30 bg-green-50 rounded-lg shadow-xl p-6 w-[630px] h-[520px] overflow-y-auto">
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
              <img
                src={`https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png`}
                alt="weather"
                className="w-14 h-14"
              />
              <h1 className="text-4xl font-bold">
                {current.main.temp.toFixed(1)}°F
              </h1>
              <div className="ml-auto text-right text-gray-700 text-sm">
                <p>Humidity: {current.main.humidity}%</p>
                <p>Wind: {current.wind.speed} miles/h</p>
                <p>
                  Feel like: {current.main.feels_like.toFixed(1)}°F
                </p>
              </div>
            </div>
          )}

          {/* Hourly Forecast Cards */}
          <div className="grid grid-cols-6 gap-4">
            {hourly.slice(0, 18).map((hour: any, idx: number) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-2 shadow-md text-center"
              >
                <img
                  src={`https://openweathermap.org/img/wn/${hour.weather[0].icon}.png`}
                  alt="icon"
                  className="w-8 h-8 mx-auto"
                />
                <p className="font-semibold">
                  {hour.main.temp.toFixed(1)}°F
                </p>
                <p className="text-xs bg-[#00b386] text-white rounded mt-1 py-0.5">
                  {new Date(hour.dt * 1000).toLocaleTimeString("en-US", {
                    hour: "numeric",
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
