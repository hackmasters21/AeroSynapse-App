import React, { useState, useEffect } from 'react';
import { LayerGroup, CircleMarker, Popup, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { Box, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Switch, Chip, Typography } from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  Flight as FlightIcon,
  Place as PlaceIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../contexts/AppContext';

// Interfaces para datos de seguridad
interface AccidentData {
  id: string;
  date: Date;
  location: {
    latitude: number;
    longitude: number;
    city?: string;
    country: string;
  };
  aircraft: {
    type: string;
    registration: string;
  };
  severity: 'minor' | 'major' | 'fatal';
  phase: 'takeoff' | 'climb' | 'cruise' | 'descent' | 'approach' | 'landing';
  fatalities: number;
  description: string;
  cause?: string;
}

interface RiskZone {
  id: string;
  center: [number, number];
  radius: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  accidentCount: number;
  description: string;
  factors: string[];
}

interface SafetyAlert {
  id: string;
  type: 'weather' | 'terrain' | 'traffic' | 'accident_cluster';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location?: {
    latitude: number;
    longitude: number;
    radius?: number;
  };
  validUntil: Date;
}

interface SafetyOverlayProps {
  visible: boolean;
}

export default function SafetyOverlay({ visible }: SafetyOverlayProps) {
  const { t } = useTranslation();
  const { state } = useApp();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [accidents, setAccidents] = useState<AccidentData[]>([]);
  const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [showAccidents, setShowAccidents] = useState(true);
  const [showRiskZones, setShowRiskZones] = useState(true);
  const [showSafetyAlerts, setShowSafetyAlerts] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string[]>(['major', 'fatal']);

  // Cargar datos de seguridad
  useEffect(() => {
    const fetchSafetyData = async () => {
      try {
        // Simulación de datos de accidentes
        const mockAccidents: AccidentData[] = [
          {
            id: 'ACC_001',
            date: new Date('2023-06-15'),
            location: {
              latitude: 40.4168,
              longitude: -3.7038,
              city: 'Madrid',
              country: 'Spain'
            },
            aircraft: {
              type: 'Boeing 737',
              registration: 'EC-ABC'
            },
            severity: 'major',
            phase: 'approach',
            fatalities: 0,
            description: 'Hard landing due to wind shear',
            cause: 'Weather conditions'
          },
          {
            id: 'ACC_002',
            date: new Date('2023-08-22'),
            location: {
              latitude: 41.2974,
              longitude: 2.0833,
              city: 'Barcelona',
              country: 'Spain'
            },
            aircraft: {
              type: 'Airbus A320',
              registration: 'EC-XYZ'
            },
            severity: 'fatal',
            phase: 'takeoff',
            fatalities: 154,
            description: 'Engine failure during takeoff',
            cause: 'Mechanical failure'
          }
        ];

        // Simulación de zonas de riesgo
        const mockRiskZones: RiskZone[] = [
          {
            id: 'RISK_001',
            center: [40.4168, -3.7038],
            radius: 5000,
            riskLevel: 'medium',
            accidentCount: 3,
            description: 'Airport approach area with wind shear history',
            factors: ['Wind shear', 'Terrain', 'Weather patterns']
          },
          {
            id: 'RISK_002',
            center: [41.2974, 2.0833],
            radius: 8000,
            riskLevel: 'high',
            accidentCount: 5,
            description: 'High traffic density area with multiple incidents',
            factors: ['Traffic density', 'Complex airspace', 'Weather']
          }
        ];

        // Simulación de alertas de seguridad
        const mockSafetyAlerts: SafetyAlert[] = [
          {
            id: 'ALERT_001',
            type: 'accident_cluster',
            severity: 'high',
            title: 'Increased accident frequency',
            description: 'Multiple incidents reported in this area within the last 30 days',
            location: {
              latitude: 40.4168,
              longitude: -3.7038,
              radius: 10000
            },
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        ];

        setAccidents(mockAccidents);
        setRiskZones(mockRiskZones);
        setSafetyAlerts(mockSafetyAlerts);
      } catch (error) {
        console.error('Error fetching safety data:', error);
      }
    };

    if (visible) {
      fetchSafetyData();
    }
  }, [visible]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'fatal': return '#d32f2f';
      case 'major': return '#f57c00';
      case 'minor': return '#fbc02d';
      case 'critical': return '#b71c1c';
      case 'high': return '#d32f2f';
      case 'medium': return '#f57c00';
      case 'low': return '#388e3c';
      default: return '#757575';
    }
  };

  const getRiskZoneStyle = (riskLevel: string) => {
    const color = getSeverityColor(riskLevel);
    return {
      color: color,
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.2,
      fillColor: color
    };
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'fatal':
      case 'critical':
        return <ErrorIcon sx={{ color: getSeverityColor(severity) }} />;
      case 'major':
      case 'high':
        return <WarningIcon sx={{ color: getSeverityColor(severity) }} />;
      default:
        return <InfoIcon sx={{ color: getSeverityColor(severity) }} />;
    }
  };

  const filteredAccidents = accidents.filter(accident => 
    selectedSeverity.includes(accident.severity)
  );

  if (!visible) return null;

  return (
    <>
      {/* Marcadores de accidentes */}
      {showAccidents && (
        <LayerGroup>
          {filteredAccidents.map(accident => (
            <CircleMarker
              key={accident.id}
              center={[accident.location.latitude, accident.location.longitude]}
              radius={accident.severity === 'fatal' ? 12 : accident.severity === 'major' ? 8 : 5}
              color={getSeverityColor(accident.severity)}
              fillColor={getSeverityColor(accident.severity)}
              fillOpacity={0.7}
              weight={2}
            >
              <Popup>
                <Box sx={{ minWidth: 250 }}>
                  <Typography variant="h6" gutterBottom>
                    {getSeverityIcon(accident.severity)}
                    {accident.aircraft.type}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Date:</strong> {accident.date.toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Location:</strong> {accident.location.city}, {accident.location.country}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Phase:</strong> {accident.phase}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Registration:</strong> {accident.aircraft.registration}
                  </Typography>
                  {accident.fatalities > 0 && (
                    <Typography variant="body2" gutterBottom color="error">
                      <strong>Fatalities:</strong> {accident.fatalities}
                    </Typography>
                  )}
                  <Typography variant="body2" gutterBottom>
                    <strong>Description:</strong> {accident.description}
                  </Typography>
                  {accident.cause && (
                    <Typography variant="body2">
                      <strong>Cause:</strong> {accident.cause}
                    </Typography>
                  )}
                </Box>
              </Popup>
            </CircleMarker>
          ))}
        </LayerGroup>
      )}

      {/* Zonas de riesgo */}
      {showRiskZones && (
        <LayerGroup>
          {riskZones.map(zone => (
            <GeoJSON
              key={zone.id}
              data={{
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [zone.center[1], zone.center[0]]
                },
                properties: {
                  radius: zone.radius,
                  riskLevel: zone.riskLevel,
                  accidentCount: zone.accidentCount,
                  description: zone.description,
                  factors: zone.factors
                }
              } as any}
              pointToLayer={(feature, latlng) => {
                return new L.Circle(latlng, {
                  radius: feature.properties.radius,
                  ...getRiskZoneStyle(feature.properties.riskLevel)
                });
              }}
              onEachFeature={(feature, layer) => {
                layer.bindPopup(`
                  <div>
                    <h4>Risk Zone - ${feature.properties.riskLevel.toUpperCase()}</h4>
                    <p><strong>Accidents:</strong> ${feature.properties.accidentCount}</p>
                    <p><strong>Description:</strong> ${feature.properties.description}</p>
                    <p><strong>Risk Factors:</strong></p>
                    <ul>
                      ${feature.properties.factors.map((factor: string) => `<li>${factor}</li>`).join('')}
                    </ul>
                  </div>
                `);
              }}
            />
          ))}
        </LayerGroup>
      )}

      {/* Alertas de seguridad */}
      {showSafetyAlerts && (
        <LayerGroup>
          {safetyAlerts.map(alert => (
            alert.location && (
              <CircleMarker
                key={alert.id}
                center={[alert.location.latitude, alert.location.longitude]}
                radius={15}
                color={getSeverityColor(alert.severity)}
                fillColor={getSeverityColor(alert.severity)}
                fillOpacity={0.3}
                weight={3}
                className="safety-alert-marker"
              >
                <Popup>
                  <Box sx={{ minWidth: 200 }}>
                    <Typography variant="h6" gutterBottom>
                      {getSeverityIcon(alert.severity)}
                      {alert.title}
                    </Typography>
                    <Chip 
                      label={alert.type.replace('_', ' ').toUpperCase()} 
                      size="small" 
                      color="warning"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" gutterBottom>
                      {alert.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Valid until: {alert.validUntil.toLocaleDateString()}
                    </Typography>
                  </Box>
                </Popup>
              </CircleMarker>
            )
          ))}
        </LayerGroup>
      )}

      {/* Control de capas de seguridad */}
      <Box
        sx={{
          position: 'absolute',
          top: 180,
          right: 16,
          zIndex: 1000,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 1,
          boxShadow: 2
        }}
      >
        <IconButton
          onClick={handleMenuClick}
          sx={{ color: 'error.main' }}
          title={t('safety.layers')}
        >
          <SecurityIcon />
        </IconButton>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: { minWidth: 280 }
          }}
        >
          <MenuItem onClick={() => setShowAccidents(!showAccidents)}>
            <ListItemIcon><FlightIcon /></ListItemIcon>
            <ListItemText primary={t('safety.accidents')} />
            <Switch
              checked={showAccidents}
              size="small"
              color="primary"
            />
          </MenuItem>
          
          <MenuItem onClick={() => setShowRiskZones(!showRiskZones)}>
            <ListItemIcon><PlaceIcon /></ListItemIcon>
            <ListItemText primary={t('safety.risk_zones')} />
            <Switch
              checked={showRiskZones}
              size="small"
              color="primary"
            />
          </MenuItem>
          
          <MenuItem onClick={() => setShowSafetyAlerts(!showSafetyAlerts)}>
            <ListItemIcon><WarningIcon /></ListItemIcon>
            <ListItemText primary={t('safety.alerts')} />
            <Switch
              checked={showSafetyAlerts}
              size="small"
              color="primary"
            />
          </MenuItem>
        </Menu>
      </Box>

      {/* Estilos CSS para animaciones */}
      <style>{`
        .safety-alert-marker {
          animation: pulse-safety 2s infinite;
        }
        
        @keyframes pulse-safety {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}

// Hook personalizado para datos de seguridad
export const useSafetyData = () => {
  const [safetyData, setSafetyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSafetyData = async (bounds?: any) => {
    setLoading(true);
    setError(null);
    
    try {
      // Aquí se haría la llamada real a la API del backend
      const response = await fetch('/api/safety/accidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ bounds })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch safety data');
      }
      
      const data = await response.json();
      setSafetyData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return {
    safetyData,
    loading,
    error,
    fetchSafetyData
  };
};