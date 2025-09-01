import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  CardActions,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Clear as ClearIcon,
  DoneAll as DoneAllIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  VolumeOff as MuteIcon,
  VolumeUp as UnmuteIcon,
  Add as AddIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useApp } from '../../contexts/AppContext';
import { Alert, AlertSeverity, AlertType } from '../../types/app.types';
import AddAlertDialog from './AddAlertDialog';

export default function AlertsPanel() {
  const { state, acknowledgeAlert, removeAlert, updateSettings, addAlert } = useApp();
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'all'>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState<'all' | 'emergency' | 'weather' | 'traffic' | 'notam' | 'accident' | 'user'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'severity' | 'type'>('time');
  const [notams, setNotams] = useState<any[]>([]);
  const [accidents, setAccidents] = useState<any[]>([]);
  const [weatherAlerts, setWeatherAlerts] = useState<any[]>([]);
  const [userAlerts, setUserAlerts] = useState<any[]>([]);
  const [addAlertDialogOpen, setAddAlertDialogOpen] = useState(false);

  // Cargar datos de NOTAMs, accidentes y clima
  useEffect(() => {
    // Simular NOTAMs
    const mockNotams = [
      {
        id: 'NOTAM001',
        airport: 'KJFK',
        title: 'Runway 04L/22R Closed',
        description: 'Runway 04L/22R closed for maintenance work',
        severity: 'high',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
        type: 'runway'
      },
      {
        id: 'NOTAM002',
        airport: 'KLAX',
        title: 'ILS Approach Unavailable',
        description: 'ILS approach to runway 25L out of service',
        severity: 'medium',
        startTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
        type: 'navigation'
      },
      {
        id: 'NOTAM003',
        airport: 'KORD',
        title: 'Taxiway Alpha Restricted',
        description: 'Taxiway Alpha restricted due to construction',
        severity: 'low',
        startTime: new Date(Date.now() - 30 * 60 * 1000),
        endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
        type: 'taxiway'
      }
    ];

    // Simular accidentes recientes
    const mockAccidents = [
      {
        id: 'ACC001',
        airport: 'KATL',
        title: 'Ground Collision Incident',
        description: 'Minor ground collision between two aircraft during pushback',
        severity: 'medium',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        aircraftInvolved: ['N123AB', 'N456CD'],
        injuries: 0,
        status: 'Under Investigation'
      },
      {
        id: 'ACC002',
        airport: 'KDEN',
        title: 'Emergency Landing',
        description: 'Aircraft made emergency landing due to engine malfunction',
        severity: 'high',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        aircraftInvolved: ['N789EF'],
        injuries: 0,
        status: 'Resolved'
      }
    ];

    // Simular alertas meteorológicas
    const mockWeatherAlerts = [
      {
        id: 'WX001',
        airport: 'KMIA',
        title: 'Severe Thunderstorms',
        description: 'Severe thunderstorms approaching from the west',
        severity: 'high',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
        type: 'thunderstorm',
        visibility: '2 SM',
        winds: '25G35KT'
      },
      {
        id: 'WX002',
        airport: 'KSEA',
        title: 'Low Visibility',
        description: 'Fog reducing visibility to less than 1/4 mile',
        severity: 'medium',
        startTime: new Date(Date.now() - 30 * 60 * 1000),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        type: 'fog',
        visibility: '1/4 SM',
        winds: 'CALM'
      }
    ];

    setNotams(mockNotams);
    setAccidents(mockAccidents);
    setWeatherAlerts(mockWeatherAlerts);
    
    // Cargar alertas personalizadas del localStorage
    const savedUserAlerts = localStorage.getItem('aerosynapse_user_alerts');
    if (savedUserAlerts) {
      try {
        const parsed = JSON.parse(savedUserAlerts);
        setUserAlerts(parsed.map((alert: any) => ({
          ...alert,
          timestamp: new Date(alert.timestamp),
          createdAt: new Date(alert.createdAt)
        })));
      } catch (error) {
        console.error('Error loading user alerts:', error);
      }
    }
  }, []);
  
  // Función para agregar alerta personalizada
  const handleAddUserAlert = (newAlert: any) => {
    const updatedUserAlerts = [...userAlerts, newAlert];
    setUserAlerts(updatedUserAlerts);
    
    // Guardar en localStorage
    localStorage.setItem('aerosynapse_user_alerts', JSON.stringify(updatedUserAlerts));
    
    // También agregar al sistema de alertas global si es inmediata
    if (!newAlert.scheduledTime || new Date(newAlert.scheduledTime) <= new Date()) {
      addAlert(newAlert);
    }
  };
  
  // Función para eliminar alerta personalizada
  const handleRemoveUserAlert = (alertId: string) => {
    const updatedUserAlerts = userAlerts.filter(alert => alert.id !== alertId);
    setUserAlerts(updatedUserAlerts);
    localStorage.setItem('aerosynapse_user_alerts', JSON.stringify(updatedUserAlerts));
    
    // También remover del sistema global
    removeAlert(alertId);
  };
  
  // Filtrar alertas
  const filteredAlerts = useMemo(() => {
    let alerts: any[] = [];
    
    // Combinar diferentes tipos de alertas
    if (filter === 'all' || filter === 'emergency') {
      alerts.push(...(state.alerts || []));
    }
    
    if (filter === 'all' || filter === 'user') {
      alerts.push(...userAlerts.map(userAlert => ({
        ...userAlert,
        type: 'user',
        message: userAlert.message,
        acknowledged: userAlert.acknowledged || false,
        isUserCreated: true
      })));
    }
    
    if (filter === 'all' || filter === 'notam') {
      alerts.push(...notams.map(notam => ({
        ...notam,
        type: 'notam',
        timestamp: notam.startTime,
        message: `${notam.airport}: ${notam.title}`,
        acknowledged: false
      })));
    }
    
    if (filter === 'all' || filter === 'accident') {
      alerts.push(...accidents.map(accident => ({
        ...accident,
        type: 'accident',
        timestamp: accident.date,
        message: `${accident.airport}: ${accident.title}`,
        acknowledged: false
      })));
    }
    
    if (filter === 'all' || filter === 'weather') {
      alerts.push(...weatherAlerts.map(weather => ({
        ...weather,
        type: 'weather',
        timestamp: weather.startTime,
        message: `${weather.airport}: ${weather.title}`,
        acknowledged: false
      })));
    }
    
    // Filtrar por severidad
    if (filterSeverity !== 'all') {
      alerts = alerts.filter(alert => alert.severity === filterSeverity);
    }
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      alerts = alerts.filter(alert => 
        alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (alert.airport && alert.airport.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filtrar alertas reconocidas
    if (!showAcknowledged) {
      alerts = alerts.filter(alert => !alert.acknowledged);
    }
    
    // Ordenar
    alerts.sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'severity':
          const severityOrder = { 'critical': 3, 'high': 2, 'medium': 1, 'low': 0 };
          return (severityOrder[b.severity as keyof typeof severityOrder] || 0) - 
                 (severityOrder[a.severity as keyof typeof severityOrder] || 0);
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });
    
    return alerts;
  }, [state.alerts, userAlerts, notams, accidents, weatherAlerts, filter, filterSeverity, searchTerm, showAcknowledged, sortBy]);
  
  const unacknowledgedCount = state.alerts.filter(a => !a.acknowledged).length;
  const criticalCount = state.alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;
  
  const getAlertIcon = (alert: Alert) => {
    if (alert.acknowledged) {
      return <CheckIcon color="success" />;
    }
    
    switch (alert.severity) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'high':
        return <WarningIcon color="error" />;
      case 'medium':
        return <WarningIcon color="warning" />;
      case 'low':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon />;
    }
  };
  
  const getAlertColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return 'error' as const;
      case 'high':
        return 'error' as const;
      case 'medium':
        return 'warning' as const;
      case 'low':
        return 'info' as const;
      default:
        return 'default' as const;
    }
  };
  
  const getAlertTypeLabel = (alert: any): string => {
    // Si es una alerta personalizada del usuario
    if (alert.isUserCreated || alert.type === 'user') {
      return '👤 Alerta Personal';
    }
    
    // Si es un tipo específico de alerta simulada
    if (typeof alert.type === 'string') {
      switch (alert.type) {
        case 'notam':
          return '📋 NOTAM';
        case 'accident':
          return '💥 Accidente';
        case 'weather':
          return '🌦️ Clima';
        case 'user':
          return '👤 Personal';
        default:
          break;
      }
    }
    
    // Tipos de alerta del sistema
    switch (alert.type) {
      case AlertType.COLLISION_WARNING:
        return 'Advertencia de Colisión';
      case AlertType.PROXIMITY_ALERT:
        return 'Alerta de Proximidad';
      case AlertType.ALTITUDE_DEVIATION:
        return 'Desviación de Altitud';
      case AlertType.COURSE_DEVIATION:
        return 'Desviación de Rumbo';
      case AlertType.WEATHER_WARNING:
        return 'Advertencia Meteorológica';
      case AlertType.AIRSPACE_VIOLATION:
        return 'Violación de Espacio Aéreo';
      case AlertType.SYSTEM_ERROR:
        return 'Recordatorio Personal';
      case AlertType.DATA_LOSS:
        return 'Nota de Vuelo';
      default:
        return 'Alerta';
    }
  };
  
  const acknowledgeAllAlerts = () => {
    state.alerts
      .filter(alert => !alert.acknowledged)
      .forEach(alert => acknowledgeAlert(alert.id));
  };
  
  const clearAcknowledgedAlerts = () => {
    state.alerts
      .filter(alert => alert.acknowledged)
      .forEach(alert => removeAlert(alert.id));
  };
  
  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) {
      return `hace ${seconds}s`;
    } else if (minutes < 60) {
      return `hace ${minutes}m`;
    } else {
      return `hace ${hours}h`;
    }
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          System Alerts
        </Typography>
        
        {/* Estadísticas */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`${unacknowledgedCount} unacknowledged`} 
            color={unacknowledgedCount > 0 ? 'warning' : 'success'}
            size="small"
          />
          {criticalCount > 0 && (
            <Chip 
              label={`${criticalCount} critical`} 
              color="error"
              size="small"
              sx={{ animation: 'blink 1s infinite' }}
            />
          )}
          <Chip 
            label={`${state.alerts.length} total`} 
            variant="outlined"
            size="small"
          />
        </Box>
        
        {/* Controles */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            size="small"
            startIcon={<DoneAllIcon />}
            onClick={acknowledgeAllAlerts}
            disabled={unacknowledgedCount === 0}
            variant="outlined"
          >
            Acknowledge All
          </Button>
          
          <Button
            size="small"
            startIcon={<ClearIcon />}
            onClick={clearAcknowledgedAlerts}
            disabled={state.alerts.filter(a => a.acknowledged).length === 0}
            variant="outlined"
          >
            Clear
          </Button>
          
          <Tooltip title="Filters">
            <IconButton 
              size="small" 
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? 'primary' : 'default'}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={state.settings.alertSounds ? 'Silenciar alertas' : 'Activar sonidos'}>
            <IconButton 
              size="small" 
              onClick={() => updateSettings({ alertSounds: !state.settings.alertSounds })}
              color={state.settings.alertSounds ? 'primary' : 'default'}
            >
              {state.settings.alertSounds ? <UnmuteIcon /> : <MuteIcon />}
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* Panel de filtros */}
        {showFilters && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Filters
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={filter}
                  label="Type"
                  onChange={(e) => setFilter(e.target.value as any)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="user">👤 My Alerts</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                  <MenuItem value="notam">📋 NOTAMs</MenuItem>
                  <MenuItem value="accident">💥 Accidents</MenuItem>
                  <MenuItem value="weather">🌦️ Weather</MenuItem>
                  <MenuItem value="traffic">Traffic</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={filterSeverity}
                  label="Severity"
                  onChange={(e) => setFilterSeverity(e.target.value as any)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={showAcknowledged}
                    onChange={(e) => setShowAcknowledged(e.target.checked)}
                    size="small"
                  />
                }
                label="Show acknowledged"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={state.settings.voiceAlerts}
                    onChange={(e) => updateSettings({ voiceAlerts: e.target.checked })}
                    size="small"
                  />
                }
                label="Voice alerts"
              />
            </Box>
          </Box>
        )}
      </Box>
      
      {/* Lista de alertas */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {filteredAlerts.length > 0 ? (
          <List>
            {filteredAlerts.map((alert) => (
              <ListItem key={alert.id} disablePadding>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    width: '100%', 
                    m: 1,
                    backgroundColor: alert.acknowledged ? 'background.default' : 'background.paper',
                    opacity: alert.acknowledged ? 0.7 : 1,
                    borderColor: alert.severity === 'critical' ? 'error.main' : 'divider'
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 1 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ mt: 0.5 }}>
                        {getAlertIcon(alert)}
                      </Box>
                      
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {alert.title}
                          </Typography>
                          <Chip 
                            label={alert.severity.toUpperCase()} 
                            size="small" 
                            color={getAlertColor(alert.severity)}
                            variant="outlined"
                          />
                        </Box>
                        
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {alert.message}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          <Chip 
                            label={getAlertTypeLabel(alert)} 
                            size="small" 
                            variant="outlined"
                            color={alert.isUserCreated ? 'primary' : 'default'}
                          />
                          <Chip 
                            label={formatTimestamp(alert.timestamp)} 
                            size="small" 
                            variant="outlined"
                          />
                          {alert.aircraftId && (
                            <Chip 
                              label={`Aircraft: ${alert.aircraftId}`} 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                          {alert.airport && (
                            <Chip 
                              label={`Airport: ${alert.airport}`} 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                          {alert.tags && alert.tags.length > 0 && (
                            alert.tags.map((tag: string) => (
                              <Chip 
                                key={tag}
                                label={tag} 
                                size="small" 
                                variant="outlined"
                                color="secondary"
                              />
                            ))
                          )}
                          {alert.isUserCreated && (
                            <Chip 
                              icon={<PersonIcon />}
                              label="Created by you" 
                              size="small" 
                              variant="filled"
                              color="primary"
                            />
                          )}
                        </Box>
                        
                        {alert.position && (
                          <Typography variant="caption" color="text.secondary">
                            Position: {alert.position.latitude.toFixed(4)}, {alert.position.longitude.toFixed(4)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                  
                  <CardActions sx={{ p: 1, pt: 0 }}>
                    {!alert.acknowledged ? (
                      <Button 
                        size="small" 
                        startIcon={<CheckIcon />}
                        onClick={() => acknowledgeAlert(alert.id)}
                        color="success"
                      >
                        Acknowledge
                      </Button>
                    ) : (
                      <Typography variant="caption" color="success.main">
                        ✓ Acknowledged
                      </Typography>
                    )}
                    
                    {alert.isUserCreated && (
                      <Button 
                        size="small" 
                        startIcon={<ClearIcon />}
                        onClick={() => handleRemoveUserAlert(alert.id)}
                        color="error"
                        sx={{ ml: 1 }}
                      >
                        Delete
                      </Button>
                    )}
                    
                    <Button 
                      size="small" 
                      startIcon={<ClearIcon />}
                      onClick={() => removeAlert(alert.id)}
                      color="error"
                      sx={{ ml: 'auto' }}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              {state.alerts.length === 0 
                ? 'No alerts in the system' 
                : 'No alerts match the current filters'}
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* Botón flotante para agregar alerta */}
      <Fab
        color="primary"
        size="medium"
        onClick={() => setAddAlertDialogOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 24,
          zIndex: 1000,
          background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
          '&:hover': {
            background: 'linear-gradient(45deg, #1976D2, #0288D1)',
            transform: 'scale(1.05)'
          },
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 20px rgba(33, 150, 243, 0.4)'
        }}
      >
        <AddIcon />
      </Fab>
      
      {/* Diálogo para agregar alerta */}
      <AddAlertDialog
        open={addAlertDialogOpen}
        onClose={() => setAddAlertDialogOpen(false)}
        onAddAlert={handleAddUserAlert}
      />
      
      {/* Animación blink se maneja en CSS global */}
    </Box>
  );
}