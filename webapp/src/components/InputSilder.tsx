import React from 'react';

interface InputSliderProps {
  label?: string;
  min?: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}

const InputSlider: React.FC<InputSliderProps> = ({
  label,
  min = 0,
  max,
  step = 1,
  value,
  onChange,
}) => {
  return (
    <div className="w-[426px] relative">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className={`absolute inline-block text-sm/[21px] lg:text-base/[24px] top-full font-bold text-green-900 translate-y-2`} style={{ left: `${(value * 100) / max}%`, transform: value == min ? 'none' : (value == max ? 'translateX(-100%)' : 'translateX(-50%)')}}>
        {label}
      </div>
    </div>
  );
};

export default InputSlider;
