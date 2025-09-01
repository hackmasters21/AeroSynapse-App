import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert
} from '@mui/material';
import {
  Flight as FlightIcon,
  Scale as WeightIcon,
  Route as RouteIcon,
  LocalGasStation as FuelIcon,
  Schedule as ScheduleIcon,
  Map as MapIcon
} from '@mui/icons-material';
import WeightBalancePanel from './WeightBalancePanel';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`planning-tabpanel-${index}`}
      aria-labelledby={`planning-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `planning-tab-${index}`,
    'aria-controls': `planning-tabpanel-${index}`,
  };
}

export default function PlanningPanel() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FlightIcon color="primary" sx={{ fontSize: 32 }} />
          Flight Planning Suite
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Professional flight planning tools with real aircraft data and safety calculations
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="flight planning tabs">
          <Tab 
            icon={<WeightIcon />} 
            label="Weight & Balance" 
            {...a11yProps(0)} 
            sx={{ minHeight: 64 }}
          />
          <Tab 
            icon={<RouteIcon />} 
            label="Route Planning" 
            {...a11yProps(1)} 
            sx={{ minHeight: 64 }}
          />
          <Tab 
            icon={<FuelIcon />} 
            label="Fuel Planning" 
            {...a11yProps(2)} 
            sx={{ minHeight: 64 }}
          />
          <Tab 
            icon={<ScheduleIcon />} 
            label="Flight Schedule" 
            {...a11yProps(3)} 
            sx={{ minHeight: 64 }}
          />
          <Tab 
            icon={<MapIcon />} 
            label="Charts & Maps" 
            {...a11yProps(4)} 
            sx={{ minHeight: 64 }}
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <TabPanel value={tabValue} index={0}>
          <WeightBalancePanel />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RouteIcon color="primary" />
                  Route Planning
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Route planning functionality coming soon! This will include:
                  </Typography>
                </Alert>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Planned Features:</Typography>
                    <Box component="ul" sx={{ pl: 3 }}>
                      <Typography component="li">Waypoint-based route creation</Typography>
                      <Typography component="li">Airways and SID/STAR procedures</Typography>
                      <Typography component="li">Distance and time calculations</Typography>
                      <Typography component="li">Alternate airport selection</Typography>
                      <Typography component="li">Weather routing optimization</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Data Sources:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip label="FAA NASR Data" variant="outlined" />
                      <Chip label="ICAO Procedures" variant="outlined" />
                      <Chip label="OpenAIP" variant="outlined" />
                      <Chip label="OurAirports" variant="outlined" />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FuelIcon color="primary" />
                  Fuel Planning
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Advanced fuel planning tools coming soon!
                  </Typography>
                </Alert>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Planned Features:</Typography>
                    <Box component="ul" sx={{ pl: 3 }}>
                      <Typography component="li">Trip fuel calculations</Typography>
                      <Typography component="li">Reserve fuel requirements</Typography>
                      <Typography component="li">Alternate fuel planning</Typography>
                      <Typography component="li">Weather contingency fuel</Typography>
                      <Typography component="li">Cost optimization</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Calculations Include:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip label="Wind Corrections" variant="outlined" />
                      <Chip label="Altitude Effects" variant="outlined" />
                      <Chip label="Temperature Impact" variant="outlined" />
                      <Chip label="Aircraft Performance" variant="outlined" />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon color="primary" />
                  Flight Schedule
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Flight scheduling and timeline management coming soon!
                  </Typography>
                </Alert>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Planned Features:</Typography>
                    <Box component="ul" sx={{ pl: 3 }}>
                      <Typography component="li">Departure/arrival time planning</Typography>
                      <Typography component="li">Slot time coordination</Typography>
                      <Typography component="li">Crew duty time tracking</Typography>
                      <Typography component="li">Aircraft availability</Typography>
                      <Typography component="li">Maintenance scheduling</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Integration:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip label="Real-time Weather" variant="outlined" />
                      <Chip label="Airport Delays" variant="outlined" />
                      <Chip label="ATC Flow Control" variant="outlined" />
                      <Chip label="NOTAMs" variant="outlined" />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MapIcon color="primary" />
                  Charts & Maps
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Interactive aviation charts and mapping tools coming soon!
                  </Typography>
                </Alert>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Planned Features:</Typography>
                    <Box component="ul" sx={{ pl: 3 }}>
                      <Typography component="li">Sectional charts overlay</Typography>
                      <Typography component="li">IFR enroute charts</Typography>
                      <Typography component="li">Approach plates</Typography>
                      <Typography component="li">Airport diagrams</Typography>
                      <Typography component="li">Terrain and obstacle data</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>Chart Sources:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip label="FAA Digital Charts" variant="outlined" />
                      <Chip label="ICAO Charts" variant="outlined" />
                      <Chip label="OpenStreetMap" variant="outlined" />
                      <Chip label="Satellite Imagery" variant="outlined" />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
      </Box>
    </Box>
  );
}