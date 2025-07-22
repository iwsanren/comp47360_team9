import { useEffect, useState } from "react";

import Icon from "@/components/Icon";
import { WEATHER_CONDITION_ICONS } from "@/constants/icons";
import Heading from "@/components/Heading";

interface modalProps {
  setShowModal: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  current: any;
  hourly: any;
}

const ShowWeatherModal = ({ setShowModal, current, hourly }: modalProps) => {
    const [manhattanTime, setManhattanTime] = useState<string>("");
    // console.log(manhattanTime)
    // Time update
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
    return (
        <div
          className="fixed
            w-[calc(100vw-32px)]
            max-w-[30em]
            h-[80dvh]
            shadow-xl 
            rounded-md
            lg:w-[630px]
            lg:max-w-[unset]
            lg:absolute
            lg:h-auto
            py-3
            px-4
            lg:py-6
            lg:px-8
            overflow-y-auto
            top-[50%]
            left-[50%]
            z-30
            -translate-1/2
          "
          style={{
            backgroundColor: "#E0EEE9",
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
          {current ? (
            <div className="flex items-center gap-4 mb-4">
              <Icon size="3.75rem" icon={WEATHER_CONDITION_ICONS[current?.weather?.[0]?.icon]} />
              <Heading className="lg:!text-5xl">
                {current.main.temp.toFixed(1)}°F
              </Heading>
              <div className="ml-auto text-right text-gray-700 text-sm">
                <p>Humidity: {current.main.humidity}%</p>
                <p>Wind: {current.wind.speed} miles/h</p>
                <p>Feels like: {current.main.feels_like.toFixed(1)}°F</p>
              </div>
            </div>
          ) : (
            <div>Loading...</div>
          )}
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-[10px]">
            {hourly ? hourly.slice(0, 18).map((hour: any, idx: number) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow-md text-center overflow-hidden relative"
              >
                <div className="flex flex-col gap-[10px] py-[12px]">
                  <Icon size="2.5rem" style={{ margin: '0 auto' }} icon={WEATHER_CONDITION_ICONS[hour?.weather?.[0]?.icon]} />
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
            )) : (
              <div>Loading...</div>
            )}
          </div>
        </div>
    )
}

export default ShowWeatherModal 