// components/Heading.tsx

import React from "react";

type HeadingProps = {
  level?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
};

const baseStyles = {
  1: "text-4xl lg:text-6xl", // fontSize css can add here and below. 
  2: "text-[1.75em] lg:text-4xl",
  3: "text-2xl lg:text-3xl",
  4: "text-xl lg:text-2xl",
};

const Heading = ({ level = 1, children, className = "" }: HeadingProps) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const style = baseStyles[level];

  return <Tag className={`font-bold leading-[1.5] ${className} ${style}`}>{children}</Tag>;
};

export default Heading
