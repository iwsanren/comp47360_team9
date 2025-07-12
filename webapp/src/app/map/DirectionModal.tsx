import React, { useEffect, useMemo } from "react";
import { indexOf, min, minBy } from "lodash";
import { FaMapMarkerAlt } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import Image from "next/image";
import Icon from "@/components/Icon";
import Text from "@/components/Text";
import Slide from "@/components/Slide";

import badge from "@/assets/images/green-badge.png";

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
}

interface DirectionData {
  method: string;
  paths: RoutePath[];
  greenScores: number[];
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
  setNavigation: React.Dispatch<React.SetStateAction<NavigationData | undefined>>;
  navigation: NavigationData | undefined;
}

const DirectionModal = ({ data, setOpen, setNavigation, navigation }: DirectionModalProps) => {
  const steps = useMemo(
    () => navigation?.steps,
    [navigation]
  );
  
  const bestOptIndex = useMemo(() => {
    if (!data || !data.paths || data.paths.length === 0) return 0;
    
    if (data.method === "driving") {
      const minValue = minBy(
        data.paths,
        (n: RoutePath) => n.legs?.[0]?.distance?.value || 0
      );
      const minIndex = indexOf(data.paths, minValue);
      return minIndex;
    }
    
    if (!data.greenScores || data.greenScores.length === 0) return 0;
    const minValue = min(data.greenScores);
    const minIndex = indexOf(data.greenScores, minValue);
    return minIndex;
  }, [data]);
  
  useEffect(() => {
    if (data?.paths?.[bestOptIndex]) {
      setNavigation({ 
        steps: data.paths[bestOptIndex].legs?.[0]?.steps || [], 
        overview_polyline: data.paths[bestOptIndex].overview_polyline, 
        key: bestOptIndex 
      });
    }
  }, [bestOptIndex, data, setNavigation]);
  
  if (!data || !data.paths || data.paths.length === 0) {
    return null;
  }
  // console.log(data);
  return (
    <div className="absolute left-0 right-0 top-0 bottom-0 rounded-lg bg-green-800 py-11 px-8 overflow-scroll">
      <button
        onClick={() => {
          setOpen(false)
          setNavigation(undefined)
        }}
        className="absolute right-[8px] top-[8px] cursor-pointer"
      >
        <Icon icon={IoMdClose} size="1.5rem" className="fill-white" />
      </button>
      <Slide>
        {data.paths.map(({ legs, overview_polyline }: RoutePath, i: number) => (
          <div className="pr-3 h-[100%]" key={i}>
            <button
              onClick={() => setNavigation({ steps: legs?.[0]?.steps || [], overview_polyline, key: i })}
              className={`cursor-pointer py-2 px-6 text-white h-[100%] ${
                (navigation?.key === i) ? "bg-green-500" : "bg-green-900"
              } rounded-lg hover:bg-green-500 transition-all duration-250`}
            >
              <div className="flex gap-2 items-center justify-center">
                {bestOptIndex === i && (
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
                {legs?.[0]?.distance?.text || 'N/A'} <br /> {legs?.[0]?.duration?.text || 'N/A'}
              </p>
            </button>
          </div>
        ))}
      </Slide>
      {steps && (
        <div className="pt-6">
          <Text className="text-white mb-2">Steps</Text>
          {steps?.map(({ distance, html_instructions }: RouteStep, i: number, arr: RouteStep[]) => (
            <div className="flex pb-5 gap-3 relative" key={i}>
              {i !== arr.length - 1 && (
                <div className="absolute w-[2px] bg-green-700 left-[10.5px] top-4 bottom-[-4px]" />
              )}
              {i === arr.length - 1 ? (
                <Icon icon={FaMapMarkerAlt} size="1.5rem" className="text-green-300" />
              ) : (
                <div
                  className={`relative ml-1 mt-1 w-4 h-4 rounded-full border-solid border border-green-700 ${
                    i ? "bg-green-700" : "bg-green-300"
                  }`}
                />
              )}
              <div className="text-white">
                <p className="text-base/[1.5] font-bold lg:text-lg/[1.5]">
                  {distance?.text || 'N/A'}
                </p>
                <div dangerouslySetInnerHTML={{ __html: html_instructions || '' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DirectionModal;
