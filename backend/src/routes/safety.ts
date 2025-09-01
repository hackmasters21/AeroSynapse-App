import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { optionalAuth } from '../middleware/auth';
import { SafetyService, AccidentFilter } from '../services/safetyService';
import { logger } from '../utils/logger';
import { validateInput, createHttpError } from '../middleware/errorHandler';
import Joi from 'joi';

const router = Router();

// Instancia del servicio de seguridad
let safetyService: SafetyService;

// Función para inyectar el servicio
export const setSafetyService = (service: SafetyService) => {
  safetyService = service;
};

// Esquemas de validación
const accidentFilterSchema = Joi.object({
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional(),
  flightPhase: Joi.array().items(Joi.string().valid(
    'taxi', 'takeoff', 'initial_climb', 'climb', 'cruise', 'descent', 'approach', 'landing', 'ground_operations'
  )).optional(),
  aircraftCategory: Joi.array().items(Joi.string().valid(
    'airplane', 'helicopter', 'glider', 'balloon', 'other'
  )).optional(),
  flightType: Joi.array().items(Joi.string().valid(
    'commercial', 'general_aviation', 'military', 'cargo', 'training', 'other'
  )).optional(),
  minFatalities: Joi.number().min(0).optional(),
  country: Joi.string().max(50).optional(),
  bounds: Joi.object({
    north: Joi.number().min(-90).max(90).required(),
    south: Joi.number().min(-90).max(90).required(),
    east: Joi.number().min(-180).max(180).required(),
    west: Joi.number().min(-180).max(180).required()
  }).optional(),
  radius: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    distance: Joi.number().min(1).max(500).required() // máximo 500 NM
  }).optional()
});

const riskAssessmentSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  radius: Joi.number().min(1).max(100).default(25) // máximo 100 NM
});

/**
 * @route POST /api/safety/accidents/search
 * @desc Buscar accidentes aéreos con filtros
 * @access Public
 */
router.post('/accidents/search', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  // Validar filtros
  validateInput(accidentFilterSchema, req.body);
  
  const filters: AccidentFilter = req.body;
  
  try {
    const accidents = await safetyService.searchAccidents(filters);
    
    res.json({
      success: true,
      data: {
        accidents,
        count: accidents.length,
        filters,
        summary: {
          totalAccidents: accidents.length,
          fatalAccidents: accidents.filter(a => a.casualties.fatalities > 0).length,
          totalFatalities: accidents.reduce((sum, a) => sum + a.casualties.fatalities, 0),
          dateRange: {
            earliest: accidents.length > 0 ? Math.min(...accidents.map(a => a.eventDate.getTime())) : null,
            latest: accidents.length > 0 ? Math.max(...accidents.map(a => a.eventDate.getTime())) : null
          }
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error buscando accidentes:', error);
    throw error;
  }
}));

/**
 * @route GET /api/safety/accidents/:id
 * @desc Obtener detalles de un accidente específico
 * @access Public
 */
router.get('/accidents/:id', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const accidents = await safetyService.searchAccidents({});
    const accident = accidents.find(a => a.id === id);
    
    if (!accident) {
      throw createHttpError.notFound('Accidente');
    }
    
    res.json({
      success: true,
      data: accident
    });
    
  } catch (error) {
    logger.error(`Error obteniendo accidente ${id}:`, error);
    throw error;
  }
}));

/**
 * @route POST /api/safety/statistics
 * @desc Obtener estadísticas de seguridad aérea
 * @access Public
 */
router.post('/statistics', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  // Validar filtros opcionales
  if (req.body && Object.keys(req.body).length > 0) {
    validateInput(accidentFilterSchema, req.body);
  }
  
  const filters: AccidentFilter = req.body || {};
  
  try {
    const statistics = await safetyService.calculateSafetyStatistics(filters);
    
    res.json({
      success: true,
      data: {
        statistics,
        filters,
        interpretation: {
          safetyLevel: getSafetyLevel(statistics),
          trendDescription: getTrendDescription(statistics.trends),
          keyInsights: generateKeyInsights(statistics)
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error calculando estadísticas de seguridad:', error);
    throw error;
  }
}));

/**
 * @route POST /api/safety/risk-assessment
 * @desc Evaluar riesgo de seguridad para una ubicación
 * @access Public
 */
router.post('/risk-assessment', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  // Validar entrada
  validateInput(riskAssessmentSchema, req.body);
  
  const { latitude, longitude, radius } = req.body;
  
  try {
    const riskAssessment = await safetyService.assessLocationRisk(latitude, longitude, radius);
    
    res.json({
      success: true,
      data: {
        assessment: riskAssessment,
        interpretation: {
          riskDescription: getRiskDescription(riskAssessment.riskLevel),
          operationalImpact: getOperationalImpact(riskAssessment.riskLevel),
          mitigationStrategies: getMitigationStrategies(riskAssessment)
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error evaluando riesgo de ubicación:', error);
    throw error;
  }
}));

/**
 * @route GET /api/safety/alerts
 * @desc Obtener alertas de seguridad activas
 * @access Public
 */
router.get('/alerts', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { severity, type } = req.query;
  
  try {
    let alerts = await safetyService.generateSafetyAlerts();
    
    // Aplicar filtros
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    if (type) {
      alerts = alerts.filter(alert => alert.type === type);
    }
    
    // Ordenar por severidad
    const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
    alerts.sort((a, b) => 
      severityOrder[b.severity as keyof typeof severityOrder] - 
      severityOrder[a.severity as keyof typeof severityOrder]
    );
    
    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
        summary: {
          critical: alerts.filter(a => a.severity === 'critical').length,
          high: alerts.filter(a => a.severity === 'high').length,
          medium: alerts.filter(a => a.severity === 'medium').length,
          low: alerts.filter(a => a.severity === 'low').length
        },
        filters: { severity, type }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error obteniendo alertas de seguridad:', error);
    throw error;
  }
}));

/**
 * @route GET /api/safety/data-sources
 * @desc Obtener información sobre fuentes de datos de seguridad
 * @access Public
 */
router.get('/data-sources', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const sources = [
    {
      id: 'ntsb',
      name: 'National Transportation Safety Board',
      description: 'US aviation accident database',
      coverage: 'United States',
      dataTypes: ['accidents', 'incidents', 'investigations'],
      updateFrequency: 'Daily',
      reliability: 95,
      url: 'https://www.ntsb.gov/',
      apiStatus: 'active'
    },
    {
      id: 'asn',
      name: 'Aviation Safety Network',
      description: 'Global aviation accident database',
      coverage: 'Worldwide',
      dataTypes: ['accidents', 'incidents', 'statistics'],
      updateFrequency: 'Daily',
      reliability: 90,
      url: 'https://aviation-safety.net/',
      apiStatus: 'active'
    },
    {
      id: 'icao',
      name: 'International Civil Aviation Organization',
      description: 'International aviation safety data',
      coverage: 'Worldwide',
      dataTypes: ['statistics', 'safety_indicators'],
      updateFrequency: 'Monthly',
      reliability: 98,
      url: 'https://www.icao.int/',
      apiStatus: 'limited'
    }
  ];
  
  res.json({
    success: true,
    data: {
      sources,
      summary: {
        total: sources.length,
        active: sources.filter(s => s.apiStatus === 'active').length,
        coverage: 'Global with emphasis on US and European data',
        lastUpdate: new Date().toISOString()
      }
    }
  });
}));

/**
 * @route GET /api/safety/flight-phases
 * @desc Obtener información sobre fases de vuelo para filtros
 * @access Public
 */
router.get('/flight-phases', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const phases = [
    {
      id: 'taxi',
      name: 'Taxi',
      description: 'Ground movement to/from runway',
      riskLevel: 'low'
    },
    {
      id: 'takeoff',
      name: 'Takeoff',
      description: 'From brake release to 35ft AGL',
      riskLevel: 'high'
    },
    {
      id: 'initial_climb',
      name: 'Initial Climb',
      description: 'From 35ft to 1000ft AGL',
      riskLevel: 'high'
    },
    {
      id: 'climb',
      name: 'Climb',
      description: 'From 1000ft AGL to cruise altitude',
      riskLevel: 'medium'
    },
    {
      id: 'cruise',
      name: 'Cruise',
      description: 'Level flight at cruise altitude',
      riskLevel: 'low'
    },
    {
      id: 'descent',
      name: 'Descent',
      description: 'From cruise altitude to 1000ft AGL',
      riskLevel: 'medium'
    },
    {
      id: 'approach',
      name: 'Approach',
      description: 'From 1000ft AGL to 50ft AGL',
      riskLevel: 'high'
    },
    {
      id: 'landing',
      name: 'Landing',
      description: 'From 50ft AGL to full stop',
      riskLevel: 'high'
    },
    {
      id: 'ground_operations',
      name: 'Ground Operations',
      description: 'All ground operations except taxi',
      riskLevel: 'low'
    }
  ];
  
  res.json({
    success: true,
    data: phases
  });
}));

/**
 * @route GET /api/safety/stats
 * @desc Obtener estadísticas del servicio de seguridad
 * @access Public
 */
router.get('/stats', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = safetyService.getServiceStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error obteniendo estadísticas del servicio:', error);
    throw error;
  }
}));

/**
 * @route POST /api/safety/sync-data
 * @desc Sincronizar datos de fuentes externas
 * @access Public
 */
router.post('/sync-data', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { sources = ['ntsb', 'asn'] } = req.body;
  
  try {
    const results = [];
    
    for (const source of sources) {
      try {
        let data;
        if (source === 'ntsb') {
          data = await safetyService.fetchNTSBData();
        } else if (source === 'asn') {
          data = await safetyService.fetchASNData();
        }
        
        results.push({
          source,
          status: 'success',
          recordsProcessed: data?.length || 0,
          lastSync: new Date().toISOString()
        });
        
      } catch (error) {
        results.push({
          source,
          status: 'error',
          error: error.message,
          lastSync: new Date().toISOString()
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        syncResults: results,
        summary: {
          successful: results.filter(r => r.status === 'success').length,
          failed: results.filter(r => r.status === 'error').length,
          totalRecords: results.reduce((sum, r) => sum + (r.recordsProcessed || 0), 0)
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error sincronizando datos de seguridad:', error);
    throw error;
  }
}));

// Funciones auxiliares

function getSafetyLevel(statistics: any): string {
  const fatalityRate = statistics.totalFatalities / Math.max(statistics.totalAccidents, 1);
  
  if (fatalityRate < 0.1) return 'excellent';
  if (fatalityRate < 0.3) return 'good';
  if (fatalityRate < 0.5) return 'fair';
  return 'poor';
}

function getTrendDescription(trends: any): string {
  if (trends.improving) {
    return `Safety is improving with a ${Math.abs(trends.changeRate)}% reduction in accidents over ${trends.period}`;
  } else {
    return `Safety trends show a ${trends.changeRate}% increase in accidents over ${trends.period}`;
  }
}

function generateKeyInsights(statistics: any): string[] {
  const insights = [];
  
  // Análisis por fase de vuelo
  const phases = Object.entries(statistics.byPhase) as [string, number][];
  const maxPhase = phases.reduce((max, current) => current[1] > max[1] ? current : max, phases[0]);
  insights.push(`Most accidents occur during ${maxPhase[0]} phase (${maxPhase[1]} incidents)`);
  
  // Análisis de fatalidades
  const fatalityRate = (statistics.fatalAccidents / statistics.totalAccidents * 100).toFixed(1);
  insights.push(`${fatalityRate}% of accidents result in fatalities`);
  
  // Tendencias
  if (statistics.trends.improving) {
    insights.push('Overall safety trend is positive');
  } else {
    insights.push('Safety trends require attention');
  }
  
  return insights;
}

function getRiskDescription(riskLevel: string): string {
  const descriptions = {
    'very_low': 'Minimal safety risk - standard precautions apply',
    'low': 'Low safety risk - normal operations with standard vigilance',
    'medium': 'Moderate safety risk - increased awareness and precautions recommended',
    'high': 'High safety risk - significant precautions and risk mitigation required',
    'very_high': 'Very high safety risk - consider avoiding area or implementing extensive safety measures'
  };
  
  return descriptions[riskLevel as keyof typeof descriptions] || 'Unknown risk level';
}

function getOperationalImpact(riskLevel: string): string {
  const impacts = {
    'very_low': 'No operational restrictions',
    'low': 'Standard operating procedures apply',
    'medium': 'Enhanced briefings and increased vigilance recommended',
    'high': 'Consider operational restrictions and additional safety measures',
    'very_high': 'Significant operational restrictions recommended'
  };
  
  return impacts[riskLevel as keyof typeof impacts] || 'Unknown operational impact';
}

function getMitigationStrategies(assessment: any): string[] {
  const strategies = [];
  
  if (assessment.factors.historicalAccidents > 3) {
    strategies.push('Review historical accident patterns and contributing factors');
    strategies.push('Implement lessons learned from previous incidents');
  }
  
  if (assessment.factors.weatherRelated > 25) {
    strategies.push('Enhance weather monitoring and decision-making processes');
    strategies.push('Consider higher weather minimums for operations in this area');
  }
  
  if (assessment.factors.terrainComplexity > 60) {
    strategies.push('Ensure current terrain awareness and warning systems');
    strategies.push('Review minimum safe altitudes and escape procedures');
  }
  
  if (assessment.factors.trafficDensity > 70) {
    strategies.push('Enhance traffic awareness and collision avoidance procedures');
    strategies.push('Consider additional ATC coordination');
  }
  
  return strategies;
}

export default router;