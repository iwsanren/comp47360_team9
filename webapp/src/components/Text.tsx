import React from "react";

interface TextProps {
    className?: string;
    children: React.ReactNode;
}

const Text = ({ className, ...props }: TextProps) => {
    return <p className={`text-base/[1.5] lg:text-lg/[1.5] ${className}`} {...props} />
}

export default Text