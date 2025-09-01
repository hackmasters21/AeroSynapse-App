import React from 'react';
import { Popup } from 'react-leaflet';
import { Box, Typography, Chip, Divider, IconButton } from '@mui/material';
import {
  Flight as FlightIcon,
  Speed as SpeedIcon,
  Height as HeightIcon,
  Navigation as NavigationIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { Aircraft, EmergencyStatus } from '../../types/app.types';
import { useApp } from '../../contexts/AppContext';

interface AircraftPopupProps {
  aircraft: Aircraft;
}

// Función para formatear altitud
function formatAltitude(altitude: number): string {
  if (altitude < 1000) {
    return `${altitude} ft`;
  }
  return `FL${Math.round(altitude / 100)}`;
}

// Función para formatear velocidad
function formatSpeed(speed: number): string {
  return `${Math.round(speed)} kt`;
}

// Función para formatear rumbo
function formatHeading(heading: number): string {
  return `${Math.round(heading).toString().padStart(3, '0')}°`;
}

// Función para formatear velocidad vertical
function formatVerticalRate(rate: number): string {
  const sign = rate >= 0 ? '+' : '';
  return `${sign}${Math.round(rate)} ft/min`;
}

// Función para obtener descripción de emergencia
function getEmergencyDescription(status: EmergencyStatus): string {
  switch (status) {
    case EmergencyStatus.GENERAL:
      return 'Emergencia General';
    case EmergencyStatus.MEDICAL:
      return 'Emergencia Médica';
    case EmergencyStatus.MINIMUM_FUEL:
      return 'Combustible Mínimo';
    case EmergencyStatus.NO_COMMUNICATIONS:
      return 'Sin Comunicaciones';
    case EmergencyStatus.UNLAWFUL_INTERFERENCE:
      return 'Interferencia Ilegal';
    case EmergencyStatus.DOWNED_AIRCRAFT:
      return 'Aeronave Accidentada';
    default:
      return 'Normal';
  }
}

// Función para obtener color de chip según estado
function getStatusColor(aircraft: Aircraft): 'success' | 'warning' | 'error' | 'info' {
  if (aircraft.emergencyStatus && aircraft.emergencyStatus !== EmergencyStatus.NONE) {
    return 'error';
  }
  if (aircraft.onGround) {
    return 'warning';
  }
  return 'success';
}

export default function AircraftPopup({ aircraft }: AircraftPopupProps) {
  const { selectAircraft } = useApp();
  
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectAircraft(null);
  };
  
  const timeSinceUpdate = aircraft.lastUpdate 
    ? Math.round((Date.now() - aircraft.lastUpdate.getTime()) / 1000)
    : null;
  
  return (
    <Popup
      closeButton={false}
      className="aircraft-popup"
      maxWidth={320}
      minWidth={280}
    >
      <Box sx={{ p: 1, minWidth: 260 }}>
        {/* Header con callsign y botón cerrar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FlightIcon color="primary" fontSize="small" />
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              {aircraft.callsign || 'N/A'}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        
        {/* Estado de la aeronave */}
        <Box sx={{ mb: 1 }}>
          <Chip
            label={aircraft.onGround ? 'On Ground' : 'In Flight'}
            color={getStatusColor(aircraft)}
            size="small"
            variant="outlined"
          />
          {aircraft.emergencyStatus && aircraft.emergencyStatus !== EmergencyStatus.NONE && (
            <Chip
              label={getEmergencyDescription(aircraft.emergencyStatus)}
              color="error"
              size="small"
              variant="filled"
              icon={<WarningIcon />}
              sx={{ ml: 1 }}
            />
          )}
        </Box>
        
        <Divider sx={{ my: 1 }} />
        
        {/* Información de vuelo */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1 }}>
          {/* Altitud */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <HeightIcon fontSize="small" color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Altitud
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                {formatAltitude(aircraft.altitude)}
              </Typography>
            </Box>
          </Box>
          
          {/* Velocidad */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <SpeedIcon fontSize="small" color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Velocidad
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                {formatSpeed(aircraft.velocity)}
              </Typography>
            </Box>
          </Box>
          
          {/* Rumbo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <NavigationIcon fontSize="small" color="action" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Rumbo
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                {formatHeading(aircraft.heading)}
              </Typography>
            </Box>
          </Box>
          
          {/* Velocidad vertical */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ 
              width: 16, 
              height: 16, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '12px'
            }}>
              {aircraft.verticalRate > 100 ? '↗' : aircraft.verticalRate < -100 ? '↘' : '→'}
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                V/S
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 'bold', 
                  fontFamily: 'monospace',
                  color: aircraft.verticalRate > 100 ? 'success.main' : 
                         aircraft.verticalRate < -100 ? 'error.main' : 'text.primary'
                }}
              >
                {formatVerticalRate(aircraft.verticalRate)}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Divider sx={{ my: 1 }} />
        
        {/* Información adicional */}
        <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
          {aircraft.registration && (
            <Typography variant="caption" display="block">
              <strong>Matrícula:</strong> {aircraft.registration}
            </Typography>
          )}
          {aircraft.aircraftType && (
            <Typography variant="caption" display="block">
              <strong>Tipo:</strong> {aircraft.aircraftType}
            </Typography>
          )}
          {aircraft.airline && (
            <Typography variant="caption" display="block">
              <strong>Aerolínea:</strong> {aircraft.airline}
            </Typography>
          )}
          {aircraft.origin && (
            <Typography variant="caption" display="block">
              <strong>Origen:</strong> {aircraft.origin}
            </Typography>
          )}
          {aircraft.destination && (
            <Typography variant="caption" display="block">
              <strong>Destino:</strong> {aircraft.destination}
            </Typography>
          )}
          {aircraft.squawk && (
            <Typography variant="caption" display="block">
              <strong>Squawk:</strong> {aircraft.squawk}
            </Typography>
          )}
        </Box>
        
        <Divider sx={{ my: 1 }} />
        
        {/* Información técnica */}
        <Box sx={{ fontSize: '0.7rem', color: 'text.secondary', fontFamily: 'monospace' }}>
          <Typography variant="caption" display="block">
            <strong>ICAO24:</strong> {aircraft.icao24}
          </Typography>
          <Typography variant="caption" display="block">
            <strong>Posición:</strong> {aircraft.latitude.toFixed(6)}, {aircraft.longitude.toFixed(6)}
          </Typography>
          {timeSinceUpdate !== null && (
            <Typography variant="caption" display="block">
              <strong>Actualizado:</strong> hace {timeSinceUpdate}s
            </Typography>
          )}
        </Box>
        
        {/* Indicador de calidad de datos */}
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: timeSinceUpdate && timeSinceUpdate < 10 ? 'success.main' :
                              timeSinceUpdate && timeSinceUpdate < 30 ? 'warning.main' : 'error.main'
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {timeSinceUpdate && timeSinceUpdate < 10 ? 'Datos actuales' :
             timeSinceUpdate && timeSinceUpdate < 30 ? 'Datos recientes' : 'Datos antiguos'}
          </Typography>
        </Box>
      </Box>
      
      {/* Estilos de popup se manejan en CSS global */}
    </Popup>
  );
}