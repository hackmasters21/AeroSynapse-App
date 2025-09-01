import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useApp } from './AppContext';
import { Aircraft, Alert, SocketMessage, SocketMessageType, AlertType, AlertSeverity } from '../types/app.types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  reconnectAttempts: number;
  lastHeartbeat: Date | null;
  sendMessage: (type: string, payload: any) => void;
  disconnect: () => void;
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { 
    setConnected, 
    setError, 
    addAircraft, 
    removeAircraft, 
    addAlert,
    state 
  } = useApp();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 10;
  const reconnectDelay = 5000; // 5 segundos
  const heartbeatInterval = 30000; // 30 segundos

  // Configuración del socket
  const socketConfig = {
    transports: ['websocket', 'polling'],
    timeout: 10000,
    forceNew: true,
    reconnection: false, // Manejamos la reconexión manualmente
  };

  // Función para conectar
  const connect = () => {
    try {
      const serverUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
      console.log('🔌 Conectando a WebSocket:', serverUrl);
      
      const newSocket = io(serverUrl, socketConfig);
      setSocket(newSocket);
      
      // Eventos de conexión
      newSocket.on('connect', () => {
        console.log('✅ WebSocket conectado');
        setIsConnected(true);
        setConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);
        setLastHeartbeat(new Date());
        
        // Iniciar heartbeat
        startHeartbeat(newSocket);
        
        // Solicitar datos iniciales
        newSocket.emit('request_initial_data');
      });
      
      newSocket.on('disconnect', (reason) => {
        console.log('❌ WebSocket desconectado:', reason);
        setIsConnected(false);
        setConnected(false);
        stopHeartbeat();
        
        // Intentar reconectar si no fue desconexión manual
        if (reason !== 'io client disconnect') {
          scheduleReconnect();
        }
      });
      
      newSocket.on('connect_error', (error) => {
        console.error('❌ Error de conexión WebSocket:', error);
        setConnectionError(error.message);
        setError(`Error de conexión: ${error.message}`);
        scheduleReconnect();
      });
      
      // Eventos de datos
      newSocket.on('aircraft_update', (data: Aircraft[]) => {
        console.log(`📡 Actualización de aeronaves: ${data.length} aeronaves`);
        data.forEach(aircraft => {
          addAircraft({
            ...aircraft,
            lastUpdate: new Date()
          });
        });
      });
      
      newSocket.on('aircraft_removed', (aircraftId: string) => {
        console.log('🛩️ Aeronave removida:', aircraftId);
        removeAircraft(aircraftId);
      });
      
      newSocket.on('alert_new', (alert: Alert) => {
        console.log('🚨 Nueva alerta:', alert);
        addAlert({
          ...alert,
          timestamp: new Date(alert.timestamp)
        });
      });
      
      newSocket.on('system_status', (status: any) => {
        console.log('📊 Estado del sistema:', status);
        if (status.error) {
          setError(status.error);
        }
      });
      
      newSocket.on('heartbeat', () => {
        setLastHeartbeat(new Date());
      });
      
      // Eventos de proximidad y colisión
      newSocket.on('proximity_alert', (data: any) => {
        const alert: Alert = {
          id: `proximity_${Date.now()}`,
          type: AlertType.PROXIMITY_ALERT,
          severity: AlertSeverity.MEDIUM,
          title: 'Alerta de Proximidad',
          message: `Aeronave ${data.callsign} a ${data.distance.toFixed(1)} NM`,
          timestamp: new Date(),
          aircraftId: data.aircraftId,
          position: data.position,
          acknowledged: false,
          autoResolve: true
        };
        addAlert(alert);
      });
      
      newSocket.on('collision_warning', (data: any) => {
        const alert: Alert = {
          id: `collision_${Date.now()}`,
          type: AlertType.COLLISION_WARNING,
          severity: AlertSeverity.CRITICAL,
          title: 'ADVERTENCIA DE COLISIÓN',
          message: `TRÁFICO: ${data.callsign}, ${data.bearing}, ${data.distance.toFixed(1)} NM, ${data.relativeAltitude > 0 ? 'ARRIBA' : 'ABAJO'} ${Math.abs(data.relativeAltitude)} pies`,
          timestamp: new Date(),
          aircraftId: data.aircraftId,
          position: data.position,
          acknowledged: false,
          autoResolve: false
        };
        addAlert(alert);
      });
      
    } catch (error) {
      console.error('Error creando socket:', error);
      setConnectionError('Error al crear conexión WebSocket');
    }
  };
  
  // Función para desconectar
  const disconnect = () => {
    if (socket) {
      console.log('🔌 Desconectando WebSocket...');
      socket.disconnect();
      setSocket(null);
    }
    stopHeartbeat();
    clearReconnectTimeout();
  };
  
  // Función para reconectar
  const reconnect = () => {
    disconnect();
    setReconnectAttempts(0);
    connect();
  };
  
  // Programar reconexión
  const scheduleReconnect = () => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error('❌ Máximo número de intentos de reconexión alcanzado');
      setError('No se pudo establecer conexión con el servidor');
      return;
    }
    
    clearReconnectTimeout();
    
    const delay = reconnectDelay * Math.pow(2, reconnectAttempts); // Backoff exponencial
    console.log(`🔄 Reintentando conexión en ${delay / 1000} segundos (intento ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectAttempts(prev => prev + 1);
      connect();
    }, delay);
  };
  
  // Limpiar timeout de reconexión
  const clearReconnectTimeout = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };
  
  // Iniciar heartbeat
  const startHeartbeat = (socket: Socket) => {
    stopHeartbeat();
    heartbeatIntervalRef.current = setInterval(() => {
      if (socket.connected) {
        socket.emit('heartbeat');
      }
    }, heartbeatInterval);
  };
  
  // Detener heartbeat
  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };
  
  // Enviar mensaje
  const sendMessage = (type: string, payload: any) => {
    if (socket && socket.connected) {
      socket.emit(type, payload);
    } else {
      console.warn('⚠️ Intento de enviar mensaje sin conexión WebSocket');
    }
  };
  
  // Efecto para conectar al montar
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, []);
  
  // Efecto para manejar cambios en configuración
  useEffect(() => {
    if (socket && isConnected) {
      // Enviar configuración actualizada al servidor
      socket.emit('update_settings', {
        updateInterval: state.settings.updateInterval,
        proximityDistance: state.settings.proximityDistance,
        proximityAltitude: state.settings.proximityAltitude,
        filters: state.filters
      });
    }
  }, [socket, isConnected, state.settings, state.filters]);
  
  // Monitorear heartbeat
  useEffect(() => {
    if (!lastHeartbeat || !isConnected) return;
    
    const checkHeartbeat = setInterval(() => {
      const now = new Date();
      const timeSinceLastHeartbeat = now.getTime() - lastHeartbeat.getTime();
      
      // Si no hay heartbeat en 60 segundos, considerar conexión perdida
      if (timeSinceLastHeartbeat > 60000) {
        console.warn('⚠️ Heartbeat perdido, reconectando...');
        reconnect();
      }
    }, 10000); // Verificar cada 10 segundos
    
    return () => clearInterval(checkHeartbeat);
  }, [lastHeartbeat, isConnected]);
  
  const value: SocketContextType = {
    socket,
    isConnected,
    connectionError,
    reconnectAttempts,
    lastHeartbeat,
    sendMessage,
    disconnect,
    reconnect,
  };
  
  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

// Hook personalizado
export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket debe ser usado dentro de un SocketProvider');
  }
  return context;
}