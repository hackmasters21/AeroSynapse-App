import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Tooltip,
  Switch,
  FormControlLabel,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  NightsStay as NightModeIcon,
  Settings as SettingsIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  FilterList as FilterIcon,
  Info as InfoIcon,
  Help as HelpIcon,
  Refresh as RefreshIcon,
  Headphones as HeadphonesIcon,
  Radar as RadarIcon
} from '@mui/icons-material';
import { ThemeMode } from '../../types/app.types';
import { useApp } from '../../contexts/AppContext';
import { useSocket } from '../../contexts/SocketContext';

import ATCPanel, { useATC } from '../ATC/ATCPanel';

interface HeaderProps {
  themeMode: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export default function Header({
  themeMode,
  onThemeChange,
  sidebarOpen,
  onSidebarToggle
}: HeaderProps) {
  const { state } = useApp();
  const { isConnected, reconnectAttempts } = useSocket();
  const { atcPanelOpen, toggleATCPanel, closeATCPanel } = useATC();
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(null);
  const settingsOpen = Boolean(settingsAnchorEl);
  
  const handleThemeToggle = () => {
    const themes: ThemeMode[] = ['light', 'dark', 'night'];
    const currentIndex = themes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % themes.length;
    onThemeChange(themes[nextIndex]);
  };
  
  const handleSettingsClick = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };
  
  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };
  
  const handleRefreshData = () => {
    window.location.reload();
    handleSettingsClose();
  };
  
  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light':
        return <LightModeIcon />;
      case 'dark':
        return <DarkModeIcon />;
      case 'night':
        return <NightModeIcon />;
      default:
        return <DarkModeIcon />;
    }
  };
  
  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: themeMode === 'night' ? '#000000' : undefined
      }}
    >
      <Toolbar>
        {/* Botón de menú */}
        <IconButton
          color="inherit"
          aria-label="toggle sidebar"
          onClick={onSidebarToggle}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        {/* Logo y título */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            AeroSynapse
          </Typography>
          <Typography variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
            Situational Awareness System
          </Typography>
        </Box>
        
        {/* Indicadores de estado */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
          {/* Connection Status */}
          <Tooltip title={isConnected ? 'Connected' : `Disconnected (${reconnectAttempts} attempts)`}>
            <Chip
              icon={isConnected ? <WifiIcon /> : <WifiOffIcon />}
              label={isConnected ? 'Online' : 'Offline'}
              color={isConnected ? 'success' : 'error'}
              size="small"
              variant="outlined"
            />
          </Tooltip>
          

          
          {/* Active Alerts */}
          {state.alerts.filter(a => !a.acknowledged).length > 0 && (
            <Chip
              label={`${state.alerts.filter(a => !a.acknowledged).length} alerts`}
              color="warning"
              size="small"
              variant="filled"
            />
          )}
        </Box>
        
        {/* Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          
          {/* Theme Selector */}
          <Tooltip title={`Theme: ${themeMode}`}>
            <IconButton color="inherit" onClick={handleThemeToggle}>
              {getThemeIcon()}
            </IconButton>
          </Tooltip>
          
          {/* Settings */}
          <Tooltip title="Settings">
            <IconButton 
              color="inherit" 
              onClick={handleSettingsClick}
              aria-controls={settingsOpen ? 'settings-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={settingsOpen ? 'true' : undefined}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* Settings Menu */}
        <Menu
          id="settings-menu"
          anchorEl={settingsAnchorEl}
          open={settingsOpen}
          onClose={handleSettingsClose}
          MenuListProps={{
            'aria-labelledby': 'settings-button',
          }}
          PaperProps={{
            sx: { minWidth: 200 }
          }}
        >
          <MenuItem onClick={handleRefreshData}>
            <ListItemIcon>
              <RefreshIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Refresh Data</ListItemText>
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleSettingsClose}>
            <ListItemIcon>
              <FilterIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Advanced Filters</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={handleSettingsClose}>
            <ListItemIcon>
              <InfoIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>System Information</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={handleSettingsClose}>
            <ListItemIcon>
              <HelpIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Help</ListItemText>
          </MenuItem>
         </Menu>
         
         {/* Panel ATC */}
          <ATCPanel visible={atcPanelOpen} onClose={closeATCPanel} />
          

          

        </Toolbar>
      </AppBar>
    );
  }