import React, { useState, useEffect } from 'react';
import { LayerGroup, TileLayer, GeoJSON } from 'react-leaflet';
import { Box, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Switch, FormControlLabel } from '@mui/material';
import {
  Cloud as CloudIcon,
  Satellite as SatelliteIcon,
  Air as WindIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../contexts/AppContext';

// Interfaces para datos meteorológicos
interface WeatherLayer {
  id: string;
  name: string;
  type: 'radar' | 'satellite' | 'winds' | 'sigmet';
  url: string;
  opacity: number;
  visible: boolean;
  icon: React.ReactNode;
}

interface SigmetData {
  id: string;
  type: 'SIGMET' | 'AIRMET';
  phenomenon: string;
  validFrom: Date;
  validTo: Date;
  geometry: GeoJSON.Geometry;
  severity: 'low' | 'moderate' | 'severe';
  description: string;
}

interface WeatherOverlayProps {
  visible: boolean;
}

export default function WeatherOverlay({ visible }: WeatherOverlayProps) {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [weatherLayers, setWeatherLayers] = useState<WeatherLayer[]>([
    {
      id: 'satellite',
      name: t('weather.satellite'),
      type: 'satellite',
      url: 'https://api.sat24.com/animated/{z}/{x}/{y}/1/visual_1km/2023010100',
      opacity: 0.7,
      visible: false,
      icon: <SatelliteIcon />
    },
    {
      id: 'winds',
      name: t('weather.winds_aloft'),
      type: 'winds',
      url: 'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY',
      opacity: 0.5,
      visible: false,
      icon: <WindIcon />
    }
  ]);
  
  const [sigmets, setSigmets] = useState<SigmetData[]>([]);
  const [showSigmets, setShowSigmets] = useState(true);

  // Cargar SIGMETs desde la API
  useEffect(() => {
    const fetchSigmets = async () => {
      try {
        // Simulación de datos SIGMET
        const mockSigmets: SigmetData[] = [
          {
            id: 'SIGMET_001',
            type: 'SIGMET',
            phenomenon: 'THUNDERSTORMS',
            validFrom: new Date(),
            validTo: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 horas
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-3.7, 40.4],
                [-3.6, 40.4],
                [-3.6, 40.5],
                [-3.7, 40.5],
                [-3.7, 40.4]
              ]]
            },
            severity: 'severe',
            description: 'Severe thunderstorms with hail and strong winds'
          }
        ];
        setSigmets(mockSigmets);
      } catch (error) {
        console.error('Error fetching SIGMETs:', error);
      }
    };

    if (visible) {
      fetchSigmets();
    }
  }, [visible]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const toggleLayer = (layerId: string) => {
    setWeatherLayers(prev => 
      prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, visible: !layer.visible }
          : layer
      )
    );
  };

  const getSigmetColor = (severity: string) => {
    switch (severity) {
      case 'severe': return '#ff0000';
      case 'moderate': return '#ff8800';
      case 'low': return '#ffff00';
      default: return '#888888';
    }
  };

  const getSigmetStyle = (feature: any) => {
    const severity = feature.properties?.severity || 'low';
    return {
      color: getSigmetColor(severity),
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.3,
      fillColor: getSigmetColor(severity)
    };
  };

  if (!visible) return null;

  return (
    <>
      {/* Capas de tiles meteorológicas */}
      <LayerGroup>
        {weatherLayers
          .filter(layer => layer.visible)
          .map(layer => (
            <TileLayer
              key={layer.id}
              url={layer.url}
              opacity={layer.opacity}
              attribution={`Weather data © ${layer.type}`}
            />
          ))
        }
      </LayerGroup>

      {/* SIGMETs y AIRMETs */}
      {showSigmets && (
        <LayerGroup>
          {sigmets.map(sigmet => (
            <GeoJSON
              key={sigmet.id}
              data={{
                type: 'Feature',
                geometry: sigmet.geometry,
                properties: {
                  id: sigmet.id,
                  type: sigmet.type,
                  phenomenon: sigmet.phenomenon,
                  severity: sigmet.severity,
                  description: sigmet.description,
                  validFrom: sigmet.validFrom.toISOString(),
                  validTo: sigmet.validTo.toISOString()
                }
              } as any}
              style={getSigmetStyle}
              onEachFeature={(feature, layer) => {
                layer.bindPopup(`
                  <div>
                    <h4>${feature.properties.type}</h4>
                    <p><strong>Phenomenon:</strong> ${feature.properties.phenomenon}</p>
                    <p><strong>Severity:</strong> ${feature.properties.severity}</p>
                    <p><strong>Valid:</strong> ${new Date(feature.properties.validFrom).toLocaleString()} - ${new Date(feature.properties.validTo).toLocaleString()}</p>
                    <p>${feature.properties.description}</p>
                  </div>
                `);
              }}
            />
          ))}
        </LayerGroup>
      )}

      {/* Control de capas meteorológicas */}
      <Box
        sx={{
          position: 'absolute',
          top: 120,
          right: 16,
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 1,
          boxShadow: 2
        }}
      >
        <IconButton
          onClick={handleMenuClick}
          sx={{ color: 'primary.main' }}
          title={t('weather.layers')}
        >
          <CloudIcon />
        </IconButton>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { minWidth: 250 }
          }}
        >
          {weatherLayers.map(layer => (
            <MenuItem key={layer.id} onClick={() => toggleLayer(layer.id)}>
              <ListItemIcon>{layer.icon}</ListItemIcon>
              <ListItemText primary={layer.name} />
              <Switch
                checked={layer.visible}
                size="small"
                color="primary"
              />
            </MenuItem>
          ))}
          
          <MenuItem onClick={() => setShowSigmets(!showSigmets)}>
            <ListItemIcon><WarningIcon /></ListItemIcon>
            <ListItemText primary={t('weather.sigmets')} />
            <Switch
              checked={showSigmets}
              size="small"
              color="primary"
            />
          </MenuItem>
        </Menu>
      </Box>
    </>
  );
}

// Hook personalizado para datos meteorológicos
export const useWeatherData = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = async (station: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Aquí se haría la llamada real a la API del backend
      const response = await fetch(`/api/weather/metar/${station}`);
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return {
    weatherData,
    loading,
    error,
    fetchWeatherData
  };
};