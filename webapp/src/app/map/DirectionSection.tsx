import React from 'react';
import Image from 'next/image';
import { maxBy, minBy, uniq } from 'lodash';
import { HiOutlineSwitchVertical } from 'react-icons/hi';

import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Input from '@/components/Input';
import startEndIcon from '@/assets/images/start_end_icon.png';
import { co2Emissions, transitEmissions } from '@/utils/formula';

import { Coordinates, TransportMethod } from './page';

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
  handleClear: () => void;
  tool: any;
  setOpen: React.Dispatch<React.SetStateAction<boolean | undefined>>;
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
  handleClear,
  tool,
  setOpen,
  methods,
  setTool,
  routes,
  greenScoreforEachRoute,
  isInValid,
}: DirectionSectionProps) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3 items-center pr-4">
        <Image
          src={startEndIcon}
          alt="Start and End Icon"
          width={32}
          height={100}
        />
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
          {isInValid && (
            <div className="text-red-500 text-xs">
              Invaild position, the position is only available in Manhattan
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
            {methods.map(({ method, color, icon, iconAlert, mesg }, i) => {
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
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: isActive ? color : 'white',
                    boxShadow: '0px 2px 4px 0px #00000040',
                    color: isActive ? 'white' : color,
                  }}
                  className={`py-2 px-3 rounded-lg cursor-pointer transition-all duration-250`}
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
                    <Icon icon={icon} className="inherit" size="1.5rem" />
                    <p
                      className={`text-sm text-${isActive ? 'white' : 'black'}`}
                    >
                      {paths?.length > 1
                        ? Math.floor(minTime?.legs?.[0].duration.value / 60) +
                          ' - ' +
                          Math.floor(maxTime?.legs?.[0].duration.value / 60) +
                          ' mins'
                        : maxTime}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-[8.875rem]">
                    <Icon icon={iconAlert} className="inherit" size="1.25rem" />
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
      <div className="flex justify-between mt-2">
        <Button onClick={handleClear}>Clear</Button>
        {tool && <Button onClick={() => setOpen(true)}>Show Directions</Button>}
      </div>
    </div>
  );
};

export default DirectionSection;
