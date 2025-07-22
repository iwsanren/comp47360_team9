import { MvpFeatures, Toggles } from '@/app/map/page';

import Toggle from './Toggle';

interface FilterProps {
  mvpFeatures: MvpFeatures<keyof Toggles>[];
  setToggles: React.Dispatch<React.SetStateAction<any>>;
  toggles: any;
  className?: string;
}

interface TogglesModuleProps {
  label: string;
  onClick: () => void;
  isActive: boolean;
}

const TogglesModule = ({ label, onClick, isActive }: TogglesModuleProps) => (
  <div className="flex gap-1 items-center text-white text-sm">
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
      onClick={onClick}
      isActive={isActive}
    />
  </div>
);

const Filter = ({
  mvpFeatures,
  setToggles,
  toggles,
  className,
}: FilterProps) => {
  return (
    <div
      className={`flex flex-col gap-1 rounded-sm bg-[#00674CBF] p-2 ${className}`}
    >
      <TogglesModule
        label="Active all features"
        isActive={Object.values(toggles).every(d => d)}
        onClick={() => {
          setToggles((prev: any) => {
            const allTrue = Object.values(prev).every((value) => value === true);
            const updated = Object.fromEntries(
              Object.entries(prev).map(([key]) => [key, allTrue ? false : true])
            );
            return updated
          })
        }}
      />
      {mvpFeatures.map(({ key, label }: { key: string; label: string }) => (
        <TogglesModule
          label={label}
          isActive={toggles[key]}
           onClick={() =>
            setToggles((prev: any) => ({ ...prev, [key]: !prev[key] }))
          }
          key={key}
        />
      ))}
    </div>
  );
};

export default Filter;
