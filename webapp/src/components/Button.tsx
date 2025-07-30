'use client';

import React from "react";

import { useMode } from "@/contexts/ModeProvider";

type BtnProps = {
  children: React.ReactNode;
  className?: string;
  isDisabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

const Button = ({ children, isDisabled, className = "", ...props }: BtnProps) => {
  const disabled = isDisabled ? 'cursor-not-allowed opacity-[0.5]' : 'cursor-pointer'
  const { mode } = useMode();
  return <button
    disabled={isDisabled}
    className={`font-bold bg-green-500 ${mode ? 'hover:bg-blue-700' : 'hover:bg-green-700'} rounded-sm py-1 px-3 lg:py-2 lg:px-6 text-white text-base/[1.5] lg:text-lg/[1.5] transition-all duration-250 ${disabled} ${className}`}
    {...props}
  >{children}</button>;
};

export default Button
