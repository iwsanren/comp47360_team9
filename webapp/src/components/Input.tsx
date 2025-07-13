// components/Input.tsx
import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  width?: 'full' | 'auto';
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  placeholder,
  disabled = false,
  className = '',
  width = 'auto',
  ...props
}, ref) => {
  const widthClasses = {
    full: 'w-full',
    auto: 'w-auto'
  };

  // Basic styles: height, spacing, text size - follow mobile-first principles
  const baseStyles = `
    px-3 py-1 text-base/[24px] outline-none hover:text-black
    lg:leading-[27px] lg:px-6 lg:py-4 lg:text-lg
    rounded-sm bg-blue-100
    transition-all duration-250 ease-in-out
    ${widthClasses[width]}
    ${className}
  `;

  // State styles: Mobile devices only have default, while desktop devices have hover/focus.
  const stateStyles = disabled && 'bg-gray-100 cursor-not-allowed opacity-50'

  return (
    <input
      ref={ref}
      placeholder={placeholder}
      disabled={disabled}
      className={`${baseStyles} ${stateStyles}`}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;
