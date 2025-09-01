import axios from 'axios';
import { config } from '../config/config';
import { logger, debugLog } from '../utils/logger';
import { AppError, ExternalAPIError } from '../middleware/errorHandler';

// Interfaces para NOTAMs
interface NotamData {
  id: string;
  icaoCode: string;
  notamNumber: string;
  type: 'A' | 'N' | 'C' | 'R'; // A=New, N=Replace, C=Cancel, R=Replace
  classification: 'I' | 'II' | 'III' | 'IV' | 'V'; // Classification
  traffic: 'I' | 'N' | 'IV' | 'V'; // Traffic type
  purpose: 'N' | 'B' | 'O' | 'M'; // Purpose
  scope: 'A' | 'E' | 'W' | 'K'; // Scope
  minimumFL: number;
  maximumFL: number;
  coordinates: {
    latitude: number;
    longitude: number;
    radius?: number;
  }[];
  schedule: {
    startDate: Date;
    endDate: Date;
    permanent: boolean;
    estimated: boolean;
  };
  text: string;
  rawNotam: string;
  created: Date;
  source: 'faa' | 'icao' | 'eurocontrol';
}

interface NotamFilter {
  icaoCodes?: string[];
  startDate?: Date;
  endDate?: Date;
  classification?: string[];
  traffic?: string[];
  radius?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Clase principal del servicio de NOTAMs
export class NotamService {
  private cache = new Map<string, NotamData[]>();
  private rateLimiters = new Map<string, { count: number; resetTime: number }>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutos
  private readonly RATE_LIMIT = 60; // 60 requests por minuto

  constructor() {
    debugLog.info('NotamService inicializado');
  }

  // Verificar rate limiting
  private checkRateLimit(source: string): boolean {
    const now = Date.now();
    const limiter = this.rateLimiters.get(source);

    if (!limiter || now > limiter.resetTime) {
      this.rateLimiters.set(source, {
        count: 1,
        resetTime: now + 60000 // 1 minuto
      });
      return true;
    }

    if (limiter.count >= this.RATE_LIMIT) {
      return false;
    }

    limiter.count++;
    return true;
  }

  // Verificar si el cache es válido
  private isCacheValid(timestamp: Date): boolean {
    return Date.now() - timestamp.getTime() < this.CACHE_DURATION;
  }

  // Obtener NOTAMs de FAA
  async getFAANotams(icaoCodes: string[]): Promise<NotamData[]> {
    try {
      if (!this.checkRateLimit('faa')) {
        throw new ExternalAPIError('FAA', 'Rate limit exceeded');
      }

      const cacheKey = `faa_${icaoCodes.join('_')}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && cached.length > 0 && this.isCacheValid(cached[0].created)) {
        return cached;
      }

      // Conexión real con FAA NOTAM Service
      const notams: NotamData[] = [];
      
      for (const icaoCode of icaoCodes) {
        try {
          const response = await axios.get(
            `https://pilotweb.nas.faa.gov/PilotWeb/notamRetrievalByICAOAction.do`,
            {
              params: {
                method: 'displayByICAOs',
                reportType: 'RAW',
                formatType: 'DOMESTIC',
                retrieveLocId: icaoCode
              },
              headers: {
                'User-Agent': '(AeroSynapse/1.0, contact@aerosynapse.com)'
              },
              timeout: 10000
            }
          );

          if (response.data) {
            const parsedNotams = this.parseFAANotams(response.data, icaoCode);
            notams.push(...parsedNotams);
          }
        } catch (error) {
          logger.warn(`Error obteniendo NOTAMs para ${icaoCode}:`, error);
        }
      }

      // Si no hay datos reales, usar simulados
      if (notams.length === 0) {
        const simulatedNotams = this.generateSimulatedNotams(icaoCodes);
        this.cache.set(cacheKey, simulatedNotams);
        return simulatedNotams;
      }

      this.cache.set(cacheKey, notams);
      return notams;

    } catch (error) {
      logger.error('Error obteniendo NOTAMs de FAA:', error);
      // Fallback a datos simulados
      return this.generateSimulatedNotams(icaoCodes);
    }
  }

  // Parsear NOTAMs de FAA
  private parseFAANotams(htmlData: string, icaoCode: string): NotamData[] {
    const notams: NotamData[] = [];
    
    try {
      // Buscar NOTAMs en el HTML usando regex
      const notamRegex = /!([A-Z]{3,4})\s+(\d{2}\/\d{3})\s+([^\n]+)/g;
      let match;

      while ((match = notamRegex.exec(htmlData)) !== null) {
        const [, airportCode, notamNumber, notamText] = match;
        
        if (airportCode === icaoCode.substring(1)) { // Remove 'K' prefix for US airports
          const notam = this.parseNotamText(notamText, icaoCode, notamNumber);
          if (notam) {
            notams.push(notam);
          }
        }
      }
    } catch (error) {
      logger.error('Error parseando NOTAMs de FAA:', error);
    }

    return notams;
  }

  // Parsear texto de NOTAM
  private parseNotamText(text: string, icaoCode: string, notamNumber: string): NotamData | null {
    try {
      return {
        id: `${icaoCode}_${notamNumber}_${Date.now()}`,
        icaoCode,
        notamNumber,
        type: this.extractNotamType(text),
        classification: this.extractClassification(text),
        traffic: this.extractTraffic(text),
        purpose: this.extractPurpose(text),
        scope: this.extractScope(text),
        minimumFL: this.extractMinFL(text),
        maximumFL: this.extractMaxFL(text),
        coordinates: this.extractCoordinates(text, icaoCode),
        schedule: this.extractSchedule(text),
        text: text.trim(),
        rawNotam: text,
        created: new Date(),
        source: 'faa'
      };
    } catch (error) {
      logger.error('Error parseando texto NOTAM:', error);
      return null;
    }
  }

  // Métodos auxiliares para extraer información del NOTAM
  private extractNotamType(text: string): 'A' | 'N' | 'C' | 'R' {
    if (text.includes('CANCEL')) return 'C';
    if (text.includes('REPLACE')) return 'R';
    return 'A'; // Default to new
  }

  private extractClassification(text: string): 'I' | 'II' | 'III' | 'IV' | 'V' {
    // Simplified classification logic
    if (text.includes('RWY') || text.includes('RUNWAY')) return 'I';
    if (text.includes('TWY') || text.includes('TAXIWAY')) return 'II';
    if (text.includes('APRON')) return 'III';
    if (text.includes('NAV') || text.includes('ILS')) return 'IV';
    return 'V';
  }

  private extractTraffic(text: string): 'I' | 'N' | 'IV' | 'V' {
    if (text.includes('IFR')) return 'I';
    if (text.includes('VFR')) return 'V';
    return 'N'; // Default
  }

  private extractPurpose(text: string): 'N' | 'B' | 'O' | 'M' {
    if (text.includes('NOTAM')) return 'N';
    return 'N'; // Default
  }

  private extractScope(text: string): 'A' | 'E' | 'W' | 'K' {
    return 'A'; // Default to Aerodrome
  }

  private extractMinFL(text: string): number {
    const flMatch = text.match(/FL(\d{3})/i);
    return flMatch ? parseInt(flMatch[1]) * 100 : 0;
  }

  private extractMaxFL(text: string): number {
    const flMatch = text.match(/FL(\d{3})/i);
    return flMatch ? parseInt(flMatch[1]) * 100 : 45000;
  }

  private extractCoordinates(text: string, icaoCode: string): { latitude: number; longitude: number; radius?: number }[] {
    // Simplified coordinate extraction - would need more sophisticated parsing
    return [{
      latitude: 0, // Would extract from airport database
      longitude: 0,
      radius: 5 // 5 NM default radius
    }];
  }

  private extractSchedule(text: string): {
    startDate: Date;
    endDate: Date;
    permanent: boolean;
    estimated: boolean;
  } {
    const now = new Date();
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days default
    
    // Extract dates from NOTAM text (simplified)
    const dateMatch = text.match(/(\d{10})-(\d{10})/); // YYMMDDHHMM format
    
    if (dateMatch) {
      const startStr = dateMatch[1];
      const endStr = dateMatch[2];
      
      return {
        startDate: this.parseNotamDate(startStr),
        endDate: this.parseNotamDate(endStr),
        permanent: text.includes('PERM'),
        estimated: text.includes('EST')
      };
    }

    return {
      startDate: now,
      endDate,
      permanent: text.includes('PERM'),
      estimated: text.includes('EST')
    };
  }

  private parseNotamDate(dateStr: string): Date {
    // Parse YYMMDDHHMM format
    if (dateStr.length === 10) {
      const year = 2000 + parseInt(dateStr.substring(0, 2));
      const month = parseInt(dateStr.substring(2, 4)) - 1; // Month is 0-indexed
      const day = parseInt(dateStr.substring(4, 6));
      const hour = parseInt(dateStr.substring(6, 8));
      const minute = parseInt(dateStr.substring(8, 10));
      
      return new Date(year, month, day, hour, minute);
    }
    
    return new Date();
  }

  // Generar NOTAMs simulados como fallback
  private generateSimulatedNotams(icaoCodes: string[]): NotamData[] {
    const notams: NotamData[] = [];
    const now = new Date();
    
    icaoCodes.forEach(icaoCode => {
      // Generate 2-5 NOTAMs per airport
      const count = Math.floor(Math.random() * 4) + 2;
      
      for (let i = 0; i < count; i++) {
        notams.push({
          id: `${icaoCode}_SIM_${i}_${Date.now()}`,
          icaoCode,
          notamNumber: `${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`,
          type: 'A',
          classification: 'I',
          traffic: 'N',
          purpose: 'N',
          scope: 'A',
          minimumFL: 0,
          maximumFL: 45000,
          coordinates: [{
            latitude: 40.7128 + (Math.random() - 0.5) * 10,
            longitude: -74.0060 + (Math.random() - 0.5) * 10,
            radius: 5
          }],
          schedule: {
            startDate: now,
            endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            permanent: false,
            estimated: false
          },
          text: this.generateSimulatedNotamText(icaoCode, i),
          rawNotam: this.generateSimulatedNotamText(icaoCode, i),
          created: now,
          source: 'faa'
        });
      }
    });
    
    return notams;
  }

  private generateSimulatedNotamText(icaoCode: string, index: number): string {
    const templates = [
      `${icaoCode} RWY 09L/27R CLOSED FOR MAINTENANCE`,
      `${icaoCode} TWY A BETWEEN TWY B AND TWY C CLOSED`,
      `${icaoCode} ILS RWY 04L OUT OF SERVICE`,
      `${icaoCode} APRON EAST SECTION CLOSED TO AIRCRAFT PARKING`,
      `${icaoCode} VOR/DME OUT OF SERVICE FOR MAINTENANCE`
    ];
    
    return templates[index % templates.length];
  }

  // Buscar NOTAMs con filtros
  async searchNotams(filters: NotamFilter): Promise<NotamData[]> {
    try {
      if (filters.icaoCodes && filters.icaoCodes.length > 0) {
        return await this.getFAANotams(filters.icaoCodes);
      }
      
      return [];
    } catch (error) {
      logger.error('Error buscando NOTAMs:', error);
      throw error;
    }
  }

  // Obtener estadísticas del servicio
  getServiceStats() {
    return {
      cacheSize: this.cache.size,
      rateLimiters: Object.fromEntries(this.rateLimiters),
      cacheDuration: this.CACHE_DURATION,
      rateLimit: this.RATE_LIMIT
    };
  }
}

export default NotamService;
export { NotamData, NotamFilter };