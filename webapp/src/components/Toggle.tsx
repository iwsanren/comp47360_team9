interface ToggleProps {
  onClick: () => void;
  isActive: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  children?: React.ReactNode;
  isDisabled?: boolean;
}

const Toggle = ({
  onClick,
  isActive,
  isDisabled,
  onMouseEnter,
  onMouseLeave,
  children,
}: ToggleProps) => {
  return (
    <div
      className={`relative z-2 ${isDisabled && 'pointer-events-none opacity-50'}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        onClick={onClick}
        className={`relative cursor-pointer flex items-center p-[2px] gap-[2px] rounded-3xl w-[48px] lg:w-[52px] ${isActive && 'flex-row-reverse'}`}
        style={{
          backgroundColor: isActive ? '#0FD892' : '#F0F0F0',
          transition: 'all 0.3s',
        }}
      >
        <div
          className="w-5 h-5 lg:w-6 lg:h-6 rounded-full"
          style={{
            backgroundColor: isActive ? '#FFFFFF' : '#D9D9D9',
            transition: 'all 0.3s',
          }}
        />
        <div
          className="text-xs/[1] font-bold text-right flex-1"
          style={{
            color: isActive ? '#FFFFFF' : '#A6A6A6',
            transition: 'all 0.3s',
          }}
        >
          {isActive ? 'ON' : 'OFF'}
        </div>
      </div>
      {children}
    </div>
  );
};

export default Toggle;
