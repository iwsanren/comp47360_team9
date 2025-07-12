// components/Input.tsx
import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  width?: 'fixed' | 'full' | 'auto';
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  placeholder,
  disabled = false,
  className = '',
  width = 'fixed',
  ...props
}, ref) => {
  const widthClasses = {
    fixed: 'w-[254px] lg:w-[330px]', // Mobile: 254px, Desktop: 330px
    full: 'w-full',
    auto: 'w-auto'
  };

  // Basic styles: height, spacing, text size - follow mobile-first principles
  const baseStyles = `
    h-8 px-3 py-1 text-sm
    lg:h-[59px] lg:px-6 lg:py-3 lg:text-base
    rounded-sm bg-[#e8ecef] lg:bg-[#e8ecef]
    transition-colors duration-200 ease-in-out
    ${widthClasses[width]}
    ${className}
  `;

  // State styles: Mobile devices only have default, while desktop devices have hover/focus.
  const stateStyles = disabled
    ? 'bg-gray-100 cursor-not-allowed opacity-60'
    : 'lg:hover:bg-[#e8ecef] lg:focus:bg-[#e8ecef] lg:focus:ring-1 lg:focus:ring-green-500/20';

  const inputStyles = `
    w-full bg-transparent outline-none
    placeholder:text-gray-500
    ${disabled ? 'cursor-not-allowed text-gray-400' : 'text-gray-900'}
  `;

  return (
    <input
      ref={ref}
      placeholder={placeholder}
      disabled={disabled}
      className={`${baseStyles} ${stateStyles} ${inputStyles}`}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;
