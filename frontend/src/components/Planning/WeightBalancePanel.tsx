import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Alert,
  Chip,
  Divider,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Flight as FlightIcon,
  Scale as ScaleIcon,
  Help as HelpIcon
} from '@mui/icons-material';

// Aircraft specifications database (based on FAA data)
const AIRCRAFT_DATABASE = {
  // Commercial Aircraft
  'B737-800': {
    name: 'Boeing 737-800',
    category: 'Commercial',
    mtow: 79015, // kg
    emptyWeight: 41413,
    maxPayload: 23157,
    fuelCapacity: 26020,
    maxPassengers: 189,
    manufacturer: 'Boeing',
    engines: 2,
    wingSpan: 35.8, // meters
    length: 39.5,
    height: 12.5,
    cruiseSpeed: 842, // km/h
    maxRange: 5765, // km
    serviceceiling: 12500, // meters
    source: 'FAA Aircraft Characteristics Database'
  },
  'A320': {
    name: 'Airbus A320',
    category: 'Commercial',
    mtow: 78000,
    emptyWeight: 42600,
    maxPayload: 21300,
    fuelCapacity: 24210,
    maxPassengers: 180,
    manufacturer: 'Airbus',
    engines: 2,
    wingSpan: 35.8,
    length: 37.6,
    height: 11.8,
    cruiseSpeed: 828,
    maxRange: 6150,
    serviceiling: 12000,
    source: 'EASA Type Certificate Data Sheet'
  },
  'B777-300ER': {
    name: 'Boeing 777-300ER',
    category: 'Wide-body',
    mtow: 351533,
    emptyWeight: 167829,
    maxPayload: 69100,
    fuelCapacity: 181283,
    maxPassengers: 396,
    manufacturer: 'Boeing',
    engines: 2,
    wingSpan: 64.8,
    length: 73.9,
    height: 18.5,
    cruiseSpeed: 905,
    maxRange: 14685,
    serviceiling: 13100,
    source: 'FAA Aircraft Characteristics Database'
  },
  'A380': {
    name: 'Airbus A380',
    category: 'Super Jumbo',
    mtow: 575000,
    emptyWeight: 276800,
    maxPayload: 90800,
    fuelCapacity: 320000,
    maxPassengers: 853,
    manufacturer: 'Airbus',
    engines: 4,
    wingSpan: 79.8,
    length: 72.7,
    height: 24.1,
    cruiseSpeed: 903,
    maxRange: 15200,
    serviceiling: 13100,
    source: 'EASA Type Certificate Data Sheet'
  },
  // General Aviation
  'C172': {
    name: 'Cessna 172',
    category: 'General Aviation',
    mtow: 1157,
    emptyWeight: 743,
    maxPayload: 414,
    fuelCapacity: 212,
    maxPassengers: 4,
    manufacturer: 'Cessna',
    engines: 1,
    wingSpan: 11.0,
    length: 8.3,
    height: 2.7,
    cruiseSpeed: 226,
    maxRange: 1289,
    serviceiling: 4200,
    source: 'FAA Type Certificate Data Sheet'
  },
  'C208': {
    name: 'Cessna 208 Caravan',
    category: 'Utility',
    mtow: 3969,
    emptyWeight: 2303,
    maxPayload: 1666,
    fuelCapacity: 1346,
    maxPassengers: 14,
    manufacturer: 'Cessna',
    engines: 1,
    wingSpan: 15.9,
    length: 12.7,
    height: 4.3,
    cruiseSpeed: 344,
    maxRange: 1982,
    serviceiling: 7620,
    source: 'FAA Type Certificate Data Sheet'
  },
  'PA28': {
    name: 'Piper Cherokee PA-28',
    category: 'General Aviation',
    mtow: 1157,
    emptyWeight: 635,
    maxPayload: 522,
    fuelCapacity: 189,
    maxPassengers: 4,
    manufacturer: 'Piper',
    engines: 1,
    wingSpan: 9.1,
    length: 7.3,
    height: 2.2,
    cruiseSpeed: 230,
    maxRange: 1167,
    serviceiling: 4267,
    source: 'FAA Type Certificate Data Sheet'
  },
  // Business Jets
  'G650': {
    name: 'Gulfstream G650',
    category: 'Business Jet',
    mtow: 45360,
    emptyWeight: 25311,
    maxPayload: 6804,
    fuelCapacity: 20104,
    maxPassengers: 19,
    manufacturer: 'Gulfstream',
    engines: 2,
    wingSpan: 30.4,
    length: 30.4,
    height: 7.7,
    cruiseSpeed: 956,
    maxRange: 12964,
    serviceiling: 15545,
    source: 'FAA Type Certificate Data Sheet'
  }
};

interface WeightBalanceCalculation {
  totalWeight: number;
  weightPercentage: number;
  remainingCapacity: number;
  status: 'safe' | 'warning' | 'danger';
  message: string;
}

export default function WeightBalancePanel() {
  const [selectedAircraft, setSelectedAircraft] = useState('C172');
  const [passengers, setPassengers] = useState(1);
  const [cargo, setCargo] = useState(0);
  const [fuel, setFuel] = useState(40);
  const [baggage, setBaggage] = useState(50);
  const [calculation, setCalculation] = useState<WeightBalanceCalculation | null>(null);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  const aircraftData = selectedAircraft ? AIRCRAFT_DATABASE[selectedAircraft as keyof typeof AIRCRAFT_DATABASE] : null;

  const calculateWeightBalance = () => {
    if (!aircraftData) return;

    const passengerWeight = passengers * 77; // Average passenger weight (77kg including carry-on)
    const totalWeight = aircraftData.emptyWeight + passengerWeight + cargo + fuel + baggage;
    const weightPercentage = (totalWeight / aircraftData.mtow) * 100;
    const remainingCapacity = aircraftData.mtow - totalWeight;

    let status: 'safe' | 'warning' | 'danger';
    let message: string;

    if (weightPercentage <= 85) {
      status = 'safe';
      message = 'Weight within safe operating limits';
    } else if (weightPercentage <= 95) {
      status = 'warning';
      message = 'Approaching maximum weight - verify calculations';
    } else if (weightPercentage <= 100) {
      status = 'warning';
      message = 'Near MTOW - performance may be affected';
    } else {
      status = 'danger';
      message = 'EXCEEDS MTOW - UNSAFE FOR TAKEOFF';
    }

    setCalculation({
      totalWeight,
      weightPercentage,
      remainingCapacity,
      status,
      message
    });
  };

  useEffect(() => {
    if (selectedAircraft) {
      calculateWeightBalance();
    }
  }, [selectedAircraft, passengers, cargo, fuel, baggage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'success';
      case 'warning': return 'warning';
      case 'danger': return 'error';
      default: return 'info';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'danger': return <ErrorIcon color="error" />;
      default: return <InfoIcon color="info" />;
    }
  };

  const formatWeight = (weight: number) => {
    return `${weight.toLocaleString()} kg (${(weight * 2.20462).toLocaleString()} lbs)`;
  };

  const aircraftCategories = useMemo(() => {
    const categories: { [key: string]: string[] } = {};
    Object.entries(AIRCRAFT_DATABASE).forEach(([key, aircraft]) => {
      if (!categories[aircraft.category]) {
        categories[aircraft.category] = [];
      }
      categories[aircraft.category].push(key);
    });
    return categories;
  }, []);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScaleIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">
            Weight & Balance Calculator
          </Typography>
        </Box>
        <Tooltip title="Help & Information">
          <IconButton onClick={() => setHelpDialogOpen(true)}>
            <HelpIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Aircraft Selection */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FlightIcon color="primary" />
                Aircraft Selection
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Aircraft Type</InputLabel>
                <Select
                  value={selectedAircraft}
                  onChange={(e) => setSelectedAircraft(e.target.value)}
                  label="Select Aircraft Type"
                >
                  {Object.entries(aircraftCategories).map(([category, aircraftList]) => [
                    <MenuItem key={category} disabled sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {category}
                    </MenuItem>,
                    ...aircraftList.map(aircraftKey => (
                      <MenuItem key={aircraftKey} value={aircraftKey} sx={{ pl: 3 }}>
                        {AIRCRAFT_DATABASE[aircraftKey as keyof typeof AIRCRAFT_DATABASE].name}
                      </MenuItem>
                    ))
                  ])}
                </Select>
              </FormControl>

              {aircraftData && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Aircraft Specifications
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip label={`MTOW: ${formatWeight(aircraftData.mtow)}`} color="primary" variant="outlined" />
                    <Chip label={`Empty: ${formatWeight(aircraftData.emptyWeight)}`} variant="outlined" />
                    <Chip label={`Max Pax: ${aircraftData.maxPassengers}`} variant="outlined" />
                    <Chip label={`Fuel Cap: ${formatWeight(aircraftData.fuelCapacity)}`} variant="outlined" />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Data source: {aircraftData.source}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Weight Inputs */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalculateIcon color="primary" />
                Weight Configuration
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Passengers"
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    inputProps={{ min: 0, max: aircraftData?.maxPassengers || 999 }}
                    helperText={`Max: ${aircraftData?.maxPassengers || 'N/A'}`}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Cargo (kg)"
                    value={cargo}
                    onChange={(e) => setCargo(Number(e.target.value))}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Fuel (kg)"
                    value={fuel}
                    onChange={(e) => setFuel(Number(e.target.value))}
                    inputProps={{ min: 0, max: aircraftData?.fuelCapacity || 999999 }}
                    helperText={`Max: ${aircraftData?.fuelCapacity ? formatWeight(aircraftData.fuelCapacity) : 'N/A'}`}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Baggage (kg)"
                    value={baggage}
                    onChange={(e) => setBaggage(Number(e.target.value))}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              </Grid>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                * Passenger weight calculated at 77kg average (including carry-on)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Results */}
        {calculation && aircraftData && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getStatusIcon(calculation.status)}
                  Weight & Balance Results
                </Typography>

                <Alert severity={getStatusColor(calculation.status)} sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {calculation.message}
                  </Typography>
                </Alert>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Weight Distribution
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(calculation.weightPercentage, 100)}
                        color={getStatusColor(calculation.status) as any}
                        sx={{ height: 10, borderRadius: 5, mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {calculation.weightPercentage.toFixed(1)}% of MTOW
                      </Typography>
                    </Box>

                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Component</strong></TableCell>
                            <TableCell align="right"><strong>Weight</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>Empty Weight</TableCell>
                            <TableCell align="right">{formatWeight(aircraftData.emptyWeight)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Passengers ({passengers})</TableCell>
                            <TableCell align="right">{formatWeight(passengers * 77)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Cargo</TableCell>
                            <TableCell align="right">{formatWeight(cargo)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Fuel</TableCell>
                            <TableCell align="right">{formatWeight(fuel)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Baggage</TableCell>
                            <TableCell align="right">{formatWeight(baggage)}</TableCell>
                          </TableRow>
                          <Divider />
                          <TableRow sx={{ backgroundColor: 'action.hover' }}>
                            <TableCell><strong>Total Weight</strong></TableCell>
                            <TableCell align="right"><strong>{formatWeight(calculation.totalWeight)}</strong></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>MTOW Limit</strong></TableCell>
                            <TableCell align="right"><strong>{formatWeight(aircraftData.mtow)}</strong></TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Remaining Capacity</strong></TableCell>
                            <TableCell align="right" sx={{ 
                              color: calculation.remainingCapacity >= 0 ? 'success.main' : 'error.main',
                              fontWeight: 'bold'
                            }}>
                              {formatWeight(calculation.remainingCapacity)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Performance Impact
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      {calculation.weightPercentage > 90 && (
                        <Alert severity="warning" sx={{ mb: 1 }}>
                          <Typography variant="body2">
                            • Increased takeoff distance required
                          </Typography>
                          <Typography variant="body2">
                            • Reduced climb performance
                          </Typography>
                          <Typography variant="body2">
                            • Higher fuel consumption
                          </Typography>
                        </Alert>
                      )}
                      
                      {calculation.weightPercentage > 100 && (
                        <Alert severity="error" sx={{ mb: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            ⚠️ AIRCRAFT EXCEEDS MTOW - DO NOT ATTEMPT TAKEOFF
                          </Typography>
                          <Typography variant="body2">
                            Reduce weight by {formatWeight(Math.abs(calculation.remainingCapacity))}
                          </Typography>
                        </Alert>
                      )}
                    </Box>

                    <Typography variant="subtitle2" gutterBottom>
                      Safety Recommendations
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        • Verify actual weights vs estimates
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        • Check center of gravity calculations
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        • Consider runway length and conditions
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        • Account for weather and altitude effects
                      </Typography>
                      <Typography variant="body2">
                        • Consult aircraft flight manual for specific limits
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Help Dialog */}
      <Dialog open={helpDialogOpen} onClose={() => setHelpDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Weight & Balance Information
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            About MTOW (Maximum Takeoff Weight)
          </Typography>
          <Typography paragraph>
            MTOW is the maximum weight at which an aircraft is certified to take off safely. 
            It's determined by aircraft manufacturers and certified by aviation authorities like the FAA and EASA.
          </Typography>
          
          <Typography variant="h6" gutterBottom>
            Data Sources
          </Typography>
          <Typography paragraph>
            Aircraft specifications are sourced from official databases:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li">FAA Aircraft Characteristics Database</Typography>
            <Typography component="li">EASA Type Certificate Data Sheets</Typography>
            <Typography component="li">Manufacturer Technical Documentation</Typography>
            <Typography component="li">Transport Canada Certification Data</Typography>
          </Box>
          
          <Typography variant="h6" gutterBottom>
            Safety Guidelines
          </Typography>
          <Typography paragraph>
            This calculator provides estimates based on standard weights. Always:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <Typography component="li">Use actual measured weights when possible</Typography>
            <Typography component="li">Consult the aircraft's flight manual</Typography>
            <Typography component="li">Consider environmental factors (altitude, temperature)</Typography>
            <Typography component="li">Verify center of gravity calculations</Typography>
            <Typography component="li">Account for runway conditions and length</Typography>
          </Box>
          
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Disclaimer:</strong> This tool is for educational and planning purposes only. 
              Always consult official aircraft documentation and certified weight & balance calculations for actual flight operations.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}