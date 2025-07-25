import React, { useEffect, useMemo } from 'react';
import { round, sortBy } from 'lodash';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';
import { IconType } from 'react-icons';
import Image from 'next/image';

import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Slide from '@/components/Slide';
import badge from '@/assets/images/green-badge.png';
import {
  co2Emissions,
  finalGreenScore,
  getTransitTypeCO2Emissions,
} from '@/utils/formula';

interface RouteStep {
  distance: {
    text: string;
    value: number;
  };
  html_instructions: string;
}

interface RouteLeg {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  steps: RouteStep[];
}

interface RoutePath {
  legs: RouteLeg[];
  overview_polyline: {
    points: string;
  };
  greenScore: number;
}

interface DirectionData {
  method: string;
  paths: RoutePath[];
  greenScores: number[];
  icon: IconType;
}

interface NavigationData {
  steps: RouteStep[];
  overview_polyline: {
    points: string;
  };
  key: number;
}

interface DirectionModalProps {
  data: DirectionData;
  setOpen: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  setNavigation: React.Dispatch<
    React.SetStateAction<NavigationData | undefined>
  >;
  navigation: NavigationData | undefined;
}

const DirectionModal = ({
  data,
  setOpen,
  setNavigation,
  navigation,
}: DirectionModalProps) => {
  const steps = useMemo(() => navigation?.steps, [navigation]);

  const greenScores = useMemo(() => {
    const scores = data.greenScores;
    if (data.method === 'driving') {
      return scores.map((score, i) => {
        return finalGreenScore(
          score +
            Math.min(
              1,
              co2Emissions(data.paths[i].legs[0].distance.value) / 5
            ) *
              0.5
        );
      });
    } else if (data.method === 'transit') {
      return scores.map((score, i) => {
        const emission = data?.paths[i]?.legs?.[0]?.steps?.reduce(
          (value: number, step: any) => {
            if (step?.travel_mode == 'TRANSIT') {
              value =
                value +
                getTransitTypeCO2Emissions(
                  step?.transit_details?.line?.vehicle?.type,
                  step?.distance?.value
                );
            }
            return round(value, 1);
          },
          0
        );
        return finalGreenScore(score + Math.min(1, emission / 5) * 0.5);
      });
    } else {
      return scores.map(score => finalGreenScore(score));
    }
  }, [data]);

  const routes = useMemo(
    () =>
      sortBy(
        data.paths.map((d, i) => ({
          ...d,
          greenScore: round(greenScores[i], 3),
        })),
        o => -o.greenScore
      ),
    [data, greenScores]
  );

  useEffect(() => {
    if (routes?.[0]) {
      setNavigation({
        steps: routes[0].legs?.[0]?.steps || [],
        overview_polyline: routes[0].overview_polyline,
        key: 0,
      });
    }
  }, [routes]);

  if (!data || !data.paths || data.paths.length === 0) {
    return null;
  }

  return (
    <div className="m-4 absolute left-0 right-0 top-0 bottom-0 rounded-lg bg-green-800 px-3 py-10 lg:m-0 lg:py-11 lg:px-8 overflow-scroll z-10">
      <button
        onClick={() => {
          setOpen(false);
          setNavigation(undefined);
        }}
        className="absolute right-[8px] top-[8px] cursor-pointer"
      >
        <Icon icon={IoMdClose} size="1.5rem" className="fill-white" />
      </button>
      <Slide>
        {routes.map(
          ({ legs, overview_polyline, greenScore }: RoutePath, i: number) => (
            <div className="pr-3 h-[100%]" key={i}>
              <button
                onClick={() =>
                  setNavigation({
                    steps: legs?.[0]?.steps || [],
                    overview_polyline,
                    key: i,
                  })
                }
                className={`w-full cursor-pointer py-2 px-3 lg:px-6 text-white h-[100%] ${
                  navigation?.key === i ? 'bg-green-500' : 'bg-green-900'
                } rounded-lg hover:bg-green-500 transition-all duration-250`}
              >
                <div className="flex gap-2 items-center justify-center">
                  {!i && (
                    <Image
                      className="w-8 h-8"
                      src={badge}
                      width={32}
                      height={32}
                      alt="badge-icon"
                    />
                  )}
                  <Text>Route {i + 1}</Text>
                </div>
                <p className="text-base/[1.5]">
                  {legs?.[0]?.distance?.text || 'N/A'} <br />{' '}
                  {legs?.[0]?.duration?.text || 'N/A'}
                </p>
                <div>Green score: {greenScore}</div>
              </button>
            </div>
          )
        )}
      </Slide>
      {steps && (
        <div className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <Icon icon={data.icon} size="1.5em" className="!text-white" />
            <Text className="text-white">Steps</Text>
          </div>
          {steps?.map(
            (
              { distance, html_instructions }: RouteStep,
              i: number,
              arr: RouteStep[]
            ) => (
              <div className="flex pb-5 gap-3 relative" key={i}>
                {i !== arr.length - 1 && (
                  <div className="absolute w-[2px] bg-green-700 left-[8.5px] lg:left-[10.5px] top-4 bottom-[-4px]" />
                )}
                {i === arr.length - 1 ? (
                  <Icon
                    icon={FaMapMarkerAlt}
                    className="text-green-300 text-xl lg:text-2xl"
                  />
                ) : (
                  <div
                    className={`relative ml-1 mt-1 w-3 h-3 lg:w-4 lg:h-4 rounded-full border-solid border border-green-700 ${
                      i ? 'bg-green-700' : 'bg-green-300'
                    }`}
                  />
                )}
                <div className="text-white flex-1">
                  <p className="text-base/[1.5] font-bold lg:text-lg/[1.5]">
                    {distance?.text || 'N/A'}
                  </p>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: html_instructions || '',
                    }}
                  />
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default DirectionModal;
