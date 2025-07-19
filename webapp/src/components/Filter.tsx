import { MvpFeatures, Toggles } from "@/app/map/page";

import Toggle from "./Toggle";

interface FilterProps {
    mvpFeatures: MvpFeatures<keyof Toggles>[];
    setToggles: React.Dispatch<React.SetStateAction<any>>;
    toggles: any;
    className?: string;
}

const Filter = ({ mvpFeatures, setToggles, toggles, className }: FilterProps) => {
  return (
    <div className={`flex flex-col gap-1 rounded-sm bg-[#00674CBF] p-2 ${className}`}>
      {mvpFeatures.map(({ key, label }: { key: string, label: string }) => (
        <div
          key={key}
          className="flex gap-1 items-center text-white text-sm px-2"
        >
          <span
            style={{
              fontWeight: 700,
              fontStyle: 'normal',
              fontSize: '12px',
              lineHeight: '18px',
              letterSpacing: '0%',
              textAlign: 'right',
              flex: 1,
            }}
          >
            {label}
          </span>
          <Toggle
            onClick={() => setToggles((prev: any) => ({ ...prev, [key]: !prev[key] }))}
            isActive={toggles[key]}
          />
        </div>
      ))}
    </div>
  );
};

export default Filter