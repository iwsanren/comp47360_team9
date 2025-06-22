// components/Icon.tsx
import { ElementType } from 'react';

interface IconProps {
  icon: ElementType;
  className?: string;
  size?: string;
}

export default function Icon({ icon: IconComp, className = '', ...props }: IconProps) {
  return (
    <IconComp className={className} {...props} />
  );
}
