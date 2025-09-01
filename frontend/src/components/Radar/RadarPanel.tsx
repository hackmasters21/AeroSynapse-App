import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Switch,
  FormControlLabel,
  Slider,
  Button,
  Chip,
  Alert
} from '@mui/material';
import {
  Radar as RadarIcon,
  Visibility as VisibilityIcon,
  Opacity as OpacityIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

export default function RadarPanel() {
  const [weatherRadar, setWeatherRadar] = useState(true);
  const [trafficRadar, setTrafficRadar] = useState(true);
  const [radarOpacity, setRadarOpacity] = useState(70);
  const [radarRange, setRadarRange] = useState(100);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const handleRefresh = () => {
    setLastUpdate(new Date());
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Radar Systems
        </Typography>
        
        <Alert severity="info" sx={{ mt: 1 }}>
          Aviation radar systems for air traffic control and weather monitoring
        </Alert>
      </Box>

      {/* Controls */}
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        {/* Weather Radar */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <RadarIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Weather Radar</Typography>
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={weatherRadar}
                  onChange={(e) => setWeatherRadar(e.target.checked)}
                  color="primary"
                />
              }
              label="Enable Weather Radar"
              sx={{ mb: 2 }}
            />
            
            {weatherRadar && (
              <Box>
                <Typography gutterBottom>Opacity: {radarOpacity}%</Typography>
                <Slider
                  value={radarOpacity}
                  onChange={(_, value) => setRadarOpacity(value as number)}
                  min={10}
                  max={100}
                  step={10}
                  marks
                  valueLabelDisplay="auto"
                  sx={{ mb: 2 }}
                />
                
                <Typography gutterBottom>Range: {radarRange} km</Typography>
                <Slider
                  value={radarRange}
                  onChange={(_, value) => setRadarRange(value as number)}
                  min={50}
                  max={500}
                  step={50}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Traffic Radar */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <VisibilityIcon sx={{ mr: 1, color: 'secondary.main' }} />
              <Typography variant="h6">Traffic Radar</Typography>
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={trafficRadar}
                  onChange={(e) => setTrafficRadar(e.target.checked)}
                  color="secondary"
                />
              }
              label="Enable Traffic Radar"
              sx={{ mb: 2 }}
            />
            
            {trafficRadar && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Chip label="Primary Radar" color="success" variant="filled" />
                </Grid>
                <Grid item xs={6}>
                  <Chip label="Secondary Radar" color="info" variant="filled" />
                </Grid>
                <Grid item xs={6}>
                  <Chip label="Mode S" color="warning" variant="filled" />
                </Grid>
                <Grid item xs={6}>
                  <Chip label="ADS-B" color="error" variant="filled" />
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* ATC Radar Sites */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ATC Radar Sites
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">JFK TRACON</Typography>
                  <Typography variant="body2" color="text.secondary">ASR-11 Primary</Typography>
                  <Typography variant="body2" color="success.main">● Online</Typography>
                  <Typography variant="caption">Range: 60 NM</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">LAX TRACON</Typography>
                  <Typography variant="body2" color="text.secondary">ASR-9 Secondary</Typography>
                  <Typography variant="body2" color="success.main">● Online</Typography>
                  <Typography variant="caption">Range: 80 NM</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">ORD TRACON</Typography>
                  <Typography variant="body2" color="text.secondary">ARSR-4 Long Range</Typography>
                  <Typography variant="body2" color="warning.main">● Maintenance</Typography>
                  <Typography variant="caption">Range: 200 NM</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">ATL TRACON</Typography>
                  <Typography variant="body2" color="text.secondary">Mode S Enhanced</Typography>
                  <Typography variant="body2" color="success.main">● Online</Typography>
                  <Typography variant="caption">Range: 120 NM</Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Weather Radar Sites */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Weather Radar Network
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">NEXRAD WSR-88D Network</Typography>
                  <Typography variant="body2" color="text.secondary">National Weather Service</Typography>
                  <Typography variant="body2" color="success.main">● 159 Sites Active</Typography>
                  <Typography variant="caption">Coverage: Continental US</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">• KJFK: WSR-88D OKX</Typography>
                <Typography variant="caption" color="text.secondary">Upton, NY - 60 NM</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">• KLAX: WSR-88D SOX</Typography>
                <Typography variant="caption" color="text.secondary">Santa Ana, CA - 45 NM</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">• KORD: WSR-88D LOT</Typography>
                <Typography variant="caption" color="text.secondary">Romeoville, IL - 35 NM</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">• KATL: WSR-88D FFC</Typography>
                <Typography variant="caption" color="text.secondary">Peachtree City, GA - 40 NM</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Radar Status */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">System Status</Typography>
              <Button
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                size="small"
                variant="outlined"
              >
                Refresh
              </Button>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Last Update: {lastUpdate.toLocaleTimeString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'success.main',
                      mr: 1
                    }}
                  />
                  <Typography variant="body2">Primary Radar: 98% Up</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'success.main',
                      mr: 1
                    }}
                  />
                  <Typography variant="body2">Secondary Radar: 100% Up</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'warning.main',
                      mr: 1
                    }}
                  />
                  <Typography variant="body2">Weather Radar: 95% Up</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'success.main',
                      mr: 1
                    }}
                  />
                  <Typography variant="body2">Mode S: Online</Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Active Targets: {Math.floor(Math.random() * 500) + 200} aircraft
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}