import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Button,
  Divider,
  Alert,
  TextField,
  Chip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Map as MapIcon,
  Flight as FlightIcon,
  Save as SaveIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';

export default function SettingsPanel() {
  const [settings, setSettings] = useState({
    // Display Settings
    theme: 'dark',
    language: 'en',
    units: 'metric',
    
    // Map Settings
    mapStyle: 'openstreetmap',
    showTrails: true,
    trailLength: 10,
    showLabels: true,
    
    // Aircraft Settings
    showOnGround: true,
    showEmergency: true,
    updateInterval: 5,
    maxAircraft: 1000,
    
    // Notifications
    soundAlerts: true,
    emergencyAlerts: true,
    proximityAlerts: false,
    alertVolume: 70,
    
    // Data Sources
    openSkyEnabled: true,
    flightradar24Enabled: false,
    adsb: true,
    
    // Performance
    maxRange: 250,
    dataCompression: true,
    cacheEnabled: true
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('aerosynapse-settings', JSON.stringify(settings));
    // Show success message
  };

  const handleReset = () => {
    // Reset to defaults
    setSettings({
      theme: 'dark',
      language: 'en',
      units: 'metric',
      mapStyle: 'openstreetmap',
      showTrails: true,
      trailLength: 10,
      showLabels: true,
      showOnGround: true,
      showEmergency: true,
      updateInterval: 5,
      maxAircraft: 1000,
      soundAlerts: true,
      emergencyAlerts: true,
      proximityAlerts: false,
      alertVolume: 70,
      openSkyEnabled: true,
      flightradar24Enabled: false,
      adsb: true,
      maxRange: 250,
      dataCompression: true,
      cacheEnabled: true
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          System Settings
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button
            startIcon={<SaveIcon />}
            onClick={handleSave}
            variant="contained"
            size="small"
          >
            Save
          </Button>
          <Button
            startIcon={<RestoreIcon />}
            onClick={handleReset}
            variant="outlined"
            size="small"
          >
            Reset
          </Button>
        </Box>
      </Box>

      {/* Settings Content */}
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        {/* Display Settings */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Display Settings
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Theme</InputLabel>
              <Select
                value={settings.theme}
                onChange={(e) => handleSettingChange('theme', e.target.value)}
                label="Theme"
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="night">Night Mode</MenuItem>
              </Select>
            </FormControl>
            

            
            <FormControl fullWidth>
              <InputLabel>Units</InputLabel>
              <Select
                value={settings.units}
                onChange={(e) => handleSettingChange('units', e.target.value)}
                label="Units"
              >
                <MenuItem value="metric">Metric (km, m/s)</MenuItem>
                <MenuItem value="imperial">Imperial (mi, ft/s)</MenuItem>
                <MenuItem value="aviation">Aviation (NM, kts)</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>

        {/* Map Settings */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <MapIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Map Settings</Typography>
            </Box>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Map Style</InputLabel>
              <Select
                value={settings.mapStyle}
                onChange={(e) => handleSettingChange('mapStyle', e.target.value)}
                label="Map Style"
              >
                <MenuItem value="openstreetmap">OpenStreetMap</MenuItem>
                <MenuItem value="satellite">Satellite</MenuItem>
                <MenuItem value="terrain">Terrain</MenuItem>
                <MenuItem value="aviation">Aviation</MenuItem>
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showTrails}
                  onChange={(e) => handleSettingChange('showTrails', e.target.checked)}
                />
              }
              label="Show Aircraft Trails"
              sx={{ mb: 2 }}
            />
            
            {settings.showTrails && (
              <Box sx={{ mb: 2 }}>
                <Typography gutterBottom>Trail Length: {settings.trailLength} points</Typography>
                <Slider
                  value={settings.trailLength}
                  onChange={(_, value) => handleSettingChange('trailLength', value)}
                  min={5}
                  max={50}
                  step={5}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>
            )}
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showLabels}
                  onChange={(e) => handleSettingChange('showLabels', e.target.checked)}
                />
              }
              label="Show Aircraft Labels"
            />
          </CardContent>
        </Card>

        {/* Aircraft Settings */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FlightIcon sx={{ mr: 1, color: 'secondary.main' }} />
              <Typography variant="h6">Aircraft Settings</Typography>
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showOnGround}
                  onChange={(e) => handleSettingChange('showOnGround', e.target.checked)}
                />
              }
              label="Show Aircraft on Ground"
              sx={{ mb: 2 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.showEmergency}
                  onChange={(e) => handleSettingChange('showEmergency', e.target.checked)}
                />
              }
              label="Highlight Emergency Aircraft"
              sx={{ mb: 2 }}
            />
            
            <Typography gutterBottom>Update Interval: {settings.updateInterval}s</Typography>
            <Slider
              value={settings.updateInterval}
              onChange={(_, value) => handleSettingChange('updateInterval', value)}
              min={1}
              max={30}
              step={1}
              marks={[
                { value: 1, label: '1s' },
                { value: 5, label: '5s' },
                { value: 10, label: '10s' },
                { value: 30, label: '30s' }
              ]}
              valueLabelDisplay="auto"
              sx={{ mb: 2 }}
            />
            
            <TextField
              label="Max Aircraft to Display"
              type="number"
              value={settings.maxAircraft}
              onChange={(e) => handleSettingChange('maxAircraft', parseInt(e.target.value))}
              fullWidth
              inputProps={{ min: 100, max: 5000, step: 100 }}
            />
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NotificationsIcon sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="h6">Notifications</Typography>
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.soundAlerts}
                  onChange={(e) => handleSettingChange('soundAlerts', e.target.checked)}
                />
              }
              label="Sound Alerts"
              sx={{ mb: 2 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emergencyAlerts}
                  onChange={(e) => handleSettingChange('emergencyAlerts', e.target.checked)}
                />
              }
              label="Emergency Alerts"
              sx={{ mb: 2 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.proximityAlerts}
                  onChange={(e) => handleSettingChange('proximityAlerts', e.target.checked)}
                />
              }
              label="Proximity Alerts"
              sx={{ mb: 2 }}
            />
            
            {settings.soundAlerts && (
              <Box>
                <Typography gutterBottom>Alert Volume: {settings.alertVolume}%</Typography>
                <Slider
                  value={settings.alertVolume}
                  onChange={(_, value) => handleSettingChange('alertVolume', value)}
                  min={0}
                  max={100}
                  step={10}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Data Sources */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Data Sources
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.openSkyEnabled}
                    onChange={(e) => handleSettingChange('openSkyEnabled', e.target.checked)}
                  />
                }
                label="OpenSky Network"
              />
              <Chip
                label={settings.openSkyEnabled ? "Active" : "Inactive"}
                color={settings.openSkyEnabled ? "success" : "default"}
                size="small"
                sx={{ ml: 1 }}
              />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.flightradar24Enabled}
                    onChange={(e) => handleSettingChange('flightradar24Enabled', e.target.checked)}
                  />
                }
                label="Flightradar24"
              />
              <Chip
                label={settings.flightradar24Enabled ? "Active" : "Inactive"}
                color={settings.flightradar24Enabled ? "success" : "default"}
                size="small"
                sx={{ ml: 1 }}
              />
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.adsb}
                  onChange={(e) => handleSettingChange('adsb', e.target.checked)}
                />
              }
              label="ADS-B Reception"
            />
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance
            </Typography>
            
            <Typography gutterBottom>Max Range: {settings.maxRange} km</Typography>
            <Slider
              value={settings.maxRange}
              onChange={(_, value) => handleSettingChange('maxRange', value)}
              min={50}
              max={500}
              step={50}
              marks
              valueLabelDisplay="auto"
              sx={{ mb: 2 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.dataCompression}
                  onChange={(e) => handleSettingChange('dataCompression', e.target.checked)}
                />
              }
              label="Data Compression"
              sx={{ mb: 2 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.cacheEnabled}
                  onChange={(e) => handleSettingChange('cacheEnabled', e.target.checked)}
                />
              }
              label="Enable Caching"
            />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}