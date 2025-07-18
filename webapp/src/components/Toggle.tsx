interface ToggleProps {
    onClick: () => void;
    isActive: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    children?: React.ReactNode; 
}

const Toggle = ({ onClick, isActive, onMouseEnter, onMouseLeave, children }: ToggleProps) => {
    return (
         <div className="relative flex items-center z-2" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <div
                onClick={onClick}
                className="relative cursor-pointer"
                style={{
                    width: 52,
                    height: 28,
                    borderRadius: 24,
                    backgroundColor: isActive ? "#0FD892" : "#F0F0F0",
                    transition: "background-color 0.3s",
                }}
            >
            <div
                style={{
                position: "absolute",
                top: 2,
                left: isActive ? 26 : 2,
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: isActive ? "#FFFFFF" : "#D9D9D9",
                transition: "left 0.3s",
                }}
            />
            <span
                style={{
                position: "absolute",
                top: 8,
                left: isActive ? 7 : 28,
                width: isActive ? 17 : 22,
                height: 12,
                fontSize: 12,
                fontWeight: 700,
                fontStyle: "normal",
                lineHeight: "12px",
                letterSpacing: "0%",
                color: isActive ? "#FFFFFF" : "#A6A6A6",
                opacity: 1,
                transform: "rotate(0deg)",
                }}
            >
                {isActive ? "ON" : "OFF"}
            </span>
            </div>
            {children}
        </div>
    )
}

export default Toggle