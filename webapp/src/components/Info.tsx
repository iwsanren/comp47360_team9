import { useState } from 'react';

type InfoProps = {
  isActive: boolean;
  children: React.ReactNode;
  currentColor: string;
};

const Info = ({ children, isActive, currentColor }: InfoProps) => {
  const [showInfo, setShowInfo] = useState<boolean>(false);
  return (
    <div
      className="w-3 h-3 lg:w-4 lg:h-4 flex rounded-full justify-center items-center text-xs absolute right-0 top-0 -translate-y-1/2 translate-x-1/2"
      style={{
        background: isActive ? 'white' : currentColor,
        color: isActive ? currentColor : 'white',
      }}
      onClick={e => e.stopPropagation()}
      onMouseEnter={() => setShowInfo(true)}
      onMouseLeave={() => setShowInfo(false)}
    >
      i
      {showInfo && (
        <div className="w-[164px] p-2 pt-4 text-xs/[1.5] top-full -right-4 translate-y-1 bg-white rounded-sm text-black absolute z-5">
          {children}
        </div>
      )}
    </div>
  );
};

export default Info;
