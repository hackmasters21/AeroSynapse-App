import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Grid,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Cloud as CloudIcon,
  Visibility as VisibilityIcon,
  Air as WindIcon,
  Thermostat as TempIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Satellite as SatelliteIcon,
  Radar as RadarIcon,
  TrendingUp as TrendIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as TimeIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../contexts/AppContext';

// Interfaces para datos meteorológicos
interface MetarData {
  station: string;
  observationTime: Date;
  rawText: string;
  temperature: number;
  dewpoint: number;
  windDirection: number;
  windSpeed: number;
  windGust?: number;
  visibility: number;
  altimeter: number;
  conditions: string[];
  clouds: CloudLayer[];
  remarks?: string;
}

interface CloudLayer {
  coverage: 'SKC' | 'FEW' | 'SCT' | 'BKN' | 'OVC';
  altitude: number;
  type?: 'CU' | 'CB' | 'TCU';
}

interface TafData {
  station: string;
  issueTime: Date;
  validFrom: Date;
  validTo: Date;
  rawText: string;
  forecast: ForecastPeriod[];
}

interface ForecastPeriod {
  from: Date;
  to: Date;
  windDirection: number;
  windSpeed: number;
  windGust?: number;
  visibility: number;
  conditions: string[];
  clouds: CloudLayer[];
  probability?: number;
}

interface SigmetData {
  id: string;
  fir: string;
  type: 'SIGMET' | 'AIRMET';
  phenomenon: string;
  validFrom: Date;
  validTo: Date;
  intensity?: 'WEAK' | 'MODERATE' | 'STRONG' | 'SEVERE';
  rawText: string;
}

interface WeatherConfidence {
  overall: number;
  factors: {
    temporal: number;
    spatial: number;
    consensus: number;
    reliability: number;
  };
}

interface WeatherSource {
  id: string;
  name: string;
  type: 'aviation' | 'satellite' | 'radar' | 'model';
  status: 'active' | 'inactive' | 'error';
  reliability: number;
  lastUpdate: Date;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`weather-tabpanel-${index}`}
      aria-labelledby={`weather-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function WeatherPanel() {
  const { t } = useTranslation();
  const { state } = useApp();
  const [tabValue, setTabValue] = useState(0);
  const [selectedStation, setSelectedStation] = useState('LEMD');
  const [metar, setMetar] = useState<MetarData | null>(null);
  const [taf, setTaf] = useState<TafData | null>(null);
  const [sigmets, setSigmets] = useState<SigmetData[]>([]);
  const [confidence, setConfidence] = useState<WeatherConfidence | null>(null);
  const [sources, setSources] = useState<WeatherSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showRawData, setShowRawData] = useState(false);
  const [layersEnabled, setLayersEnabled] = useState({
    satellite: true,
    radar: true,
    sigmets: true,
    winds: false
  });

  // Cargar datos meteorológicos
  const loadWeatherData = async (station: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Simular llamadas a la API
      const [metarResponse, tafResponse, sigmetsResponse, confidenceResponse, sourcesResponse] = await Promise.allSettled([
        fetch(`/api/weather/metar/${station}`),
        fetch(`/api/weather/taf/${station}`),
        fetch('/api/weather/sigmets'),
        fetch(`/api/weather/confidence/${station}`),
        fetch('/api/weather/sources')
      ]);
      
      // Procesar respuestas (simulado)
      setMetar(generateSimulatedMetar(station));
      setTaf(generateSimulatedTaf(station));
      setSigmets(generateSimulatedSigmets());
      setConfidence(generateSimulatedConfidence());
      setSources(generateSimulatedSources());
      
    } catch (err) {
      setError('Error loading weather data');
      console.error('Weather data error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadWeatherData(selectedStation);
  }, [selectedStation]);

  // Auto-refresh cada 5 minutos
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadWeatherData(selectedStation);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [selectedStation, autoRefresh]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleStationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const station = event.target.value.toUpperCase();
    if (station.length <= 4) {
      setSelectedStation(station);
    }
  };

  const handleRefresh = () => {
    loadWeatherData(selectedStation);
  };

  const handleLayerToggle = (layer: keyof typeof layersEnabled) => {
    setLayersEnabled(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
    return 'error';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return t('weather.confidence_levels.high');
    if (confidence >= 60) return t('weather.confidence_levels.medium');
    return t('weather.confidence_levels.low');
  };

  const formatWindDirection = (direction: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(direction / 22.5) % 16;
    return `${direction.toString().padStart(3, '0')}° (${directions[index]})`;
  };

  const formatCloudCoverage = (coverage: string) => {
    const coverageMap = {
      'SKC': 'Clear',
      'FEW': 'Few',
      'SCT': 'Scattered',
      'BKN': 'Broken',
      'OVC': 'Overcast'
    };
    return coverageMap[coverage as keyof typeof coverageMap] || coverage;
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudIcon />
            {t('weather.title')}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  size="small"
                />
              }
              label="Auto"
              sx={{ mr: 1 }}
            />
            
            <Tooltip title={t('common.refresh')}>
              <IconButton onClick={handleRefresh} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Station Input */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            label="ICAO Station"
            value={selectedStation}
            onChange={handleStationChange}
            size="small"
            inputProps={{ maxLength: 4, style: { textTransform: 'uppercase' } }}
            sx={{ width: 120 }}
          />
          
          <Button
            variant="contained"
            size="small"
            onClick={() => loadWeatherData(selectedStation)}
            disabled={loading || selectedStation.length !== 4}
          >
            {t('common.search')}
          </Button>
          
          {confidence && (
            <Chip
              icon={<CheckIcon />}
              label={`${t('weather.confidence')}: ${confidence.overall}%`}
              color={getConfidenceColor(confidence.overall) as any}
              size="small"
            />
          )}
        </Box>
        
        {loading && <LinearProgress sx={{ mt: 1 }} />}
      </Box>

      {/* Disclaimer */}
      <Alert severity="warning" sx={{ m: 2 }}>
        <Typography variant="caption">
          {t('weather.disclaimer')}
        </Typography>
      </Alert>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label={t('weather.reports.metar')} icon={<TempIcon />} />
          <Tab label={t('weather.reports.taf')} icon={<TrendIcon />} />
          <Tab label={t('weather.reports.sigmet')} icon={<WarningIcon />} />
          <Tab label={t('weather.layers')} icon={<SatelliteIcon />} />
          <Tab label={t('weather.sources')} icon={<InfoIcon />} />
        </Tabs>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {/* METAR Tab */}
        <TabPanel value={tabValue} index={0}>
          {metar ? (
            <Box>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {metar.station} METAR
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <TempIcon color="primary" />
                        <Typography variant="h4">{metar.temperature}°C</Typography>
                        <Typography variant="caption">Temperature</Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <WindIcon color="primary" />
                        <Typography variant="h6">{metar.windSpeed} kt</Typography>
                        <Typography variant="caption">{formatWindDirection(metar.windDirection)}</Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <VisibilityIcon color="primary" />
                        <Typography variant="h6">{metar.visibility} SM</Typography>
                        <Typography variant="caption">Visibility</Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6} sm={3}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="h6">{metar.altimeter}"</Typography>
                        <Typography variant="caption">Altimeter</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {metar.clouds.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Cloud Layers:</Typography>
                      {metar.clouds.map((cloud, index) => (
                        <Chip
                          key={index}
                          label={`${formatCloudCoverage(cloud.coverage)} ${cloud.altitude}ft`}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>
                  )}
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showRawData}
                        onChange={(e) => setShowRawData(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Show Raw Data"
                    sx={{ mt: 2 }}
                  />
                  
                  {showRawData && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {metar.rawText}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Typography>No METAR data available</Typography>
          )}
        </TabPanel>

        {/* TAF Tab */}
        <TabPanel value={tabValue} index={1}>
          {taf ? (
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {taf.station} TAF
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Valid: {taf.validFrom.toLocaleString()} - {taf.validTo.toLocaleString()}
                  </Typography>
                  
                  {taf.forecast.map((period, index) => (
                    <Accordion key={index}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>
                          {period.from.toLocaleTimeString()} - {period.to.toLocaleTimeString()}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={4}>
                            <Typography variant="caption">Wind</Typography>
                            <Typography>{formatWindDirection(period.windDirection)} {period.windSpeed} kt</Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="caption">Visibility</Typography>
                            <Typography>{period.visibility} SM</Typography>
                          </Grid>
                          <Grid item xs={4}>
                            <Typography variant="caption">Clouds</Typography>
                            {period.clouds.map((cloud, i) => (
                              <Typography key={i} variant="body2">
                                {formatCloudCoverage(cloud.coverage)} {cloud.altitude}ft
                              </Typography>
                            ))}
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                  
                  {showRawData && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {taf.rawText}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          ) : (
            <Typography>No TAF data available</Typography>
          )}
        </TabPanel>

        {/* SIGMETs Tab */}
        <TabPanel value={tabValue} index={2}>
          {sigmets.length > 0 ? (
            <Box>
              {sigmets.map((sigmet) => (
                <Card key={sigmet.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6">
                        {sigmet.type} - {sigmet.phenomenon}
                      </Typography>
                      <Chip
                        label={sigmet.intensity || 'UNKNOWN'}
                        color={sigmet.intensity === 'SEVERE' ? 'error' : 'warning'}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      FIR: {sigmet.fir} | Valid: {sigmet.validFrom.toLocaleString()} - {sigmet.validTo.toLocaleString()}
                    </Typography>
                    
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {sigmet.rawText}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Typography>No active SIGMETs/AIRMETs</Typography>
          )}
        </TabPanel>

        {/* Layers Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('weather.layers')}
            </Typography>
            
            <List>
              <ListItem>
                <ListItemIcon>
                  <SatelliteIcon />
                </ListItemIcon>
                <ListItemText primary={t('weather.layers.satellite_ir')} />
                <Switch
                  checked={layersEnabled.satellite}
                  onChange={() => handleLayerToggle('satellite')}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <RadarIcon />
                </ListItemIcon>
                <ListItemText primary={t('weather.layers.radar_precipitation')} />
                <Switch
                  checked={layersEnabled.radar}
                  onChange={() => handleLayerToggle('radar')}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <WarningIcon />
                </ListItemIcon>
                <ListItemText primary={t('weather.layers.sigmets_airmets')} />
                <Switch
                  checked={layersEnabled.sigmets}
                  onChange={() => handleLayerToggle('sigmets')}
                />
              </ListItem>
              
              <ListItem>
                <ListItemIcon>
                  <WindIcon />
                </ListItemIcon>
                <ListItemText primary={t('weather.layers.winds_aloft')} />
                <Switch
                  checked={layersEnabled.winds}
                  onChange={() => handleLayerToggle('winds')}
                />
              </ListItem>
            </List>
          </Box>
        </TabPanel>

        {/* Sources Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {t('weather.sources')}
            </Typography>
            
            {sources.map((source) => (
              <Card key={source.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h6">{source.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Type: {source.type} | Reliability: {Math.round(source.reliability * 100)}%
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        icon={source.status === 'active' ? <CheckIcon /> : <ErrorIcon />}
                        label={source.status}
                        color={source.status === 'active' ? 'success' : 'error'}
                        size="small"
                      />
                      
                      <Tooltip title={`Last update: ${source.lastUpdate.toLocaleString()}`}>
                        <TimeIcon color="action" />
                      </Tooltip>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </TabPanel>
      </Box>
    </Paper>
  );
}

// Funciones para generar datos simulados
function generateSimulatedMetar(station: string): MetarData {
  return {
    station,
    observationTime: new Date(),
    rawText: `${station} ${new Date().toISOString().slice(11, 16)}Z AUTO 27008KT 10SM FEW250 22/18 A3012 RMK AO2 SLP201`,
    temperature: 22,
    dewpoint: 18,
    windDirection: 270,
    windSpeed: 8,
    visibility: 10,
    altimeter: 30.12,
    conditions: ['AUTO'],
    clouds: [{ coverage: 'FEW', altitude: 25000 }]
  };
}

function generateSimulatedTaf(station: string): TafData {
  const now = new Date();
  const validFrom = new Date(now.getTime() + 60 * 60 * 1000);
  const validTo = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  return {
    station,
    issueTime: now,
    validFrom,
    validTo,
    rawText: `TAF ${station} ${now.toISOString().slice(11, 16)}Z ${validFrom.toISOString().slice(8, 13)}/${validTo.toISOString().slice(8, 13)} 27010KT 9999 FEW030 SCT100`,
    forecast: [{
      from: validFrom,
      to: validTo,
      windDirection: 270,
      windSpeed: 10,
      visibility: 9999,
      conditions: [],
      clouds: [
        { coverage: 'FEW', altitude: 3000 },
        { coverage: 'SCT', altitude: 10000 }
      ]
    }]
  };
}

function generateSimulatedSigmets(): SigmetData[] {
  return [
    {
      id: 'SIGMET_001',
      fir: 'MADRID',
      type: 'SIGMET',
      phenomenon: 'TURB',
      validFrom: new Date(),
      validTo: new Date(Date.now() + 4 * 60 * 60 * 1000),
      intensity: 'MODERATE',
      rawText: 'SIGMET MADRID 001 VALID 120600/121000 LECM- MADRID FIR MOD TURB FL100/300'
    }
  ];
}

function generateSimulatedConfidence(): WeatherConfidence {
  return {
    overall: 85,
    factors: {
      temporal: 90,
      spatial: 80,
      consensus: 85,
      reliability: 85
    }
  };
}

function generateSimulatedSources(): WeatherSource[] {
  return [
    {
      id: 'awc',
      name: 'Aviation Weather Center',
      type: 'aviation',
      status: 'active',
      reliability: 0.95,
      lastUpdate: new Date()
    },
    {
      id: 'noaa',
      name: 'NOAA Satellite',
      type: 'satellite',
      status: 'active',
      reliability: 0.90,
      lastUpdate: new Date()
    }
  ];
}