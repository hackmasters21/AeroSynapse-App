import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Link,
  Button
} from '@mui/material';
import {
  Info as InfoIcon,
  Flight as FlightIcon,
  Radar as RadarIcon,
  Public as PublicIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  Update as UpdateIcon,
  GitHub as GitHubIcon
} from '@mui/icons-material';

export default function AboutPanel() {
  const version = '2.1.0';
  const buildDate = new Date().toLocaleDateString();
  
  const features = [
    { icon: <FlightIcon />, title: 'Real-time Aircraft Tracking', description: 'Live aircraft positions from OpenSky Network' },
    { icon: <RadarIcon />, title: 'Weather Radar', description: 'Integrated weather data and radar imagery' },

    { icon: <SecurityIcon />, title: 'Safety Alerts', description: 'Emergency and proximity alert system' },

    { icon: <UpdateIcon />, title: 'Real-time Updates', description: 'Live data updates every 5-30 seconds' }
  ];

  const dataSources = [
    { name: 'OpenSky Network', url: 'https://opensky-network.org/', description: 'Aircraft position data' },

    { name: 'Flightradar24', url: 'https://www.flightradar24.com/', description: 'Flight tracking and aircraft information' },
    { name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/', description: 'Base map tiles and geographic data' }
  ];

  const technologies = [
    'React 18', 'TypeScript', 'Material-UI', 'Leaflet', 'Socket.IO', 'Node.js', 'Express'
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <FlightIcon sx={{ mr: 1, color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" fontWeight="bold">
            AeroSynapse
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          Professional Aviation Situational Awareness System
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Chip label={`Version ${version}`} color="primary" size="small" sx={{ mr: 1 }} />
          <Chip label={`Build ${buildDate}`} variant="outlined" size="small" />
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        {/* Description */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              About AeroSynapse
            </Typography>
            <Typography variant="body2" paragraph>
              AeroSynapse is a comprehensive aviation situational awareness platform designed for 
              pilots, air traffic controllers, aviation enthusiasts, and professionals. It provides 
              real-time aircraft tracking, weather information, safety alerts, and communication tools 
              in a unified, easy-to-use interface.
            </Typography>
            <Typography variant="body2">
              Built with modern web technologies, AeroSynapse delivers professional-grade aviation 
              data visualization and monitoring capabilities accessible from any device with a web browser.
            </Typography>
          </CardContent>
        </Card>

        {/* Key Features */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Key Features
            </Typography>
            <List dense>
              {features.map((feature, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon sx={{ color: 'primary.main' }}>
                      {feature.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={feature.title}
                      secondary={feature.description}
                    />
                  </ListItem>
                  {index < features.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Data Sources */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Data Sources
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              AeroSynapse integrates data from multiple trusted aviation sources:
            </Typography>
            <List dense>
              {dataSources.map((source, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      <PublicIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Link href={source.url} target="_blank" rel="noopener">
                          {source.name}
                        </Link>
                      }
                      secondary={source.description}
                    />
                  </ListItem>
                  {index < dataSources.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>

        {/* Technologies */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Technologies
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Built with modern, reliable technologies:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {technologies.map((tech) => (
                <Chip
                  key={tech}
                  label={tech}
                  variant="outlined"
                  size="small"
                  color="primary"
                />
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              System Information
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText
                  primary="Version"
                  secondary={version}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Build Date"
                  secondary={buildDate}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Platform"
                  secondary="Web Application (Cross-platform)"
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="License"
                  secondary="Proprietary - Professional Aviation Software"
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText
                  primary="Update Channel"
                  secondary="Stable Release"
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Support & Documentation
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              For technical support, documentation, or feature requests:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<InfoIcon />}
                fullWidth
                onClick={() => window.open('mailto:support@aerosynapse.com', '_blank')}
              >
                Contact Support
              </Button>
              <Button
                variant="outlined"
                startIcon={<CodeIcon />}
                fullWidth
                onClick={() => window.open('/docs', '_blank')}
              >
                View Documentation
              </Button>
            </Box>
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              © 2024 AeroSynapse. All rights reserved. This software is designed for aviation 
              professionals and enthusiasts. Always consult official sources for flight operations.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}