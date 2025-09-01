import React, { useState } from 'react';
import {
  Box,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  IconButton,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  Layers as LayersIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Map as MapIcon,
  Satellite as SatelliteIcon,
  Terrain as TerrainIcon,
  Flight as FlightIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useApp } from '../../contexts/AppContext';

interface MapControlsProps {
  currentStyle: string;
  onStyleChange: (style: string) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const MAP_STYLES = [
  {
    id: 'openstreetmap',
    name: 'OpenStreetMap',
    icon: <MapIcon />,
    description: 'Mapa estándar con calles y ciudades'
  },
  {
    id: 'satellite',
    name: 'Satélite',
    icon: <SatelliteIcon />,
    description: 'Vista satelital de alta resolución'
  },
  {
    id: 'terrain',
    name: 'Terreno',
    icon: <TerrainIcon />,
    description: 'Mapa topográfico con relieve'
  },
  {
    id: 'aviation',
    name: 'Aviación',
    icon: <FlightIcon />,
    description: 'Mapa optimizado para aviación'
  }
];

export default function MapControls({
  currentStyle,
  onStyleChange,
  isFullscreen,
  onToggleFullscreen
}: MapControlsProps) {
  const { state, updateSettings, updateFilters } = useApp();
  const [layersMenuAnchor, setLayersMenuAnchor] = useState<null | HTMLElement>(null);
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState<null | HTMLElement>(null);
  
  const handleLayersClick = (event: React.MouseEvent<HTMLElement>) => {
    setLayersMenuAnchor(event.currentTarget);
  };
  
  const handleLayersClose = () => {
    setLayersMenuAnchor(null);
  };
  
  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsMenuAnchor(event.currentTarget);
  };
  
  const handleSettingsClose = () => {
    setSettingsMenuAnchor(null);
  };
  
  const handleStyleChange = (styleId: string) => {
    onStyleChange(styleId);
    handleLayersClose();
  };
  
  return (
    <>
      {/* Controles principales */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}
      >
        {/* Control de capas */}
        <Tooltip title="Capas del mapa" placement="left">
          <Fab
            size="small"
            color="primary"
            onClick={handleLayersClick}
            sx={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          >
            <LayersIcon />
          </Fab>
        </Tooltip>
        
        {/* Control de configuración */}
        <Tooltip title="Configuración del mapa" placement="left">
          <Fab
            size="small"
            onClick={handleSettingsClick}
            sx={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          >
            <SettingsIcon />
          </Fab>
        </Tooltip>
        
        {/* Control de pantalla completa */}
        <Tooltip title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"} placement="left">
          <Fab
            size="small"
            onClick={onToggleFullscreen}
            sx={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </Fab>
        </Tooltip>
      </Box>
      
      {/* Menú de capas */}
      <Menu
        anchorEl={layersMenuAnchor}
        open={Boolean(layersMenuAnchor)}
        onClose={handleLayersClose}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            minWidth: 200
          }
        }}
      >
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, px: 1 }}>
            Estilo de Mapa
          </Typography>
        </Box>
        
        {MAP_STYLES.map((style) => (
          <MenuItem
            key={style.id}
            selected={currentStyle === style.id}
            onClick={() => handleStyleChange(style.id)}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                }
              }
            }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              {style.icon}
            </ListItemIcon>
            <ListItemText 
              primary={style.name}
              secondary={style.description}
              secondaryTypographyProps={{
                sx: { color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }
              }}
            />
          </MenuItem>
        ))}
      </Menu>
      
      {/* Menú de configuración */}
      <Menu
        anchorEl={settingsMenuAnchor}
        open={Boolean(settingsMenuAnchor)}
        onClose={handleSettingsClose}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'center',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            minWidth: 250,
            maxWidth: 300
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Configuración del Mapa
          </Typography>
          
          {/* Mostrar trails */}
          <FormControlLabel
            control={
              <Switch
                checked={state.settings.showTrails}
                onChange={(e) => updateSettings({ showTrails: e.target.checked })}
                size="small"
                color="primary"
              />
            }
            label="Show aircraft trails"
            sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}
          />
          
          {/* Auto zoom */}
          <FormControlLabel
            control={
              <Switch
                checked={state.settings.autoZoom}
                onChange={(e) => updateSettings({ autoZoom: e.target.checked })}
                size="small"
                color="primary"
              />
            }
            label="Zoom automático a aeronave seleccionada"
            sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}
          />
          
          <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
          
          <Typography variant="caption" sx={{ mb: 1, display: 'block', opacity: 0.7 }}>
            Filtros de Visualización
          </Typography>
          
          {/* Mostrar aeronaves en tierra */}
          <FormControlLabel
            control={
              <Switch
                checked={state.filters.showOnGround ?? true}
                onChange={(e) => updateFilters({ showOnGround: e.target.checked })}
                size="small"
                color="primary"
              />
            }
            label="Aircraft on ground"
            sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}
          />
          
          {/* Mostrar emergencias */}
          <FormControlLabel
            control={
              <Switch
                checked={state.filters.showEmergency ?? true}
                onChange={(e) => updateFilters({ showEmergency: e.target.checked })}
                size="small"
                color="primary"
              />
            }
            label="Alertas de emergencia"
            sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}
          />
          
          <Divider sx={{ my: 1, borderColor: 'rgba(255, 255, 255, 0.2)' }} />
          
          <Typography variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
            Intervalo de actualización: {state.settings.updateInterval}s
          </Typography>
          
          <Typography variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
            Distancia de proximidad: {state.settings.proximityDistance} NM
          </Typography>
        </Box>
      </Menu>
      
      {/* Indicador de estilo actual */}
      <Paper
        sx={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          p: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        {MAP_STYLES.find(s => s.id === currentStyle)?.icon}
        <Typography variant="caption">
          {MAP_STYLES.find(s => s.id === currentStyle)?.name}
        </Typography>
      </Paper>
    </>
  );
}