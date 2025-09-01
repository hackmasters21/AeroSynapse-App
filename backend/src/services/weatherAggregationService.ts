import { WeatherService, MetarData, TafData, SigmetData, WeatherConfidence } from './weatherService';
import { logger, debugLog } from '../utils/logger';
import { config } from '../config/config';

// Interfaces para agregación meteorológica
interface WeatherDataPoint {
  source: string;
  timestamp: Date;
  reliability: number;
  data: any;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

interface AggregatedWeatherData {
  station: string;
  timestamp: Date;
  confidence: WeatherConfidence;
  consensus: {
    temperature?: number;
    windDirection?: number;
    windSpeed?: number;
    visibility?: number;
    pressure?: number;
    agreement: number;
  };
  sources: WeatherDataPoint[];
  recommendations: string[];
  warnings: string[];
}

interface SourceWeight {
  sourceId: string;
  weight: number;
  factors: {
    reliability: number;
    recency: number;
    coverage: number;
    accuracy: number;
  };
}

interface ConflictAnalysis {
  parameter: string;
  values: { source: string; value: number; weight: number }[];
  variance: number;
  consensus: number;
  recommendation: string;
}

interface QualityMetrics {
  completeness: number; // Porcentaje de datos disponibles
  consistency: number; // Consistencia entre fuentes
  timeliness: number; // Qué tan recientes son los datos
  accuracy: number; // Precisión histórica
  coverage: number; // Cobertura geográfica
}

// Clase para agregación y análisis de confianza meteorológica
export class WeatherAggregationService {
  private weatherService: WeatherService;
  private sourceWeights = new Map<string, SourceWeight>();
  private historicalAccuracy = new Map<string, number[]>();
  private consensusThresholds = {
    temperature: 3.0, // °C
    windDirection: 30, // grados
    windSpeed: 5, // kt
    visibility: 2, // SM
    pressure: 0.05 // inHg
  };
  
  constructor(weatherService: WeatherService) {
    this.weatherService = weatherService;
    this.initializeSourceWeights();
    debugLog.info('WeatherAggregationService inicializado');
  }
  
  // Inicializar pesos de fuentes
  private initializeSourceWeights(): void {
    const weights: SourceWeight[] = [
      {
        sourceId: 'awc',
        weight: 1.0,
        factors: {
          reliability: 0.95,
          recency: 0.90,
          coverage: 0.85,
          accuracy: 0.92
        }
      },
      {
        sourceId: 'noaa_satellite',
        weight: 0.85,
        factors: {
          reliability: 0.90,
          recency: 0.95,
          coverage: 0.95,
          accuracy: 0.88
        }
      },
      {
        sourceId: 'eumetsat',
        weight: 0.80,
        factors: {
          reliability: 0.88,
          recency: 0.90,
          coverage: 0.90,
          accuracy: 0.85
        }
      },
      {
        sourceId: 'rainviewer',
        weight: 0.75,
        factors: {
          reliability: 0.85,
          recency: 0.95,
          coverage: 0.80,
          accuracy: 0.82
        }
      },
      {
        sourceId: 'gfs',
        weight: 0.70,
        factors: {
          reliability: 0.80,
          recency: 0.70,
          coverage: 0.95,
          accuracy: 0.78
        }
      },
      {
        sourceId: 'ecmwf',
        weight: 0.90,
        factors: {
          reliability: 0.92,
          recency: 0.75,
          coverage: 0.90,
          accuracy: 0.90
        }
      }
    ];
    
    weights.forEach(weight => {
      this.sourceWeights.set(weight.sourceId, weight);
    });
  }
  
  // Agregar datos meteorológicos de múltiples fuentes
  async aggregateWeatherData(station: string): Promise<AggregatedWeatherData> {
    try {
      debugLog.info(`Agregando datos meteorológicos para ${station}`);
      
      // Obtener datos de múltiples fuentes
      const [metar, taf, sigmets] = await Promise.all([
        this.weatherService.getMetar(station),
        this.weatherService.getTaf(station),
        this.weatherService.getSigmets()
      ]);
      
      // Simular datos de múltiples fuentes para METAR
      const metarSources = await this.getMultiSourceMetar(station);
      
      // Calcular consenso
      const consensus = this.calculateConsensus(metarSources);
      
      // Calcular confianza
      const confidence = await this.calculateAdvancedConfidence(station, metarSources);
      
      // Analizar conflictos
      const conflicts = this.analyzeConflicts(metarSources);
      
      // Generar recomendaciones
      const recommendations = this.generateRecommendations(confidence, conflicts, consensus);
      
      // Generar advertencias
      const warnings = this.generateWarnings(conflicts, confidence, sigmets);
      
      return {
        station,
        timestamp: new Date(),
        confidence,
        consensus,
        sources: metarSources,
        recommendations,
        warnings
      };
      
    } catch (error) {
      logger.error(`Error agregando datos meteorológicos para ${station}:`, error);
      throw error;
    }
  }
  
  // Obtener METAR de múltiples fuentes simuladas
  private async getMultiSourceMetar(station: string): Promise<WeatherDataPoint[]> {
    const sources: WeatherDataPoint[] = [];
    
    // Simular datos de diferentes fuentes con variaciones
    const baseTemp = 20 + Math.random() * 10;
    const baseWind = Math.floor(Math.random() * 360);
    const baseSpeed = 5 + Math.random() * 15;
    
    const sourceData = [
      {
        source: 'awc',
        temperature: baseTemp + (Math.random() - 0.5) * 2,
        windDirection: baseWind + (Math.random() - 0.5) * 20,
        windSpeed: baseSpeed + (Math.random() - 0.5) * 3,
        visibility: 10,
        pressure: 30.12 + (Math.random() - 0.5) * 0.1
      },
      {
        source: 'noaa_satellite',
        temperature: baseTemp + (Math.random() - 0.5) * 3,
        windDirection: baseWind + (Math.random() - 0.5) * 25,
        windSpeed: baseSpeed + (Math.random() - 0.5) * 4,
        visibility: 10,
        pressure: 30.12 + (Math.random() - 0.5) * 0.15
      },
      {
        source: 'openweather',
        temperature: baseTemp + (Math.random() - 0.5) * 4,
        windDirection: baseWind + (Math.random() - 0.5) * 30,
        windSpeed: baseSpeed + (Math.random() - 0.5) * 5,
        visibility: 10,
        pressure: 30.12 + (Math.random() - 0.5) * 0.2
      }
    ];
    
    sourceData.forEach(data => {
      const weight = this.sourceWeights.get(data.source);
      const quality = this.assessDataQuality(data, weight);
      
      sources.push({
        source: data.source,
        timestamp: new Date(),
        reliability: weight?.weight || 0.5,
        data,
        quality
      });
    });
    
    return sources;
  }
  
  // Calcular consenso entre fuentes
  private calculateConsensus(sources: WeatherDataPoint[]): any {
    if (sources.length === 0) {
      return { agreement: 0 };
    }
    
    const parameters = ['temperature', 'windDirection', 'windSpeed', 'visibility', 'pressure'];
    const consensus: any = { agreement: 0 };
    let totalAgreement = 0;
    let parameterCount = 0;
    
    parameters.forEach(param => {
      const values = sources
        .map(s => ({ value: s.data[param], weight: s.reliability }))
        .filter(v => v.value !== undefined);
      
      if (values.length > 1) {
        const weightedAverage = this.calculateWeightedAverage(values);
        const agreement = this.calculateParameterAgreement(values, param);
        
        consensus[param] = weightedAverage;
        totalAgreement += agreement;
        parameterCount++;
      }
    });
    
    consensus.agreement = parameterCount > 0 ? totalAgreement / parameterCount : 0;
    
    return consensus;
  }
  
  // Calcular promedio ponderado
  private calculateWeightedAverage(values: { value: number; weight: number }[]): number {
    const totalWeight = values.reduce((sum, v) => sum + v.weight, 0);
    const weightedSum = values.reduce((sum, v) => sum + (v.value * v.weight), 0);
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }
  
  // Calcular acuerdo para un parámetro específico
  private calculateParameterAgreement(values: { value: number; weight: number }[], parameter: string): number {
    if (values.length < 2) return 1;
    
    const threshold = this.consensusThresholds[parameter as keyof typeof this.consensusThresholds] || 1;
    const average = this.calculateWeightedAverage(values);
    
    let agreementCount = 0;
    let totalWeight = 0;
    
    values.forEach(v => {
      const deviation = Math.abs(v.value - average);
      if (deviation <= threshold) {
        agreementCount += v.weight;
      }
      totalWeight += v.weight;
    });
    
    return totalWeight > 0 ? agreementCount / totalWeight : 0;
  }
  
  // Calcular confianza avanzada
  private async calculateAdvancedConfidence(
    station: string,
    sources: WeatherDataPoint[]
  ): Promise<WeatherConfidence> {
    
    // Factores de confianza
    const temporal = this.calculateTemporalFactor(sources);
    const spatial = this.calculateSpatialFactor(station);
    const consensus = this.calculateConsensusFactor(sources);
    const reliability = this.calculateReliabilityFactor(sources);
    
    // Calcular confianza general con pesos ajustados
    const overall = Math.round(
      (temporal * 0.25 + spatial * 0.15 + consensus * 0.35 + reliability * 0.25) * 100
    );
    
    return {
      overall: Math.max(0, Math.min(100, overall)),
      sources: sources.map(source => ({
        sourceId: source.source,
        weight: source.reliability,
        agreement: this.calculateSourceAgreement(source, sources)
      })),
      factors: {
        temporal: Math.round(temporal * 100),
        spatial: Math.round(spatial * 100),
        consensus: Math.round(consensus * 100),
        reliability: Math.round(reliability * 100)
      }
    };
  }
  
  // Analizar conflictos entre fuentes
  private analyzeConflicts(sources: WeatherDataPoint[]): ConflictAnalysis[] {
    const conflicts: ConflictAnalysis[] = [];
    const parameters = ['temperature', 'windDirection', 'windSpeed', 'pressure'];
    
    parameters.forEach(param => {
      const values = sources
        .map(s => ({
          source: s.source,
          value: s.data[param],
          weight: s.reliability
        }))
        .filter(v => v.value !== undefined);
      
      if (values.length > 1) {
        const variance = this.calculateVariance(values.map(v => v.value));
        const consensus = this.calculateParameterAgreement(
          values.map(v => ({ value: v.value, weight: v.weight })),
          param
        );
        
        const threshold = this.consensusThresholds[param as keyof typeof this.consensusThresholds] || 1;
        
        if (variance > threshold * threshold) {
          conflicts.push({
            parameter: param,
            values,
            variance,
            consensus,
            recommendation: this.generateConflictRecommendation(param, variance, consensus)
          });
        }
      }
    });
    
    return conflicts;
  }
  
  // Calcular varianza
  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
  
  // Generar recomendaciones
  private generateRecommendations(
    confidence: WeatherConfidence,
    conflicts: ConflictAnalysis[],
    consensus: any
  ): string[] {
    const recommendations: string[] = [];
    
    // Recomendaciones basadas en confianza
    if (confidence.overall >= 85) {
      recommendations.push('High confidence weather data - suitable for flight planning');
    } else if (confidence.overall >= 70) {
      recommendations.push('Good confidence - verify with additional sources for critical decisions');
    } else if (confidence.overall >= 50) {
      recommendations.push('Medium confidence - exercise caution and seek additional verification');
    } else {
      recommendations.push('Low confidence - seek alternative sources and delay non-essential flights');
    }
    
    // Recomendaciones basadas en conflictos
    if (conflicts.length > 0) {
      recommendations.push(`${conflicts.length} data conflicts detected - review individual sources`);
      
      conflicts.forEach(conflict => {
        if (conflict.consensus < 0.7) {
          recommendations.push(`Significant disagreement in ${conflict.parameter} - use most reliable source`);
        }
      });
    }
    
    // Recomendaciones basadas en factores específicos
    if (confidence.factors.temporal < 70) {
      recommendations.push('Weather data may be outdated - request current observations');
    }
    
    if (confidence.factors.consensus < 60) {
      recommendations.push('Poor consensus between sources - cross-check with official reports');
    }
    
    return recommendations;
  }
  
  // Generar advertencias
  private generateWarnings(
    conflicts: ConflictAnalysis[],
    confidence: WeatherConfidence,
    sigmets: SigmetData[]
  ): string[] {
    const warnings: string[] = [];
    
    // Advertencias por baja confianza
    if (confidence.overall < 50) {
      warnings.push('CAUTION: Low confidence weather data - verify with official sources');
    }
    
    // Advertencias por conflictos críticos
    conflicts.forEach(conflict => {
      if (conflict.parameter === 'windSpeed' && conflict.variance > 25) {
        warnings.push('WARNING: Significant wind speed disagreement between sources');
      }
      if (conflict.parameter === 'visibility' && conflict.variance > 4) {
        warnings.push('WARNING: Visibility reports vary significantly between sources');
      }
    });
    
    // Advertencias por SIGMETs activos
    if (sigmets.length > 0) {
      const criticalSigmets = sigmets.filter(s => 
        s.phenomenon.includes('TS') || 
        s.phenomenon.includes('TURB') || 
        s.intensity === 'SEVERE'
      );
      
      if (criticalSigmets.length > 0) {
        warnings.push(`WARNING: ${criticalSigmets.length} critical SIGMET(s) active in area`);
      }
    }
    
    return warnings;
  }
  
  // Métodos auxiliares
  
  private assessDataQuality(data: any, weight?: SourceWeight): 'excellent' | 'good' | 'fair' | 'poor' {
    if (!weight) return 'poor';
    
    const score = (weight.factors.reliability + weight.factors.accuracy + weight.factors.recency) / 3;
    
    if (score >= 0.9) return 'excellent';
    if (score >= 0.8) return 'good';
    if (score >= 0.7) return 'fair';
    return 'poor';
  }
  
  private calculateTemporalFactor(sources: WeatherDataPoint[]): number {
    if (sources.length === 0) return 0;
    
    const now = Date.now();
    const ages = sources.map(s => (now - s.timestamp.getTime()) / (1000 * 60)); // minutos
    const avgAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
    
    // Factor decrece con la edad (máximo 60 minutos para METAR)
    return Math.max(0, 1 - avgAge / 60);
  }
  
  private calculateSpatialFactor(station: string): number {
    // Simulación basada en densidad de estaciones
    // En implementación real, calcularía basado en estaciones cercanas
    return 0.8;
  }
  
  private calculateConsensusFactor(sources: WeatherDataPoint[]): number {
    if (sources.length < 2) return 0.5;
    
    const parameters = ['temperature', 'windDirection', 'windSpeed', 'pressure'];
    let totalAgreement = 0;
    let parameterCount = 0;
    
    parameters.forEach(param => {
      const values = sources
        .map(s => ({ value: s.data[param], weight: s.reliability }))
        .filter(v => v.value !== undefined);
      
      if (values.length > 1) {
        const agreement = this.calculateParameterAgreement(values, param);
        totalAgreement += agreement;
        parameterCount++;
      }
    });
    
    return parameterCount > 0 ? totalAgreement / parameterCount : 0.5;
  }
  
  private calculateReliabilityFactor(sources: WeatherDataPoint[]): number {
    if (sources.length === 0) return 0;
    
    const totalWeight = sources.reduce((sum, s) => sum + s.reliability, 0);
    return totalWeight / sources.length;
  }
  
  private calculateSourceAgreement(source: WeatherDataPoint, allSources: WeatherDataPoint[]): number {
    const otherSources = allSources.filter(s => s.source !== source.source);
    if (otherSources.length === 0) return 100;
    
    const parameters = ['temperature', 'windDirection', 'windSpeed'];
    let agreements = 0;
    let comparisons = 0;
    
    parameters.forEach(param => {
      const sourceValue = source.data[param];
      if (sourceValue !== undefined) {
        otherSources.forEach(other => {
          const otherValue = other.data[param];
          if (otherValue !== undefined) {
            const threshold = this.consensusThresholds[param as keyof typeof this.consensusThresholds] || 1;
            if (Math.abs(sourceValue - otherValue) <= threshold) {
              agreements++;
            }
            comparisons++;
          }
        });
      }
    });
    
    return comparisons > 0 ? Math.round((agreements / comparisons) * 100) : 50;
  }
  
  private generateConflictRecommendation(parameter: string, variance: number, consensus: number): string {
    if (consensus < 0.5) {
      return `High disagreement in ${parameter} - use most reliable source and verify with official reports`;
    } else if (consensus < 0.7) {
      return `Moderate disagreement in ${parameter} - cross-reference with additional sources`;
    } else {
      return `Minor disagreement in ${parameter} - acceptable for planning purposes`;
    }
  }
  
  // Obtener métricas de calidad
  async getQualityMetrics(station: string): Promise<QualityMetrics> {
    try {
      const sources = await this.getMultiSourceMetar(station);
      
      return {
        completeness: this.calculateCompleteness(sources),
        consistency: this.calculateConsistency(sources),
        timeliness: this.calculateTimeliness(sources),
        accuracy: this.calculateAccuracy(sources),
        coverage: this.calculateCoverage(station)
      };
      
    } catch (error) {
      logger.error('Error calculando métricas de calidad:', error);
      return {
        completeness: 0,
        consistency: 0,
        timeliness: 0,
        accuracy: 0,
        coverage: 0
      };
    }
  }
  
  private calculateCompleteness(sources: WeatherDataPoint[]): number {
    if (sources.length === 0) return 0;
    
    const requiredParameters = ['temperature', 'windDirection', 'windSpeed', 'pressure'];
    let totalAvailable = 0;
    let totalRequired = sources.length * requiredParameters.length;
    
    sources.forEach(source => {
      requiredParameters.forEach(param => {
        if (source.data[param] !== undefined) {
          totalAvailable++;
        }
      });
    });
    
    return totalRequired > 0 ? (totalAvailable / totalRequired) * 100 : 0;
  }
  
  private calculateConsistency(sources: WeatherDataPoint[]): number {
    return this.calculateConsensusFactor(sources) * 100;
  }
  
  private calculateTimeliness(sources: WeatherDataPoint[]): number {
    return this.calculateTemporalFactor(sources) * 100;
  }
  
  private calculateAccuracy(sources: WeatherDataPoint[]): number {
    // Simulación basada en confiabilidad de fuentes
    if (sources.length === 0) return 0;
    
    const avgReliability = sources.reduce((sum, s) => sum + s.reliability, 0) / sources.length;
    return avgReliability * 100;
  }
  
  private calculateCoverage(station: string): number {
    // Simulación de cobertura geográfica
    return 85;
  }
  
  // Obtener estadísticas del servicio
  getServiceStats() {
    return {
      sourceWeights: Object.fromEntries(this.sourceWeights),
      consensusThresholds: this.consensusThresholds,
      historicalAccuracy: Object.fromEntries(this.historicalAccuracy)
    };
  }
}

export default WeatherAggregationService;
export {
  AggregatedWeatherData,
  WeatherDataPoint,
  ConflictAnalysis,
  QualityMetrics,
  SourceWeight
};