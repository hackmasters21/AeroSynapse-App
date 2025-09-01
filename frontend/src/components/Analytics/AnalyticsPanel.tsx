import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Flight as FlightIcon,
  Speed as SpeedIcon,
  Height as AltitudeIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useApp } from '../../contexts/AppContext';

export default function AnalyticsPanel() {
  const { state } = useApp();
  const [analytics, setAnalytics] = useState<{
    totalFlights: number;
    activeFlights: number;
    avgAltitude: number;
    avgSpeed: number;
    busyAirports: Array<{ code: string; name: string; flights: number }>;
    flightsByType: Record<string, number>;
    hourlyTraffic: Array<{ hour: number; flights: number }>;
  }>({
    totalFlights: 0,
    activeFlights: 0,
    avgAltitude: 0,
    avgSpeed: 0,
    busyAirports: [],
    flightsByType: {},
    hourlyTraffic: []
  });

  useEffect(() => {
    // Calculate analytics from aircraft data
    const aircraft = state.aircraft || [];
    const activeAircraft = aircraft.filter(a => !a.onGround);
    
    const avgAlt = activeAircraft.length > 0 
      ? activeAircraft.reduce((sum, a) => sum + (a.altitude || 0), 0) / activeAircraft.length
      : 0;
    
    const avgSpd = activeAircraft.length > 0
      ? activeAircraft.reduce((sum, a) => sum + (a.velocity || 0), 0) / activeAircraft.length
      : 0;

    // Mock busy airports data
    const busyAirports = [
      { code: 'JFK', name: 'John F. Kennedy', flights: Math.floor(Math.random() * 100) + 50 },
      { code: 'LAX', name: 'Los Angeles Intl', flights: Math.floor(Math.random() * 90) + 40 },
      { code: 'ORD', name: 'Chicago O\'Hare', flights: Math.floor(Math.random() * 80) + 35 },
      { code: 'ATL', name: 'Atlanta Hartsfield', flights: Math.floor(Math.random() * 85) + 45 }
    ];

    // Mock flight types
    const flightTypes = {
      'Commercial': Math.floor(aircraft.length * 0.7),
      'Private': Math.floor(aircraft.length * 0.2),
      'Cargo': Math.floor(aircraft.length * 0.08),
      'Military': Math.floor(aircraft.length * 0.02)
    };

    setAnalytics({
      totalFlights: aircraft.length,
      activeFlights: activeAircraft.length,
      avgAltitude: Math.round(avgAlt),
      avgSpeed: Math.round(avgSpd),
      busyAirports,
      flightsByType: flightTypes,
      hourlyTraffic: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        flights: Math.floor(Math.random() * 100) + 20
      }))
    });
  }, [state.aircraft]);

  const handleRefresh = () => {
    // Trigger analytics recalculation
    setAnalytics(prev => ({ ...prev }));
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Flight Analytics
          </Typography>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            size="small"
            variant="outlined"
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Analytics Content */}
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        {/* Flight Plan Metrics */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <FlightIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" color="primary">
                  {analytics.totalFlights}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Planned Flights
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" color="success.main">
                  {analytics.activeFlights}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Routes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <AltitudeIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" color="info.main">
                  {Math.round(analytics.avgAltitude / 100) * 100}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Planned Cruise (ft)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <SpeedIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" color="warning.main">
                  {Math.round(analytics.avgSpeed / 10) * 10}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Planned Speed (kts)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Planned Flights */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Planned Flight Routes
            </Typography>
            <List dense>
              {[
                { flight: 'UAL123', route: 'KJFK-KLAX', aircraft: 'B777-300ER', departure: '14:30', arrival: '18:45', status: 'On Time' },
                { flight: 'DAL456', route: 'KATL-KORD', aircraft: 'A320-200', departure: '16:15', arrival: '17:30', status: 'Delayed' },
                { flight: 'AAL789', route: 'KORD-KDEN', aircraft: 'B737-800', departure: '19:00', arrival: '20:15', status: 'On Time' },
                { flight: 'SWA101', route: 'KDEN-KPHX', aircraft: 'B737-700', departure: '21:30', arrival: '22:45', status: 'Boarding' }
              ].map((flight, index) => (
                <React.Fragment key={flight.flight}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={flight.flight}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Typography variant="body2" fontWeight="bold">
                            {flight.route}
                          </Typography>
                          <Chip
                            label={flight.status}
                            size="small"
                            color={flight.status === 'On Time' ? 'success' : flight.status === 'Delayed' ? 'error' : 'warning'}
                            variant="filled"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            Aircraft: {flight.aircraft}
                          </Typography>
                          <Typography variant="caption">
                            Departure: {flight.departure} | Arrival: {flight.arrival}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < 3 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Flight Types */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Aircraft by Type
            </Typography>
            {Object.entries(analytics.flightsByType).map(([type, count]) => (
              <Box key={type} sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{type}</Typography>
                  <Typography variant="body2">{count}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(count / analytics.totalFlights) * 100}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            ))}
          </CardContent>
        </Card>

        {/* Busy Airports */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Busiest Airports
            </Typography>
            <List dense>
              {analytics.busyAirports.map((airport, index) => (
                <React.Fragment key={airport.code}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={airport.code}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Typography variant="body2">{airport.name}</Typography>
                        </Box>
                      }
                      secondary={`${airport.flights} flights`}
                    />
                  </ListItem>
                  {index < analytics.busyAirports.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Traffic Trends */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TimelineIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">Traffic Trends</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Peak traffic hours: 14:00-16:00 UTC
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Current traffic level: {analytics.activeFlights > 50 ? 'High' : analytics.activeFlights > 20 ? 'Medium' : 'Low'}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Chip
                label={`${Math.round((analytics.activeFlights / analytics.totalFlights) * 100)}% Active`}
                color="success"
                variant="filled"
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}