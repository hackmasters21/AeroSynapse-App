import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete
} from '@mui/material';
import {
  FlightTakeoff as TakeoffIcon,
  FlightLand as LandingIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon,
  Clear as ClearIcon,
  Navigation as NavigationIcon
} from '@mui/icons-material';
import airportService, { Airport as AirportData, FlightCalculation } from '../../services/airportService';

export default function RoutePanel() {
  const [originAirport, setOriginAirport] = useState<AirportData | null>(null);
  const [destinationAirport, setDestinationAirport] = useState<AirportData | null>(null);
  const [cruiseAltitude, setCruiseAltitude] = useState('35000');
  const [selectedAircraftType, setSelectedAircraftType] = useState<string>('B737-800');
  const [flightCalculation, setFlightCalculation] = useState<FlightCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [airportSearchOrigin, setAirportSearchOrigin] = useState('');
  const [airportSearchDestination, setAirportSearchDestination] = useState('');
  const [originOptions, setOriginOptions] = useState<AirportData[]>([]);
  const [destinationOptions, setDestinationOptions] = useState<AirportData[]>([]);

  // Search airports for origin
  useEffect(() => {
    if (airportSearchOrigin.trim().length >= 2) {
      const results = airportService.searchAirports(airportSearchOrigin);
      setOriginOptions(results);
    } else {
      setOriginOptions([]);
    }
  }, [airportSearchOrigin]);

  // Search airports for destination
  useEffect(() => {
    if (airportSearchDestination.trim().length >= 2) {
      const results = airportService.searchAirports(airportSearchDestination);
      setDestinationOptions(results);
    } else {
      setDestinationOptions([]);
    }
  }, [airportSearchDestination]);
  
  // Calculate flight with real data
  const calculateFlight = async () => {
    if (!originAirport || !destinationAirport || !selectedAircraftType) {
      return;
    }

    setIsCalculating(true);
    
    try {
      // Simulate calculation delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      const calculation = airportService.calculateFlight(
        originAirport,
        destinationAirport,
        selectedAircraftType,
        parseInt(cruiseAltitude)
      );

      setFlightCalculation(calculation);
    } catch (error) {
      console.error('Flight calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };
  
  const clearCalculation = () => {
    setFlightCalculation(null);
    setOriginAirport(null);
    setDestinationAirport(null);
    setAirportSearchOrigin('');
    setAirportSearchDestination('');
  };

  // Get available aircraft types
  const aircraftTypes = airportService.getAircraftTypes();

  // Format airport option for display
  const formatAirportOption = (airport: AirportData): string => {
    return `${airport.icao || airport.iata || 'N/A'} - ${airport.name} (${airport.city}, ${airport.country})`;
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Route Planning
        </Typography>
        
        {/* Formulario de ruta */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Origin and Destination */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Autocomplete
            size="small"
            options={originOptions}
            value={originAirport}
            onChange={(_, newValue) => setOriginAirport(newValue)}
            inputValue={airportSearchOrigin}
            onInputChange={(_, newInputValue) => setAirportSearchOrigin(newInputValue)}
            getOptionLabel={formatAirportOption}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Origin Airport"
                placeholder="Search by ICAO, IATA, city or name"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <TakeoffIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      {params.InputProps.startAdornment}
                    </>
                  )
                }}
              />
            )}
            sx={{ flex: 1 }}
            noOptionsText="Type to search airports..."
          />
          <Autocomplete
            size="small"
            options={destinationOptions}
            value={destinationAirport}
            onChange={(_, newValue) => setDestinationAirport(newValue)}
            inputValue={airportSearchDestination}
            onInputChange={(_, newInputValue) => setAirportSearchDestination(newInputValue)}
            getOptionLabel={formatAirportOption}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Destination Airport"
                placeholder="Search by ICAO, IATA, city or name"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <LandingIcon sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      {params.InputProps.startAdornment}
                    </>
                  )
                }}
              />
            )}
            sx={{ flex: 1 }}
            noOptionsText="Type to search airports..."
          />
        </Box>
          
          {/* Configuration */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ flex: 2 }}>
              <InputLabel>Aircraft Type</InputLabel>
              <Select
                value={selectedAircraftType}
                label="Aircraft Type"
                onChange={(e) => setSelectedAircraftType(e.target.value)}
              >
                {aircraftTypes.map((type) => {
                  const performance = airportService.getAircraftPerformance(type);
                  return (
                    <MenuItem key={type} value={type}>
                      {performance?.type} ({performance?.category})
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
            <TextField
              size="small"
              label="Cruise Altitude (ft)"
              value={cruiseAltitude}
              onChange={(e) => setCruiseAltitude(e.target.value)}
              type="number"
              sx={{ flex: 1 }}
              inputProps={{ min: 1000, max: 50000, step: 1000 }}
            />
          </Box>
          
          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<CalculateIcon />}
              onClick={calculateFlight}
              disabled={!originAirport || !destinationAirport || isCalculating}
              sx={{ flex: 1 }}
            >
              {isCalculating ? 'Calculating...' : 'Calculate Flight'}
            </Button>
            <Tooltip title="Clear">
              <IconButton onClick={clearCalculation}>
                <ClearIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
      
      {/* Flight Calculation Results */}
      {flightCalculation && originAirport && destinationAirport && (
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" gutterBottom>
            Flight Calculation Results
          </Typography>
          <Card variant="outlined" sx={{ backgroundColor: 'success.main', color: 'success.contrastText' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {originAirport.icao || originAirport.iata} → {destinationAirport.icao || destinationAirport.iata}
                </Typography>
                <IconButton size="small" onClick={clearCalculation} sx={{ color: 'inherit' }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                {originAirport.name} to {destinationAirport.name}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                <Chip label={airportService.formatDistance(flightCalculation.distance)} size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <Chip label={airportService.formatFlightTime(flightCalculation.flightTime)} size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <Chip label={`FL${Math.round(flightCalculation.optimalAltitude / 100)}`} size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
                <Chip label={airportService.formatFuel(flightCalculation.fuelRequired)} size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
              </Box>
              
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Aircraft: {airportService.getAircraftPerformance(selectedAircraftType)?.type}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}
      
      {/* Flight Details */}
      {flightCalculation && (
        <Card sx={{ m: 2, mb: 1 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Flight Details
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>Flight Phases</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Climb:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {airportService.formatFlightTime(flightCalculation.climbTime)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Cruise:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {airportService.formatFlightTime(flightCalculation.cruiseTime)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Descent:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {airportService.formatFlightTime(flightCalculation.descentTime)}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight="bold">Total:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {airportService.formatFlightTime(flightCalculation.flightTime)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>Aircraft Performance</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {(() => {
                    const performance = airportService.getAircraftPerformance(selectedAircraftType);
                    return performance ? (
                      <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Cruise Speed:</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {performance.cruiseSpeed} kts
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Service Ceiling:</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {performance.serviceCeiling.toLocaleString()} ft
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Fuel Burn Rate:</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {performance.fuelBurnRate} gal/hr
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Max Range:</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {performance.maxRange.toLocaleString()} NM
                          </Typography>
                        </Box>
                      </>
                    ) : null;
                  })()}
                </Box>
              </Box>
            </Box>
            
            {flightCalculation.alternateAirports.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>Alternate Airports</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {flightCalculation.alternateAirports.map((airport) => (
                    <Chip
                      key={airport.id}
                      label={`${airport.icao || airport.iata} - ${airport.name}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {!flightCalculation && !isCalculating && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NavigationIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Professional Flight Planning
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select origin and destination airports, choose your aircraft type, and get accurate flight time calculations based on real aircraft performance data.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Chip label="Real Airport Data" size="small" variant="outlined" />
              <Chip label="Aircraft Performance" size="small" variant="outlined" />
              <Chip label="Fuel Calculations" size="small" variant="outlined" />
              <Chip label="Flight Phases" size="small" variant="outlined" />
            </Box>
          </Box>
        )}
        
        {isCalculating && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Calculating flight parameters...
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}