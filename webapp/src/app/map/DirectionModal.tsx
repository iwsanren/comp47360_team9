import React, { useMemo } from "react";
import { indexOf, min, minBy } from "lodash";
import { FaMapMarkerAlt } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import Image from "next/image";
import Icon from "@/components/Icon";
import Text from "@/components/Text";
import Slide from "@/components/Slide";

import badge from "@/assets/images/green-badge.png";

interface DirectionModalProps {
  data: any; // TODO: replace 'any' with the actual type
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setNavigation: React.Dispatch<React.SetStateAction<any>>; // replace 'any' with your Navigation type
  navigation: any; // replace 'any' with your Navigation type
}

const DirectionModal = ({ data, setOpen, setNavigation, navigation }: DirectionModalProps) => {
  const steps = useMemo(
    () => navigation?.steps,
    [navigation]
  );
  const bestOptIndex = useMemo(() => {
    if (data.method == "driving") {
      const minValue = minBy(
        data.paths,
        (n: any) => n.legs?.[0].distance.value
      );
      const minIndex = indexOf(data.paths, minValue);
      return minIndex;
    }
    const minValue = min(data.greenScores);
    const minIndex = indexOf(data.greenScores, minValue);
    return minIndex;
  }, [data]);
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
        {data.paths.map(({ legs, overview_polyline }: { legs: any; overview_polyline: any }, i: number) => (
          <div className="pr-3 h-[100%]" key={i}>
            <button
              onClick={() => setNavigation({ steps: legs?.[0].steps, overview_polyline })}
              className={`cursor-pointer py-2 px-6 text-white h-[100%] ${
                bestOptIndex === i ? "bg-green-500" : "bg-green-900"
              } rounded-lg active:bg-green-500`}
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
                {legs?.[0].distance.text}les <br /> {legs?.[0].duration.text}
              </p>
            </button>
          </div>
        ))}
      </Slide>
      {steps && (
        <div className="pt-6">
          <Text className="text-white mb-2">Steps</Text>
          {steps?.map(({ distance, html_instructions }: { distance: any; html_instructions: any }, i:number, { length }: { length: number }) => (
            <div className="flex pb-5 gap-3 relative" key={i}>
              {i != length - 1 && (
                <div className="absolute w-[2px] bg-green-700 left-[10.5px] top-4 bottom-[-4px]" />
              )}
              {i == length - 1 ? (
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
                  {distance.text}
                </p>
                <div dangerouslySetInnerHTML={{ __html: html_instructions }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DirectionModal;
