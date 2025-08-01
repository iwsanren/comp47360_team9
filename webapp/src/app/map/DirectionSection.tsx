'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { max, range, uniq } from 'lodash';
import { FaLocationArrow } from 'react-icons/fa6';
import { HiOutlineSwitchVertical, HiLocationMarker } from 'react-icons/hi';
import { point } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import mapboxgl from 'mapbox-gl';
import { Feature, Point, GeoJsonProperties } from 'geojson';

import Heading from '@/components/Heading';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Input from '@/components/Input';
import Info from '@/components/Info';
import Toggle from '@/components/Toggle';
import getFormattedDurationRange from '@/utils/getFormattedDurationRange';
import calculateTreesNeededPerDay from '@/utils/calculateTreesNeededPerDay';
import getNextHourInNY from '@/utils/getNextHourInNY';
import fetchData from '@/utils/fetchData';
import { getMaxDistanceText } from '@/utils/getMaxDistanceText';
import { transitEmissions } from '@/utils/formula';
import { useMode } from '@/contexts/ModeProvider';
import { api, handleAPIError } from '@/utils/apiClient';

import { Coordinates, Toggles, TransportMethod } from './page';
import PredictionSection from './PredictionSection';

const key = 'busyness-prediction';

const clearPredictedBusynessLayer = (map: mapboxgl.Map | null) => {
  if (!map) return;
  if (map.getLayer(`${key}-layer`)) {
    map.removeLayer(`${key}-layer`);
    map.removeLayer(`${key}-border-layer`);
  }
  if (map.getSource(key)) {
    map.removeSource(key);
  }
};

const userInputs = [
  {
    placeholder: 'Start Location (Click on Map)',
    icon: FaLocationArrow,
    bg: 'bg-gray-700',
    size: 'text-sm lg:text-[1.25rem]',
  },
  {
    placeholder: 'Your Destination (Click on Map)',
    icon: HiLocationMarker,
    bg: 'bg-green-500',
    size: 'text-base lg:text-[1.375rem]',
  },
];

interface DirectionSectionProps {
  tool: any;
  methods: TransportMethod[];
  setTool: React.Dispatch<React.SetStateAction<any>>;
  routes: any;
  greenScoreforEachRoute: number[];
  map: mapboxgl.Map | null;
  featuresData: any;
  toggles: any;
  isPredictionMode: boolean;
  busynessLayerSetting: any;
  setFeatureData: any;
  setDirectionData: React.Dispatch<React.SetStateAction<any>>;
  setShowFilter: React.Dispatch<React.SetStateAction<boolean>>;
  setPredictionMode: React.Dispatch<React.SetStateAction<boolean>>;
  setNavigation: React.Dispatch<React.SetStateAction<any>>;
  setToggles: React.Dispatch<React.SetStateAction<Toggles>>;
  setOpen: React.Dispatch<React.SetStateAction<boolean | undefined>>;
}

const DirectionSection = ({
  tool,
  methods,
  setTool,
  routes,
  greenScoreforEachRoute,
  map,
  featuresData,
  toggles,
  isPredictionMode,
  busynessLayerSetting,
  setDirectionData,
  setFeatureData,
  setShowFilter,
  setPredictionMode,
  setNavigation,
  setToggles,
  setOpen,
}: DirectionSectionProps) => {
  const { mode } = useMode();
  const [isInValid, setIsInVaildPos] = useState<boolean>();
  const [startLocation, setStartLocation] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [startCoords, setStartCoords] = useState<Coordinates | null>(null);
  const [destCoords, setDestCoords] = useState<Coordinates | null>(null);
  const [clickPoints, setClickPoints] = useState<
    Feature<Point, GeoJsonProperties>[]
  >([]);
  const [timestamp, setTime] = useState(getNextHourInNY());
  const [isLoading, setIsLoading] = useState<boolean>();
  const [isLoadingPrediction, setIsLoadingPrediction] = useState<boolean>();

  const handleLocationSelect = async (
    lng: number,
    lat: number,
    index?: number
  ) => {
    const pt = point([lng, lat]);
    const isInManhattan = featuresData.busyness.features.some((region: any) =>
      booleanPointInPolygon(pt, region)
    );

    if (!isInManhattan) {
      setIsInVaildPos(true);
      return false;
    }

    setIsInVaildPos(false);

    setClickPoints(prev => {
      const newPoint: Feature<Point, GeoJsonProperties> = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        properties: {
          icon: prev.length === 0 || index === 0 ? 'start-icon' : 'dest-icon',
        },
      };

      if (typeof index === 'number') {
        prev[index] = newPoint;
        return [...prev];
      }

      return prev.length >= 2 ? [newPoint] : [...prev, newPoint];
    });

    return true;
  };

  useEffect(() => {
    if (startCoords && destCoords) {
      if (isPredictionMode) {
        handleShowPrediction();
      } else {
        fetchDirection();
      }
    }
  }, [isPredictionMode, startCoords, destCoords]);

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
              limit: '1',
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
        console.error('Failed to reverse geocode:', error);
      }
    };

    if (
      featuresData.busyness &&
      clickPoints.length != 2 &&
      !toggles.bikes &&
      !toggles.parks &&
      !toggles.evStations
    ) {
      map.on('click', handleClick);
    }

    return () => {
      map.off('click', handleClick);
    };
  }, [
    featuresData.busyness,
    clickPoints,
    startCoords,
    destCoords,
    toggles.bikes,
    toggles.parks,
    toggles.evStations,
    map,
  ]);

  const getGeocode = (
    value: string
  ): Promise<{ lat: number; lon: number; display_name: string } | null> => {
    return fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        value
      )}&viewbox=-74.03,40.88,-73.91,40.68&bounded=1&countrycodes=us`,
      {
        headers: {
          'User-Agent': 'Manhattan My Way',
        },
      }
    )
      .then(res => res.json())
      .then(data => {
        if (data.length === 0) return null;
        const { lat, lon, display_name } = data[0];
        return { lat: parseFloat(lat), lon: parseFloat(lon), display_name };
      })
      .catch(err => {
        console.error('Geocoding failed:', err);
        return null;
      });
  };

  const handleGeocode = async () => {
    try {
      setIsLoading(true);
      const [startResult, destResult] = await Promise.all([
        getGeocode(startLocation),
        getGeocode(destination),
      ]);

      if (startResult && destResult) {
        const isStartValid = await handleLocationSelect(
          startResult.lon,
          startResult.lat,
          0
        );

        if (!isStartValid) return;

        const isDestValid = await handleLocationSelect(
          destResult.lon,
          destResult.lat,
          1
        );

        if (isStartValid && isDestValid) {
          setStartCoords({ lat: startResult.lat, lng: startResult.lon });
          setDestCoords({ lat: destResult.lat, lng: destResult.lon });
        }
        return true;
      } else {
        setIsInVaildPos(true);
        return false;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // add start point and dest point icon
  useEffect(() => {
    if (!map) return;

    const addClickPoints = () => {
      if (clickPoints.length === 0) {
        if (map.getLayer('click-points-layer')) {
          map.removeLayer('click-points-layer');
        }
        if (map.getSource('click-points')) {
          map.removeSource('click-points');
        }
        return;
      }
      if (!map.getSource('click-points')) {
        map.addSource('click-points', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: clickPoints,
          },
        });

        map.addLayer({
          id: 'click-points-layer',
          type: 'symbol',
          source: 'click-points',
          layout: {
            'icon-image': ['get', 'icon'],
            'icon-size': 0.33,
            'icon-allow-overlap': true,
          },
        });

        map.moveLayer('click-points-layer');
      } else {
        const source = map.getSource('click-points') as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData({
            type: 'FeatureCollection',
            features: clickPoints,
          });
        }
        // prevent layer from being covered
        if (map.getLayer('click-points-layer')) {
          map.moveLayer('click-points-layer');
        }
      }
    };

    if (!map?.isStyleLoaded()) {
      map?.once('style.load', addClickPoints);
    } else {
      addClickPoints();
    }

    return () => {
      map?.off('load', addClickPoints);
    };
  }, [clickPoints, map]);

  const isDisabled = useMemo(
    () => isLoading || isLoadingPrediction,
    [isLoading, isLoadingPrediction]
  );

  const fetchDirection = async () => {
    setIsLoading(true);
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
      console.error('Failed to fetch direction', errorInfo);
      // Can add user notification logic here
      // toast.error(errorInfo.userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowPrediction = async () => {
    if (!map) return;
    setIsLoadingPrediction(true);
    fetchDirection();
    setFeatureData((prev: any) => ({ ...prev, predictedBusyness: false }));
    try {
      const predictedBusyness = await fetchData(
        `/api/manhattan?timestamp=${timestamp}`
      );
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
            type: 'geojson',
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
            'line-width': 1.5,
          },
        });
      }
      // Show the layer after data is loaded
    } catch (err) {
      console.error('Prediction load failed:', err);
    } finally {
      // Always turn off loading state
      if (map.getLayer('click-points-layer')) {
        map.moveLayer('click-points-layer');
      }
      setIsLoadingPrediction(false);
    }
  };

  const handleClear = () => {
    setStartLocation('');
    setDestination('');
    setStartCoords(null);
    setDestCoords(null);
    setDirectionData(null);
    setClickPoints([]);
    setTool('');
    setNavigation(undefined);
    setFeatureData((prev: any) => ({ ...prev, predictedBusyness: false }));
    clearPredictedBusynessLayer(map);
  };

  return (
    <div className="flex flex-col gap-4 lg:gap-3">
      <div className="flex justify-between items-center mb-4 ">
        <Heading className="text-green-800" level={2}>
          {isPredictionMode ? 'Plan a Future Trip' : 'Plan a Trip Now'}
        </Heading>
        <Toggle
          isDisabled={isDisabled}
          onClick={() => {
            clearPredictedBusynessLayer(map);
            setPredictionMode(prev => !prev);
            handleClear();
            setShowFilter(false);
            setToggles((prev: any) => {
              const newToggles = Object.fromEntries(
                Object.keys(prev).map(key => [key, false])
              ) as unknown as Toggles;

              return newToggles;
            });
          }}
          isActive={isPredictionMode}
        >
          <div className="absolute text-center top-full right-0 lg:left-[50%] lg:-translate-x-1/2 translate-y-2 w-30 py-1 px-2 text-sm/[21px] bg-white rounded-sm drop-shadow-lg">
            {isPredictionMode ? 'Plan a trip now' : 'Plan a future trip'}
          </div>
        </Toggle>
      </div>
      {isPredictionMode && (
        <PredictionSection
          setTime={setTime}
          timestamp={timestamp}
          layerName={key}
          map={map}
          busynessLayerSetting={busynessLayerSetting}
          setFeatureData={setFeatureData}
        />
      )}
      <div className="flex gap-3 items-center pr-[6px] lg:pr-4">
        <div className="relative flex-1 flex flex-col gap-3">
          <div className="flex flex-col gap-1 absolute top-[50%] left-2 lg:left-[14px] -translate-y-1/2">
            {range(3).map(num => (
              <div className="w-1 h-1 bg-gray-500 rounded-full" key={num} />
            ))}
          </div>
          {userInputs.map((userInput, i) => (
            <div
              className="flex items-center gap-3"
              key={userInput.placeholder}
            >
              <div
                className={`flex items-center justify-center w-5 h-5 lg:w-8 lg:h-8 ${userInput.bg} rounded-full`}
              >
                <Icon
                  icon={userInput.icon}
                  className={`${userInput.size} text-white`}
                />
              </div>
              <Input
                className="flex-1 lg:w-[330px]"
                placeholder={userInput.placeholder}
                value={i ? destination : startLocation}
                onChange={e => {
                  if (i) {
                    setDestination(e.target.value);
                  } else {
                    setStartLocation(e.target.value);
                  }
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
          {routes && !tool && !isDisabled && (
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
      {isDisabled ? (
        <div className="py-3">Loading...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {methods.map(
            (
              { method, color, blindColor, icon, iconAlert, mesg, info, co2 },
              i,
              { length }
            ) => {
              const paths = routes?.[method]?.routes;
              const transitCO2Arr = uniq(transitEmissions(paths));
              const isActive = tool?.method === method;
              const currentColor = mode ? blindColor : color;
              return (
                paths?.length > 0 && (
                  <div
                    style={{
                      background: isActive ? currentColor : 'white',
                      color: isActive ? 'white' : currentColor,
                      zIndex: length - i,
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
                        <div
                          className={`flex flex-col lg:flex-row lg:gap-1 text-sm text-${
                            isActive ? 'white' : 'black'
                          }`}
                        >
                          <p>{getFormattedDurationRange(paths)}</p>
                          <p>(~{getMaxDistanceText(paths)}les)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-[8.875rem]">
                        <Icon
                          icon={iconAlert}
                          className={'inherit'}
                          size="1.25rem"
                        />
                        <div>
                          <div className={`font-bold inline-block relative`}>
                            {transitCO2Arr.join(' - ')}
                            {' kg CO₂'}
                            {info && (
                              <Info
                                currentColor={currentColor}
                                isActive={isActive}
                              >
                                {info}
                              </Info>
                            )}
                          </div>
                          <div className="text-xs/[1.5]">{mesg}</div>
                        </div>
                      </div>
                    </div>
                    {co2 && (
                      <p
                        className="font-bold text-xs lg:text-sm mt-1"
                        style={{ color: isActive ? 'white' : currentColor }}
                      >
                        Generates as much CO2 as{' '}
                        {calculateTreesNeededPerDay(max(transitCO2Arr))} urban
                        trees absorb in a day.
                      </p>
                    )}
                  </div>
                )
              );
            }
          )}
        </div>
      )}
      <div className="flex justify-between">
        <Button onClick={handleClear}>Clear</Button>
        {isPredictionMode && !featuresData.predictedBusyness && !isDisabled && (
          <Button onClick={handleGeocode}>Get Prediction</Button>
        )}
        {!isPredictionMode && !routes && (
          <Button isDisabled={isDisabled} onClick={handleGeocode}>
            Show Transit Options
          </Button>
        )}
        {routes && !isDisabled && (
          <Button isDisabled={!tool} onClick={() => setOpen(true)}>
            Show Directions
          </Button>
        )}
      </div>
    </div>
  );
};

export default DirectionSection;
