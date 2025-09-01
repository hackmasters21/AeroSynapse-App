import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Componentes principales
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';
import MapView from './components/Map/MapView';

import RoutePanel from './components/Route/RoutePanel';
import AlertsPanel from './components/Alerts/AlertsPanel';
import RadarPanel from './components/Radar/RadarPanel';
import AnalyticsPanel from './components/Analytics/AnalyticsPanel';
import SettingsPanel from './components/Settings/SettingsPanel';
import AboutPanel from './components/About/AboutPanel';
import FlightRadarEmbed from './components/FlightRadar/FlightRadarEmbed';
import DonateButton from './components/DonateButton/DonateButton';
import PlanningPanel from './components/Planning/PlanningPanel';


// Contextos
import { AppProvider } from './contexts/AppContext';
import { SocketProvider } from './contexts/SocketContext';

// Tipos
import { ThemeMode } from './types/app.types';

// Inicializar i18n
import './i18n';

// Estilos CSS
import './App.css';

function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<string>('traffic');

  // Tema personalizado para aviación
  const theme = createTheme({
    palette: {
      mode: themeMode === 'night' ? 'dark' : themeMode as 'light' | 'dark',
      primary: {
        main: themeMode === 'night' ? '#ff4444' : '#00ff88',
        dark: themeMode === 'night' ? '#cc0000' : '#00cc66',
        light: themeMode === 'night' ? '#ff6666' : '#33ffaa',
      },
      secondary: {
        main: '#ffaa00',
        dark: '#cc8800',
        light: '#ffcc33',
      },
      background: {
        default: themeMode === 'night' ? '#000000' : themeMode === 'dark' ? '#0a0a0a' : '#f5f5f5',
        paper: themeMode === 'night' ? '#111111' : themeMode === 'dark' ? '#1a1a1a' : '#ffffff',
      },
      text: {
        primary: themeMode === 'night' ? '#ff4444' : themeMode === 'dark' ? '#ffffff' : '#000000',
        secondary: themeMode === 'night' ? '#ffaaaa' : themeMode === 'dark' ? '#cccccc' : '#666666',
      },
      error: {
        main: '#ff4444',
      },
      warning: {
        main: '#ffaa00',
      },
      success: {
        main: '#00ff88',
      },
    },
    typography: {
      fontFamily: 'Roboto, Arial, sans-serif',
      h1: {
        fontSize: '2rem',
        fontWeight: 500,
      },
      h2: {
        fontSize: '1.5rem',
        fontWeight: 500,
      },
      body1: {
        fontSize: '0.875rem',
      },
      body2: {
        fontSize: '0.75rem',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: themeMode === 'night' ? '#ff4444 #111111' : '#666666 #1a1a1a',
          },
        },
      },
    },
  });

  // Detectar preferencia de tema del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (localStorage.getItem('themeMode') === null) {
        setThemeMode(mediaQuery.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    handleChange();

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Cargar tema guardado
  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode') as ThemeMode;
    if (savedTheme) {
      setThemeMode(savedTheme);
    }
  }, []);

  // Guardar tema
  const handleThemeChange = (newTheme: ThemeMode) => {
    setThemeMode(newTheme);
    localStorage.setItem('themeMode', newTheme);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <SocketProvider>
          <Router>
            <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
              {/* Header */}
              <Header
                themeMode={themeMode}
                onThemeChange={handleThemeChange}
                sidebarOpen={sidebarOpen}
                onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
              />

              {/* Sidebar */}
              <Sidebar
                open={sidebarOpen}
                activePanel={activePanel}
                onPanelChange={setActivePanel}
              />

              {/* Contenido principal */}
              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100vh',
                  paddingTop: '64px', // Altura del header
                  marginLeft: sidebarOpen ? '240px' : '60px', // Ancho del sidebar
                  transition: 'margin-left 0.3s ease',
                }}
              >
                {/* Contenido según panel activo */}
                {activePanel === 'map' && (
                  <Box sx={{ flex: 1, position: 'relative' }}>
                    <Routes>
                      <Route path="/" element={<MapView />} />
                      <Route path="/map" element={<MapView />} />
                    </Routes>
                  </Box>
                )}
                
                {activePanel === 'traffic' && (
                   <Box sx={{ flex: 1, position: 'relative' }}>
                     <FlightRadarEmbed />
                   </Box>
                 )}
                
                {activePanel === 'route' && <RoutePanel />}
                {activePanel === 'planning' && <PlanningPanel />}
                {activePanel === 'alerts' && <AlertsPanel />}

                {activePanel === 'radar' && <RadarPanel />}
                {activePanel === 'analytics' && <AnalyticsPanel />}
                {activePanel === 'settings' && <SettingsPanel />}
                {activePanel === 'about' && <AboutPanel />}
              </Box>
            </Box>
          </Router>
        </SocketProvider>
      </AppProvider>
      
      {/* Donate Button - Always visible */}
      <DonateButton />
    </ThemeProvider>
  );
}

export default App;