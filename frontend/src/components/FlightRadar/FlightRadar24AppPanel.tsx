import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import {
  Close as CloseIcon,
  Radar as RadarIcon,
  PhoneAndroid as AndroidIcon,
  PhoneIphone as IosIcon,
  Computer as WebIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';

interface FlightRadar24AppPanelProps {
  visible: boolean;
  onClose: () => void;
}

export default function FlightRadar24AppPanel({ visible, onClose }: FlightRadar24AppPanelProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionSelect = (option: string, url: string) => {
    setSelectedOption(option);
    setTimeout(() => {
      window.open(url, '_blank');
      setSelectedOption(null);
      onClose();
    }, 800);
  };

  if (!visible) return null;

  return (
    <Paper
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        maxWidth: '90vw',
        zIndex: 1300,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}
    >
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RadarIcon sx={{ mr: 2, color: '#1976d2', fontSize: 32 }} />
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Flightradar24
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Live Flight Tracking
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
          Choose how you'd like to access Flightradar24:
        </Typography>

        {/* Options */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Mobile App - Android */}
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: selectedOption === 'android' ? 2 : 1,
              borderColor: selectedOption === 'android' ? 'primary.main' : 'divider',
              '&:hover': {
                boxShadow: 2,
                transform: 'translateY(-2px)'
              }
            }}
            onClick={() => handleOptionSelect('android', 'https://play.google.com/store/apps/details?id=com.flightradar24free')}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
              <AndroidIcon sx={{ mr: 2, color: '#4CAF50', fontSize: 28 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Android App
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Download from Google Play Store
                </Typography>
              </Box>
              <Chip label="Recommended" color="success" size="small" />
            </CardContent>
          </Card>

          {/* Mobile App - iOS */}
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: selectedOption === 'ios' ? 2 : 1,
              borderColor: selectedOption === 'ios' ? 'primary.main' : 'divider',
              '&:hover': {
                boxShadow: 2,
                transform: 'translateY(-2px)'
              }
            }}
            onClick={() => handleOptionSelect('ios', 'https://apps.apple.com/app/flightradar24-flight-tracker/id382233851')}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
              <IosIcon sx={{ mr: 2, color: '#000', fontSize: 28 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  iPhone/iPad App
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Download from App Store
                </Typography>
              </Box>
              <Chip label="Recommended" color="success" size="small" />
            </CardContent>
          </Card>

          <Divider sx={{ my: 1 }}>
            <Typography variant="caption" color="text.secondary">
              or
            </Typography>
          </Divider>

          {/* Web Version */}
          <Card 
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.2s',
              border: selectedOption === 'web' ? 2 : 1,
              borderColor: selectedOption === 'web' ? 'primary.main' : 'divider',
              '&:hover': {
                boxShadow: 2,
                transform: 'translateY(-2px)'
              }
            }}
            onClick={() => handleOptionSelect('web', 'https://www.flightradar24.com/')}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
              <WebIcon sx={{ mr: 2, color: '#1976d2', fontSize: 28 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Web Version
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Open in browser (limited features)
                </Typography>
              </Box>
              <OpenInNewIcon sx={{ color: 'text.secondary' }} />
            </CardContent>
          </Card>
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            For the best experience, we recommend using the mobile app
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

// Hook personalizado para Flightradar24
export const useFlightradar24 = () => {
  const [flightradar24PanelOpen, setFlightradar24PanelOpen] = useState(false);

  const openFlightradar24Panel = () => setFlightradar24PanelOpen(true);
  const closeFlightradar24Panel = () => setFlightradar24PanelOpen(false);
  const toggleFlightradar24Panel = () => setFlightradar24PanelOpen(prev => !prev);

  return {
    flightradar24PanelOpen,
    openFlightradar24Panel,
    closeFlightradar24Panel,
    toggleFlightradar24Panel
  };
};