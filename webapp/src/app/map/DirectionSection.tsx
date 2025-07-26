"use client";

import React, { useEffect, useState } from 'react';
import { max, maxBy, minBy, range, uniq } from 'lodash';
import { FaLocationArrow } from 'react-icons/fa6';
import { HiOutlineSwitchVertical, HiLocationMarker } from 'react-icons/hi';
import { point } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import mapboxgl from "mapbox-gl";
import { Feature, Point, GeoJsonProperties } from 'geojson';

import Icon from '@/components/Icon';
import Input from '@/components/Input';
import Info from '@/components/Info';
import { co2Emissions, transitEmissions } from '@/utils/formula';
import formatMinutesToDecimalHour from '@/utils/formatMinutesToDecimalHour';
import calculateTreesNeededPerDay from '@/utils/calculateTreesNeededPerDay';
import { useMode } from "@/contexts/ModeProvider";

import { Coordinates, TransportMethod } from './page';


const userInputs = [
  {
    placeholder: 'Start Location (Click on Map)',
    icon: FaLocationArrow,
    bg: 'bg-gray-700',
    size: 'text-sm lg:text-[1.25rem]'
  },
  {
    placeholder: 'Your Destination (Click on Map)',
    icon: HiLocationMarker,
    bg: 'bg-green-500',
    size: 'text-base lg:text-[1.375rem]'
  },
]

interface DirectionSectionProps {
  setClickPoints: React.Dispatch<React.SetStateAction<any[]>>;
  setStartLocation: React.Dispatch<React.SetStateAction<string>>;
  setStartCoords: React.Dispatch<React.SetStateAction<Coordinates | null>>;
  setDestCoords: React.Dispatch<React.SetStateAction<Coordinates | null>>;
  destCoords: Coordinates | null;
  startLocation: string;
  startCoords: Coordinates | null;
  setDestination: React.Dispatch<React.SetStateAction<string>>;
  destination: string;
  isLoadingDirection: boolean | undefined;
  tool: any;
  methods: TransportMethod[];
  setTool: React.Dispatch<React.SetStateAction<any>>;
  routes: any;
  greenScoreforEachRoute: number[];
  map: mapboxgl.Map | null;
  featuresData: any;
  clickPoints: Feature<Point, GeoJsonProperties>[];
  toggles: any;
}

const DirectionSection = ({
  setClickPoints,
  clickPoints,
  setStartLocation,
  startLocation,
  setStartCoords,
  startCoords,
  setDestCoords,
  destCoords,
  setDestination,
  destination,
  isLoadingDirection,
  tool,
  methods,
  setTool,
  routes,
  greenScoreforEachRoute,
  map,
  featuresData,
  toggles,
}: DirectionSectionProps) => {
  const { mode } = useMode();
  const [isInValid, setIsInVaildPos] = useState<boolean>();

 const handleLocationSelect = async (lng: number, lat: number, index?: number) => {
  const pt = point([lng, lat]);
  const isInManhattan = featuresData.busyness.features.some((region: any) =>
    booleanPointInPolygon(pt, region)
  );

  if (!isInManhattan) {
    setIsInVaildPos(true);
    return false
  }

  setIsInVaildPos(false);

  setClickPoints((prev) => {
    const newPoint: Feature<Point, GeoJsonProperties> = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [lng, lat],
      },
      properties: {
        icon: (prev.length === 0 || index === 0) ? "start-icon" : "dest-icon",
      },
    };

    if (typeof index === 'number') {
      prev[index] = newPoint
      return [...prev]
    }

    return prev.length >= 2 ? [newPoint] : [...prev, newPoint];
  });

  return true
};

  // click on map
  useEffect(() => {
    if (!map) return;
    
    const handleClick = async (e: any) => {
      const { lng, lat } = e.lngLat;
      const isValid = await handleLocationSelect(lng, lat);

      if (!isValid) return;
      
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?` +
          new URLSearchParams({
            access_token: mapboxgl.accessToken!,
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
      
    };

    if (featuresData.busyness && clickPoints.length != 2 && !toggles.bikes && !toggles.parks && !toggles.evStations) {
      map.on('click', handleClick);
    }

    return () => {
      map.off('click', handleClick);
    };

  }, [featuresData.busyness, clickPoints, startCoords, destCoords, toggles.bikes, toggles.parks, toggles.evStations, map])

  const handleGeocode = async (index: number, value: string) => {
    if (index) {
      setDestination(value)
    } else {
      setStartLocation(value)
    }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&viewbox=-74.03,40.88,-73.91,40.68&bounded=1&countrycodes=us`, {
        headers: {
          'User-Agent': 'Manhattan My Way',
        },
      });

      const data = await res.json();

      if (data.length === 0) {
      } else {
        const { lon: lng, lat } = data[0];
        console.log(lng, lat)
        const isValid = await handleLocationSelect(lng, lat, index)
        if (isValid) {
          if (index) {
            setDestCoords({ lat, lng });
          } else {
            setStartCoords({ lat, lng });
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // add start point and dest point icon
  useEffect(() => {
    if (!map) return;

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
  }, [clickPoints, map]);

  return (
    <div className="flex flex-col gap-4 lg:gap-3">

      <div className="flex gap-3 items-center pr-[6px] lg:pr-4">
        <div className="relative flex-1 flex flex-col gap-3">
          <div className="flex flex-col gap-1 absolute top-[50%] left-2 lg:left-[14px] -translate-y-1/2">
            {range(3).map((num) => (
              <div className="w-1 h-1 bg-gray-500 rounded-full" key={num} />
            ))}
          </div>
          {userInputs.map((userInput, i) => (
            <div className="flex items-center gap-3" key={userInput.placeholder}>
              <div className={`flex items-center justify-center w-5 h-5 lg:w-8 lg:h-8 ${userInput.bg} rounded-full`}>
                <Icon icon={userInput.icon} className={`${userInput.size} text-white`} />
              </div>
              <Input
                className="flex-1 lg:w-[330px]"
                placeholder={userInput.placeholder}
                value={i ? destination : startLocation}
                onChange={(e) => {
                  handleGeocode(i, e.target.value)
                }}
                width="full"
              />
            </div>
          ))}
          {isInValid && (
            <div className="text-red-500 text-xs">
              Invalid position, the position is only available in Manhattan
            </div>
          )}
          {routes && !tool && !isLoadingDirection && (
            <p>Please select your preferred mode of transportation.</p>
          )}
        </div>
        <div
          onClick={() => {
            setClickPoints(prev => {
              if (prev.length !== 2) return prev;
              const [first, second] = prev;
              const updated = [
                { ...first, properties: { icon: second.properties?.icon } },
                { ...second, properties: { icon: first.properties?.icon } },
              ];
              return updated;
            });
            const temp = startLocation;
            setStartLocation(destination);
            setDestination(temp);
            const tempCoords = startCoords;
            setStartCoords(destCoords);
            setDestCoords(tempCoords);
          }}
        >
          <Icon
            className="cursor-pointer"
            icon={HiOutlineSwitchVertical}
            size="1.5em"
          />
        </div>
      </div>
      {startCoords &&
        destCoords &&
        (isLoadingDirection ? (
          <div className="py-3">Loading...</div>
        ) : (
          <div className="flex flex-col gap-3">
            {methods.map(({ method, color, blindColor, icon, iconAlert, mesg, info, co2 }, i, { length }) => {
              const paths = routes?.[method]?.routes;
              const maxTime =
                paths?.length > 1
                  ? maxBy(paths, (n: any) => n.legs?.[0].duration.value)
                  : paths?.[0]?.legs?.[0].duration.text;
              const minTime =
                paths?.length > 1 &&
                minBy(paths, (n: any) => n.legs?.[0].duration.value);
              const maxEmissions = co2Emissions(
                paths?.length > 1
                  ? maxBy(paths, (n: any) => n.legs?.[0].distance.value)
                      .legs?.[0].distance.value
                  : paths?.[0]?.legs?.[0]?.distance?.value
              );
              const minEmissions = co2Emissions(
                paths?.length > 1 &&
                  minBy(paths, (n: any) => n.legs?.[0].distance.value).legs?.[0]
                    .distance.value
              );
              const transitCO2Arr =
                method == 'transit' ? uniq(transitEmissions(paths)) : undefined
              const isActive = tool?.method === method;
              const isEqual = minEmissions == maxEmissions;
              const currentColor = mode ? blindColor : color
              return paths?.length > 0 && (
                <div
                  style={{
                      background: isActive ? currentColor : 'white',
                      color: isActive ? 'white' : currentColor,
                      zIndex: length - i
                    }}
                    className={`drop-shadow-lg py-2 px-3 rounded-lg cursor-pointer transition-all duration-250`}
                    onClick={() =>
                      setTool({
                        method,
                        icon,
                        greenScores: greenScoreforEachRoute[i],
                        paths,
                      })
                    }
                  key={i}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 lg:gap-[10px] items-center">
                      <Icon icon={icon} className={'inherit'} size="1.5rem" />
                      <p
                        className={`text-sm text-${isActive ? 'white' : 'black'}`}
                      >
                        {paths?.length > 1
                          ? formatMinutesToDecimalHour(
                              Math.floor(minTime?.legs?.[0].duration.value / 60),
                              Math.floor(maxTime?.legs?.[0].duration.value / 60)
                            )
                          : maxTime}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 w-[8.875rem]">
                      <Icon icon={iconAlert} className={'inherit'} size="1.25rem" />
                      <div>
                        <div className={`font-bold inline-block relative`}>
                          {method === 'driving'
                            ? minEmissions
                              ? isEqual
                                ? minEmissions
                                : `${minEmissions} - ${maxEmissions}`
                              : maxEmissions
                            : transitCO2Arr
                            ? transitCO2Arr.join(' - ')
                            : 0}{' '}
                          kg CO₂
                          {info && (
                            <Info currentColor={currentColor} isActive={isActive}>
                              {info}
                            </Info>
                          )}
                        </div>
                        <div className="text-xs/[1.5]">{mesg}</div>
                      </div>
                    </div>
                  </div>
                {co2 && <p className='font-bold text-xs lg:text-sm mt-1' style={{ color: isActive ? 'white' : currentColor }}>Generates as much CO2 as {calculateTreesNeededPerDay(max(transitCO2Arr) ?? maxEmissions)} urban trees absorb in a day.</p>}
                </div>
              );
            })}
          </div>
        ))}
    </div>
  );
};

export default DirectionSection;
