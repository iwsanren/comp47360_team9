// components/Icon.tsx
import { ElementType } from 'react';

interface IconProps {
  icon: ElementType;
  className?: string;
  size?: string;
  strokeWidth?: number;
  stroke?: string;
  style?: React.CSSProperties;
}

export default function Icon({ icon: IconComp, className = 'fill-green-700 stroke-green-700', ...props }: IconProps) {
  return (
    <IconComp className={`${className}`} {...props} />
  );
}
