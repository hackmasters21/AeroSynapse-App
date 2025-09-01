import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { optionalAuth } from '../middleware/auth';
import { WeatherService } from '../services/weatherService';
import { logger } from '../utils/logger';
import { validateInput, createHttpError } from '../middleware/errorHandler';
import Joi from 'joi';

const router = Router();

// Instancia del servicio meteorológico
let weatherService: WeatherService;

// Función para inyectar el servicio
export const setWeatherService = (service: WeatherService) => {
  weatherService = service;
};

// Esquemas de validación
const stationSchema = Joi.object({
  station: Joi.string().length(4).uppercase().required()
});

const boundsSchema = Joi.object({
  north: Joi.number().min(-90).max(90).required(),
  south: Joi.number().min(-90).max(90).required(),
  east: Joi.number().min(-180).max(180).required(),
  west: Joi.number().min(-180).max(180).required()
});

const flightLevelSchema = Joi.object({
  flightLevel: Joi.number().min(10).max(600).required(),
  bounds: boundsSchema.required()
});

const satelliteSchema = Joi.object({
  type: Joi.string().valid('visible', 'infrared', 'water_vapor').required(),
  bounds: boundsSchema.required()
});

/**
 * @route GET /api/weather/metar/:station
 * @desc Obtener METAR de una estación específica
 * @access Public
 */
router.get('/metar/:station', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { station } = req.params;
  
  // Validar código de estación
  if (!/^[A-Z]{4}$/.test(station)) {
    throw createHttpError.badRequest('Código de estación ICAO inválido');
  }
  
  try {
    const metar = await weatherService.getMetar(station);
    
    if (!metar) {
      throw createHttpError.notFound(`METAR para estación ${station}`);
    }
    
    res.json({
      success: true,
      data: metar,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`Error obteniendo METAR para ${station}:`, error);
    throw error;
  }
}));

/**
 * @route GET /api/weather/taf/:station
 * @desc Obtener TAF de una estación específica
 * @access Public
 */
router.get('/taf/:station', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { station } = req.params;
  
  // Validar código de estación
  if (!/^[A-Z]{4}$/.test(station)) {
    throw createHttpError.badRequest('Código de estación ICAO inválido');
  }
  
  try {
    const taf = await weatherService.getTaf(station);
    
    if (!taf) {
      throw createHttpError.notFound(`TAF para estación ${station}`);
    }
    
    res.json({
      success: true,
      data: taf,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`Error obteniendo TAF para ${station}:`, error);
    throw error;
  }
}));

/**
 * @route GET /api/weather/sigmets
 * @desc Obtener SIGMETs/AIRMETs activos
 * @access Public
 */
router.get('/sigmets', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { fir } = req.query;
  
  try {
    const sigmets = await weatherService.getSigmets(fir as string);
    
    res.json({
      success: true,
      data: {
        sigmets,
        count: sigmets.length,
        fir: fir || 'global'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error obteniendo SIGMETs:', error);
    throw error;
  }
}));

/**
 * @route POST /api/weather/radar
 * @desc Obtener datos de radar para un área específica
 * @access Public
 */
router.post('/radar', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  // Validar bounds
  validateInput(boundsSchema, req.body);
  
  const bounds = req.body;
  
  try {
    const radarData = await weatherService.getRadarData(bounds);
    
    res.json({
      success: true,
      data: {
        radar: radarData,
        bounds,
        count: radarData.length
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error obteniendo datos de radar:', error);
    throw error;
  }
}));

/**
 * @route POST /api/weather/satellite
 * @desc Obtener datos satelitales para un área específica
 * @access Public
 */
router.post('/satellite', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  // Validar entrada
  validateInput(satelliteSchema, req.body);
  
  const { type, bounds } = req.body;
  
  try {
    const satelliteData = await weatherService.getSatelliteData(type, bounds);
    
    if (!satelliteData) {
      throw createHttpError.notFound('Datos satelitales');
    }
    
    res.json({
      success: true,
      data: satelliteData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error obteniendo datos satelitales:', error);
    throw error;
  }
}));

/**
 * @route POST /api/weather/winds-aloft
 * @desc Obtener vientos en altura para un nivel de vuelo específico
 * @access Public
 */
router.post('/winds-aloft', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  // Validar entrada
  validateInput(flightLevelSchema, req.body);
  
  const { flightLevel, bounds } = req.body;
  
  try {
    const windsData = await weatherService.getWindsAloft(flightLevel, bounds);
    
    if (!windsData) {
      throw createHttpError.notFound('Datos de vientos en altura');
    }
    
    res.json({
      success: true,
      data: windsData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error obteniendo vientos en altura:', error);
    throw error;
  }
}));

/**
 * @route GET /api/weather/confidence/:station
 * @desc Obtener índice de confianza meteorológica para una estación
 * @access Public
 */
router.get('/confidence/:station', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { station } = req.params;
  
  // Validar código de estación
  if (!/^[A-Z]{4}$/.test(station)) {
    throw createHttpError.badRequest('Código de estación ICAO inválido');
  }
  
  try {
    const confidence = await weatherService.calculateWeatherConfidence(station);
    
    res.json({
      success: true,
      data: {
        station,
        confidence,
        interpretation: {
          level: confidence.overall >= 80 ? 'high' : confidence.overall >= 60 ? 'medium' : 'low',
          description: getConfidenceDescription(confidence.overall),
          recommendation: getConfidenceRecommendation(confidence.overall)
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`Error calculando confianza para ${station}:`, error);
    throw error;
  }
}));

/**
 * @route GET /api/weather/sources
 * @desc Obtener información sobre las fuentes meteorológicas disponibles
 * @access Public
 */
router.get('/sources', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = weatherService.getServiceStats();
    
    res.json({
      success: true,
      data: {
        sources: stats.sources.map(source => ({
          id: source.id,
          name: source.name,
          type: source.type,
          status: source.status,
          reliability: Math.round(source.reliability * 100),
          lastUpdate: source.lastUpdate
        })),
        summary: {
          total: stats.sources.length,
          active: stats.sources.filter(s => s.status === 'active').length,
          avgReliability: Math.round(
            stats.sources.reduce((sum, s) => sum + s.reliability, 0) / stats.sources.length * 100
          )
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error obteniendo fuentes meteorológicas:', error);
    throw error;
  }
}));

/**
 * @route GET /api/weather/stats
 * @desc Obtener estadísticas del servicio meteorológico
 * @access Public
 */
router.get('/stats', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = weatherService.getServiceStats();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error obteniendo estadísticas meteorológicas:', error);
    throw error;
  }
}));

/**
 * @route POST /api/weather/comprehensive
 * @desc Obtener datos meteorológicos completos para una estación
 * @access Public
 */
router.post('/comprehensive', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { station, includeSatellite = false, includeRadar = false, bounds } = req.body;
  
  if (!station || !/^[A-Z]{4}$/.test(station)) {
    throw createHttpError.badRequest('Código de estación ICAO requerido y válido');
  }
  
  try {
    // Obtener datos básicos
    const [metar, taf, sigmets, confidence] = await Promise.all([
      weatherService.getMetar(station),
      weatherService.getTaf(station),
      weatherService.getSigmets(),
      weatherService.calculateWeatherConfidence(station)
    ]);
    
    const result: any = {
      station,
      metar,
      taf,
      sigmets,
      confidence,
      timestamp: new Date().toISOString()
    };
    
    // Agregar datos opcionales si se solicitan
    if (includeSatellite && bounds) {
      const [visible, infrared, waterVapor] = await Promise.all([
        weatherService.getSatelliteData('visible', bounds),
        weatherService.getSatelliteData('infrared', bounds),
        weatherService.getSatelliteData('water_vapor', bounds)
      ]);
      
      result.satellite = { visible, infrared, waterVapor };
    }
    
    if (includeRadar && bounds) {
      result.radar = await weatherService.getRadarData(bounds);
    }
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    logger.error(`Error obteniendo datos completos para ${station}:`, error);
    throw error;
  }
}));

/**
 * @route GET /api/weather/disclaimer
 * @desc Obtener disclaimer legal sobre el uso de datos meteorológicos
 * @access Public
 */
router.get('/disclaimer', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { lang = 'en' } = req.query;
  
  const disclaimers = {
    en: "INFORMATION FOR PLANNING PURPOSES. WEATHER IS DYNAMIC AND UNCERTAIN. CONSULT OFFICIAL REPORTS (ATIS, ASOS, VOLMET) AND CONTACT AIR TRAFFIC CONTROL (ATC) FOR REAL-TIME INFORMATION DURING FLIGHT.",
    es: "INFORMACIÓN PARA PLANIFICACIÓN. LA METEOROLOGÍA ES DINÁMICA E INCIERTA. CONSULTE LOS REPORTES OFICIALES (ATIS, ASOS, VOLMET) Y CONTACTE AL CONTROL DE TRÁFICO AÉREO (ATC) PARA INFORMACIÓN EN TIEMPO REAL DURANTE EL VUELO.",
    pt: "INFORMAÇÃO PARA PLANEJAMENTO. A METEOROLOGIA É DINÂMICA E INCERTA. CONSULTE OS RELATÓRIOS OFICIAIS (ATIS, ASOS, VOLMET) E CONTATE O CONTROLE DE TRÁFEGO AÉREO (ATC) PARA INFORMAÇÕES EM TEMPO REAL DURANTE O VOO.",
    fr: "INFORMATION POUR LA PLANIFICATION. LA MÉTÉOROLOGIE EST DYNAMIQUE ET INCERTAINE. CONSULTEZ LES RAPPORTS OFFICIELS (ATIS, ASOS, VOLMET) ET CONTACTEZ LE CONTRÔLE DU TRAFIC AÉRIEN (ATC) POUR DES INFORMATIONS EN TEMPS RÉEL PENDANT LE VOL."
  };
  
  res.json({
    success: true,
    data: {
      disclaimer: disclaimers[lang as keyof typeof disclaimers] || disclaimers.en,
      language: lang,
      importance: 'CRITICAL',
      mustDisplay: true
    }
  });
}));

// Funciones auxiliares

function getConfidenceDescription(confidence: number): string {
  if (confidence >= 80) {
    return 'High confidence - Multiple sources agree, recent data available';
  } else if (confidence >= 60) {
    return 'Medium confidence - Some uncertainty in data or limited sources';
  } else {
    return 'Low confidence - Significant uncertainty, use with caution';
  }
}

function getConfidenceRecommendation(confidence: number): string {
  if (confidence >= 80) {
    return 'Data suitable for flight planning with normal precautions';
  } else if (confidence >= 60) {
    return 'Verify with additional sources before critical decisions';
  } else {
    return 'Seek alternative sources and exercise extreme caution';
  }
}

export default router;