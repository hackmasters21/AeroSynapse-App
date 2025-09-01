import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  Flight as FlightIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Warning as WarningIcon,
  Speed as SpeedIcon,
  Height as HeightIcon
} from '@mui/icons-material';
import { useApp } from '../../contexts/AppContext';
import { Aircraft, EmergencyStatus } from '../../types/app.types';

export default function TrafficPanel() {
  const { state, selectAircraft, updateFilters } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'callsign' | 'altitude' | 'distance'>('callsign');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtrar y ordenar aeronaves
  const filteredAircraft = useMemo(() => {
    let filtered = state.aircraft.filter(aircraft => {
      // Filtro de búsqueda
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          aircraft.callsign?.toLowerCase().includes(search) ||
          aircraft.registration?.toLowerCase().includes(search) ||
          aircraft.aircraftType?.toLowerCase().includes(search) ||
          aircraft.airline?.toLowerCase().includes(search)
        );
      }
      return true;
    });
    
    // Aplicar filtros adicionales
    const { filters } = state;
    filtered = filtered.filter(aircraft => {
      if (filters.altitudeMin !== undefined && aircraft.altitude < filters.altitudeMin) {
        return false;
      }
      if (filters.altitudeMax !== undefined && aircraft.altitude > filters.altitudeMax) {
        return false;
      }
      if (!filters.showOnGround && aircraft.onGround) {
        return false;
      }
      if (!filters.showEmergency && aircraft.emergencyStatus && aircraft.emergencyStatus !== EmergencyStatus.NONE) {
        return false;
      }
      return true;
    });
    
    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'callsign':
          return (a.callsign || '').localeCompare(b.callsign || '');
        case 'altitude':
          return b.altitude - a.altitude;
        case 'distance':
          // En una implementación real, calcularíamos la distancia desde la posición del usuario
          return 0;
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [state.aircraft, searchTerm, sortBy, state.filters]);
  
  const handleAircraftSelect = (aircraft: Aircraft) => {
    selectAircraft(aircraft.id === state.selectedAircraft ? null : aircraft.id);
  };
  
  const formatAltitude = (altitude: number): string => {
    if (altitude < 1000) {
      return `${altitude} ft`;
    }
    return `FL${Math.round(altitude / 100)}`;
  };
  
  const getAircraftStatus = (aircraft: Aircraft) => {
    if (aircraft.emergencyStatus && aircraft.emergencyStatus !== EmergencyStatus.NONE) {
      return { label: 'EMERGENCIA', color: 'error' as const };
    }
    if (aircraft.onGround) {
      return { label: 'On Ground', color: 'warning' as const };
    }
    return { label: 'In Flight', color: 'success' as const };
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" gutterBottom>
          Air Traffic
        </Typography>
        
        {/* Búsqueda */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search by callsign, registration, type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchTerm('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ mb: 1 }}
        />
        
        {/* Controles */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Ordenar por</InputLabel>
            <Select
              value={sortBy}
              label="Ordenar por"
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <MenuItem value="callsign">Callsign</MenuItem>
              <MenuItem value="altitude">Altitud</MenuItem>
              <MenuItem value="distance">Distancia</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Filtros">
            <IconButton 
              size="small" 
              onClick={() => setShowFilters(!showFilters)}
              color={showFilters ? 'primary' : 'default'}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* Panel de filtros */}
        {showFilters && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Filtros
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={state.filters.showOnGround ?? true}
                    onChange={(e) => updateFilters({ showOnGround: e.target.checked })}
                    size="small"
                  />
                }
                label="Show aircraft on ground"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={state.filters.showEmergency ?? true}
                    onChange={(e) => updateFilters({ showEmergency: e.target.checked })}
                    size="small"
                  />
                }
                label="Show emergencies"
              />
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  label="Alt. mín (ft)"
                  type="number"
                  value={state.filters.altitudeMin || ''}
                  onChange={(e) => updateFilters({ 
                    altitudeMin: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label="Alt. máx (ft)"
                  type="number"
                  value={state.filters.altitudeMax || ''}
                  onChange={(e) => updateFilters({ 
                    altitudeMax: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  sx={{ flex: 1 }}
                />
              </Box>
            </Box>
          </Box>
        )}
        
        {/* Estadísticas */}
        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
          <Chip 
            label={`${filteredAircraft.length} aircraft`} 
            size="small" 
            color="primary" 
            variant="outlined"
          />
          <Chip 
            label={`${filteredAircraft.filter(a => !a.onGround).length} in flight`} 
            size="small" 
            color="success" 
            variant="outlined"
          />
          <Chip 
            label={`${filteredAircraft.filter(a => a.emergencyStatus && a.emergencyStatus !== EmergencyStatus.NONE).length} emergencies`} 
            size="small" 
            color="error" 
            variant="outlined"
          />
        </Box>
      </Box>
      
      {/* Aircraft list */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <List dense>
          {filteredAircraft.map((aircraft) => {
            const status = getAircraftStatus(aircraft);
            const isSelected = state.selectedAircraft === aircraft.id;
            
            return (
              <ListItem key={aircraft.id} disablePadding>
                <ListItemButton
                  selected={isSelected}
                  onClick={() => handleAircraftSelect(aircraft)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '& .MuiListItemText-secondary': {
                        color: 'primary.contrastText',
                        opacity: 0.8
                      }
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {aircraft.emergencyStatus && aircraft.emergencyStatus !== EmergencyStatus.NONE ? (
                      <WarningIcon color="error" fontSize="small" />
                    ) : (
                      <FlightIcon 
                        fontSize="small" 
                        sx={{ 
                          transform: `rotate(${aircraft.heading}deg)`,
                          color: aircraft.onGround ? 'warning.main' : 'success.main'
                        }} 
                      />
                    )}
                  </ListItemIcon>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                          {aircraft.callsign || 'N/A'}
                        </Typography>
                        <Chip 
                          label={status.label} 
                          size="small" 
                          color={status.color} 
                          variant="outlined"
                          sx={{ height: 16, fontSize: '0.6rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <HeightIcon sx={{ fontSize: 12 }} />
                          <span>{formatAltitude(aircraft.altitude)}</span>
                          <SpeedIcon sx={{ fontSize: 12 }} />
                          <span>{Math.round(aircraft.velocity)} kt</span>
                        </Box>
                        {aircraft.aircraftType && (
                          <Typography variant="caption" display="block">
                            {aircraft.aircraftType}
                          </Typography>
                        )}
                        {aircraft.origin && aircraft.destination && (
                          <Typography variant="caption" display="block">
                            {aircraft.origin} → {aircraft.destination}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        
        {filteredAircraft.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? 'No aircraft found' : 'No visible aircraft'}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}