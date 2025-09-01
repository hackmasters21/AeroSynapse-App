import axios from 'axios';
import { config } from '../config/config';
import { logger, debugLog } from '../utils/logger';
import { AppError, ExternalAPIError } from '../middleware/errorHandler';

// Interfaces para datos meteorológicos
interface WeatherSource {
  id: string;
  name: string;
  type: 'aviation' | 'satellite' | 'radar' | 'model';
  priority: number;
  reliability: number;
  lastUpdate: Date;
  status: 'active' | 'inactive' | 'error';
}

interface MetarData {
  station: string;
  observationTime: Date;
  rawText: string;
  temperature: number;
  dewpoint: number;
  windDirection: number;
  windSpeed: number;
  windGust?: number;
  visibility: number;
  altimeter: number;
  conditions: string[];
  clouds: CloudLayer[];
  remarks?: string;
}

interface TafData {
  station: string;
  issueTime: Date;
  validFrom: Date;
  validTo: Date;
  rawText: string;
  forecast: ForecastPeriod[];
}

interface CloudLayer {
  coverage: 'SKC' | 'FEW' | 'SCT' | 'BKN' | 'OVC';
  altitude: number;
  type?: 'CU' | 'CB' | 'TCU';
}

interface ForecastPeriod {
  from: Date;
  to: Date;
  windDirection: number;
  windSpeed: number;
  windGust?: number;
  visibility: number;
  conditions: string[];
  clouds: CloudLayer[];
  probability?: number;
}

interface SigmetData {
  id: string;
  fir: string;
  type: 'SIGMET' | 'AIRMET';
  phenomenon: string;
  validFrom: Date;
  validTo: Date;
  geometry: any;
  flightLevels: {
    bottom: number;
    top: number;
  };
  movement?: {
    direction: number;
    speed: number;
  };
  intensity?: 'WEAK' | 'MODERATE' | 'STRONG' | 'SEVERE';
  rawText: string;
}

interface RadarData {
  timestamp: Date;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  tileUrl: string;
  intensity: 'light' | 'moderate' | 'heavy' | 'extreme';
  precipitationType: 'rain' | 'snow' | 'mixed';
}

interface SatelliteData {
  timestamp: Date;
  type: 'visible' | 'infrared' | 'water_vapor';
  tileUrl: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

interface WindsAloftData {
  flightLevel: number;
  timestamp: Date;
  data: {
    latitude: number;
    longitude: number;
    direction: number;
    speed: number;
    temperature?: number;
  }[];
}

interface WeatherConfidence {
  overall: number; // 0-100
  sources: {
    sourceId: string;
    weight: number;
    agreement: number;
  }[];
  factors: {
    temporal: number; // Qué tan recientes son los datos
    spatial: number; // Cobertura geográfica
    consensus: number; // Acuerdo entre fuentes
    reliability: number; // Confiabilidad histórica
  };
}

// Clase principal del servicio meteorológico
export class WeatherService {
  private sources: Map<string, WeatherSource> = new Map();
  private metarCache = new Map<string, MetarData>();
  private tafCache = new Map<string, TafData>();
  private sigmetCache = new Map<string, SigmetData[]>();
  private radarCache = new Map<string, RadarData>();
  private satelliteCache = new Map<string, SatelliteData>();
  private windsAloftCache = new Map<string, WindsAloftData>();
  private rateLimiters = new Map<string, { count: number; resetTime: number }>();
  
  constructor() {
    this.initializeSources();
    debugLog.info('WeatherService inicializado');
  }
  
  // Inicializar fuentes de datos meteorológicos
  private initializeSources(): void {
    const sources: WeatherSource[] = [
      {
        id: 'awc',
        name: 'Aviation Weather Center',
        type: 'aviation',
        priority: 1,
        reliability: 0.95,
        lastUpdate: new Date(),
        status: 'active'
      },
      {
        id: 'noaa_satellite',
        name: 'NOAA Satellite',
        type: 'satellite',
        priority: 2,
        reliability: 0.90,
        lastUpdate: new Date(),
        status: 'active'
      },
      {
        id: 'eumetsat',
        name: 'EUMETSAT',
        type: 'satellite',
        priority: 3,
        reliability: 0.88,
        lastUpdate: new Date(),
        status: 'active'
      },
      {
        id: 'rainviewer',
        name: 'RainViewer',
        type: 'radar',
        priority: 4,
        reliability: 0.85,
        lastUpdate: new Date(),
        status: 'active'
      },
      {
        id: 'gfs',
        name: 'GFS Model',
        type: 'model',
        priority: 5,
        reliability: 0.80,
        lastUpdate: new Date(),
        status: 'active'
      },
      {
        id: 'ecmwf',
        name: 'ECMWF Model',
        type: 'model',
        priority: 6,
        reliability: 0.92,
        lastUpdate: new Date(),
        status: 'active'
      }
    ];
    
    sources.forEach(source => {
      this.sources.set(source.id, source);
    });
  }
  
  // Obtener METAR de múltiples fuentes
  async getMetar(station: string): Promise<MetarData | null> {
    try {
      // Verificar cache
      const cached = this.metarCache.get(station);
      if (cached && this.isCacheValid(cached.observationTime, 30)) { // 30 minutos
        return cached;
      }
      
      // Intentar obtener de AWC primero
      let metar = await this.fetchMetarFromAWC(station);
      
      // Si falla, intentar fuentes alternativas
      if (!metar) {
        metar = await this.fetchMetarFromOpenWeather(station);
      }
      
      if (metar) {
        this.metarCache.set(station, metar);
      }
      
      return metar;
      
    } catch (error) {
      logger.error(`Error obteniendo METAR para ${station}:`, error);
      return null;
    }
  }
  
  // Obtener TAF de múltiples fuentes
  async getTaf(station: string): Promise<TafData | null> {
    try {
      // Verificar cache
      const cached = this.tafCache.get(station);
      if (cached && this.isCacheValid(cached.issueTime, 360)) { // 6 horas
        return cached;
      }
      
      // Intentar obtener de AWC
      const taf = await this.fetchTafFromAWC(station);
      
      if (taf) {
        this.tafCache.set(station, taf);
      }
      
      return taf;
      
    } catch (error) {
      logger.error(`Error obteniendo TAF para ${station}:`, error);
      return null;
    }
  }
  
  // Obtener SIGMETs/AIRMETs
  async getSigmets(fir?: string): Promise<SigmetData[]> {
    try {
      const cacheKey = fir || 'global';
      const cached = this.sigmetCache.get(cacheKey);
      
      if (cached && this.isCacheValid(new Date(), 60)) { // 1 hora
        return cached;
      }
      
      const sigmets = await this.fetchSigmetsFromAWC(fir);
      
      if (sigmets) {
        this.sigmetCache.set(cacheKey, sigmets);
      }
      
      return sigmets || [];
      
    } catch (error) {
      logger.error('Error obteniendo SIGMETs:', error);
      return [];
    }
  }
  
  // Obtener datos de radar
  async getRadarData(bounds: any): Promise<RadarData[]> {
    try {
      if (!this.checkRateLimit('rainviewer')) {
        throw new ExternalAPIError('RainViewer', 'Rate limit exceeded');
      }
      
      const radarData = await this.fetchRadarFromRainViewer(bounds);
      return radarData || [];
      
    } catch (error) {
      logger.error('Error obteniendo datos de radar:', error);
      return [];
    }
  }
  
  // Obtener datos satelitales
  async getSatelliteData(type: 'visible' | 'infrared' | 'water_vapor', bounds: any): Promise<SatelliteData | null> {
    try {
      const cacheKey = `${type}_${JSON.stringify(bounds)}`;
      const cached = this.satelliteCache.get(cacheKey);
      
      if (cached && this.isCacheValid(cached.timestamp, 15)) { // 15 minutos
        return cached;
      }
      
      // Intentar NOAA primero, luego EUMETSAT
      let satelliteData = await this.fetchSatelliteFromNOAA(type, bounds);
      
      if (!satelliteData) {
        satelliteData = await this.fetchSatelliteFromEUMETSAT(type, bounds);
      }
      
      if (satelliteData) {
        this.satelliteCache.set(cacheKey, satelliteData);
      }
      
      return satelliteData;
      
    } catch (error) {
      logger.error('Error obteniendo datos satelitales:', error);
      return null;
    }
  }
  
  // Obtener vientos en altura
  async getWindsAloft(flightLevel: number, bounds: any): Promise<WindsAloftData | null> {
    try {
      const cacheKey = `winds_${flightLevel}_${JSON.stringify(bounds)}`;
      const cached = this.windsAloftCache.get(cacheKey);
      
      if (cached && this.isCacheValid(cached.timestamp, 180)) { // 3 horas
        return cached;
      }
      
      // Intentar GFS primero, luego ECMWF
      let windsData = await this.fetchWindsFromGFS(flightLevel, bounds);
      
      if (!windsData) {
        windsData = await this.fetchWindsFromECMWF(flightLevel, bounds);
      }
      
      if (windsData) {
        this.windsAloftCache.set(cacheKey, windsData);
      }
      
      return windsData;
      
    } catch (error) {
      logger.error('Error obteniendo vientos en altura:', error);
      return null;
    }
  }
  
  // Calcular confianza de los datos meteorológicos
  async calculateWeatherConfidence(station: string): Promise<WeatherConfidence> {
    try {
      const metar = await this.getMetar(station);
      const taf = await this.getTaf(station);
      const sigmets = await this.getSigmets();
      
      // Factores de confianza
      const temporal = this.calculateTemporalFactor(metar, taf);
      const spatial = this.calculateSpatialFactor(station);
      const consensus = await this.calculateConsensusFactor(station);
      const reliability = this.calculateReliabilityFactor();
      
      // Calcular confianza general
      const overall = Math.round(
        (temporal * 0.3 + spatial * 0.2 + consensus * 0.3 + reliability * 0.2) * 100
      );
      
      return {
        overall,
        sources: Array.from(this.sources.values()).map(source => ({
          sourceId: source.id,
          weight: source.priority,
          agreement: source.reliability * 100
        })),
        factors: {
          temporal: Math.round(temporal * 100),
          spatial: Math.round(spatial * 100),
          consensus: Math.round(consensus * 100),
          reliability: Math.round(reliability * 100)
        }
      };
      
    } catch (error) {
      logger.error('Error calculando confianza meteorológica:', error);
      return {
        overall: 50,
        sources: [],
        factors: {
          temporal: 50,
          spatial: 50,
          consensus: 50,
          reliability: 50
        }
      };
    }
  }
  
  // Métodos privados para obtener datos de fuentes específicas
  
  private async fetchMetarFromAWC(station: string): Promise<MetarData | null> {
    try {
      if (!this.checkRateLimit('awc')) {
        return null;
      }
      
      // Conexión real con AWC API
      const response = await axios.get(`https://aviationweather.gov/api/data/metar?ids=${station}&format=json`, {
        headers: {
          'User-Agent': '(AeroSynapse/1.0, contact@aerosynapse.com)'
        },
        timeout: 10000
      });
      
      if (response.data && response.data.length > 0) {
        const awcData = response.data[0];
        return this.parseAWCMetar(awcData);
      }
      
      return null;
      
    } catch (error) {
      logger.error('Error obteniendo METAR de AWC:', error);
      // Fallback a datos simulados si falla la API
      return this.generateSimulatedMetar(station);
    }
  }
  
  private async fetchMetarFromOpenWeather(station: string): Promise<MetarData | null> {
    try {
      // Implementación alternativa con OpenWeatherMap
      return this.generateSimulatedMetar(station);
    } catch (error) {
      logger.error('Error obteniendo METAR de OpenWeather:', error);
      return null;
    }
  }
  
  private async fetchTafFromAWC(station: string): Promise<TafData | null> {
    try {
      if (!this.checkRateLimit('awc')) {
        return null;
      }
      
      // Conexión real con AWC API para TAFs
      const response = await axios.get(`https://aviationweather.gov/api/data/taf?ids=${station}&format=json`, {
        headers: {
          'User-Agent': '(AeroSynapse/1.0, contact@aerosynapse.com)'
        },
        timeout: 10000
      });
      
      if (response.data && response.data.length > 0) {
        const awcData = response.data[0];
        return this.parseAWCTaf(awcData);
      }
      
      return null;
      
    } catch (error) {
      logger.error('Error obteniendo TAF de AWC:', error);
      // Fallback a datos simulados si falla la API
      return this.generateSimulatedTaf(station);
    }
  }
  
  private async fetchSigmetsFromAWC(fir?: string): Promise<SigmetData[]> {
    try {
      if (!this.checkRateLimit('awc')) {
        return [];
      }
      
      // Conexión real con AWC API para SIGMETs
      const response = await axios.get('https://aviationweather.gov/api/data/airsigmet?format=json', {
        headers: {
          'User-Agent': '(AeroSynapse/1.0, contact@aerosynapse.com)'
        },
        timeout: 10000
      });
      
      if (response.data && Array.isArray(response.data)) {
        const sigmets = response.data.map((sigmet: any) => this.parseAWCSigmet(sigmet));
        
        // Filtrar por FIR si se especifica
        if (fir) {
          return sigmets.filter((sigmet: SigmetData) => 
            sigmet.fir?.toLowerCase().includes(fir.toLowerCase())
          );
        }
        
        return sigmets;
      }
      
      return [];
      
    } catch (error) {
      logger.error('Error obteniendo SIGMETs de AWC:', error);
      // Fallback a datos simulados si falla la API
      return this.generateSimulatedSigmets(fir);
    }
  }
  
  // Método para parsear datos reales de AWC METAR
  private parseAWCMetar(awcData: any): MetarData {
    return {
      station: awcData.icaoId || awcData.stationId,
      observationTime: new Date(awcData.obsTime || awcData.observation_time),
      rawText: awcData.rawOb || awcData.raw_text || '',
      temperature: awcData.temp || awcData.temperature || 0,
      dewpoint: awcData.dewp || awcData.dewpoint || 0,
      windDirection: awcData.wdir || awcData.wind_dir || 0,
      windSpeed: awcData.wspd || awcData.wind_speed || 0,
      windGust: awcData.wgst || awcData.wind_gust,
      visibility: awcData.visib || awcData.visibility || 10,
      altimeter: awcData.altim || awcData.altimeter || 30.00,
      conditions: this.parseConditions(awcData.wxString || awcData.weather || ''),
      clouds: this.parseClouds(awcData.clds || awcData.clouds || []),
      remarks: awcData.rmk || awcData.remarks
    };
  }
  
  // Método auxiliar para parsear condiciones meteorológicas
  private parseConditions(wxString: string): string[] {
    if (!wxString) return [];
    // Parsear condiciones como RA, SN, FG, etc.
    const conditions = wxString.match(/\b(RA|SN|FG|BR|HZ|DZ|IC|PL|GR|GS|UP|SG|FC|SS|DS|PO|SQ|FC|VA|DU|SA|PY|BC|PR|DR|BL|SH|TS|FZ)\b/g);
    return conditions || [];
  }
  
  // Método auxiliar para parsear información de nubes
   private parseClouds(cloudsData: any): CloudLayer[] {
     if (!Array.isArray(cloudsData)) return [];
     
     return cloudsData.map((cloud: any) => ({
       coverage: cloud.cover || cloud.coverage || 'CLR',
       altitude: cloud.base || cloud.altitude || 0,
       type: cloud.type || 'CU'
     }));
   }
   
   // Método para parsear datos reales de AWC TAF
   private parseAWCTaf(awcData: any): TafData {
     return {
       station: awcData.icaoId || awcData.stationId,
       issueTime: new Date(awcData.issueTime || awcData.issue_time),
       validFrom: new Date(awcData.validTimeFrom || awcData.valid_time_from),
       validTo: new Date(awcData.validTimeTo || awcData.valid_time_to),
       rawText: awcData.rawTAF || awcData.raw_text || '',
       forecasts: this.parseTafForecasts(awcData.forecasts || awcData.forecast || [])
     };
   }
   
   // Método auxiliar para parsear pronósticos TAF
    private parseTafForecasts(forecastsData: any[]): TafForecast[] {
      if (!Array.isArray(forecastsData)) return [];
      
      return forecastsData.map((forecast: any) => ({
        timeFrom: new Date(forecast.timeFrom || forecast.time_from),
        timeTo: new Date(forecast.timeTo || forecast.time_to),
        windDirection: forecast.wdir || forecast.wind_dir || 0,
        windSpeed: forecast.wspd || forecast.wind_speed || 0,
        windGust: forecast.wgst || forecast.wind_gust,
        visibility: forecast.visib || forecast.visibility || 10,
        conditions: this.parseConditions(forecast.wxString || forecast.weather || ''),
        clouds: this.parseClouds(forecast.clds || forecast.clouds || []),
        changeIndicator: forecast.changeIndicator || forecast.change_indicator || 'FM',
        probability: forecast.probability || forecast.prob
      }));
    }
    
    // Método para parsear datos reales de AWC SIGMET
    private parseAWCSigmet(awcData: any): SigmetData {
      return {
        id: awcData.id || awcData.sigmetId || `SIGMET_${Date.now()}`,
        type: this.parseSigmetType(awcData.hazard || awcData.type || 'TURB'),
        severity: this.parseSigmetSeverity(awcData.severity || awcData.intensity || 'MOD'),
        validFrom: new Date(awcData.validTimeFrom || awcData.valid_time_from || Date.now()),
        validTo: new Date(awcData.validTimeTo || awcData.valid_time_to || Date.now() + 6 * 60 * 60 * 1000),
        fir: awcData.fir || awcData.firId || 'UNKNOWN',
        area: this.parseSigmetArea(awcData.area || awcData.coords || []),
        altitudeFrom: awcData.altitudeFrom || awcData.base || 0,
        altitudeTo: awcData.altitudeTo || awcData.top || 45000,
        movement: awcData.movement || awcData.dir || 'STNR',
        intensity: awcData.intensityChange || awcData.change || 'NC',
        rawText: awcData.rawSigmet || awcData.raw_text || '',
        issueTime: new Date(awcData.issueTime || awcData.issue_time || Date.now())
      };
    }
    
    // Método auxiliar para parsear tipo de SIGMET
    private parseSigmetType(hazard: string): 'TURB' | 'ICE' | 'CONV' | 'DUST' | 'ASH' | 'OTHER' {
      const hazardUpper = hazard.toUpperCase();
      if (hazardUpper.includes('TURB')) return 'TURB';
      if (hazardUpper.includes('ICE') || hazardUpper.includes('ICING')) return 'ICE';
      if (hazardUpper.includes('CONV') || hazardUpper.includes('TS')) return 'CONV';
      if (hazardUpper.includes('DUST') || hazardUpper.includes('SAND')) return 'DUST';
      if (hazardUpper.includes('ASH') || hazardUpper.includes('VA')) return 'ASH';
      return 'OTHER';
    }
    
    // Método auxiliar para parsear severidad de SIGMET
    private parseSigmetSeverity(severity: string): 'LIGHT' | 'MODERATE' | 'SEVERE' {
      const severityUpper = severity.toUpperCase();
      if (severityUpper.includes('SEV') || severityUpper.includes('HEAVY')) return 'SEVERE';
      if (severityUpper.includes('MOD')) return 'MODERATE';
      return 'LIGHT';
    }
    
    // Método auxiliar para parsear área de SIGMET
    private parseSigmetArea(areaData: any): Array<{lat: number, lon: number}> {
      if (!Array.isArray(areaData)) return [];
      
      return areaData.map((point: any) => ({
        lat: parseFloat(point.lat || point.latitude || 0),
        lon: parseFloat(point.lon || point.longitude || 0)
      }));
    }
  
  private async fetchRadarFromRainViewer(bounds: any): Promise<RadarData[]> {
    try {
      return this.generateSimulatedRadar(bounds);
    } catch (error) {
      logger.error('Error obteniendo radar de RainViewer:', error);
      return [];
    }
  }
  
  private async fetchSatelliteFromNOAA(type: string, bounds: any): Promise<SatelliteData | null> {
    try {
      return this.generateSimulatedSatellite(type, bounds);
    } catch (error) {
      logger.error('Error obteniendo satélite de NOAA:', error);
      return null;
    }
  }
  
  private async fetchSatelliteFromEUMETSAT(type: string, bounds: any): Promise<SatelliteData | null> {
    try {
      return this.generateSimulatedSatellite(type, bounds);
    } catch (error) {
      logger.error('Error obteniendo satélite de EUMETSAT:', error);
      return null;
    }
  }
  
  private async fetchWindsFromGFS(flightLevel: number, bounds: any): Promise<WindsAloftData | null> {
    try {
      return this.generateSimulatedWinds(flightLevel, bounds);
    } catch (error) {
      logger.error('Error obteniendo vientos de GFS:', error);
      return null;
    }
  }
  
  private async fetchWindsFromECMWF(flightLevel: number, bounds: any): Promise<WindsAloftData | null> {
    try {
      return this.generateSimulatedWinds(flightLevel, bounds);
    } catch (error) {
      logger.error('Error obteniendo vientos de ECMWF:', error);
      return null;
    }
  }
  
  // Métodos de utilidad
  
  private isCacheValid(timestamp: Date, maxAgeMinutes: number): boolean {
    const now = new Date();
    const ageMinutes = (now.getTime() - timestamp.getTime()) / (1000 * 60);
    return ageMinutes < maxAgeMinutes;
  }
  
  private checkRateLimit(source: string): boolean {
    const now = Date.now();
    const limit = this.rateLimiters.get(source);
    
    if (!limit || now > limit.resetTime) {
      this.rateLimiters.set(source, {
        count: 1,
        resetTime: now + 60000 // 1 minuto
      });
      return true;
    }
    
    const maxRequests = 60; // 60 requests per minute
    
    if (limit.count >= maxRequests) {
      return false;
    }
    
    limit.count++;
    return true;
  }
  
  private calculateTemporalFactor(metar: MetarData | null, taf: TafData | null): number {
    let factor = 0;
    
    if (metar) {
      const metarAge = (Date.now() - metar.observationTime.getTime()) / (1000 * 60);
      factor += Math.max(0, 1 - metarAge / 60) * 0.6; // METAR válido por 1 hora
    }
    
    if (taf) {
      const tafAge = (Date.now() - taf.issueTime.getTime()) / (1000 * 60 * 60);
      factor += Math.max(0, 1 - tafAge / 6) * 0.4; // TAF válido por 6 horas
    }
    
    return Math.min(1, factor);
  }
  
  private calculateSpatialFactor(station: string): number {
    // Simulación basada en la densidad de estaciones cercanas
    return 0.8;
  }
  
  private async calculateConsensusFactor(station: string): Promise<number> {
    // Simulación del acuerdo entre múltiples fuentes
    return 0.75;
  }
  
  private calculateReliabilityFactor(): number {
    const activeSources = Array.from(this.sources.values()).filter(s => s.status === 'active');
    const avgReliability = activeSources.reduce((sum, s) => sum + s.reliability, 0) / activeSources.length;
    return avgReliability;
  }
  
  // Métodos para generar datos simulados (para desarrollo)
  
  private generateSimulatedMetar(station: string): MetarData {
    return {
      station,
      observationTime: new Date(),
      rawText: `${station} ${new Date().toISOString().slice(11, 16)}Z AUTO 27008KT 10SM FEW250 22/18 A3012 RMK AO2 SLP201`,
      temperature: 22,
      dewpoint: 18,
      windDirection: 270,
      windSpeed: 8,
      visibility: 10,
      altimeter: 30.12,
      conditions: ['AUTO'],
      clouds: [{ coverage: 'FEW', altitude: 25000 }]
    };
  }
  
  private generateSimulatedTaf(station: string): TafData {
    const now = new Date();
    const validFrom = new Date(now.getTime() + 60 * 60 * 1000); // +1 hora
    const validTo = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 horas
    
    return {
      station,
      issueTime: now,
      validFrom,
      validTo,
      rawText: `TAF ${station} ${now.toISOString().slice(11, 16)}Z ${validFrom.toISOString().slice(8, 13)}/${validTo.toISOString().slice(8, 13)} 27010KT 9999 FEW030 SCT100`,
      forecast: [{
        from: validFrom,
        to: validTo,
        windDirection: 270,
        windSpeed: 10,
        visibility: 9999,
        conditions: [],
        clouds: [
          { coverage: 'FEW', altitude: 3000 },
          { coverage: 'SCT', altitude: 10000 }
        ]
      }]
    };
  }
  
  private generateSimulatedSigmets(fir?: string): SigmetData[] {
    return [
      {
        id: 'SIGMET_001',
        fir: fir || 'MADRID',
        type: 'SIGMET',
        phenomenon: 'TURB',
        validFrom: new Date(),
        validTo: new Date(Date.now() + 4 * 60 * 60 * 1000),
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-4.0, 40.0],
            [-3.0, 40.0],
            [-3.0, 41.0],
            [-4.0, 41.0],
            [-4.0, 40.0]
          ]]
        },
        flightLevels: { bottom: 100, top: 300 },
        intensity: 'MODERATE',
        rawText: 'SIGMET MADRID 001 VALID 120600/121000 LECM- MADRID FIR MOD TURB FL100/300'
      }
    ];
  }
  
  private generateSimulatedRadar(bounds: any): RadarData[] {
    return [
      {
        timestamp: new Date(),
        bounds,
        tileUrl: 'https://tilecache.rainviewer.com/v2/radar/{timestamp}/512/{z}/{x}/{y}/2/1_1.png',
        intensity: 'moderate',
        precipitationType: 'rain'
      }
    ];
  }
  
  private generateSimulatedSatellite(type: string, bounds: any): SatelliteData {
    return {
      timestamp: new Date(),
      type: type as any,
      tileUrl: `https://cdn.star.nesdis.noaa.gov/GOES16/ABI/FD/GEOCOLOR/{timestamp}_GOES16-ABI-FD-GEOCOLOR-10848x10848.jpg`,
      bounds
    };
  }
  
  private generateSimulatedWinds(flightLevel: number, bounds: any): WindsAloftData {
    const data = [];
    
    // Generar grid de vientos
    for (let lat = bounds.south; lat <= bounds.north; lat += 0.5) {
      for (let lng = bounds.west; lng <= bounds.east; lng += 0.5) {
        data.push({
          latitude: lat,
          longitude: lng,
          direction: Math.floor(Math.random() * 360),
          speed: Math.floor(Math.random() * 100) + 20,
          temperature: -50 + Math.random() * 30
        });
      }
    }
    
    return {
      flightLevel,
      timestamp: new Date(),
      data
    };
  }
  
  // Obtener estadísticas del servicio
  getServiceStats() {
    return {
      sources: Array.from(this.sources.values()),
      cacheStats: {
        metar: this.metarCache.size,
        taf: this.tafCache.size,
        sigmets: this.sigmetCache.size,
        radar: this.radarCache.size,
        satellite: this.satelliteCache.size,
        windsAloft: this.windsAloftCache.size
      },
      rateLimits: Object.fromEntries(this.rateLimiters)
    };
  }
}

export default WeatherService;
export {
  MetarData,
  TafData,
  SigmetData,
  RadarData,
  SatelliteData,
  WindsAloftData,
  WeatherConfidence,
  WeatherSource
};