import { Server as SocketIOServer, Socket } from 'socket.io';
import { config } from '../config/config';
import { logger, debugLog } from '../utils/logger';
import { AircraftService } from './aircraftService';
import { AlertService } from './alertService';

// Interfaces para eventos de WebSocket
interface SocketUser {
  id: string;
  userId?: string;
  connectedAt: Date;
  lastActivity: Date;
  subscriptions: Set<string>;
  filters?: any;
}

interface ClientFilters {
  altitudeMin?: number;
  altitudeMax?: number;
  distanceMax?: number;
  aircraftTypes?: string[];
  airlines?: string[];
  showOnGround?: boolean;
  showEmergency?: boolean;
}

interface ClientSettings {
  updateInterval: number;
  proximityDistance: number;
  proximityAltitude: number;
  filters: ClientFilters;
}

// Clase para manejar WebSocket
export class SocketService {
  private connectedUsers = new Map<string, SocketUser>();
  private updateInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastAircraftUpdate = 0;
  private lastAlertCheck = 0;
  
  constructor(
    private io: SocketIOServer,
    private aircraftService: AircraftService,
    private alertService: AlertService
  ) {
    debugLog.websocket('SocketService inicializado');
    this.setupEventHandlers();
    this.startPeriodicUpdates();
  }
  
  // Configurar manejadores de eventos
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });
  }
  
  // Manejar nueva conexión
  private handleConnection(socket: Socket): void {
    const user: SocketUser = {
      id: socket.id,
      connectedAt: new Date(),
      lastActivity: new Date(),
      subscriptions: new Set()
    };
    
    this.connectedUsers.set(socket.id, user);
    
    debugLog.websocket(`Cliente conectado: ${socket.id} (${this.connectedUsers.size} total)`);
    
    // Enviar datos iniciales
    this.sendInitialData(socket);
    
    // Configurar eventos del socket
    this.setupSocketEvents(socket, user);
    
    // Manejar desconexión
    socket.on('disconnect', (reason) => {
      this.handleDisconnection(socket, reason);
    });
  }
  
  // Configurar eventos específicos del socket
  private setupSocketEvents(socket: Socket, user: SocketUser): void {
    // Solicitar datos iniciales
    socket.on('request_initial_data', () => {
      this.updateLastActivity(user);
      this.sendInitialData(socket);
    });
    
    // Actualizar configuración del cliente
    socket.on('update_settings', (settings: ClientSettings) => {
      this.updateLastActivity(user);
      user.filters = settings.filters;
      debugLog.websocket(`Configuración actualizada para ${socket.id}`);
    });
    
    // Suscribirse a actualizaciones de aeronave específica
    socket.on('subscribe_aircraft', (aircraftId: string) => {
      this.updateLastActivity(user);
      user.subscriptions.add(`aircraft:${aircraftId}`);
      debugLog.websocket(`Cliente ${socket.id} suscrito a aeronave ${aircraftId}`);
    });
    
    // Desuscribirse de aeronave
    socket.on('unsubscribe_aircraft', (aircraftId: string) => {
      this.updateLastActivity(user);
      user.subscriptions.delete(`aircraft:${aircraftId}`);
      debugLog.websocket(`Cliente ${socket.id} desuscrito de aeronave ${aircraftId}`);
    });
    
    // Reconocer alerta
    socket.on('acknowledge_alert', async (alertId: string) => {
      this.updateLastActivity(user);
      const success = await this.alertService.acknowledgeAlert(alertId);
      if (success) {
        this.io.emit('alert_acknowledged', { alertId, acknowledgedBy: socket.id });
      }
    });
    
    // Solicitar aeronaves en área específica
    socket.on('request_aircraft_in_bounds', async (bounds: any) => {
      this.updateLastActivity(user);
      try {
        const aircraft = await this.aircraftService.getAircraftInBounds(bounds);
        socket.emit('aircraft_in_bounds', aircraft);
      } catch (error) {
        socket.emit('error', { message: 'Error obteniendo aeronaves en área' });
      }
    });
    
    // Buscar aeronaves cercanas
    socket.on('find_nearby_aircraft', async (data: { latitude: number, longitude: number, radius: number }) => {
      this.updateLastActivity(user);
      try {
        const aircraft = await this.aircraftService.findNearbyAircraft(
          data.latitude,
          data.longitude,
          data.radius
        );
        socket.emit('nearby_aircraft', aircraft);
      } catch (error) {
        socket.emit('error', { message: 'Error buscando aeronaves cercanas' });
      }
    });
    
    // Heartbeat
    socket.on('heartbeat', () => {
      this.updateLastActivity(user);
      socket.emit('heartbeat');
    });
    
    // Ping/Pong para latencia
    socket.on('ping', (timestamp: number) => {
      socket.emit('pong', timestamp);
    });
  }
  
  // Enviar datos iniciales al cliente
  private async sendInitialData(socket: Socket): Promise<void> {
    try {
      // Enviar aeronaves activas
      const aircraft = this.aircraftService.getCachedAircraft();
      socket.emit('aircraft_update', aircraft);
      
      // Enviar alertas activas
      const alerts = this.alertService.getActiveAlerts();
      socket.emit('alerts_update', alerts);
      
      // Enviar estado del sistema
      const systemStatus = {
        aircraftService: this.aircraftService.getServiceStatus(),
        alertService: this.alertService.getServiceStats(),
        connectedClients: this.connectedUsers.size,
        serverTime: new Date().toISOString()
      };
      socket.emit('system_status', systemStatus);
      
      debugLog.websocket(`Datos iniciales enviados a ${socket.id}`);
      
    } catch (error) {
      logger.error('Error enviando datos iniciales:', error);
      socket.emit('error', { message: 'Error cargando datos iniciales' });
    }
  }
  
  // Manejar desconexión
  private handleDisconnection(socket: Socket, reason: string): void {
    this.connectedUsers.delete(socket.id);
    debugLog.websocket(`Cliente desconectado: ${socket.id} (${reason}) - ${this.connectedUsers.size} restantes`);
  }
  
  // Actualizar última actividad del usuario
  private updateLastActivity(user: SocketUser): void {
    user.lastActivity = new Date();
  }
  
  // Iniciar actualizaciones periódicas
  private startPeriodicUpdates(): void {
    // Actualizaciones de aeronaves
    this.updateInterval = setInterval(async () => {
      await this.broadcastAircraftUpdates();
    }, config.websocket.updateInterval);
    
    // Verificación de alertas
    setInterval(async () => {
      await this.checkAndBroadcastAlerts();
    }, 5000); // Cada 5 segundos
    
    // Heartbeat
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, config.websocket.heartbeatInterval);
    
    // Limpieza de conexiones inactivas
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, 60000); // Cada minuto
    
    debugLog.websocket('Actualizaciones periódicas iniciadas');
  }
  
  // Transmitir actualizaciones de aeronaves
  private async broadcastAircraftUpdates(): Promise<void> {
    try {
      const aircraft = this.aircraftService.getCachedAircraft();
      
      if (aircraft.length === 0) {
        return;
      }
      
      // Enviar a todos los clientes conectados
      this.io.emit('aircraft_update', aircraft);
      
      // Enviar actualizaciones específicas a suscriptores
      for (const ac of aircraft) {
        const subscribers = Array.from(this.connectedUsers.entries())
          .filter(([_, user]) => user.subscriptions.has(`aircraft:${ac.icao24}`))
          .map(([socketId, _]) => socketId);
        
        if (subscribers.length > 0) {
          this.io.to(subscribers).emit('aircraft_specific_update', ac);
        }
      }
      
      this.lastAircraftUpdate = Date.now();
      
    } catch (error) {
      logger.error('Error transmitiendo actualizaciones de aeronaves:', error);
    }
  }
  
  // Verificar y transmitir alertas
  private async checkAndBroadcastAlerts(): Promise<void> {
    try {
      // Verificar alertas de proximidad
      const proximityAlerts = await this.alertService.checkProximityAlerts();
      for (const alert of proximityAlerts) {
        this.io.emit('alert_new', alert);
        
        // Enviar alerta específica según tipo
        if (alert.type === 'proximity_alert') {
          this.io.emit('proximity_alert', {
            aircraftId: alert.aircraftId,
            message: alert.message,
            position: alert.position,
            metadata: alert.metadata
          });
        } else if (alert.type === 'collision_warning') {
          this.io.emit('collision_warning', {
            aircraftId: alert.aircraftId,
            message: alert.message,
            position: alert.position,
            metadata: alert.metadata
          });
        }
      }
      
      // Verificar alertas de emergencia
      const emergencyAlerts = await this.alertService.checkEmergencySquawks();
      for (const alert of emergencyAlerts) {
        this.io.emit('alert_new', alert);
        this.io.emit('emergency_alert', {
          aircraftId: alert.aircraftId,
          message: alert.message,
          position: alert.position,
          metadata: alert.metadata
        });
      }
      
      // Limpiar alertas auto-resueltas
      this.alertService.cleanupAutoResolvedAlerts();
      
      this.lastAlertCheck = Date.now();
      
    } catch (error) {
      logger.error('Error verificando alertas:', error);
    }
  }
  
  // Enviar heartbeat
  private sendHeartbeat(): void {
    this.io.emit('heartbeat', {
      timestamp: new Date().toISOString(),
      connectedClients: this.connectedUsers.size
    });
  }
  
  // Limpiar conexiones inactivas
  private cleanupInactiveConnections(): void {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutos
    
    for (const [socketId, user] of this.connectedUsers.entries()) {
      if (now - user.lastActivity.getTime() > timeout) {
        debugLog.websocket(`Desconectando cliente inactivo: ${socketId}`);
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
        }
        this.connectedUsers.delete(socketId);
      }
    }
  }
  
  // Transmitir mensaje a todos los clientes
  public broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }
  
  // Transmitir mensaje a clientes específicos
  public broadcastToUsers(userIds: string[], event: string, data: any): void {
    this.io.to(userIds).emit(event, data);
  }
  
  // Obtener estadísticas del servicio
  public getStats() {
    const users = Array.from(this.connectedUsers.values());
    
    return {
      connectedUsers: this.connectedUsers.size,
      totalSubscriptions: users.reduce((sum, user) => sum + user.subscriptions.size, 0),
      lastAircraftUpdate: new Date(this.lastAircraftUpdate),
      lastAlertCheck: new Date(this.lastAlertCheck),
      averageConnectionTime: this.calculateAverageConnectionTime(users),
      activeSubscriptions: this.getActiveSubscriptions(users)
    };
  }
  
  // Calcular tiempo promedio de conexión
  private calculateAverageConnectionTime(users: SocketUser[]): number {
    if (users.length === 0) return 0;
    
    const now = Date.now();
    const totalTime = users.reduce((sum, user) => {
      return sum + (now - user.connectedAt.getTime());
    }, 0);
    
    return Math.round(totalTime / users.length / 1000); // en segundos
  }
  
  // Obtener suscripciones activas
  private getActiveSubscriptions(users: SocketUser[]): Record<string, number> {
    const subscriptions: Record<string, number> = {};
    
    for (const user of users) {
      for (const subscription of user.subscriptions) {
        subscriptions[subscription] = (subscriptions[subscription] || 0) + 1;
      }
    }
    
    return subscriptions;
  }
  
  // Detener servicio
  public stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Desconectar todos los clientes
    this.io.disconnectSockets(true);
    
    debugLog.websocket('SocketService detenido');
  }
}

// Función para configurar manejadores de WebSocket
export function setupSocketHandlers(
  io: SocketIOServer,
  aircraftService: AircraftService,
  alertService: AlertService
): SocketService {
  const socketService = new SocketService(io, aircraftService, alertService);
  
  // Middleware de autenticación (opcional)
  io.use((socket, next) => {
    // Aquí podrías verificar tokens de autenticación
    // Por ahora, permitimos todas las conexiones
    next();
  });
  
  // Middleware de logging
  io.use((socket, next) => {
    logger.info('Nueva conexión WebSocket', {
      socketId: socket.id,
      ip: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent']
    });
    next();
  });
  
  return socketService;
}

export default SocketService;