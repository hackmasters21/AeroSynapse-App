import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  AlertTitle
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Info as LegendIcon,
  Flight as FlightIcon,
  Warning as WarningIcon,
  Cloud as CloudIcon,
  Security as SecurityIcon,
  Map as MapIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../contexts/AppContext';

// Interfaces para elementos de la leyenda
interface LegendItem {
  id: string;
  label: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  category: 'aircraft' | 'weather' | 'safety' | 'airspace' | 'navigation';
  visible: boolean;
}

interface LegendCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  items: LegendItem[];
  expanded: boolean;
}

interface InteractiveLegendProps {
  visible: boolean;
  onToggle: () => void;
  position?: 'left' | 'right';
}

export default function InteractiveLegend({ 
  visible, 
  onToggle, 
  position = 'left' 
}: InteractiveLegendProps) {
  const { t } = useTranslation();
  const { state } = useApp();
  
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['aircraft', 'safety']);
  const [showWarnings, setShowWarnings] = useState(true);

  // Definición de categorías y elementos de la leyenda
  const legendCategories: LegendCategory[] = [
    {
      id: 'aircraft',
      name: t('legend.aircraft'),
      icon: <FlightIcon />,
      expanded: expandedCategories.includes('aircraft'),
      items: [
        {
          id: 'aircraft_normal',
          label: t('legend.normal_aircraft'),
          description: t('legend.normal_aircraft_desc'),
          color: '#2196f3',
          icon: <FlightIcon sx={{ color: '#2196f3' }} />,
          category: 'aircraft',
          visible: true
        },
        {
          id: 'aircraft_emergency',
          label: t('legend.emergency_aircraft'),
          description: t('legend.emergency_aircraft_desc'),
          color: '#f44336',
          icon: <FlightIcon sx={{ color: '#f44336' }} />,
          category: 'aircraft',
          visible: true
        },
        {
          id: 'aircraft_selected',
          label: t('legend.selected_aircraft'),
          description: t('legend.selected_aircraft_desc'),
          color: '#ff9800',
          icon: <FlightIcon sx={{ color: '#ff9800' }} />,
          category: 'aircraft',
          visible: true
        },
        {
          id: 'aircraft_ground',
          label: t('legend.ground_aircraft'),
          description: t('legend.ground_aircraft_desc'),
          color: '#9e9e9e',
          icon: <FlightIcon sx={{ color: '#9e9e9e' }} />,
          category: 'aircraft',
          visible: true
        }
      ]
    },
    {
      id: 'weather',
      name: t('legend.weather'),
      icon: <CloudIcon />,
      expanded: expandedCategories.includes('weather'),
      items: [
        {
          id: 'weather_radar',
          label: t('legend.weather_radar'),
          description: t('legend.weather_radar_desc'),
          color: '#4caf50',
          icon: <Box sx={{ width: 16, height: 16, backgroundColor: '#4caf50', opacity: 0.6 }} />,
          category: 'weather',
          visible: true
        },
        {
          id: 'weather_sigmet',
          label: t('legend.sigmets'),
          description: t('legend.sigmets_desc'),
          color: '#ff5722',
          icon: <WarningIcon sx={{ color: '#ff5722' }} />,
          category: 'weather',
          visible: true
        },
        {
          id: 'weather_satellite',
          label: t('legend.satellite'),
          description: t('legend.satellite_desc'),
          color: '#9c27b0',
          icon: <Box sx={{ width: 16, height: 16, backgroundColor: '#9c27b0', opacity: 0.7 }} />,
          category: 'weather',
          visible: true
        },
        {
          id: 'weather_winds',
          label: t('legend.winds_aloft'),
          description: t('legend.winds_aloft_desc'),
          color: '#00bcd4',
          icon: <Box sx={{ width: 16, height: 16, backgroundColor: '#00bcd4', opacity: 0.5 }} />,
          category: 'weather',
          visible: true
        }
      ]
    },
    {
      id: 'safety',
      name: t('legend.safety'),
      icon: <SecurityIcon />,
      expanded: expandedCategories.includes('safety'),
      items: [
        {
          id: 'accident_fatal',
          label: t('legend.fatal_accidents'),
          description: t('legend.fatal_accidents_desc'),
          color: '#d32f2f',
          icon: <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#d32f2f' }} />,
          category: 'safety',
          visible: true
        },
        {
          id: 'accident_major',
          label: t('legend.major_accidents'),
          description: t('legend.major_accidents_desc'),
          color: '#f57c00',
          icon: <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f57c00' }} />,
          category: 'safety',
          visible: true
        },
        {
          id: 'accident_minor',
          label: t('legend.minor_accidents'),
          description: t('legend.minor_accidents_desc'),
          color: '#fbc02d',
          icon: <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#fbc02d' }} />,
          category: 'safety',
          visible: true
        },
        {
          id: 'risk_zones',
          label: t('legend.risk_zones'),
          description: t('legend.risk_zones_desc'),
          color: '#ff5722',
          icon: <Box sx={{ 
            width: 16, 
            height: 16, 
            borderRadius: '50%', 
            border: '2px solid #ff5722',
            backgroundColor: 'transparent'
          }} />,
          category: 'safety',
          visible: true
        }
      ]
    },
    {
      id: 'airspace',
      name: t('legend.airspace'),
      icon: <MapIcon />,
      expanded: expandedCategories.includes('airspace'),
      items: [
        {
          id: 'airspace_controlled',
          label: t('legend.controlled_airspace'),
          description: t('legend.controlled_airspace_desc'),
          color: '#3f51b5',
          icon: <Box sx={{ 
            width: 16, 
            height: 16, 
            border: '2px solid #3f51b5',
            backgroundColor: 'rgba(63, 81, 181, 0.1)'
          }} />,
          category: 'airspace',
          visible: true
        },
        {
          id: 'airspace_restricted',
          label: t('legend.restricted_airspace'),
          description: t('legend.restricted_airspace_desc'),
          color: '#f44336',
          icon: <Box sx={{ 
            width: 16, 
            height: 16, 
            border: '2px solid #f44336',
            backgroundColor: 'rgba(244, 67, 54, 0.1)'
          }} />,
          category: 'airspace',
          visible: true
        },
        {
          id: 'airports',
          label: t('legend.airports'),
          description: t('legend.airports_desc'),
          color: '#4caf50',
          icon: <Box sx={{ 
            width: 12, 
            height: 12, 
            backgroundColor: '#4caf50',
            transform: 'rotate(45deg)'
          }} />,
          category: 'airspace',
          visible: true
        }
      ]
    },
    {
      id: 'navigation',
      name: t('legend.navigation'),
      icon: <InfoIcon />,
      expanded: expandedCategories.includes('navigation'),
      items: [
        {
          id: 'vor_stations',
          label: t('legend.vor_stations'),
          description: t('legend.vor_stations_desc'),
          color: '#9c27b0',
          icon: <Box sx={{ 
            width: 12, 
            height: 12, 
            backgroundColor: '#9c27b0',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
          }} />,
          category: 'navigation',
          visible: true
        },
        {
          id: 'waypoints',
          label: t('legend.waypoints'),
          description: t('legend.waypoints_desc'),
          color: '#607d8b',
          icon: <Box sx={{ 
            width: 8, 
            height: 8, 
            backgroundColor: '#607d8b',
            borderRadius: '50%'
          }} />,
          category: 'navigation',
          visible: true
        }
      ]
    }
  ];

  const handleCategoryToggle = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#b71c1c';
      case 'high': return '#d32f2f';
      case 'medium': return '#f57c00';
      case 'low': return '#388e3c';
      default: return '#757575';
    }
  };

  if (!visible) {
    return (
      <Box
        sx={{
          position: 'absolute',
          [position]: 16,
          bottom: 16,
          zIndex: 1000
        }}
      >
        <Tooltip title={t('legend.show_legend')}>
          <IconButton
            onClick={onToggle}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 1)'
              }
            }}
          >
            <LegendIcon />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Paper
      sx={{
        position: 'absolute',
        [position]: 16,
        bottom: 16,
        width: 320,
        maxHeight: '70vh',
        overflow: 'auto',
        zIndex: 1000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LegendIcon sx={{ mr: 1 }} />
          <Typography variant="h6">{t('legend.map_legend')}</Typography>
        </Box>
        <IconButton onClick={onToggle} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {/* Advertencias de seguridad */}
      {showWarnings && (
        <Box sx={{ p: 2 }}>
          <Alert 
            severity="warning" 
            onClose={() => setShowWarnings(false)}
            sx={{ mb: 2 }}
          >
            <AlertTitle>{t('legend.safety_warning_title')}</AlertTitle>
            {t('legend.safety_warning_text')}
          </Alert>
        </Box>
      )}

      {/* Categorías de la leyenda */}
      <Box sx={{ pb: 2 }}>
        {legendCategories.map(category => (
          <Accordion
            key={category.id}
            expanded={category.expanded}
            onChange={() => handleCategoryToggle(category.id)}
            sx={{ 
              boxShadow: 'none',
              '&:before': { display: 'none' }
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ minHeight: 48 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {category.icon}
                <Typography sx={{ ml: 1 }}>{category.name}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <List dense>
                {category.items.map(item => (
                  <ListItem key={item.id} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      secondary={item.description}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      <Divider />

      {/* Información adicional */}
      <Box sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {t('legend.data_sources')}: OpenSky Network, AWC, NTSB, ASN
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">
          {t('legend.last_update')}: {new Date().toLocaleTimeString()}
        </Typography>
      </Box>
    </Paper>
  );
}

// Hook para gestionar la leyenda
export const useInteractiveLegend = () => {
  const [legendVisible, setLegendVisible] = useState(false);
  const [legendPosition, setLegendPosition] = useState<'left' | 'right'>('left');

  const toggleLegend = () => {
    setLegendVisible(prev => !prev);
  };

  const showLegend = () => setLegendVisible(true);
  const hideLegend = () => setLegendVisible(false);

  const switchPosition = () => {
    setLegendPosition(prev => prev === 'left' ? 'right' : 'left');
  };

  return {
    legendVisible,
    legendPosition,
    toggleLegend,
    showLegend,
    hideLegend,
    switchPosition
  };
};