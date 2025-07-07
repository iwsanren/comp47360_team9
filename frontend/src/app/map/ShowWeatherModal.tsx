import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { WEATHER_CONDITION_ICONS } from "@/constants/icons";

interface modalProps {
  setShowModal: Function;
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
          className="absolute shadow-xl py-6 px-8 overflow-y-auto z-30"
          style={{
            width: 630,
            height: 600,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: "#E0EEE9",
            borderRadius: 8,
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
          {current && (
            <div className="flex items-center gap-4 mb-4">
              <Icon size="3.75rem" icon={WEATHER_CONDITION_ICONS[current.weather[0].icon]} />
              <h1 className="text-4xl font-bold">
                {current.main.temp.toFixed(1)}°F
              </h1>
              <div className="ml-auto text-right text-gray-700 text-sm">
                <p>Humidity: {current.main.humidity}%</p>
                <p>Wind: {current.wind.speed} miles/h</p>
                <p>Feel like: {current.main.feels_like.toFixed(1)}°F</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-6 gap-[10px]">
            {hourly.slice(0, 18).map((hour: any, idx: number) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow-md text-center relative"
              >
                <div className="flex flex-col gap-[10px] py-[12px]">
                  <Icon className="mx-auto" size="2.5rem" icon={WEATHER_CONDITION_ICONS[hour.weather[0].icon]} />
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
            ))}
          </div>
        </div>
    )
}

export default ShowWeatherModal 