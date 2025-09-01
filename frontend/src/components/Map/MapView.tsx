import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Box, IconButton, Tooltip, Fab } from '@mui/material';
import {
  MyLocation as MyLocationIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Layers as LayersIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';

import { useApp } from '../../contexts/AppContext';
import { Aircraft, Position } from '../../types/app.types';
import AircraftMarker from './AircraftMarker';
import AircraftPopup from './AircraftPopup';
import MapControls from './MapControls';
import RouteOverlay from './RouteOverlay';
import AirspaceOverlay from './AirspaceOverlay';
import WeatherOverlay from './WeatherOverlay';
import SafetyOverlay from './SafetyOverlay';
import InteractiveLegend from './InteractiveLegend';
import AccidentIcon from './AccidentIcon';
import { AccidentMapService, HistoricalAccident } from '../../services/accidentMapService';

// Configuración del mapa
const DEFAULT_CENTER: [number, number] = [40.4168, -3.7038]; // Madrid
const DEFAULT_ZOOM = 8;
const MIN_ZOOM = 3;
const MAX_ZOOM = 18;

// Estilos de mapa disponibles
const MAP_STYLES = {
  openstreetmap: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri'
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap contributors'
  },
  aviation: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    className: 'aviation-tiles'
  }
};

interface MapViewProps {
  className?: string;
}

// Componente para manejar eventos del mapa
function MapEventHandler() {
  const { selectAircraft, state } = useApp();
  
  useMapEvents({
    click: (e) => {
      // Deseleccionar aeronave al hacer clic en el mapa
      if (state.selectedAircraft) {
        selectAircraft(null);
      }
    },
    zoomend: (e) => {
      const map = e.target;
      console.log('Zoom level:', map.getZoom());
    },
    moveend: (e) => {
      const map = e.target;
      const center = map.getCenter();
      console.log('Map center:', center.lat, center.lng);
    }
  });
  
  return null;
}

// Componente para controlar el mapa programáticamente
function MapController() {
  const map = useMap();
  const { state } = useApp();
  const [userLocation, setUserLocation] = useState<Position | null>(null);
  
  // Centrar en aeronave seleccionada
  useEffect(() => {
    if (state.selectedAircraft && state.settings.autoZoom) {
      const aircraft = state.aircraft.find(a => a.id === state.selectedAircraft);
      if (aircraft) {
        map.setView([aircraft.latitude, aircraft.longitude], Math.max(map.getZoom(), 10), {
          animate: true,
          duration: 1
        });
      }
    }
  }, [state.selectedAircraft, map, state.aircraft, state.settings.autoZoom]);
  
  // Obtener ubicación del usuario
  const getUserLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos: Position = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude || undefined
          };
          setUserLocation(userPos);
          map.setView([userPos.latitude, userPos.longitude], 12, {
            animate: true,
            duration: 1.5
          });
        },
        (error) => {
          console.error('Error obteniendo ubicación:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutos
        }
      );
    }
  }, [map]);
  
  return (
    <>
      {/* Marcador de ubicación del usuario */}
      {userLocation && (
        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={L.divIcon({
            className: 'user-location-marker',
            html: '<div class="user-location-dot"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })}
        >
          <Popup>
            <div>
              <strong>Tu ubicación</strong><br />
              Lat: {userLocation.latitude.toFixed(6)}<br />
              Lng: {userLocation.longitude.toFixed(6)}
              {userLocation.altitude && (
                <><br />Alt: {userLocation.altitude.toFixed(0)} m</>
              )}
            </div>
          </Popup>
        </Marker>
      )}
      
      {/* Controles del mapa */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        <Tooltip title="Mi ubicación" placement="left">
          <Fab
            size="small"
            color="primary"
            onClick={getUserLocation}
            sx={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          >
            <MyLocationIcon />
          </Fab>
        </Tooltip>
        
        <Tooltip title="Acercar" placement="left">
          <Fab
            size="small"
            onClick={() => map.zoomIn()}
            sx={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          >
            <ZoomInIcon />
          </Fab>
        </Tooltip>
        
        <Tooltip title="Alejar" placement="left">
          <Fab
            size="small"
            onClick={() => map.zoomOut()}
            sx={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          >
            <ZoomOutIcon />
          </Fab>
        </Tooltip>
      </Box>
    </>
  );
}

export default function MapView({ className }: MapViewProps) {
  const { state } = useApp();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentMapStyle, setCurrentMapStyle] = useState('openstreetmap');
  const [legendVisible, setLegendVisible] = useState(false);
  const [showAccidents, setShowAccidents] = useState(true);
  const [selectedAccident, setSelectedAccident] = useState<HistoricalAccident | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  // Obtener accidentes históricos
  const historicalAccidents = AccidentMapService.getAllAccidents();
  
  // Filtrar aeronaves según configuración
  const visibleAircraft = state.aircraft.filter(aircraft => {
    const { filters } = state;
    
    // Aplicar filtros
    if (filters.altitudeMin !== undefined && aircraft.altitude < filters.altitudeMin) {
      return false;
    }
    if (filters.altitudeMax !== undefined && aircraft.altitude > filters.altitudeMax) {
      return false;
    }
    if (!filters.showOnGround && aircraft.onGround) {
      return false;
    }
    
    return true;
  });
  
  // Manejar pantalla completa
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };
  
  // Cambiar estilo de mapa
  const changeMapStyle = (style: string) => {
    setCurrentMapStyle(style);
  };
  
  // Aplicar tema nocturno al mapa
  useEffect(() => {
    const mapContainer = document.querySelector('.leaflet-container');
    if (mapContainer) {
      if (state.settings.theme === 'night') {
        mapContainer.classList.add('night-mode');
      } else {
        mapContainer.classList.remove('night-mode');
      }
    }
  }, [state.settings.theme]);
  
  return (
    <Box
      className={className}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={true}
        ref={mapRef}
      >
        {/* Capa base del mapa */}
        <TileLayer
          url={MAP_STYLES[currentMapStyle as keyof typeof MAP_STYLES].url}
          attribution={MAP_STYLES[currentMapStyle as keyof typeof MAP_STYLES].attribution}
          className={(MAP_STYLES[currentMapStyle as keyof typeof MAP_STYLES] as any).className}
        />
        
        {/* Manejador de eventos */}
        <MapEventHandler />
        
        {/* Controlador del mapa */}
        <MapController />
        
        {/* Marcadores de aeronaves */}
        {visibleAircraft.map((aircraft) => (
          <AircraftMarker
            key={aircraft.id}
            aircraft={aircraft}
            isSelected={state.selectedAircraft === aircraft.id}
            showTrail={state.settings.showTrails}
            trailLength={state.settings.trailLength}
          />
        ))}
        
        {/* Marcadores de accidentes históricos */}
        {showAccidents && historicalAccidents.map((accident) => (
          <Marker
            key={accident.id}
            position={[accident.location.latitude, accident.location.longitude]}
            icon={L.divIcon({
              className: 'accident-marker',
              html: `<div style="display: flex; align-items: center; justify-content: center;">
                       <svg width="24" height="24" viewBox="0 0 24 24">
                         <path d="M12 2 L22 20 L2 20 Z" fill="#FFD700" stroke="#FFA500" stroke-width="1"/>
                         <g transform="translate(12, 12) scale(0.6)">
                           <ellipse cx="0" cy="0" rx="8" ry="2" fill="#2C3E50"/>
                           <rect x="-6" y="-1" width="12" height="2" fill="#34495E"/>
                           <polygon points="6,0 10,-2 10,2" fill="#2C3E50"/>
                         </g>
                         <g transform="translate(12, 8)">
                           <path d="M-3,-3 L3,3 M3,-3 L-3,3" stroke="#E74C3C" stroke-width="2" stroke-linecap="round"/>
                         </g>
                       </svg>
                     </div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })}
            eventHandlers={{
              click: () => setSelectedAccident(accident)
            }}
          >
            <Popup>
              <div style={{ minWidth: '250px' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#E74C3C' }}>
                  ⚠️ {accident.name}
                </h3>
                <div style={{ marginBottom: '8px' }}>
                   <strong>Date:</strong> {new Date(accident.date).toLocaleDateString('en-US')}
                 </div>
                 <div style={{ marginBottom: '8px' }}>
                   <strong>Aircraft:</strong> {accident.aircraft}
                 </div>
                 {accident.flightNumber && (
                   <div style={{ marginBottom: '8px' }}>
                     <strong>Flight:</strong> {accident.flightNumber}
                   </div>
                 )}
                 <div style={{ marginBottom: '8px' }}>
                   <strong>Fatalities:</strong> <span style={{ color: '#E74C3C', fontWeight: 'bold' }}>{accident.fatalities}</span>
                 </div>
                 <div style={{ marginBottom: '8px' }}>
                   <strong>Description:</strong> {accident.description}
                 </div>
                 {accident.cause && (
                   <div style={{ marginBottom: '8px' }}>
                     <strong>Cause:</strong> {accident.cause}
                   </div>
                 )}
                <div style={{ fontSize: '0.8em', color: '#666', marginTop: '8px' }}>
                  📍 {accident.location.latitude.toFixed(4)}°, {accident.location.longitude.toFixed(4)}°
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Overlay de ruta */}
        {state.currentRoute && (
          <RouteOverlay route={state.currentRoute} />
        )}
        
        {/* Overlay de espacio aéreo */}
        <AirspaceOverlay />
        
        {/* Overlay de clima */}
        <WeatherOverlay visible={true} />
        
        {/* Overlay de seguridad */}
         <SafetyOverlay visible={true} />
      </MapContainer>
      
      {/* Controles adicionales */}
      <MapControls
        currentStyle={currentMapStyle}
        onStyleChange={changeMapStyle}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />
      
      {/* Información de estado */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: 1,
          borderRadius: 1,
          fontSize: '0.75rem',
          fontFamily: 'monospace'
        }}
      >
        <div>Aircraft: {visibleAircraft.length}</div>
        <div 
           style={{ cursor: 'pointer', userSelect: 'none' }}
           onClick={() => setShowAccidents(!showAccidents)}
           title="Click to show/hide historical accidents"
         >
           Accidents: {showAccidents ? '✅' : '❌'} ({historicalAccidents.length})
         </div>
         <div>Connected: {state.isConnected ? '✅' : '❌'}</div>
         {state.lastUpdate && (
           <div>Last update: {state.lastUpdate.toLocaleTimeString()}</div>
         )}
      </Box>
      
      {/* Estilos CSS adicionales se manejan en CSS global */}
      
      {/* Leyenda interactiva */}
      <InteractiveLegend
        visible={legendVisible}
        onToggle={() => setLegendVisible(!legendVisible)}
        position="left"
      />
    </Box>
  );
}