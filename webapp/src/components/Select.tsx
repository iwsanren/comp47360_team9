import React from 'react';

type SelectProps = {
  label?: string;
  options: string[];
  value: string | undefined;
  onChange: (value: string) => void;
};

const Select = ({ options, value, label, onChange }: SelectProps) => {
  return (
    <div className="flex items-center gap-2">
      <div>{label}</div>
      <select
        className="border rounded px-3 py-2 text-sm"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
