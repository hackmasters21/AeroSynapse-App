import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import {
  OpenInNew as OpenInNewIcon,
  Refresh as RefreshIcon,
  Flight as FlightIcon
} from '@mui/icons-material';

interface FlightTrackingSite {
  id: number;
  name: string;
  description: string;
  url: string;
  logo: string;
  features: string[];
  isPrimary?: boolean;
}

const flightTrackingSites: FlightTrackingSite[] = [
  {
    id: 2,
    name: 'PlaneFinder',
    description: 'Live flight tracking and airport information',
    url: 'https://planefinder.net/',
    logo: '🛩️',
    features: ['Live tracking', 'Flight history', 'Aircraft photos', 'Weather']
  },
  {
    id: 3,
    name: 'RadarBox',
    description: 'Professional flight tracking platform',
    url: 'https://www.radarbox.com/',
    logo: '📡',
    features: ['Professional data', 'API access', 'Historical data', 'Analytics']
  },
  {
    id: 4,
    name: 'ADS-B Exchange',
    description: 'Open source flight tracking',
    url: 'https://globe.adsbexchange.com/',
    logo: '🌐',
    features: ['Open source', 'Military aircraft', 'No filtering', 'Community driven']
  },
  {
    id: 5,
    name: 'FlightAware',
    description: 'Flight tracking and aviation data',
    url: 'https://flightaware.com/',
    logo: '🛫',
    features: ['Flight alerts', 'Airport delays', 'Weather', 'Flight planning']
  },
  {
    id: 6,
    name: 'OpenSky Network',
    description: 'Research-oriented flight tracking',
    url: 'https://opensky-network.org/',
    logo: '🔬',
    features: ['Research data', 'API access', 'Historical data', 'Academic use']
  }
];

export default function FlightRadarEmbed() {
  const handleOpenExternal = (url: string) => {
    console.log('Opening URL:', url);
    window.open(url, '_blank');
  };

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 }, 
      height: '100%', 
      overflow: 'hidden', 
      position: 'relative',
      width: '100%',
      boxSizing: 'border-box'
    }}>

      
      {/* Content Container */}
       <Box
          id="flight-tracking-container"
          sx={{
            height: '100%',
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px'
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(0,0,0,0.1)',
              borderRadius: '4px'
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '4px'
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: 'rgba(0,0,0,0.5)'
            }
          }}
        >
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Flight Tracking Websites
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Click on any site to open it in a new tab
        </Typography>
      </Box>

      {/* Flight Tracking Sites */}
      <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
        Flight Tracking Platforms
      </Typography>
      
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: 'repeat(auto-fit, minmax(280px, 1fr))', 
          md: 'repeat(auto-fit, minmax(300px, 1fr))' 
        }, 
        gap: { xs: 1, sm: 1.5, md: 2 } 
      }}>
        {flightTrackingSites.map((site) => (
          <Card key={site.id} sx={{ height: 'fit-content' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" sx={{ mr: 2 }}>{site.logo}</Typography>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {site.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {site.description}
                  </Typography>
                </Box>
              </Box>
              
              <Button
                variant="contained"
                startIcon={<OpenInNewIcon />}
                onClick={() => handleOpenExternal(site.url)}
                fullWidth
              >
                Visit {site.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </Box>
      </Box>
    </Box>
  );
}