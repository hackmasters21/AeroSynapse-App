import React from 'react';

interface AccidentIconProps {
  size?: number;
  className?: string;
  onClick?: () => void;
}

const AccidentIcon: React.FC<AccidentIconProps> = ({ 
  size = 24, 
  className = '',
  onClick 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`accident-icon ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Triángulo amarillo de fondo */}
      <path
        d="M12 2 L22 20 L2 20 Z"
        fill="#FFD700"
        stroke="#FFA500"
        strokeWidth="1"
      />
      
      {/* Sombra del triángulo */}
      <path
        d="M12 2 L22 20 L2 20 Z"
        fill="url(#triangleShadow)"
        opacity="0.3"
      />
      
      {/* Avión en el centro */}
      <g transform="translate(12, 12) scale(0.6)">
        {/* Fuselaje del avión */}
        <ellipse
          cx="0"
          cy="0"
          rx="8"
          ry="2"
          fill="#2C3E50"
        />
        
        {/* Alas */}
        <rect
          x="-6"
          y="-1"
          width="12"
          height="2"
          fill="#34495E"
        />
        
        {/* Cola */}
        <polygon
          points="6,0 10,-2 10,2"
          fill="#2C3E50"
        />
        
        {/* Ventanas */}
        <circle cx="-2" cy="0" r="0.5" fill="#3498DB" />
        <circle cx="0" cy="0" r="0.5" fill="#3498DB" />
        <circle cx="2" cy="0" r="0.5" fill="#3498DB" />
      </g>
      
      {/* X roja encima del avión */}
      <g transform="translate(12, 8)">
        <path
          d="M-3,-3 L3,3 M3,-3 L-3,3"
          stroke="#E74C3C"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      
      {/* Gradientes y efectos */}
      <defs>
        <linearGradient id="triangleShadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
        </linearGradient>
        
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/> 
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
};

export default AccidentIcon;