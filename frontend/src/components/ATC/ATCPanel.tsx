import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
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
  Collapse,
  Alert,
  Button,
  CircularProgress,
  Slider
} from '@mui/material';
import {
  Radio as RadioIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  VolumeUp as VolumeIcon,
  VolumeOff as VolumeOffIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Headphones as HeadphonesIcon,
  Refresh as RefreshIcon,
  OpenInNew as OpenInNewIcon,
  Mic as NewsIcon,
  Piano as ClassicalIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import liveAtcService, { ATCStation } from '../../services/liveAtcService';

interface ATCPanelProps {
  visible: boolean;
  onClose?: () => void;
}

export default function ATCPanel({ visible, onClose }: ATCPanelProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStation, setSelectedStation] = useState<ATCStation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['popular']);
  const [stations, setStations] = useState<ATCStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load stations from LiveATC service
  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    try {
      setLoading(true);
      setError(null);
      const atcStations = await liveAtcService.getATCStations();
      setStations(atcStations);
    } catch (err) {
      setError('Failed to load ATC stations');
      console.error('Error loading ATC stations:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshStations = () => {
    loadStations();
  };



  const getStationColor = (type: ATCStation['type']) => {
    switch (type) {
      case 'music':
      case 'pop':
      case 'rock':
        return 'secondary';
      case 'news':
      case 'talk':
        return 'info';
      case 'classical':
        return 'secondary';
      case 'jazz':
        return 'warning';
      case 'country':
        return 'success';
      default:
        return 'default';
    }
  };

  // Filter and search stations
  const filteredStations = searchTerm
    ? stations.filter(station =>
        station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.frequency.includes(searchTerm)
      )
    : stations;

  // Group stations using the service
  const groupedStations = liveAtcService.groupStationsByType(filteredStations);

  const handleStationSelect = (station: ATCStation) => {
    if (selectedStation?.id === station.id && isPlaying) {
      // Stop current station
      setIsPlaying(false);
      setSelectedStation(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    } else {
      // Play new station
      setSelectedStation(station);
      const streamUrl = liveAtcService.getDirectStreamUrl(station);
      if (streamUrl) {
        setIsPlaying(true);
        setError(null); // Clear any previous errors
        if (audioRef.current) {
          audioRef.current.src = streamUrl;
          audioRef.current.volume = volume;
          audioRef.current.crossOrigin = 'anonymous';
          
          // Add event listeners for better error handling
          audioRef.current.onloadstart = () => {
            console.log('Loading audio stream:', streamUrl);
          };
          
          audioRef.current.oncanplay = () => {
            console.log('Audio stream ready to play');
          };
          
          audioRef.current.onerror = (e) => {
            console.error('Audio error:', e);
            setError(`Audio stream unavailable for ${station.name}. This may be due to CORS restrictions or the stream being offline.`);
            setIsPlaying(false);
          };
          
          audioRef.current.play().catch(err => {
            console.error('Error playing audio:', err);
            setError(`Cannot play ${station.name}. Stream may be offline or blocked by browser security policies.`);
            setIsPlaying(false);
          });
        }
      } else {
        setError('No stream URL available for this station');
      }
    }
  };

  // Handle volume change
  const handleVolumeChange = (event: Event, newValue: number | number[]) => {
    const vol = Array.isArray(newValue) ? newValue[0] : newValue;
    setVolume(vol / 100);
    if (audioRef.current) {
      audioRef.current.volume = vol / 100;
    }
  };

  const handleToggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleStopAll = () => {
    setIsPlaying(false);
    setSelectedStation(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  };

  if (!visible) return null;

  return (
    <Paper
      sx={{
        position: 'fixed',
        top: 80,
        right: 16,
        width: 380,
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
            <HeadphonesIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Radio Stations</Typography>
          </Box>
          {onClose && (
            <IconButton onClick={onClose} size="small">
              <ExpandLessIcon />
            </IconButton>
          )}
        </Box>
        
        {/* Search and Controls */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={t('atc.search_stations')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
          />
          <Tooltip title="Refresh Stations">
            <IconButton onClick={refreshStations} disabled={loading}>
              {loading ? <CircularProgress size={20} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Open LiveATC.net">
            <IconButton onClick={() => window.open('https://www.liveatc.net', '_blank')}>
              <OpenInNewIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* Player Controls */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={isPlaying ? "contained" : "outlined"}
            startIcon={isPlaying ? <StopIcon /> : <PlayIcon />}
            onClick={selectedStation ? () => handleStationSelect(selectedStation) : undefined}
            disabled={!selectedStation || loading}
            sx={{ flex: 1 }}
          >
            {isPlaying ? 'Stop' : 'Play'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<StopIcon />}
            onClick={handleStopAll}
            disabled={!isPlaying}
          >
            Stop All
          </Button>
        </Box>
        
        {/* Volume Control */}
        {selectedStation && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" gutterBottom>
              Volume: {Math.round(volume * 100)}%
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VolumeOffIcon fontSize="small" />
              <Slider
                size="small"
                value={volume * 100}
                onChange={handleVolumeChange}
                min={0}
                max={100}
                sx={{ flex: 1 }}
              />
              <VolumeIcon fontSize="small" />
            </Box>
          </Box>
        )}
      </Box>

      {/* Audio element */}
      <audio ref={audioRef} style={{ display: 'none' }} />
      
      {/* Status and Information */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }}>
          <Typography variant="caption">{error}</Typography>
        </Alert>
      )}
      
      {loading && (
        <Alert severity="info" sx={{ m: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption">Loading ATC stations...</Typography>
          </Box>
        </Alert>
      )}
      
      {!loading && !error && (
        <Alert severity="info" sx={{ m: 2 }}>
          <Typography variant="caption">
            📻 Radio stations from around the world for pilot entertainment during flight planning - {stations.length} stations available
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
            Note: Audio streams may be blocked by browser security policies or CORS restrictions.
          </Typography>
          {selectedStation && isPlaying && (
            <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 'bold', color: 'success.main' }}>
              🔊 Now playing: {selectedStation.name} ({liveAtcService.formatFrequency(selectedStation.frequency)}) - {selectedStation.city}, {selectedStation.country}
            </Typography>
          )}
          {selectedStation && !isPlaying && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              📻 Selected: {selectedStation.name} ({liveAtcService.formatFrequency(selectedStation.frequency)})
            </Typography>
          )}
        </Alert>
      )}

      {/* Lista de estaciones */}
      <Box sx={{ p: 1 }}>
        {/* Popular Stations */}
        {!loading && groupedStations.popular.length > 0 && (
          <Box>
            <ListItemButton onClick={() => handleToggleCategory('popular')}>
              <ListItemIcon>
                <RadioIcon color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary={`🔥 Popular Stations (${groupedStations.popular.length})`}
                secondary="High listener count"
              />
              {expandedCategories.includes('popular') ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
            <Collapse in={expandedCategories.includes('popular')}>
              <List dense>
                {groupedStations.popular.map(station => (
                  <ListItem key={station.id}>
                    <ListItemButton 
                      onClick={() => handleStationSelect(station)}
                      selected={selectedStation?.id === station.id}
                      disabled={loading}
                    >
                      <ListItemIcon>
                        {selectedStation?.id === station.id && isPlaying ? (
                          <StopIcon color="error" />
                        ) : (
                          <PlayIcon color="primary" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="bold">
                              {station.name}
                            </Typography>
                            <Chip
                              label={station.frequency}
                              size="small"
                              color={getStationColor(station.type) as any}
                              variant="outlined"
                            />
                            {selectedStation?.id === station.id && isPlaying && (
                              <Chip
                                label="🔊 LIVE"
                                size="small"
                                color="error"
                                variant="filled"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="caption">
                              {station.city}, {station.country}
                            </Typography>
                            <Chip
                              label={station.type.charAt(0).toUpperCase() + station.type.slice(1)}
                              size="small"
                              color="primary"
                              variant="filled"
                            />
                            {station.listeners && station.listeners > 0 && (
                              <Chip
                                label={`${station.listeners} 👥`}
                                size="small"
                                color="success"
                                variant="filled"
                              />
                            )}
                            <Chip
                              label={station.status === 'online' ? 'Live' : 'Offline'}
                              size="small"
                              color={station.status === 'online' ? 'success' : 'error'}
                              variant="filled"
                            />
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
            <Divider />
          </Box>
        )}

        {/* Music Stations */}
        {!loading && groupedStations.music && groupedStations.music.length > 0 && (
          <Box>
            <ListItemButton onClick={() => handleToggleCategory('music')}>
              <ListItemIcon>
                <RadioIcon />
              </ListItemIcon>
              <ListItemText 
                primary={`🎵 Music Stations (${groupedStations.music.length})`}
                secondary="Pop, rock and music"
              />
              {expandedCategories.includes('music') ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
            <Collapse in={expandedCategories.includes('music')}>
              <List dense>
                {groupedStations.music.map(station => (
                  <ListItem key={station.id}>
                    <ListItemButton 
                      onClick={() => handleStationSelect(station)}
                      selected={selectedStation?.id === station.id}
                      disabled={loading}
                    >
                      <ListItemIcon>
                        {selectedStation?.id === station.id && isPlaying ? (
                          <StopIcon color="error" />
                        ) : (
                          <RadioIcon fontSize="small" color="secondary" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {station.name}
                            </Typography>
                            <Chip
                              label={station.frequency}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                            {selectedStation?.id === station.id && isPlaying && (
                              <Chip label="🔊" size="small" color="error" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption">
                              {station.city}, {station.country}
                            </Typography>
                            <Chip
                              label={station.type.charAt(0).toUpperCase() + station.type.slice(1)}
                              size="small"
                              variant="filled"
                              color="secondary"
                            />
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
            <Divider />
          </Box>
        )}

        {/* News & Talk Stations */}
        {!loading && groupedStations.news && groupedStations.news.length > 0 && (
          <Box>
            <ListItemButton onClick={() => handleToggleCategory('news')}>
              <ListItemIcon>
                <NewsIcon />
              </ListItemIcon>
              <ListItemText 
                primary={`📰 News & Talk (${groupedStations.news.length})`}
                secondary="News and talk radio"
              />
              {expandedCategories.includes('news') ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
            <Collapse in={expandedCategories.includes('news')}>
              <List dense>
                {groupedStations.news.map(station => (
                  <ListItem key={station.id}>
                    <ListItemButton 
                      onClick={() => handleStationSelect(station)}
                      selected={selectedStation?.id === station.id}
                      disabled={loading}
                    >
                      <ListItemIcon>
                        {selectedStation?.id === station.id && isPlaying ? (
                          <StopIcon color="error" />
                        ) : (
                          <NewsIcon fontSize="small" color="info" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {station.name}
                            </Typography>
                            <Chip
                              label={station.frequency}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                            {selectedStation?.id === station.id && isPlaying && (
                              <Chip label="🔊" size="small" color="error" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption">
                              {station.city}, {station.country}
                            </Typography>
                            <Chip
                              label={station.type.charAt(0).toUpperCase() + station.type.slice(1)}
                              size="small"
                              variant="filled"
                              color="info"
                            />
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
            <Divider />
          </Box>
        )}

        {/* Classical Music Stations */}
        {!loading && groupedStations.classical && groupedStations.classical.length > 0 && (
          <Box>
            <ListItemButton onClick={() => handleToggleCategory('classical')}>
              <ListItemIcon>
                <ClassicalIcon />
              </ListItemIcon>
              <ListItemText 
                primary={`🎼 Classical Music (${groupedStations.classical.length})`}
                secondary="Classical and cultural music"
              />
              {expandedCategories.includes('classical') ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </ListItemButton>
            <Collapse in={expandedCategories.includes('classical')}>
              <List dense>
                {groupedStations.classical.map(station => (
                  <ListItem key={station.id}>
                    <ListItemButton 
                      onClick={() => handleStationSelect(station)}
                      selected={selectedStation?.id === station.id}
                      disabled={loading}
                    >
                      <ListItemIcon>
                        {selectedStation?.id === station.id && isPlaying ? (
                          <StopIcon color="error" />
                        ) : (
                          <ClassicalIcon fontSize="small" color="secondary" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {station.name}
                            </Typography>
                            <Chip
                              label={station.frequency}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                            {selectedStation?.id === station.id && isPlaying && (
                              <Chip label="🔊" size="small" color="error" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption">
                              {station.city}, {station.country}
                            </Typography>
                            <Chip
                              label={station.type.charAt(0).toUpperCase() + station.type.slice(1)}
                              size="small"
                              variant="filled"
                              color="secondary"
                            />
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
            <Divider />
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', backgroundColor: 'grey.50' }}>
        <Typography variant="caption" color="text.secondary" display="block">
          📻 Radio Entertainment • Music and talk radio for pilots
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          {!loading && `${stations.length} stations available`}
          {selectedStation && ` • Playing: ${selectedStation.name}`}
          {isPlaying && ` • Volume: ${Math.round(volume * 100)}%`}
        </Typography>
        {error && (
          <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
            ⚠️ {error}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

// Hook personalizado para ATC
export const useATC = () => {
  const [atcPanelOpen, setAtcPanelOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<ATCStation | null>(null);

  const openATCPanel = () => setAtcPanelOpen(true);
  const closeATCPanel = () => setAtcPanelOpen(false);
  const toggleATCPanel = () => setAtcPanelOpen(prev => !prev);

  return {
    atcPanelOpen,
    selectedStation,
    openATCPanel,
    closeATCPanel,
    toggleATCPanel,
    setSelectedStation
  };
};