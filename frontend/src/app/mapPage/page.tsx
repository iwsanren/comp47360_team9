"use client"; // If using Next.js App Router

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

// Replace with your real API key
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || "";

export default function Home() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    console.log("hello bro", mapContainerRef);
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-73.97, 40.78], // Central Park, Manhattan
      zoom: 12,
    });

    return () => map.remove();
  }, []);

  return (
    <div className="w-screen h-screen relative font-sans">
      {/* Header */}
      <div className="absolute top-0 left-0 w-full h-14 bg-[#00b386] text-white flex items-center px-4 justify-between z-20">
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

        <div className="mb-2">
          <input
            type="text"
            placeholder="Start Location"
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
          />
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter Your Destination"
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
          />
        </div>

        <button className="bg-[#00b386] text-white px-4 py-2 rounded">
          Get Directions
        </button>

        <div className="mt-70 p-4 bg-green-50 rounded">
          <p className="text-sm text-gray-500">Current Weather</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-3xl font-bold">64.4°F</span>
            <button className="bg-[#00b386] text-white px-3 py-1 rounded">
              Forecast
            </button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* Show Crowded Areas Button */}
      <div className="absolute top-4 right-4 z-10">
        <button className="bg-white text-green-700 font-medium px-3 py-1 rounded shadow">
          Show crowded areas
        </button>
      </div>
    </div>
  );
}
