// components/Button.tsx

import React from "react";

type BtnProps = {
  children: React.ReactNode;
  className?: string;
  isDisabled?: boolean;
  onClick?: Function;
};

const Button = ({ children, isDisabled, className = "", ...props }: BtnProps) => {
  const disabled = isDisabled ? 'cursor-not-allowed opacity-[0.5]' : 'cursor-pointer'

  return <button
    className={`font-bold bg-green-500 hover:bg-green-700 active:bg-green-700 rounded-sm py-2 px-6 text-white text-base/[1.5] lg:text-lg/[1.5] transition-all duration-250ms ${disabled} ${className}`}
    {...props}
  >{children}</button>;
};

export default Button
