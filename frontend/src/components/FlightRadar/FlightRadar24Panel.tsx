import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Chip,
  Tooltip,
  Divider,
  TextField,
  InputAdornment,
  Alert,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import {
  Flight as FlightIcon,
  Search as SearchIcon,
  OpenInNew as OpenInNewIcon,
  Radar as RadarIcon,
  Public as PublicIcon,
  Speed as SpeedIcon,
  Height as AltitudeIcon,
  Navigation as NavigationIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../contexts/AppContext';

// Interfaces para datos de Flightradar24
interface FlightData {
  id: string;
  callsign: string;
  registration: string;
  aircraft: {
    model: string;
    type: string;
  };
  airline: {
    name: string;
    iata: string;
    icao: string;
  };
  origin: {
    airport: string;
    iata: string;
    city: string;
    country: string;
  };
  destination: {
    airport: string;
    iata: string;
    city: string;
    country: string;
  };
  position: {
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
    heading: number;
  };
  status: string;
  flightradar24Url: string;
}

interface FlightRadar24PanelProps {
  visible: boolean;
  onClose?: () => void;
}

export default function FlightRadar24Panel({ visible, onClose }: FlightRadar24PanelProps) {
  const { t } = useTranslation();
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const [nearbyFlights, setNearbyFlights] = useState<FlightData[]>([]);

  // Convertir datos de aeronaves del estado a formato FlightRadar24
  const convertToFlightData = (aircraft: any): FlightData => {
    const callsign = aircraft.callsign || aircraft.icao24?.toUpperCase() || 'UNKNOWN';
    const registration = aircraft.registration || aircraft.icao24?.toUpperCase() || 'N/A';
    
    return {
      id: aircraft.icao24 || aircraft.id,
      callsign: callsign,
      registration: registration,
      aircraft: {
        model: aircraft.aircraftType || 'Unknown',
        type: aircraft.category || 'Unknown'
      },
      airline: {
        name: aircraft.airline || 'Unknown',
        iata: '',
        icao: ''
      },
      origin: {
        airport: 'Unknown',
        iata: '',
        city: 'Unknown',
        country: 'Unknown'
      },
      destination: {
        airport: 'Unknown',
        iata: '',
        city: 'Unknown',
        country: 'Unknown'
      },
      position: {
        latitude: aircraft.latitude || 0,
        longitude: aircraft.longitude || 0,
        altitude: aircraft.altitude || 0,
        speed: aircraft.velocity || 0,
        heading: aircraft.heading || 0
      },
      status: aircraft.onGround ? 'On Ground' : 'In Flight',
      flightradar24Url: `https://www.flightradar24.com/${callsign.toLowerCase()}`
    };
  };

  // Filtrar y convertir aeronaves
  const flights = state.aircraft
    .filter(aircraft => 
      aircraft.callsign?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aircraft.icao24?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aircraft.registration?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map(convertToFlightData)
    .slice(0, 20); // Limitar a 20 resultados

  const handleFlightSelect = (flight: FlightData) => {
    setSelectedFlight(flight);
  };

  const [embeddedUrl, setEmbeddedUrl] = useState('https://www.flightradar24.com/');
  const [showEmbedded, setShowEmbedded] = useState(false);

  const handleOpenFlightradar24 = (flight?: FlightData) => {
    if (flight) {
      setEmbeddedUrl(flight.flightradar24Url);
    } else {
      setEmbeddedUrl('https://www.flightradar24.com/');
    }
    setShowEmbedded(true);
  };

  const handleCloseEmbedded = () => {
    setShowEmbedded(false);
  };

  const handleSearchOnFlightradar24 = () => {
    if (searchTerm) {
      window.open(`https://www.flightradar24.com/data/flights/${searchTerm.toLowerCase()}`, '_blank');
    }
  };

  if (!visible) return null;

  return (
    <Paper
      sx={{
        position: 'fixed',
        top: 80,
        left: 16,
        width: 400,
        maxHeight: 'calc(100vh - 100px)',
        overflow: 'auto',
        zIndex: 1200,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RadarIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Flightradar24</Typography>
          </Box>
          {onClose && (
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </Box>
        
        {/* Búsqueda */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search flights, callsigns, registrations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleSearchOnFlightradar24}>
                  <OpenInNewIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        
        {/* Botón Flightradar24 */}
        <Button
          fullWidth
          variant="outlined"
          startIcon={<PublicIcon />}
          onClick={() => handleOpenFlightradar24()}
          sx={{ mt: 1 }}
        >
          Open Flightradar24.com
        </Button>
      </Box>

      {/* Información */}
      <Alert severity="info" sx={{ m: 2 }}>
        <Typography variant="caption">
          Live aircraft tracking with registrations and flight details
        </Typography>
      </Alert>

      {/* Estadísticas */}
      <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card variant="outlined">
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="caption" color="text.secondary">
                  Total Aircraft
                </Typography>
                <Typography variant="h6" color="primary">
                  {state.aircraft.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card variant="outlined">
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Typography variant="caption" color="text.secondary">
                  In Flight
                </Typography>
                <Typography variant="h6" color="success.main">
                  {state.aircraft.filter(a => !a.onGround).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Lista de vuelos */}
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" sx={{ p: 1, fontWeight: 'bold' }}>
          Live Flights ({flights.length})
        </Typography>
        
        {flights.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? 'No flights found matching your search' : 'No flights available'}
            </Typography>
          </Box>
        ) : (
          <List dense>
            {flights.map(flight => (
              <ListItem key={flight.id} disablePadding>
                <ListItemButton 
                  onClick={() => handleFlightSelect(flight)}
                  selected={selectedFlight?.id === flight.id}
                >
                  <ListItemIcon>
                    <FlightIcon 
                      fontSize="small" 
                      color={flight.status === 'In Flight' ? 'primary' : 'disabled'}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {flight.callsign}
                        </Typography>
                        <Chip
                          label={flight.registration}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {flight.aircraft.model} • {flight.status}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip
                            icon={<AltitudeIcon />}
                            label={`${Math.round(flight.position.altitude)}ft`}
                            size="small"
                            variant="filled"
                            color="default"
                          />
                          <Chip
                            icon={<SpeedIcon />}
                            label={`${Math.round(flight.position.speed)}kts`}
                            size="small"
                            variant="filled"
                            color="default"
                          />
                        </Box>
                      </Box>
                    }
                  />
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenFlightradar24(flight);
                    }}
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Detalles del vuelo seleccionado */}
      {selectedFlight && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', backgroundColor: 'grey.50' }}>
          <Typography variant="subtitle2" gutterBottom fontWeight="bold">
            Flight Details
          </Typography>
          
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Callsign</Typography>
              <Typography variant="body2" fontWeight="bold">{selectedFlight.callsign}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Registration</Typography>
              <Typography variant="body2" fontWeight="bold">{selectedFlight.registration}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Aircraft</Typography>
              <Typography variant="body2">{selectedFlight.aircraft.model}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">Status</Typography>
              <Typography variant="body2">{selectedFlight.status}</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">Altitude</Typography>
              <Typography variant="body2">{Math.round(selectedFlight.position.altitude)} ft</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">Speed</Typography>
              <Typography variant="body2">{Math.round(selectedFlight.position.speed)} kts</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="caption" color="text.secondary">Heading</Typography>
              <Typography variant="body2">{Math.round(selectedFlight.position.heading)}°</Typography>
            </Grid>
          </Grid>
          
          <Button
            fullWidth
            variant="contained"
            startIcon={<OpenInNewIcon />}
            onClick={() => handleOpenFlightradar24(selectedFlight)}
            sx={{ mt: 2 }}
          >
            View on Flightradar24
          </Button>
        </Box>
      )}

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Typography variant="caption" color="text.secondary">
          Powered by Flightradar24.com
        </Typography>
      </Box>
      
      {/* Embedded Flightradar24 */}
      {showEmbedded && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Box
            sx={{
              width: '95%',
              height: '95%',
              backgroundColor: 'white',
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 2001
              }}
            >
              <IconButton
                onClick={handleCloseEmbedded}
                sx={{
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)'
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
            <iframe
              src={embeddedUrl}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              title="Flightradar24"
            />
          </Box>
        </Box>
      )}
    </Paper>
  );
}

// Hook personalizado para Flightradar24
export const useFlightradar24 = () => {
  const [flightradar24PanelOpen, setFlightradar24PanelOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);

  const openFlightradar24Panel = () => setFlightradar24PanelOpen(true);
  const closeFlightradar24Panel = () => setFlightradar24PanelOpen(false);
  const toggleFlightradar24Panel = () => setFlightradar24PanelOpen(prev => !prev);

  return {
    flightradar24PanelOpen,
    selectedFlight,
    openFlightradar24Panel,
    closeFlightradar24Panel,
    toggleFlightradar24Panel,
    setSelectedFlight
  };
};