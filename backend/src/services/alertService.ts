import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/config';
import { logger, debugLog } from '../utils/logger';
import { database, queries } from '../database/connection';
import { AppError } from '../middleware/errorHandler';
import { AircraftService } from './aircraftService';

// Interfaces para alertas
interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  aircraftId?: string;
  position?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  acknowledged: boolean;
  autoResolve: boolean;
  resolvedAt?: Date;
  metadata?: any;
}

enum AlertType {
  COLLISION_WARNING = 'collision_warning',
  PROXIMITY_ALERT = 'proximity_alert',
  ALTITUDE_DEVIATION = 'altitude_deviation',
  COURSE_DEVIATION = 'course_deviation',
  WEATHER_WARNING = 'weather_warning',
  AIRSPACE_VIOLATION = 'airspace_violation',
  SYSTEM_ERROR = 'system_error',
  DATA_LOSS = 'data_loss',
  EMERGENCY_SQUAWK = 'emergency_squawk'
}

enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

interface ProximityCheck {
  aircraftId: string;
  targetId: string;
  distance: number; // en millas náuticas
  altitudeDifference: number; // en pies
  bearing: number; // en grados
  timeToClosestApproach: number; // en segundos
  closestDistance: number; // en millas náuticas
}

// Clase principal del servicio de alertas
export class AlertService {
  private activeAlerts = new Map<string, Alert>();
  private alertHistory: Alert[] = [];
  private proximityChecks = new Map<string, ProximityCheck>();
  private lastProximityCheck = 0;
  private alertCooldowns = new Map<string, number>();
  
  constructor(private aircraftService?: AircraftService) {
    debugLog.info('AlertService inicializado');
  }
  
  // Crear nueva alerta
  async createAlert(
    type: AlertType,
    severity: AlertSeverity,
    title: string,
    message: string,
    aircraftId?: string,
    position?: { latitude: number; longitude: number; altitude?: number },
    metadata?: any
  ): Promise<Alert> {
    
    // Verificar cooldown para evitar spam
    const cooldownKey = `${type}_${aircraftId || 'system'}`;
    const now = Date.now();
    const lastAlert = this.alertCooldowns.get(cooldownKey);
    
    if (lastAlert && (now - lastAlert) < 30000) { // 30 segundos de cooldown
      debugLog.warning(`Alerta en cooldown: ${cooldownKey}`);
      return null as any;
    }
    
    const alert: Alert = {
      id: uuidv4(),
      type,
      severity,
      title,
      message,
      timestamp: new Date(),
      aircraftId,
      position,
      acknowledged: false,
      autoResolve: this.shouldAutoResolve(type),
      metadata
    };
    
    try {
      // Guardar en base de datos
      await queries.insertAlert(alert);
      
      // Agregar a cache
      this.activeAlerts.set(alert.id, alert);
      this.alertHistory.push(alert);
      
      // Establecer cooldown
      this.alertCooldowns.set(cooldownKey, now);
      
      // Log de la alerta
      logger.info('Nueva alerta creada', {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        aircraftId: alert.aircraftId,
        message: alert.message
      });
      
      debugLog.info(`🚨 Alerta ${severity.toUpperCase()}: ${title}`);
      
      return alert;
      
    } catch (error) {
      logger.error('Error creando alerta:', error);
      throw error;
    }
  }
  
  // Verificar proximidad entre aeronaves
  async checkProximityAlerts(): Promise<Alert[]> {
    if (!this.aircraftService) {
      return [];
    }
    
    const now = Date.now();
    
    // Verificar cada 5 segundos
    if (now - this.lastProximityCheck < 5000) {
      return [];
    }
    
    this.lastProximityCheck = now;
    
    try {
      const aircraft = this.aircraftService.getCachedAircraft();
      const alerts: Alert[] = [];
      
      // Verificar cada par de aeronaves
      for (let i = 0; i < aircraft.length; i++) {
        for (let j = i + 1; j < aircraft.length; j++) {
          const ac1 = aircraft[i];
          const ac2 = aircraft[j];
          
          // Saltar aeronaves en tierra
          if (ac1.onGround || ac2.onGround) continue;
          
          const proximity = this.calculateProximity(ac1, ac2);
          
          if (proximity.distance <= config.alerts.proximityDistance) {
            const altDiff = Math.abs(ac1.altitude - ac2.altitude);
            
            if (altDiff <= config.alerts.proximityAltitude) {
              // Alerta de proximidad
              const alert = await this.createProximityAlert(ac1, ac2, proximity);
              if (alert) alerts.push(alert);
              
              // Verificar si es advertencia de colisión
              if (proximity.timeToClosestApproach <= config.alerts.collisionWarningTime &&
                  proximity.closestDistance <= 2.0) { // 2 NM
                const collisionAlert = await this.createCollisionWarning(ac1, ac2, proximity);
                if (collisionAlert) alerts.push(collisionAlert);
              }
            }
          }
        }
      }
      
      return alerts;
      
    } catch (error) {
      logger.error('Error verificando proximidad:', error);
      return [];
    }
  }
  
  // Verificar alertas de emergencia por squawk
  async checkEmergencySquawks(): Promise<Alert[]> {
    if (!this.aircraftService) {
      return [];
    }
    
    try {
      const aircraft = this.aircraftService.getCachedAircraft();
      const alerts: Alert[] = [];
      
      for (const ac of aircraft) {
        if (ac.emergencyStatus && ac.emergencyStatus !== 'none') {
          const alert = await this.createEmergencyAlert(ac);
          if (alert) alerts.push(alert);
        }
      }
      
      return alerts;
      
    } catch (error) {
      logger.error('Error verificando emergencias:', error);
      return [];
    }
  }
  
  // Calcular proximidad entre dos aeronaves
  private calculateProximity(ac1: any, ac2: any): ProximityCheck {
    // Calcular distancia usando fórmula haversine
    const distance = this.calculateDistance(
      ac1.latitude, ac1.longitude,
      ac2.latitude, ac2.longitude
    );
    
    // Calcular bearing
    const bearing = this.calculateBearing(
      ac1.latitude, ac1.longitude,
      ac2.latitude, ac2.longitude
    );
    
    // Calcular diferencia de altitud
    const altitudeDifference = Math.abs(ac1.altitude - ac2.altitude);
    
    // Estimar tiempo hasta aproximación más cercana
    const relativeVelocity = this.calculateRelativeVelocity(ac1, ac2);
    const timeToClosestApproach = relativeVelocity > 0 ? (distance / relativeVelocity) * 3600 : Infinity;
    
    // Estimar distancia más cercana (simplificado)
    const closestDistance = Math.max(0, distance - (relativeVelocity * timeToClosestApproach / 3600));
    
    return {
      aircraftId: ac1.icao24,
      targetId: ac2.icao24,
      distance,
      altitudeDifference,
      bearing,
      timeToClosestApproach,
      closestDistance
    };
  }
  
  // Calcular distancia entre dos puntos (fórmula haversine)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3440.065; // Radio de la Tierra en millas náuticas
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  // Calcular bearing entre dos puntos
  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const dLon = this.toRadians(lon2 - lon1);
    const lat1Rad = this.toRadians(lat1);
    const lat2Rad = this.toRadians(lat2);
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    const bearing = this.toDegrees(Math.atan2(y, x));
    return (bearing + 360) % 360;
  }
  
  // Calcular velocidad relativa
  private calculateRelativeVelocity(ac1: any, ac2: any): number {
    // Simplificado: diferencia de velocidades
    const v1x = ac1.velocity * Math.sin(this.toRadians(ac1.heading));
    const v1y = ac1.velocity * Math.cos(this.toRadians(ac1.heading));
    const v2x = ac2.velocity * Math.sin(this.toRadians(ac2.heading));
    const v2y = ac2.velocity * Math.cos(this.toRadians(ac2.heading));
    
    const relativeVx = v1x - v2x;
    const relativeVy = v1y - v2y;
    
    return Math.sqrt(relativeVx * relativeVx + relativeVy * relativeVy);
  }
  
  // Crear alerta de proximidad
  private async createProximityAlert(ac1: any, ac2: any, proximity: ProximityCheck): Promise<Alert | null> {
    const bearing = this.formatBearing(proximity.bearing);
    const distance = proximity.distance.toFixed(1);
    const altDiff = proximity.altitudeDifference;
    
    let altitudeInfo = '';
    if (altDiff < 500) {
      altitudeInfo = 'misma altitud';
    } else if (ac1.altitude > ac2.altitude) {
      altitudeInfo = `${Math.round(altDiff)} pies abajo`;
    } else {
      altitudeInfo = `${Math.round(altDiff)} pies arriba`;
    }
    
    const message = `Tráfico: ${ac2.callsign || ac2.icao24}, ${bearing}, ${distance} NM, ${altitudeInfo}`;
    
    return await this.createAlert(
      AlertType.PROXIMITY_ALERT,
      AlertSeverity.MEDIUM,
      'Alerta de Proximidad',
      message,
      ac1.icao24,
      {
        latitude: ac1.latitude,
        longitude: ac1.longitude,
        altitude: ac1.altitude
      },
      {
        targetAircraft: ac2.icao24,
        distance: proximity.distance,
        bearing: proximity.bearing,
        altitudeDifference: proximity.altitudeDifference
      }
    );
  }
  
  // Crear advertencia de colisión
  private async createCollisionWarning(ac1: any, ac2: any, proximity: ProximityCheck): Promise<Alert | null> {
    const bearing = this.formatBearing(proximity.bearing);
    const distance = proximity.distance.toFixed(1);
    const timeToImpact = Math.round(proximity.timeToClosestApproach);
    
    const message = `ADVERTENCIA DE COLISIÓN: ${ac2.callsign || ac2.icao24}, ${bearing}, ${distance} NM, impacto en ${timeToImpact}s`;
    
    return await this.createAlert(
      AlertType.COLLISION_WARNING,
      AlertSeverity.CRITICAL,
      'ADVERTENCIA DE COLISIÓN',
      message,
      ac1.icao24,
      {
        latitude: ac1.latitude,
        longitude: ac1.longitude,
        altitude: ac1.altitude
      },
      {
        targetAircraft: ac2.icao24,
        distance: proximity.distance,
        bearing: proximity.bearing,
        timeToImpact: proximity.timeToClosestApproach,
        closestDistance: proximity.closestDistance
      }
    );
  }
  
  // Crear alerta de emergencia
  private async createEmergencyAlert(aircraft: any): Promise<Alert | null> {
    let title = 'Emergencia Detectada';
    let message = `Aeronave ${aircraft.callsign || aircraft.icao24} transmitiendo código de emergencia`;
    
    switch (aircraft.emergencyStatus) {
      case 'general':
        title = 'Emergencia General';
        message += ' (7700 - Emergencia General)';
        break;
      case 'no_communications':
        title = 'Fallo de Comunicaciones';
        message += ' (7600 - Fallo de Radio)';
        break;
      case 'unlawful_interference':
        title = 'Interferencia Ilegal';
        message += ' (7500 - Secuestro)';
        break;
    }
    
    return await this.createAlert(
      AlertType.EMERGENCY_SQUAWK,
      AlertSeverity.CRITICAL,
      title,
      message,
      aircraft.icao24,
      {
        latitude: aircraft.latitude,
        longitude: aircraft.longitude,
        altitude: aircraft.altitude
      },
      {
        squawk: aircraft.squawk,
        emergencyType: aircraft.emergencyStatus
      }
    );
  }
  
  // Reconocer alerta
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    try {
      const alert = this.activeAlerts.get(alertId);
      if (!alert) {
        return false;
      }
      
      alert.acknowledged = true;
      
      // Actualizar en base de datos
      await database.query(
        'UPDATE alerts SET acknowledged = true WHERE id = $1',
        [alertId]
      );
      
      debugLog.info(`Alerta reconocida: ${alertId}`);
      return true;
      
    } catch (error) {
      logger.error('Error reconociendo alerta:', error);
      return false;
    }
  }
  
  // Resolver alerta
  async resolveAlert(alertId: string): Promise<boolean> {
    try {
      const alert = this.activeAlerts.get(alertId);
      if (!alert) {
        return false;
      }
      
      alert.resolvedAt = new Date();
      this.activeAlerts.delete(alertId);
      
      // Actualizar en base de datos
      await database.query(
        'UPDATE alerts SET resolved_at = NOW() WHERE id = $1',
        [alertId]
      );
      
      debugLog.info(`Alerta resuelta: ${alertId}`);
      return true;
      
    } catch (error) {
      logger.error('Error resolviendo alerta:', error);
      return false;
    }
  }
  
  // Obtener alertas activas
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }
  
  // Obtener historial de alertas
  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit);
  }
  
  // Limpiar alertas auto-resueltas
  cleanupAutoResolvedAlerts(): void {
    const now = Date.now();
    const cutoff = 2 * 60 * 60 * 1000; // 2 horas
    
    for (const [id, alert] of this.activeAlerts.entries()) {
      if (alert.autoResolve && (now - alert.timestamp.getTime()) > cutoff) {
        this.resolveAlert(id);
      }
    }
  }
  
  // Determinar si una alerta debe auto-resolverse
  private shouldAutoResolve(type: AlertType): boolean {
    return [
      AlertType.PROXIMITY_ALERT,
      AlertType.DATA_LOSS
    ].includes(type);
  }
  
  // Formatear bearing para display
  private formatBearing(bearing: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(bearing / 22.5) % 16;
    return directions[index];
  }
  
  // Utilidades de conversión
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
  
  private toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }
  
  // Obtener estadísticas del servicio
  getServiceStats() {
    return {
      activeAlerts: this.activeAlerts.size,
      totalAlerts: this.alertHistory.length,
      lastProximityCheck: new Date(this.lastProximityCheck),
      alertsByType: this.getAlertsByType(),
      alertsBySeverity: this.getAlertsBySeverity()
    };
  }
  
  private getAlertsByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const alert of this.activeAlerts.values()) {
      counts[alert.type] = (counts[alert.type] || 0) + 1;
    }
    return counts;
  }
  
  private getAlertsBySeverity(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const alert of this.activeAlerts.values()) {
      counts[alert.severity] = (counts[alert.severity] || 0) + 1;
    }
    return counts;
  }
}

export { Alert, AlertType, AlertSeverity };
export default AlertService;