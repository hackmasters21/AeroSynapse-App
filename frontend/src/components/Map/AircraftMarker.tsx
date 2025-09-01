import React, { useMemo, useEffect, useState } from 'react';
import { Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Aircraft, EmergencyStatus } from '../../types/app.types';
import { useApp } from '../../contexts/AppContext';
import AircraftPopup from './AircraftPopup';

interface AircraftMarkerProps {
  aircraft: Aircraft;
  isSelected: boolean;
  showTrail: boolean;
  trailLength: number; // en minutos
}

// Cache para iconos de aeronaves
const iconCache = new Map<string, L.DivIcon>();

// Función para crear icono de aeronave
function createAircraftIcon(
  aircraft: Aircraft,
  isSelected: boolean,
  theme: string
): L.DivIcon {
  const cacheKey = `${aircraft.heading}-${isSelected}-${aircraft.emergencyStatus}-${theme}-${aircraft.onGround}`;
  
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }
  
  // Determinar color según estado
  let color = '#00ff88'; // Verde por defecto
  let pulseColor = 'rgba(0, 255, 136, 0.3)';
  
  if (aircraft.emergencyStatus && aircraft.emergencyStatus !== EmergencyStatus.NONE) {
    color = '#ff4444'; // Rojo para emergencias
    pulseColor = 'rgba(255, 68, 68, 0.5)';
  } else if (aircraft.onGround) {
    color = '#ffaa00'; // Amarillo para aeronaves en tierra
    pulseColor = 'rgba(255, 170, 0, 0.3)';
  } else if (theme === 'night') {
    color = '#ff4444'; // Rojo para modo noche
    pulseColor = 'rgba(255, 68, 68, 0.3)';
  }
  
  if (isSelected) {
    color = '#66ccff'; // Azul para seleccionada
    pulseColor = 'rgba(102, 204, 255, 0.5)';
  }
  
  // Símbolo de aeronave (triángulo apuntando hacia el rumbo)
  const size = isSelected ? 28 : 20;
  const rotation = aircraft.onGround ? 0 : aircraft.heading;
  
  const html = `
    <div class="aircraft-marker ${isSelected ? 'selected' : ''}" 
         style="
           width: ${size}px;
           height: ${size}px;
           transform: rotate(${rotation}deg);
           position: relative;
         ">
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" style="overflow: visible;">
        <!-- Cuerpo de la aeronave -->
        <path d="M12 2 L16 20 L12 18 L8 20 Z" 
              fill="${color}" 
              stroke="#000" 
              stroke-width="0.5"/>
        <!-- Alas -->
        <path d="M6 12 L18 12 L16 14 L8 14 Z" 
              fill="${color}" 
              stroke="#000" 
              stroke-width="0.5"/>
        ${aircraft.emergencyStatus && aircraft.emergencyStatus !== EmergencyStatus.NONE ? 
          `<!-- Indicador de emergencia -->
           <circle cx="12" cy="12" r="3" fill="none" stroke="#ff0000" stroke-width="2" opacity="0.8">
             <animate attributeName="r" values="3;8;3" dur="1s" repeatCount="indefinite"/>
             <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1s" repeatCount="indefinite"/>
           </circle>` : ''}
      </svg>
      ${isSelected ? `
        <div class="selection-ring" style="
          position: absolute;
          top: -4px;
          left: -4px;
          width: ${size + 8}px;
          height: ${size + 8}px;
          border: 2px solid ${color};
          border-radius: 50%;
          animation: pulse 2s infinite;
        "></div>
      ` : ''}
    </div>
    <style>
      .aircraft-marker {
        transition: all 0.3s ease;
        cursor: pointer;
      }
      .aircraft-marker:hover {
        transform: scale(1.2) rotate(${rotation}deg) !important;
      }
      .aircraft-marker.selected {
        filter: drop-shadow(0 0 8px ${color});
      }
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
      }
    </style>
  `;
  
  const icon = L.divIcon({
    html,
    className: 'aircraft-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
  
  iconCache.set(cacheKey, icon);
  return icon;
}

// Función para calcular trail de la aeronave
function calculateTrail(aircraft: Aircraft, trailLength: number): [number, number][] {
  // En una implementación real, esto vendría del historial de posiciones
  // Por ahora, simulamos un trail básico
  const trail: [number, number][] = [];
  const steps = 10;
  const stepSize = 0.001; // Aproximadamente 100m por paso
  
  for (let i = 0; i < steps; i++) {
    const factor = i / steps;
    const offsetLat = Math.sin((aircraft.heading - 180) * Math.PI / 180) * stepSize * factor;
    const offsetLng = Math.cos((aircraft.heading - 180) * Math.PI / 180) * stepSize * factor;
    
    trail.push([
      aircraft.latitude + offsetLat,
      aircraft.longitude + offsetLng
    ]);
  }
  
  trail.push([aircraft.latitude, aircraft.longitude]);
  return trail;
}

export default function AircraftMarker({ 
  aircraft, 
  isSelected, 
  showTrail, 
  trailLength 
}: AircraftMarkerProps) {
  const { selectAircraft, state } = useApp();
  const [trail, setTrail] = useState<[number, number][]>([]);
  
  // Crear icono de aeronave
  const aircraftIcon = useMemo(() => {
    return createAircraftIcon(aircraft, isSelected, state.settings.theme);
  }, [aircraft.heading, aircraft.emergencyStatus, aircraft.onGround, isSelected, state.settings.theme]);
  
  // Calcular trail si está habilitado
  useEffect(() => {
    if (showTrail) {
      const newTrail = calculateTrail(aircraft, trailLength);
      setTrail(newTrail);
    }
  }, [aircraft.latitude, aircraft.longitude, aircraft.heading, showTrail, trailLength]);
  
  // Manejar clic en aeronave
  const handleClick = () => {
    selectAircraft(aircraft.id);
  };
  
  // Color del trail según el tema
  const trailColor = useMemo(() => {
    if (aircraft.emergencyStatus && aircraft.emergencyStatus !== EmergencyStatus.NONE) {
      return '#ff4444';
    }
    if (state.settings.theme === 'night') {
      return '#ff4444';
    }
    return '#00ff88';
  }, [aircraft.emergencyStatus, state.settings.theme]);
  
  return (
    <>
      {/* Trail de la aeronave */}
      {showTrail && trail.length > 1 && (
        <Polyline
          positions={trail}
          color={trailColor}
          weight={2}
          opacity={0.6}
          dashArray={isSelected ? undefined : '5, 5'}
        />
      )}
      
      {/* Marcador de la aeronave */}
      <Marker
        position={[aircraft.latitude, aircraft.longitude]}
        icon={aircraftIcon}
        eventHandlers={{
          click: handleClick,
        }}
      >
        <AircraftPopup aircraft={aircraft} />
      </Marker>
      
      {/* Círculo de proximidad para aeronave seleccionada */}
      {isSelected && (
        <>
          {/* Círculo de proximidad horizontal */}
          <Polyline
            positions={generateCircle(
              [aircraft.latitude, aircraft.longitude],
              state.settings.proximityDistance * 1852 // Convertir NM a metros
            )}
            color={state.settings.theme === 'night' ? '#ff4444' : '#00ff88'}
            weight={2}
            opacity={0.5}
            dashArray="10, 5"
          />
        </>
      )}
    </>
  );
}

// Función auxiliar para generar círculo
function generateCircle(center: [number, number], radiusInMeters: number): [number, number][] {
  const points: [number, number][] = [];
  const earthRadius = 6371000; // Radio de la Tierra en metros
  const lat = center[0] * Math.PI / 180;
  const lng = center[1] * Math.PI / 180;
  
  for (let i = 0; i <= 64; i++) {
    const angle = (i * 360 / 64) * Math.PI / 180;
    
    const deltaLat = radiusInMeters * Math.cos(angle) / earthRadius;
    const deltaLng = radiusInMeters * Math.sin(angle) / (earthRadius * Math.cos(lat));
    
    const pointLat = (lat + deltaLat) * 180 / Math.PI;
    const pointLng = (lng + deltaLng) * 180 / Math.PI;
    
    points.push([pointLat, pointLng]);
  }
  
  return points;
}

// Limpiar cache de iconos periódicamente
setInterval(() => {
  if (iconCache.size > 100) {
    iconCache.clear();
  }
}, 60000); // Cada minuto