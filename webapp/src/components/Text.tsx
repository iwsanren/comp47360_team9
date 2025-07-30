import React from "react";

interface TextProps {
    className?: string;
    children: React.ReactNode;
}

const Text = ({ className, ...props }: TextProps) => {
    return <p className={`text-base/[1.5] lg:text-lg/[1.5] ${className}`} {...props} />
}

const Bold = ({ className, ...props }: TextProps) => {
  return (
    <p
      className={`font-bold text-base/[1.5] lg:text-lg/[1.5] ${className ?? ""}`}
      {...props}
    />
  );
};

Text.Bold = Bold;
Bold.displayName = "Text.Bold";

export default Text