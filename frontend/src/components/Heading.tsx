// components/Heading.tsx

import React from "react";

type HeadingProps = {
  level?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
};

const baseStyles = {
  1: "font-bold", // fontSize css can add here and below. 
  2: "font-bold",
  3: "font-bold",
  4: "font-bold",
};

const Heading = ({ level = 1, children, className = "" }: HeadingProps) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const style = baseStyles[level];

  return <Tag className={`${style} ${className}`}>{children}</Tag>;
};

export default Heading