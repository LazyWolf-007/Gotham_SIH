import React from "react";

export function AshokaEmblem({ className = "w-8 h-8", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Ashoka Lion Capital Vector Silhouette */}
      <g fill="currentColor">
        {/* Top Lions Crown / Mane */}
        <path d="M50 5 C45 5 42 10 40 15 C37 12 30 14 28 20 C25 24 27 30 30 34 C25 36 22 42 25 48 C27 52 32 54 36 55 C35 60 38 65 42 67 L42 70 C38 72 32 75 30 80 L70 80 C68 75 62 72 58 70 L58 67 C62 65 65 60 64 55 C68 54 73 52 75 48 C78 42 75 36 70 34 C73 30 75 24 72 20 C70 14 63 12 60 15 C58 10 55 5 50 5 Z" opacity="0.95" />
        
        {/* Central Lion details */}
        <path d="M46 22 Q50 18 54 22 Q52 28 46 22 Z" fill="#111" />
        <circle cx="44" cy="28" r="2" fill="#fff" />
        <circle cx="56" cy="28" r="2" fill="#fff" />
        <path d="M48 34 Q50 36 52 34" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        
        {/* Side Lions Muzzles */}
        <circle cx="34" cy="30" r="1.5" fill="#fff" />
        <circle cx="66" cy="30" r="1.5" fill="#fff" />
        
        {/* Abacus / Base Platform */}
        <rect x="22" y="81" width="56" height="7" rx="1.5" fill="currentColor" />
        
        {/* Ashoka Chakra in Center of Abacus */}
        <circle cx="50" cy="84.5" r="4.5" stroke="#111" strokeWidth="1" fill="none" />
        <circle cx="50" cy="84.5" r="1.5" fill="#111" />
        
        {/* Bull on left, Horse on right */}
        <path d="M30 83 Q33 82 35 85 Q32 86 30 83 Z" fill="#111" />
        <path d="M65 83 Q68 82 70 85 Q67 86 65 83 Z" fill="#111" />
        
        {/* Lotus / Bell Base */}
        <path d="M26 89 C32 94 40 96 50 96 C60 96 68 94 74 89 L72 93 C66 98 58 100 50 100 C42 100 34 98 28 93 Z" fill="currentColor" opacity="0.9" />
        
        {/* Pedestal Bottom Plate */}
        <rect x="20" y="101" width="60" height="4" rx="1" fill="currentColor" />
        
        {/* Satyameva Jayate Inscription Symbolism */}
        <rect x="35" y="108" width="30" height="2" rx="1" fill="currentColor" opacity="0.6" />
      </g>
    </svg>
  );
}
