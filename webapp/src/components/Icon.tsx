// components/Icon.tsx
import { ElementType } from 'react';

interface IconProps {
  icon: ElementType;
  className?: string;
  size?: string;
  strokeWidth?: number;
  stroke?: string;
}

export default function Icon({ icon: IconComp, className = '', ...props }: IconProps) {
  return (
    <IconComp className={`${className} fill-green-700 stroke-green-700`} {...props} />
  );
}
