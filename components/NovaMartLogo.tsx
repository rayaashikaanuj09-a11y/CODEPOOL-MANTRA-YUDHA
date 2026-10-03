import React from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

export const NovaMartLogo: React.FC<LogoProps> = ({ size = 28, className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="nm-coral-grad" x1="2" y1="4" x2="30" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF7B6B" />
          <stop offset="0.55" stopColor="#FF6B5B" />
          <stop offset="1" stopColor="#DC3F35" />
        </linearGradient>
        <linearGradient id="nm-facet-grad" x1="10" y1="6" x2="24" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFA58F" stopOpacity="0.9" />
          <stop offset="1" stopColor="#E95245" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Outer rounded geometric housing */}
      <rect x="2" y="2" width="28" height="28" rx="8" fill="#181D26" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" />

      {/* Left Pillar */}
      <path
        d="M8.5 23.5V9.5C8.5 8.95 8.95 8.5 9.5 8.5H10.8C11.3 8.5 11.75 8.8 11.95 9.25L13.8 13.5V23.5H9.5C8.95 23.5 8.5 23.05 8.5 22.5Z"
        fill="url(#nm-coral-grad)"
      />

      {/* Dynamic Central Diagonal Route (Letter N Bridge & Flow) */}
      <path
        d="M11.6 9.4L20.4 22.6C20.65 22.98 21.1 23.2 21.55 23.2H22.5C23.05 23.2 23.5 22.75 23.5 22.2V8.5H20.2V17.8L13.2 8.6C12.85 8.15 12.1 8.35 12 8.9L11.6 9.4Z"
        fill="url(#nm-coral-grad)"
      />

      {/* Precision routing node points */}
      <circle cx="10" cy="9.5" r="1.5" fill="#FAF8F4" />
      <circle cx="22" cy="22.5" r="1.5" fill="#FAF8F4" />
    </svg>
  );
};
