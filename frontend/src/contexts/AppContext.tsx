import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppState, AppEvent, Aircraft, Alert, Route, AppSettings, TrafficFilter, ThemeMode, UnitSystem, MapProvider } from '../types/app.types';

// Estado inicial
const initialState: AppState = {
  isLoading: false,
  isConnected: false,
  lastUpdate: null,
  error: null,
  aircraft: [],
  alerts: [],
  selectedAircraft: null,
  currentRoute: null,
  settings: {
    theme: 'dark',
    units: UnitSystem.AVIATION,
    mapProvider: MapProvider.OPENSTREETMAP,
    updateInterval: 5,
    alertSounds: true,
    voiceAlerts: false,
    autoZoom: true,
    showTrails: true,
    trailLength: 10,
    proximityDistance: 5,
    proximityAltitude: 1000,
  },
  filters: {
    showOnGround: true,
    showEmergency: true,
  },
};

// Tipos de acciones
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_AIRCRAFT'; payload: Aircraft[] }
  | { type: 'ADD_AIRCRAFT'; payload: Aircraft }
  | { type: 'REMOVE_AIRCRAFT'; payload: string }
  | { type: 'SELECT_AIRCRAFT'; payload: string | null }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'REMOVE_ALERT'; payload: string }
  | { type: 'ACKNOWLEDGE_ALERT'; payload: string }
  | { type: 'SET_ROUTE'; payload: Route | null }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'UPDATE_FILTERS'; payload: Partial<TrafficFilter> }
  | { type: 'SET_LAST_UPDATE'; payload: Date };

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'UPDATE_AIRCRAFT':
      return {
        ...state,
        aircraft: action.payload,
        lastUpdate: new Date(),
      };
    
    case 'ADD_AIRCRAFT':
      return {
        ...state,
        aircraft: [...state.aircraft.filter(a => a.id !== action.payload.id), action.payload],
        lastUpdate: new Date(),
      };
    
    case 'REMOVE_AIRCRAFT':
      return {
        ...state,
        aircraft: state.aircraft.filter(a => a.id !== action.payload),
        selectedAircraft: state.selectedAircraft === action.payload ? null : state.selectedAircraft,
      };
    
    case 'SELECT_AIRCRAFT':
      return { ...state, selectedAircraft: action.payload };
    
    case 'ADD_ALERT':
      return {
        ...state,
        alerts: [action.payload, ...state.alerts],
      };
    
    case 'REMOVE_ALERT':
      return {
        ...state,
        alerts: state.alerts.filter(a => a.id !== action.payload),
      };
    
    case 'ACKNOWLEDGE_ALERT':
      return {
        ...state,
        alerts: state.alerts.map(alert =>
          alert.id === action.payload
            ? { ...alert, acknowledged: true }
            : alert
        ),
      };
    
    case 'SET_ROUTE':
      return { ...state, currentRoute: action.payload };
    
    case 'UPDATE_SETTINGS':
      const newSettings = { ...state.settings, ...action.payload };
      // Guardar en localStorage
      localStorage.setItem('aerosynapse-settings', JSON.stringify(newSettings));
      return { ...state, settings: newSettings };
    
    case 'UPDATE_FILTERS':
      const newFilters = { ...state.filters, ...action.payload };
      // Guardar en localStorage
      localStorage.setItem('aerosynapse-filters', JSON.stringify(newFilters));
      return { ...state, filters: newFilters };
    
    case 'SET_LAST_UPDATE':
      return { ...state, lastUpdate: action.payload };
    
    default:
      return state;
  }
}

// Contexto
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Acciones de conveniencia
  setLoading: (loading: boolean) => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
  updateAircraft: (aircraft: Aircraft[]) => void;
  addAircraft: (aircraft: Aircraft) => void;
  removeAircraft: (aircraftId: string) => void;
  selectAircraft: (aircraftId: string | null) => void;
  addAlert: (alert: Alert) => void;
  removeAlert: (alertId: string) => void;
  acknowledgeAlert: (alertId: string) => void;
  setRoute: (route: Route | null) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  updateFilters: (filters: Partial<TrafficFilter>) => void;
  // Selectores
  getSelectedAircraft: () => Aircraft | null;
  getFilteredAircraft: () => Aircraft[];
  getUnacknowledgedAlerts: () => Alert[];
  getCriticalAlerts: () => Alert[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Cargar configuración guardada al inicializar
  useEffect(() => {
    const savedSettings = localStorage.getItem('aerosynapse-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
      } catch (error) {
        console.error('Error cargando configuración:', error);
      }
    }

    const savedFilters = localStorage.getItem('aerosynapse-filters');
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        dispatch({ type: 'UPDATE_FILTERS', payload: filters });
      } catch (error) {
        console.error('Error cargando filtros:', error);
      }
    }
  }, []);

  // Acciones de conveniencia
  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setConnected = (connected: boolean) => {
    dispatch({ type: 'SET_CONNECTED', payload: connected });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const updateAircraft = (aircraft: Aircraft[]) => {
    dispatch({ type: 'UPDATE_AIRCRAFT', payload: aircraft });
  };

  const addAircraft = (aircraft: Aircraft) => {
    dispatch({ type: 'ADD_AIRCRAFT', payload: aircraft });
  };

  const removeAircraft = (aircraftId: string) => {
    dispatch({ type: 'REMOVE_AIRCRAFT', payload: aircraftId });
  };

  const selectAircraft = (aircraftId: string | null) => {
    dispatch({ type: 'SELECT_AIRCRAFT', payload: aircraftId });
  };

  const addAlert = (alert: Alert) => {
    dispatch({ type: 'ADD_ALERT', payload: alert });
    
    // Reproducir sonido de alerta si está habilitado
    if (state.settings.alertSounds) {
      playAlertSound(alert.severity);
    }
    
    // Alerta por voz si está habilitada
    if (state.settings.voiceAlerts) {
      speakAlert(alert);
    }
  };

  const removeAlert = (alertId: string) => {
    dispatch({ type: 'REMOVE_ALERT', payload: alertId });
  };

  const acknowledgeAlert = (alertId: string) => {
    dispatch({ type: 'ACKNOWLEDGE_ALERT', payload: alertId });
  };

  const setRoute = (route: Route | null) => {
    dispatch({ type: 'SET_ROUTE', payload: route });
  };

  const updateSettings = (settings: Partial<AppSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  const updateFilters = (filters: Partial<TrafficFilter>) => {
    dispatch({ type: 'UPDATE_FILTERS', payload: filters });
  };

  // Selectores
  const getSelectedAircraft = (): Aircraft | null => {
    if (!state.selectedAircraft) return null;
    return state.aircraft.find(a => a.id === state.selectedAircraft) || null;
  };

  const getFilteredAircraft = (): Aircraft[] => {
    return state.aircraft.filter(aircraft => {
      const { filters } = state;
      
      // Filtro de altitud
      if (filters.altitudeMin !== undefined && aircraft.altitude < filters.altitudeMin) {
        return false;
      }
      if (filters.altitudeMax !== undefined && aircraft.altitude > filters.altitudeMax) {
        return false;
      }
      
      // Filtro de aeronaves en tierra
      if (!filters.showOnGround && aircraft.onGround) {
        return false;
      }
      
      // Filtro de tipos de aeronave
      if (filters.aircraftTypes && filters.aircraftTypes.length > 0) {
        if (!aircraft.aircraftType || !filters.aircraftTypes.includes(aircraft.aircraftType)) {
          return false;
        }
      }
      
      // Filtro de aerolíneas
      if (filters.airlines && filters.airlines.length > 0) {
        if (!aircraft.airline || !filters.airlines.includes(aircraft.airline)) {
          return false;
        }
      }
      
      return true;
    });
  };

  const getUnacknowledgedAlerts = (): Alert[] => {
    return state.alerts.filter(alert => !alert.acknowledged);
  };

  const getCriticalAlerts = (): Alert[] => {
    return state.alerts.filter(alert => alert.severity === 'critical' && !alert.acknowledged);
  };

  // Funciones auxiliares
  const playAlertSound = (severity: string) => {
    // Implementar reproducción de sonidos según severidad
    const audio = new Audio();
    switch (severity) {
      case 'critical':
        audio.src = '/sounds/critical-alert.mp3';
        break;
      case 'high':
        audio.src = '/sounds/high-alert.mp3';
        break;
      case 'medium':
        audio.src = '/sounds/medium-alert.mp3';
        break;
      default:
        audio.src = '/sounds/low-alert.mp3';
    }
    audio.play().catch(console.error);
  };

  const speakAlert = (alert: Alert) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(alert.message);
      utterance.rate = 0.8;
      utterance.pitch = 1.2;
      speechSynthesis.speak(utterance);
    }
  };

  const value: AppContextType = {
    state,
    dispatch,
    setLoading,
    setConnected,
    setError,
    updateAircraft,
    addAircraft,
    removeAircraft,
    selectAircraft,
    addAlert,
    removeAlert,
    acknowledgeAlert,
    setRoute,
    updateSettings,
    updateFilters,
    getSelectedAircraft,
    getFilteredAircraft,
    getUnacknowledgedAlerts,
    getCriticalAlerts,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook personalizado
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
}