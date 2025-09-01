import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Badge
} from '@mui/material';
import {
  Map as MapIcon,
  Flight as FlightIcon,
  Route as RouteIcon,
  Warning as AlertIcon,
  Radar as RadarIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  Calculate as PlanningIcon
} from '@mui/icons-material';
import { useApp } from '../../contexts/AppContext';

interface SidebarProps {
  open: boolean;
  activePanel: string;
  onPanelChange: (panel: string) => void;
}

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 60;

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  divider?: boolean;
}

export default function Sidebar({ open, activePanel, onPanelChange }: SidebarProps) {
  const { state } = useApp();
  
  const unacknowledgedAlerts = state.alerts.filter(alert => !alert.acknowledged).length;
  
  const menuItems: MenuItem[] = [
    {
      id: 'map',
      label: 'Map',
      icon: <MapIcon />
    },
    {
      id: 'traffic',
      label: 'Air Traffic',
      icon: <FlightIcon />,
      badge: state.aircraft.length
    },
    {
      id: 'route',
      label: 'Route',
      icon: <RouteIcon />
    },
    {
      id: 'planning',
      label: 'Planning',
      icon: <PlanningIcon />
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <AlertIcon />,
      badge: unacknowledgedAlerts
    },

    {
      id: 'divider1',
      label: '',
      icon: null,
      divider: true
    },
    {
      id: 'radar',
      label: 'Radar',
      icon: <RadarIcon />
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <TimelineIcon />
    },
    {
      id: 'divider2',
      label: '',
      icon: null,
      divider: true
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon />
    },
    {
      id: 'about',
      label: 'About',
      icon: <InfoIcon />
    }
  ];
  
  const handleItemClick = (itemId: string) => {
    if (itemId !== 'divider1' && itemId !== 'divider2') {
      onPanelChange(itemId);
    }
  };
  
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
          boxSizing: 'border-box',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
          backgroundColor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider'
        },
      }}
    >
      {/* Espaciado para el header */}
      <Box sx={{ height: 64 }} />
      
      {/* Logo colapsado */}
      {!open && (
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
            AS
          </Typography>
        </Box>
      )}
      
      {/* Lista de navegación */}
      <List sx={{ pt: open ? 2 : 1 }}>
        {menuItems.map((item) => {
          if (item.divider) {
            return <Divider key={item.id} sx={{ my: 1 }} />;
          }
          
          const isActive = activePanel === item.id;
          
          return (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                selected={isActive}
                onClick={() => handleItemClick(item.id)}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    }
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 3 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  {item.badge !== undefined && item.badge > 0 ? (
                    <Badge 
                      badgeContent={item.badge} 
                      color={item.id === 'alerts' ? 'error' : 'primary'}
                      max={99}
                    >
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                
                {open && (
                  <ListItemText 
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 'bold' : 'normal'
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      {/* Información de estado en la parte inferior */}
      {open && (
        <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" display="block">
            System Status
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: state.isConnected ? 'success.main' : 'error.main'
                }}
              />
              <Typography variant="caption">
                {state.isConnected ? 'Connected' : 'Disconnected'}
              </Typography>
            </Box>
            
            {state.lastUpdate && (
              <Typography variant="caption" color="text.secondary" display="block">
                Last update: {state.lastUpdate.toLocaleTimeString()}
              </Typography>
            )}
            
            {state.error && (
              <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                Error: {state.error}
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Drawer>
  );
}