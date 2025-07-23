"use client";

import React from 'react';
import { maxBy, minBy, range, uniq } from 'lodash';
import { FaLocationArrow } from 'react-icons/fa6';
import { HiOutlineSwitchVertical, HiLocationMarker } from 'react-icons/hi';

import Icon from '@/components/Icon';
import Input from '@/components/Input';
import { co2Emissions, transitEmissions } from '@/utils/formula';
import formatMinutesToDecimalHour from '@/utils/formatMinutesToDecimalHour';
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
  isInValid: boolean | undefined;
}

const DirectionSection = ({
  setClickPoints,
  setStartLocation,
  setStartCoords,
  setDestCoords,
  destCoords,
  startLocation,
  startCoords,
  setDestination,
  destination,
  isLoadingDirection,
  tool,
  methods,
  setTool,
  routes,
  greenScoreforEachRoute,
  isInValid,
}: DirectionSectionProps) => {
  const { mode } = useMode();
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
                disabled={true}
                placeholder={userInput.placeholder}
                value={i ? destination : startLocation}
                width="full"
              />
            </div>
          ))}
          {isInValid && (
            <div className="text-red-500 text-xs">
              Invalid position, the position is only available in Manhattan
            </div>
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
            {methods.map(({ method, color, blindColor, icon, iconAlert, mesg }, i) => {
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
                method == 'transit' && uniq(transitEmissions(paths));
              const isActive = tool?.method === method;
              const isEqual = minEmissions == maxEmissions;
              return paths?.length > 0 && (
                <div
                  style={{
                    background: isActive ? (mode ? blindColor : color) : 'white',
                    color: isActive ? 'white' : (mode ? blindColor : color),
                  }}
                  className={`flex justify-between items-center drop-shadow-lg py-2 px-3 rounded-lg cursor-pointer transition-all duration-250`}
                  onClick={() =>
                    setTool({
                      method,
                      greenScores: greenScoreforEachRoute[i],
                      paths,
                    })
                  }
                  key={i}
                >
                  <div className="flex gap-[10px] items-center">
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
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <span className={`font-bold`}>
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
                      </span>
                      <span className="text-xs leading-[1.5]">{mesg}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
    </div>
  );
};

export default DirectionSection;
