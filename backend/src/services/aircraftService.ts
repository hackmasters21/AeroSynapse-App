import axios from 'axios';
import { config } from '../config/config';
import { logger, debugLog } from '../utils/logger';
import { database, queries } from '../database/connection';
import { AppError, ExternalAPIError } from '../middleware/errorHandler';

// Interfaces para datos de aeronaves
interface RawAircraftData {
  icao24: string;
  callsign?: string;
  origin_country?: string;
  time_position?: number;
  last_contact?: number;
  longitude?: number;
  latitude?: number;
  baro_altitude?: number;
  on_ground?: boolean;
  velocity?: number;
  true_track?: number;
  vertical_rate?: number;
  sensors?: number[];
  geo_altitude?: number;
  squawk?: string;
  spi?: boolean;
  position_source?: number;
}

interface ProcessedAircraftData {
  icao24: string;
  callsign?: string;
  registration?: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  verticalRate: number;
  onGround: boolean;
  squawk?: string;
  aircraftType?: string;
  airline?: string;
  origin?: string;
  destination?: string;
  emergencyStatus: string;
  lastUpdate: Date;
}

// Clase principal del servicio de aeronaves
export class AircraftService {
  private isCollecting = false;
  private collectionInterval: NodeJS.Timeout | null = null;
  private lastUpdateTime = 0;
  private aircraftCache = new Map<string, ProcessedAircraftData>();
  private rateLimiters = new Map<string, { count: number; resetTime: number }>();
  
  constructor() {
    debugLog.aircraft('AircraftService inicializado');
  }
  
  // Iniciar recolección de datos
  async startDataCollection(): Promise<void> {
    if (this.isCollecting) {
      debugLog.warning('La recolección de datos ya está activa');
      return;
    }
    
    debugLog.aircraft('Iniciando recolección de datos de aeronaves...');
    this.isCollecting = true;
    
    // Recolección inicial
    await this.collectAircraftData();
    
    // Configurar intervalo de recolección
    this.collectionInterval = setInterval(async () => {
      try {
        await this.collectAircraftData();
      } catch (error) {
        logger.error('Error en recolección periódica:', error);
      }
    }, config.websocket.updateInterval);
    
    debugLog.success('Recolección de datos iniciada');
  }
  
  // Detener recolección de datos
  async stopDataCollection(): Promise<void> {
    if (!this.isCollecting) {
      return;
    }
    
    debugLog.aircraft('Deteniendo recolección de datos...');
    this.isCollecting = false;
    
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    
    debugLog.success('Recolección de datos detenida');
  }
  
  // Recolectar datos de todas las fuentes
  private async collectAircraftData(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Recolectar de múltiples fuentes en paralelo
      const [flightradar24Data, adsbData] = await Promise.allSettled([
        this.fetchFromFlightradar24(),
        this.fetchFromADSBExchange()
      ]);
      
      const allAircraft: ProcessedAircraftData[] = [];
      
      // Procesar datos de Flightradar24
      if (flightradar24Data.status === 'fulfilled' && flightradar24Data.value) {
        allAircraft.push(...flightradar24Data.value);
      } else if (flightradar24Data.status === 'rejected') {
        logger.warn('Error obteniendo datos de Flightradar24:', flightradar24Data.reason);
      }
      
      // Procesar datos de ADS-B Exchange
      if (adsbData.status === 'fulfilled' && adsbData.value) {
        allAircraft.push(...adsbData.value);
      } else if (adsbData.status === 'rejected') {
        logger.warn('Error obteniendo datos de ADS-B Exchange:', adsbData.reason);
      }
      
      // Eliminar duplicados y actualizar cache
      const uniqueAircraft = this.deduplicateAircraft(allAircraft);
      
      // Actualizar base de datos
      // await this.updateDatabase(uniqueAircraft); // Comentado para demo sin DB
      
      // Actualizar cache
      this.updateCache(uniqueAircraft);
      
      const duration = Date.now() - startTime;
      debugLog.aircraft(`Recolección completada: ${uniqueAircraft.length} aeronaves en ${duration}ms`);
      
      this.lastUpdateTime = Date.now();
      
    } catch (error) {
      logger.error('Error en recolección de datos:', error);
      throw error;
    }
  }
  
  // Obtener datos de Flightradar24
  private async fetchFromFlightradar24(): Promise<ProcessedAircraftData[]> {
    if (!this.checkRateLimit('flightradar24')) {
      throw new ExternalAPIError('Flightradar24', 'Rate limit exceeded');
    }

    // Flightradar24 public API endpoint
    const url = 'https://data-live.flightradar24.com/zones/fcgi/feed.js?bounds=85,-85,-180,180&faa=1&satellite=1&mlat=1&flarm=1&adsb=1&gnd=1&air=1&vehicles=1&estimated=1&maxage=14400&gliders=1&stats=1';

    try {
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://www.flightradar24.com/'
        }
      });

      if (!response.data) {
        return [];
      }

      const aircraft: ProcessedAircraftData[] = [];
      
      // Flightradar24 returns an object where keys are flight IDs and values are flight data
      for (const [flightId, flightData] of Object.entries(response.data)) {
        // Skip metadata entries
        if (flightId === 'full_count' || flightId === 'version' || !Array.isArray(flightData)) {
          continue;
        }

        try {
          const processed = this.processFlightradar24Data(flightId, flightData as any[]);
          if (processed) {
            aircraft.push(processed);
          }
        } catch (error) {
          logger.debug('Error procesando aeronave Flightradar24:', error);
        }
      }

      debugLog.aircraft(`Flightradar24: ${aircraft.length} aeronaves obtenidas`);
      return aircraft;

    } catch (error: any) {
      if (error.response?.status === 429) {
        throw new ExternalAPIError('Flightradar24', 'Rate limit exceeded');
      }
      throw new ExternalAPIError('Flightradar24', error.message);
    }
  }
  
  // Obtener datos de ADS-B Exchange (simulado)
  private async fetchFromADSBExchange(): Promise<ProcessedAircraftData[]> {
    if (!this.checkRateLimit('adsb')) {
      throw new ExternalAPIError('ADS-B Exchange', 'Rate limit exceeded');
    }
    
    try {
      // En una implementación real, aquí harías la llamada a ADS-B Exchange
      // Por ahora, generamos datos simulados
      return this.generateSimulatedData();
      
    } catch (error) {
      throw new ExternalAPIError('ADS-B Exchange', error.message);
    }
  }
  
  // Procesar datos de Flightradar24
  private processFlightradar24Data(flightId: string, data: any[]): ProcessedAircraftData | null {
    // Formato de Flightradar24: [latitude, longitude, heading, altitude, speed, squawk, radar, aircraft_type, registration, timestamp, origin, destination, flight_number, on_ground, vertical_rate, callsign, is_glider, is_on_ground]
    
    if (!data || data.length < 16) {
      return null;
    }

    const [
      latitude, longitude, heading, altitude, speed, squawk, radar, aircraft_type,
      registration, timestamp, origin, destination, flight_number, on_ground, vertical_rate, callsign
    ] = data;

    // Validar datos mínimos requeridos
    if (latitude === null || longitude === null) {
      return null;
    }

    // Determinar estado de emergencia basado en squawk
    let emergencyStatus = 'none';
    if (squawk) {
      const squawkStr = squawk.toString();
      switch (squawkStr) {
        case '7500': emergencyStatus = 'unlawful_interference'; break;
        case '7600': emergencyStatus = 'no_communications'; break;
        case '7700': emergencyStatus = 'general'; break;
        default: emergencyStatus = 'none';
      }
    }

    // Extraer ICAO24 del flight ID o usar registration
    const icao24 = registration || flightId.toLowerCase();

    return {
      icao24: icao24,
      callsign: callsign?.trim() || flight_number?.trim() || undefined,
      registration: registration || undefined,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      altitude: altitude || 0,
      velocity: speed || 0,
      heading: heading || 0,
      verticalRate: vertical_rate || 0,
      onGround: on_ground === 1 || false,
      squawk: squawk?.toString() || undefined,
      aircraftType: aircraft_type || undefined,
      airline: undefined, // Se puede extraer del callsign
      origin: origin || undefined,
      destination: destination || undefined,
      emergencyStatus,
      lastUpdate: new Date()
    };
  }
  
  // Generar datos simulados para desarrollo
  private generateSimulatedData(): ProcessedAircraftData[] {
    const aircraft: ProcessedAircraftData[] = [];
    const count = Math.floor(Math.random() * 20) + 10; // 10-30 aeronaves
    
    for (let i = 0; i < count; i++) {
      const lat = 40.4168 + (Math.random() - 0.5) * 2; // Alrededor de Madrid
      const lng = -3.7038 + (Math.random() - 0.5) * 2;
      
      aircraft.push({
        icao24: this.generateRandomICAO(),
        callsign: this.generateRandomCallsign(),
        latitude: lat,
        longitude: lng,
        altitude: Math.floor(Math.random() * 40000) + 1000,
        velocity: Math.floor(Math.random() * 500) + 100,
        heading: Math.floor(Math.random() * 360),
        verticalRate: (Math.random() - 0.5) * 2000,
        onGround: Math.random() < 0.1, // 10% en tierra
        squawk: Math.random() < 0.05 ? '7700' : undefined, // 5% emergencia
        aircraftType: this.getRandomAircraftType(),
        airline: this.getRandomAirline(),
        emergencyStatus: Math.random() < 0.02 ? 'general' : 'none',
        lastUpdate: new Date()
      });
    }
    
    return aircraft;
  }
  
  // Detectar estado de emergencia por squawk
  private detectEmergencyStatus(squawk?: string): string {
    if (!squawk) return 'none';
    
    switch (squawk) {
      case '7700': return 'general';
      case '7600': return 'no_communications';
      case '7500': return 'unlawful_interference';
      default: return 'none';
    }
  }
  
  // Eliminar aeronaves duplicadas
  private deduplicateAircraft(aircraft: ProcessedAircraftData[]): ProcessedAircraftData[] {
    const seen = new Set<string>();
    const unique: ProcessedAircraftData[] = [];
    
    for (const ac of aircraft) {
      if (!seen.has(ac.icao24)) {
        seen.add(ac.icao24);
        unique.push(ac);
      }
    }
    
    return unique;
  }
  
  // Actualizar base de datos
  private async updateDatabase(aircraft: ProcessedAircraftData[]): Promise<void> {
    try {
      for (const ac of aircraft) {
        await queries.insertAircraft(ac);
      }
      
      // Limpiar datos antiguos cada 10 minutos
      if (Date.now() - this.lastUpdateTime > 600000) {
        await queries.cleanupOldData();
      }
      
    } catch (error) {
      logger.error('Error actualizando base de datos:', error);
      throw error;
    }
  }
  
  // Actualizar cache en memoria
  private updateCache(aircraft: ProcessedAircraftData[]): void {
    for (const ac of aircraft) {
      this.aircraftCache.set(ac.icao24, ac);
    }
    
    // Limpiar cache de aeronaves antiguas
    const cutoff = Date.now() - 300000; // 5 minutos
    for (const [icao24, ac] of this.aircraftCache.entries()) {
      if (ac.lastUpdate.getTime() < cutoff) {
        this.aircraftCache.delete(icao24);
      }
    }
  }
  
  // Verificar rate limit
  private checkRateLimit(api: string): boolean {
    const now = Date.now();
    const limit = this.rateLimiters.get(api);
    
    if (!limit || now > limit.resetTime) {
      this.rateLimiters.set(api, {
        count: 1,
        resetTime: now + 60000 // 1 minuto
      });
      return true;
    }
    
    const maxRequests = api === 'flightradar24' ? 60 : api === 'opensky' ? config.apis.openSky.rateLimit : config.apis.adsbExchange.rateLimit;
    
    if (limit.count >= maxRequests) {
      return false;
    }
    
    limit.count++;
    return true;
  }
  
  // Métodos públicos para obtener datos
  
  async getActiveAircraft(): Promise<ProcessedAircraftData[]> {
    try {
      const result = await queries.getActiveAircraft();
      return result.rows;
    } catch (error) {
      logger.error('Error obteniendo aeronaves activas:', error);
      throw error;
    }
  }
  
  async getAircraftInBounds(bounds: { north: number, south: number, east: number, west: number }): Promise<ProcessedAircraftData[]> {
    try {
      const result = await queries.getAircraftInBounds(bounds);
      return result.rows;
    } catch (error) {
      logger.error('Error obteniendo aeronaves en área:', error);
      throw error;
    }
  }
  
  async findNearbyAircraft(latitude: number, longitude: number, radiusNM: number): Promise<any[]> {
    try {
      const result = await queries.findNearbyAircraft(latitude, longitude, radiusNM);
      return result.rows;
    } catch (error) {
      logger.error('Error buscando aeronaves cercanas:', error);
      throw error;
    }
  }
  
  getCachedAircraft(): ProcessedAircraftData[] {
    return Array.from(this.aircraftCache.values());
  }
  
  getServiceStatus() {
    return {
      isCollecting: this.isCollecting,
      lastUpdate: new Date(this.lastUpdateTime),
      cachedAircraft: this.aircraftCache.size,
      rateLimits: Object.fromEntries(this.rateLimiters)
    };
  }
  
  // Métodos auxiliares para datos simulados
  
  private generateRandomICAO(): string {
    const chars = '0123456789ABCDEF';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  private generateRandomCallsign(): string {
    const airlines = ['IBE', 'VLG', 'RYR', 'EZY', 'BAW', 'AFR', 'DLH', 'KLM'];
    const airline = airlines[Math.floor(Math.random() * airlines.length)];
    const number = Math.floor(Math.random() * 9999) + 1;
    return `${airline}${number.toString().padStart(4, '0')}`;
  }
  
  private getRandomAircraftType(): string {
    const types = ['A320', 'A321', 'A330', 'A350', 'B737', 'B738', 'B777', 'B787', 'E190', 'CRJ9'];
    return types[Math.floor(Math.random() * types.length)];
  }
  
  private getRandomAirline(): string {
    const airlines = ['Iberia', 'Vueling', 'Ryanair', 'EasyJet', 'British Airways', 'Air France', 'Lufthansa', 'KLM'];
    return airlines[Math.floor(Math.random() * airlines.length)];
  }
}

export default AircraftService;