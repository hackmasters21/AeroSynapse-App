import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { optionalAuth } from '../middleware/auth';
import { AircraftService } from '../services/aircraftService';
import { logger } from '../utils/logger';
import { validateInput, createHttpError } from '../middleware/errorHandler';
import Joi from 'joi';

const router = Router();

// Instancia del servicio de aeronaves (se inyectará desde el servidor principal)
let aircraftService: AircraftService;

// Función para inyectar el servicio
export const setAircraftService = (service: AircraftService) => {
  aircraftService = service;
};

// Esquemas de validación
const boundsSchema = Joi.object({
  north: Joi.number().min(-90).max(90).required(),
  south: Joi.number().min(-90).max(90).required(),
  east: Joi.number().min(-180).max(180).required(),
  west: Joi.number().min(-180).max(180).required()
}).custom((value, helpers) => {
  if (value.north <= value.south) {
    return helpers.error('bounds.invalid', { message: 'North must be greater than south' });
  }
  return value;
});

const nearbySchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  radius: Joi.number().min(0.1).max(500).default(50) // máximo 500 NM
});

const filterSchema = Joi.object({
  altitudeMin: Joi.number().min(0).max(60000).optional(),
  altitudeMax: Joi.number().min(0).max(60000).optional(),
  onGround: Joi.boolean().optional(),
  emergency: Joi.boolean().optional(),
  aircraftType: Joi.string().max(10).optional(),
  airline: Joi.string().max(50).optional(),
  callsign: Joi.string().max(8).optional(),
  limit: Joi.number().min(1).max(1000).default(100)
});

/**
 * @route GET /api/aircraft
 * @desc Obtener todas las aeronaves activas
 * @access Public
 */
router.get('/', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    // Validar filtros
    const filters = req.query;
    validateInput(filterSchema, filters);
    
    // Obtener aeronaves del servicio
    const aircraft = await aircraftService.getActiveAircraft();
    
    // Aplicar filtros
    let filteredAircraft = aircraft;
    
    if (filters.altitudeMin) {
      filteredAircraft = filteredAircraft.filter(ac => ac.altitude >= Number(filters.altitudeMin));
    }
    
    if (filters.altitudeMax) {
      filteredAircraft = filteredAircraft.filter(ac => ac.altitude <= Number(filters.altitudeMax));
    }
    
    if (filters.onGround !== undefined) {
      const onGround = filters.onGround === 'true';
      filteredAircraft = filteredAircraft.filter(ac => ac.onGround === onGround);
    }
    
    if (filters.emergency !== undefined) {
      const emergency = filters.emergency === 'true';
      filteredAircraft = filteredAircraft.filter(ac => {
        const hasEmergency = ac.emergencyStatus && ac.emergencyStatus !== 'none';
        return emergency ? hasEmergency : !hasEmergency;
      });
    }
    
    if (filters.aircraftType) {
      filteredAircraft = filteredAircraft.filter(ac => 
        ac.aircraftType?.toLowerCase().includes(String(filters.aircraftType).toLowerCase())
      );
    }
    
    if (filters.airline) {
      filteredAircraft = filteredAircraft.filter(ac => 
        ac.airline?.toLowerCase().includes(String(filters.airline).toLowerCase())
      );
    }
    
    if (filters.callsign) {
      filteredAircraft = filteredAircraft.filter(ac => 
        ac.callsign?.toLowerCase().includes(String(filters.callsign).toLowerCase())
      );
    }
    
    // Aplicar límite
    const limit = Number(filters.limit) || 100;
    filteredAircraft = filteredAircraft.slice(0, limit);
    
    res.json({
      success: true,
      data: {
        aircraft: filteredAircraft,
        total: filteredAircraft.length,
        filters: filters,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Error obteniendo aeronaves:', error);
    throw error;
  }
}));

/**
 * @route GET /api/aircraft/:icao24
 * @desc Obtener información de una aeronave específica
 * @access Public
 */
router.get('/:icao24', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { icao24 } = req.params;
  
  // Validar ICAO24
  if (!/^[0-9A-Fa-f]{6}$/.test(icao24)) {
    throw createHttpError.badRequest('ICAO24 inválido');
  }
  
  try {
    const aircraft = await aircraftService.getActiveAircraft();
    const targetAircraft = aircraft.find(ac => ac.icao24.toLowerCase() === icao24.toLowerCase());
    
    if (!targetAircraft) {
      throw createHttpError.notFound('Aeronave');
    }
    
    res.json({
      success: true,
      data: targetAircraft
    });
    
  } catch (error) {
    logger.error(`Error obteniendo aeronave ${icao24}:`, error);
    throw error;
  }
}));

/**
 * @route POST /api/aircraft/bounds
 * @desc Obtener aeronaves en un área geográfica específica
 * @access Public
 */
router.post('/bounds', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  // Validar bounds
  validateInput(boundsSchema, req.body);
  
  const bounds = req.body;
  
  try {
    const aircraft = await aircraftService.getAircraftInBounds(bounds);
    
    res.json({
      success: true,
      data: {
        aircraft,
        bounds,
        count: aircraft.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Error obteniendo aeronaves en área:', error);
    throw error;
  }
}));

/**
 * @route POST /api/aircraft/nearby
 * @desc Buscar aeronaves cercanas a una posición
 * @access Public
 */
router.post('/nearby', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  // Validar parámetros
  validateInput(nearbySchema, req.body);
  
  const { latitude, longitude, radius } = req.body;
  
  try {
    const aircraft = await aircraftService.findNearbyAircraft(latitude, longitude, radius);
    
    res.json({
      success: true,
      data: {
        aircraft,
        center: { latitude, longitude },
        radius,
        count: aircraft.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Error buscando aeronaves cercanas:', error);
    throw error;
  }
}));

/**
 * @route GET /api/aircraft/stats
 * @desc Obtener estadísticas de aeronaves
 * @access Public
 */
router.get('/stats', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const aircraft = await aircraftService.getActiveAircraft();
    
    // Calcular estadísticas
    const stats = {
      total: aircraft.length,
      inFlight: aircraft.filter(ac => !ac.onGround).length,
      onGround: aircraft.filter(ac => ac.onGround).length,
      emergency: aircraft.filter(ac => ac.emergencyStatus && ac.emergencyStatus !== 'none').length,
      byAltitude: {
        low: aircraft.filter(ac => ac.altitude < 10000).length,
        medium: aircraft.filter(ac => ac.altitude >= 10000 && ac.altitude < 30000).length,
        high: aircraft.filter(ac => ac.altitude >= 30000).length
      },
      byType: getAircraftByType(aircraft),
      byAirline: getAircraftByAirline(aircraft),
      averageAltitude: calculateAverageAltitude(aircraft),
      averageSpeed: calculateAverageSpeed(aircraft)
    };
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error obteniendo estadísticas:', error);
    throw error;
  }
}));

/**
 * @route GET /api/aircraft/service/status
 * @desc Obtener estado del servicio de aeronaves
 * @access Public
 */
router.get('/service/status', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const status = aircraftService.getServiceStatus();
    
    res.json({
      success: true,
      data: status
    });
    
  } catch (error) {
    logger.error('Error obteniendo estado del servicio:', error);
    throw error;
  }
}));

/**
 * @route GET /api/aircraft/types
 * @desc Obtener lista de tipos de aeronaves disponibles
 * @access Public
 */
router.get('/types', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const aircraft = await aircraftService.getActiveAircraft();
    const types = [...new Set(aircraft.map(ac => ac.aircraftType).filter(Boolean))].sort();
    
    res.json({
      success: true,
      data: types
    });
    
  } catch (error) {
    logger.error('Error obteniendo tipos de aeronaves:', error);
    throw error;
  }
}));

/**
 * @route GET /api/aircraft/airlines
 * @desc Obtener lista de aerolíneas disponibles
 * @access Public
 */
router.get('/airlines', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const aircraft = await aircraftService.getActiveAircraft();
    const airlines = [...new Set(aircraft.map(ac => ac.airline).filter(Boolean))].sort();
    
    res.json({
      success: true,
      data: airlines
    });
    
  } catch (error) {
    logger.error('Error obteniendo aerolíneas:', error);
    throw error;
  }
}));

// Funciones auxiliares

function getAircraftByType(aircraft: any[]): Record<string, number> {
  const types: Record<string, number> = {};
  
  for (const ac of aircraft) {
    if (ac.aircraftType) {
      types[ac.aircraftType] = (types[ac.aircraftType] || 0) + 1;
    }
  }
  
  return Object.fromEntries(
    Object.entries(types).sort(([,a], [,b]) => b - a).slice(0, 10)
  );
}

function getAircraftByAirline(aircraft: any[]): Record<string, number> {
  const airlines: Record<string, number> = {};
  
  for (const ac of aircraft) {
    if (ac.airline) {
      airlines[ac.airline] = (airlines[ac.airline] || 0) + 1;
    }
  }
  
  return Object.fromEntries(
    Object.entries(airlines).sort(([,a], [,b]) => b - a).slice(0, 10)
  );
}

function calculateAverageAltitude(aircraft: any[]): number {
  const inFlight = aircraft.filter(ac => !ac.onGround && ac.altitude > 0);
  if (inFlight.length === 0) return 0;
  
  const total = inFlight.reduce((sum, ac) => sum + ac.altitude, 0);
  return Math.round(total / inFlight.length);
}

function calculateAverageSpeed(aircraft: any[]): number {
  const inFlight = aircraft.filter(ac => !ac.onGround && ac.velocity > 0);
  if (inFlight.length === 0) return 0;
  
  const total = inFlight.reduce((sum, ac) => sum + ac.velocity, 0);
  return Math.round(total / inFlight.length);
}

export default router;