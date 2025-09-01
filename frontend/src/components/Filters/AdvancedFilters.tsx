import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  Button,
  Divider,
  Switch,
  Grid
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
  Restore as RestoreIcon
} from '@mui/icons-material';
// Date picker imports removed for compatibility
import { useTranslation } from 'react-i18next';
import { useApp } from '../../contexts/AppContext';

// Interfaces para filtros
interface WeatherFilters {
  sources: string[];
  dataTypes: string[];
  confidenceMin: number;
  timeRange: {
    start: Date | null;
    end: Date | null;
  };
  stations: string[];
  phenomena: string[];
  severityLevels: string[];
}

interface SafetyFilters {
  accidentTypes: string[];
  severityLevels: string[];
  flightPhases: string[];
  aircraftTypes: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  fatalitiesRange: [number, number];
  countries: string[];
  causes: string[];
}

interface TrafficFilters {
  altitudeRange: [number, number];
  speedRange: [number, number];
  aircraftCategories: string[];
  airlines: string[];
  emergencyOnly: boolean;
  onGroundOnly: boolean;
  proximityDistance: number;
}

interface AdvancedFiltersProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

export default function AdvancedFilters({ open, onClose, onApply }: AdvancedFiltersProps) {
  const { t } = useTranslation();
  const { state } = useApp();
  
  // Estados para filtros meteorológicos
  const [weatherFilters, setWeatherFilters] = useState<WeatherFilters>({
    sources: ['AWC', 'NOAA'],
    dataTypes: ['METAR', 'TAF', 'SIGMET'],
    confidenceMin: 70,
    timeRange: {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date()
    },
    stations: [],
    phenomena: ['THUNDERSTORMS', 'TURBULENCE', 'ICING'],
    severityLevels: ['MODERATE', 'SEVERE']
  });

  // Estados para filtros de seguridad
  const [safetyFilters, setSafetyFilters] = useState<SafetyFilters>({
    accidentTypes: ['ACCIDENT', 'INCIDENT'],
    severityLevels: ['MAJOR', 'FATAL'],
    flightPhases: ['TAKEOFF', 'APPROACH', 'LANDING'],
    aircraftTypes: [],
    dateRange: {
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    fatalitiesRange: [0, 500],
    countries: [],
    causes: []
  });

  // Estados para filtros de tráfico
  const [trafficFilters, setTrafficFilters] = useState<TrafficFilters>({
    altitudeRange: [0, 45000],
    speedRange: [0, 600],
    aircraftCategories: ['LIGHT', 'MEDIUM', 'HEAVY'],
    airlines: [],
    emergencyOnly: false,
    onGroundOnly: false,
    proximityDistance: 5
  });

  const [expandedPanels, setExpandedPanels] = useState<string[]>(['weather']);

  const handlePanelChange = (panel: string) => {
    setExpandedPanels(prev => 
      prev.includes(panel) 
        ? prev.filter(p => p !== panel)
        : [...prev, panel]
    );
  };

  const handleWeatherSourceChange = (source: string) => {
    setWeatherFilters(prev => ({
      ...prev,
      sources: prev.sources.includes(source)
        ? prev.sources.filter(s => s !== source)
        : [...prev.sources, source]
    }));
  };

  const handleSafetyPhaseChange = (phase: string) => {
    setSafetyFilters(prev => ({
      ...prev,
      flightPhases: prev.flightPhases.includes(phase)
        ? prev.flightPhases.filter(p => p !== phase)
        : [...prev.flightPhases, phase]
    }));
  };

  const handleTrafficCategoryChange = (category: string) => {
    setTrafficFilters(prev => ({
      ...prev,
      aircraftCategories: prev.aircraftCategories.includes(category)
        ? prev.aircraftCategories.filter(c => c !== category)
        : [...prev.aircraftCategories, category]
    }));
  };

  const handleApplyFilters = () => {
    const allFilters = {
      weather: weatherFilters,
      safety: safetyFilters,
      traffic: trafficFilters
    };
    onApply(allFilters);
    onClose();
  };

  const handleClearFilters = () => {
    // Reset to default values
    setWeatherFilters({
      sources: [],
      dataTypes: [],
      confidenceMin: 0,
      timeRange: { start: null, end: null },
      stations: [],
      phenomena: [],
      severityLevels: []
    });
    
    setSafetyFilters({
      accidentTypes: [],
      severityLevels: [],
      flightPhases: [],
      aircraftTypes: [],
      dateRange: { start: null, end: null },
      fatalitiesRange: [0, 500],
      countries: [],
      causes: []
    });
    
    setTrafficFilters({
      altitudeRange: [0, 45000],
      speedRange: [0, 600],
      aircraftCategories: [],
      airlines: [],
      emergencyOnly: false,
      onGroundOnly: false,
      proximityDistance: 5
    });
  };

  if (!open) return null;

  return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 400,
          height: '100vh',
          backgroundColor: 'background.paper',
          boxShadow: 3,
          zIndex: 1300,
          overflow: 'auto',
          p: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterIcon sx={{ mr: 1 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {t('filters.advanced_filters')}
          </Typography>
          <Button onClick={onClose} size="small">
            {t('common.close')}
          </Button>
        </Box>

        {/* Filtros Meteorológicos */}
        <Accordion 
          expanded={expandedPanels.includes('weather')}
          onChange={() => handlePanelChange('weather')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">{t('filters.weather_filters')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Fuentes de datos */}
              <FormControl component="fieldset">
                <FormLabel component="legend">{t('filters.data_sources')}</FormLabel>
                <FormGroup row>
                  {['AWC', 'NOAA', 'EUMETSAT', 'RainViewer'].map(source => (
                    <FormControlLabel
                      key={source}
                      control={
                        <Checkbox
                          checked={weatherFilters.sources.includes(source)}
                          onChange={() => handleWeatherSourceChange(source)}
                        />
                      }
                      label={source}
                    />
                  ))}
                </FormGroup>
              </FormControl>

              {/* Tipos de datos */}
              <FormControl component="fieldset">
                <FormLabel component="legend">{t('filters.data_types')}</FormLabel>
                <FormGroup row>
                  {['METAR', 'TAF', 'SIGMET', 'AIRMET'].map(type => (
                    <FormControlLabel
                      key={type}
                      control={
                        <Checkbox
                          checked={weatherFilters.dataTypes.includes(type)}
                          onChange={() => {
                            setWeatherFilters(prev => ({
                              ...prev,
                              dataTypes: prev.dataTypes.includes(type)
                                ? prev.dataTypes.filter(t => t !== type)
                                : [...prev.dataTypes, type]
                            }));
                          }}
                        />
                      }
                      label={type}
                    />
                  ))}
                </FormGroup>
              </FormControl>

              {/* Confianza mínima */}
              <Box>
                <Typography gutterBottom>{t('filters.min_confidence')}: {weatherFilters.confidenceMin}%</Typography>
                <Slider
                  value={weatherFilters.confidenceMin}
                  onChange={(_, value) => setWeatherFilters(prev => ({ ...prev, confidenceMin: value as number }))}
                  min={0}
                  max={100}
                  step={5}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>

              {/* Rango de tiempo */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label={t('filters.start_date')}
                    type="datetime-local"
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label={t('filters.end_date')}
                    type="datetime-local"
                    size="small"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Filtros de Seguridad */}
        <Accordion 
          expanded={expandedPanels.includes('safety')}
          onChange={() => handlePanelChange('safety')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">{t('filters.safety_filters')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Fases de vuelo */}
              <FormControl component="fieldset">
                <FormLabel component="legend">{t('filters.flight_phases')}</FormLabel>
                <FormGroup>
                  {['TAKEOFF', 'CLIMB', 'CRUISE', 'DESCENT', 'APPROACH', 'LANDING'].map(phase => (
                    <FormControlLabel
                      key={phase}
                      control={
                        <Checkbox
                          checked={safetyFilters.flightPhases.includes(phase)}
                          onChange={() => handleSafetyPhaseChange(phase)}
                        />
                      }
                      label={t(`filters.phase_${phase.toLowerCase()}`)}
                    />
                  ))}
                </FormGroup>
              </FormControl>

              {/* Niveles de severidad */}
              <FormControl component="fieldset">
                <FormLabel component="legend">{t('filters.severity_levels')}</FormLabel>
                <FormGroup row>
                  {['MINOR', 'MAJOR', 'FATAL'].map(severity => (
                    <FormControlLabel
                      key={severity}
                      control={
                        <Checkbox
                          checked={safetyFilters.severityLevels.includes(severity)}
                          onChange={() => {
                            setSafetyFilters(prev => ({
                              ...prev,
                              severityLevels: prev.severityLevels.includes(severity)
                                ? prev.severityLevels.filter(s => s !== severity)
                                : [...prev.severityLevels, severity]
                            }));
                          }}
                        />
                      }
                      label={t(`filters.severity_${severity.toLowerCase()}`)}
                    />
                  ))}
                </FormGroup>
              </FormControl>

              {/* Rango de fatalidades */}
              <Box>
                <Typography gutterBottom>
                  {t('filters.fatalities_range')}: {safetyFilters.fatalitiesRange[0]} - {safetyFilters.fatalitiesRange[1]}
                </Typography>
                <Slider
                  value={safetyFilters.fatalitiesRange}
                  onChange={(_, value) => setSafetyFilters(prev => ({ ...prev, fatalitiesRange: value as [number, number] }))}
                  min={0}
                  max={500}
                  step={10}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Filtros de Tráfico */}
        <Accordion 
          expanded={expandedPanels.includes('traffic')}
          onChange={() => handlePanelChange('traffic')}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">{t('filters.traffic_filters')}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Rango de altitud */}
              <Box>
                <Typography gutterBottom>
                  {t('filters.altitude_range')}: {trafficFilters.altitudeRange[0]} - {trafficFilters.altitudeRange[1]} ft
                </Typography>
                <Slider
                  value={trafficFilters.altitudeRange}
                  onChange={(_, value) => setTrafficFilters(prev => ({ ...prev, altitudeRange: value as [number, number] }))}
                  min={0}
                  max={45000}
                  step={1000}
                  valueLabelDisplay="auto"
                />
              </Box>

              {/* Categorías de aeronaves */}
              <FormControl component="fieldset">
                <FormLabel component="legend">{t('filters.aircraft_categories')}</FormLabel>
                <FormGroup row>
                  {['LIGHT', 'MEDIUM', 'HEAVY', 'SUPER'].map(category => (
                    <FormControlLabel
                      key={category}
                      control={
                        <Checkbox
                          checked={trafficFilters.aircraftCategories.includes(category)}
                          onChange={() => handleTrafficCategoryChange(category)}
                        />
                      }
                      label={t(`filters.category_${category.toLowerCase()}`)}
                    />
                  ))}
                </FormGroup>
              </FormControl>

              {/* Opciones especiales */}
              <FormControlLabel
                control={
                  <Switch
                    checked={trafficFilters.emergencyOnly}
                    onChange={(e) => setTrafficFilters(prev => ({ ...prev, emergencyOnly: e.target.checked }))}
                  />
                }
                label={t('filters.emergency_only')}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={trafficFilters.onGroundOnly}
                    onChange={(e) => setTrafficFilters(prev => ({ ...prev, onGroundOnly: e.target.checked }))}
                  />
                }
                label={t('filters.on_ground_only')}
              />

              {/* Distancia de proximidad */}
              <Box>
                <Typography gutterBottom>
                  {t('filters.proximity_distance')}: {trafficFilters.proximityDistance} NM
                </Typography>
                <Slider
                  value={trafficFilters.proximityDistance}
                  onChange={(_, value) => setTrafficFilters(prev => ({ ...prev, proximityDistance: value as number }))}
                  min={1}
                  max={20}
                  step={1}
                  valueLabelDisplay="auto"
                />
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 2 }} />

        {/* Botones de acción */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
            size="small"
          >
            {t('filters.clear_all')}
          </Button>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              size="small"
            >
              {t('filters.save_preset')}
            </Button>
            
            <Button
              variant="contained"
              onClick={handleApplyFilters}
              size="small"
            >
              {t('filters.apply')}
            </Button>
          </Box>
        </Box>
      </Box>
  );
}

// Hook para gestionar filtros
export const useAdvancedFilters = () => {
  const [activeFilters, setActiveFilters] = useState<any>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const applyFilters = (filters: any) => {
    setActiveFilters(filters);
    // Aquí se aplicarían los filtros a los datos
    console.log('Applying filters:', filters);
  };

  const clearFilters = () => {
    setActiveFilters(null);
  };

  const openFilters = () => setFiltersOpen(true);
  const closeFilters = () => setFiltersOpen(false);

  return {
    activeFilters,
    filtersOpen,
    applyFilters,
    clearFilters,
    openFilters,
    closeFilters
  };
};