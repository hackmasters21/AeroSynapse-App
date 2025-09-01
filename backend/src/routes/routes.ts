import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { optionalAuth } from '../middleware/auth';
import { logger } from '../utils/logger';
import { validateInput, createHttpError } from '../middleware/errorHandler';
import Joi from 'joi';

const router = Router();

// Esquemas de validación
const routeCalculationSchema = Joi.object({
  origin: Joi.string().length(4).uppercase().required(), // ICAO code
  destination: Joi.string().length(4).uppercase().required(),
  cruiseAltitude: Joi.number().min(1000).max(60000).default(35000),
  routeType: Joi.string().valid('direct', 'airways', 'custom').default('airways'),
  aircraftType: Joi.string().max(10).optional(),
  preferences: Joi.object({
    avoidWeather: Joi.boolean().default(true),
    avoidRestricted: Joi.boolean().default(true),
    minimizeFuel: Joi.boolean().default(false),
    minimizeTime: Joi.boolean().default(true)
  }).optional()
});

const waypointSchema = Joi.object({
  name: Joi.string().max(10).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  type: Joi.string().valid('airport', 'vor', 'dme', 'ndb', 'intersection', 'gps').required()
});

// Datos simulados de aeropuertos
const AIRPORTS = {
  'LEMD': {
    icao: 'LEMD',
    iata: 'MAD',
    name: 'Madrid-Barajas Airport',
    city: 'Madrid',
    country: 'Spain',
    latitude: 40.4719,
    longitude: -3.5626,
    elevation: 2001
  },
  'LEBL': {
    icao: 'LEBL',
    iata: 'BCN',
    name: 'Barcelona-El Prat Airport',
    city: 'Barcelona',
    country: 'Spain',
    latitude: 41.2971,
    longitude: 2.0833,
    elevation: 12
  },
  'EGLL': {
    icao: 'EGLL',
    iata: 'LHR',
    name: 'London Heathrow Airport',
    city: 'London',
    country: 'United Kingdom',
    latitude: 51.4700,
    longitude: -0.4543,
    elevation: 83
  },
  'LFPG': {
    icao: 'LFPG',
    iata: 'CDG',
    name: 'Charles de Gaulle Airport',
    city: 'Paris',
    country: 'France',
    latitude: 49.0097,
    longitude: 2.5479,
    elevation: 392
  },
  'EDDF': {
    icao: 'EDDF',
    iata: 'FRA',
    name: 'Frankfurt Airport',
    city: 'Frankfurt',
    country: 'Germany',
    latitude: 50.0264,
    longitude: 8.5431,
    elevation: 364
  }
};

// Datos simulados de waypoints
const WAYPOINTS = {
  'MAD': {
    name: 'MAD',
    type: 'vor',
    latitude: 40.4719,
    longitude: -3.5626,
    frequency: 116.2
  },
  'BCN': {
    name: 'BCN',
    type: 'vor',
    latitude: 41.2971,
    longitude: 2.0833,
    frequency: 115.1
  },
  'MABAX': {
    name: 'MABAX',
    type: 'intersection',
    latitude: 40.8,
    longitude: -1.5
  }
};

/**
 * @route POST /api/routes/calculate
 * @desc Calcular rutas entre dos aeropuertos
 * @access Public
 */
router.post('/calculate', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  // Validar entrada
  validateInput(routeCalculationSchema, req.body);
  
  const { origin, destination, cruiseAltitude, routeType, aircraftType, preferences } = req.body;
  
  try {
    // Verificar que los aeropuertos existen
    const originAirport = AIRPORTS[origin as keyof typeof AIRPORTS];
    const destinationAirport = AIRPORTS[destination as keyof typeof AIRPORTS];
    
    if (!originAirport) {
      throw createHttpError.badRequest(`Aeropuerto de origen ${origin} no encontrado`);
    }
    
    if (!destinationAirport) {
      throw createHttpError.badRequest(`Aeropuerto de destino ${destination} no encontrado`);
    }
    
    // Calcular rutas
    const routes = await calculateRoutes(originAirport, destinationAirport, {
      cruiseAltitude,
      routeType,
      aircraftType,
      preferences
    });
    
    res.json({
      success: true,
      data: {
        routes,
        origin: originAirport,
        destination: destinationAirport,
        parameters: {
          cruiseAltitude,
          routeType,
          aircraftType,
          preferences
        },
        calculatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Error calculando rutas:', error);
    throw error;
  }
}));

/**
 * @route GET /api/routes/airports
 * @desc Obtener lista de aeropuertos disponibles
 * @access Public
 */
router.get('/airports', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { search } = req.query;
  
  let airports = Object.values(AIRPORTS);
  
  // Filtrar por búsqueda si se proporciona
  if (search && typeof search === 'string') {
    const searchTerm = search.toLowerCase();
    airports = airports.filter(airport => 
      airport.icao.toLowerCase().includes(searchTerm) ||
      airport.iata?.toLowerCase().includes(searchTerm) ||
      airport.name.toLowerCase().includes(searchTerm) ||
      airport.city.toLowerCase().includes(searchTerm)
    );
  }
  
  res.json({
    success: true,
    data: airports
  });
}));

/**
 * @route GET /api/routes/airports/:icao
 * @desc Obtener información de un aeropuerto específico
 * @access Public
 */
router.get('/airports/:icao', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { icao } = req.params;
  
  // Validar ICAO
  if (!/^[A-Z]{4}$/.test(icao)) {
    throw createHttpError.badRequest('Código ICAO inválido');
  }
  
  const airport = AIRPORTS[icao as keyof typeof AIRPORTS];
  
  if (!airport) {
    throw createHttpError.notFound('Aeropuerto');
  }
  
  res.json({
    success: true,
    data: airport
  });
}));

/**
 * @route GET /api/routes/waypoints
 * @desc Obtener lista de waypoints disponibles
 * @access Public
 */
router.get('/waypoints', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { type, search } = req.query;
  
  let waypoints = Object.values(WAYPOINTS);
  
  // Filtrar por tipo
  if (type && typeof type === 'string') {
    waypoints = waypoints.filter(wp => wp.type === type);
  }
  
  // Filtrar por búsqueda
  if (search && typeof search === 'string') {
    const searchTerm = search.toLowerCase();
    waypoints = waypoints.filter(wp => 
      wp.name.toLowerCase().includes(searchTerm)
    );
  }
  
  res.json({
    success: true,
    data: waypoints
  });
}));

/**
 * @route POST /api/routes/validate
 * @desc Validar una ruta propuesta
 * @access Public
 */
router.post('/validate', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { waypoints } = req.body;
  
  if (!Array.isArray(waypoints) || waypoints.length < 2) {
    throw createHttpError.badRequest('Se requieren al menos 2 waypoints');
  }
  
  try {
    const validation = await validateRoute(waypoints);
    
    res.json({
      success: true,
      data: validation
    });
    
  } catch (error) {
    logger.error('Error validando ruta:', error);
    throw error;
  }
}));

/**
 * @route GET /api/routes/airways
 * @desc Obtener información de airways disponibles
 * @access Public
 */
router.get('/airways', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  // Datos simulados de airways
  const airways = [
    {
      name: 'UL620',
      type: 'upper',
      direction: 'bidirectional',
      minimumAltitude: 24500,
      maximumAltitude: 66000,
      waypoints: ['MAD', 'MABAX', 'BCN']
    },
    {
      name: 'UN10',
      type: 'upper',
      direction: 'eastbound',
      minimumAltitude: 24500,
      maximumAltitude: 66000,
      waypoints: ['LEMD', 'MABAX', 'LEBL']
    }
  ];
  
  res.json({
    success: true,
    data: airways
  });
}));

// Funciones auxiliares

async function calculateRoutes(origin: any, destination: any, options: any) {
  const routes = [];
  
  // Calcular distancia directa
  const directDistance = calculateDistance(
    origin.latitude, origin.longitude,
    destination.latitude, destination.longitude
  );
  
  // Ruta directa
  if (options.routeType === 'direct' || options.routeType === 'airways') {
    routes.push({
      id: 'direct',
      name: 'Ruta Directa',
      type: 'direct',
      waypoints: [],
      airways: [],
      distance: Math.round(directDistance),
      estimatedTime: Math.round(directDistance / 450 * 60), // Asumiendo 450 kt
      estimatedFuel: Math.round(directDistance * 6), // Aproximado
      altitude: options.cruiseAltitude,
      description: `${origin.icao} DCT ${destination.icao}`
    });
  }
  
  // Ruta por airways
  if (options.routeType === 'airways' || options.routeType === 'custom') {
    const airwayRoute = calculateAirwayRoute(origin, destination, options);
    if (airwayRoute) {
      routes.push(airwayRoute);
    }
  }
  
  return routes;
}

function calculateAirwayRoute(origin: any, destination: any, options: any) {
  // Simulación de cálculo de ruta por airways
  const waypoints = [];
  
  // Agregar waypoints intermedios si es necesario
  if (origin.icao === 'LEMD' && destination.icao === 'LEBL') {
    waypoints.push(WAYPOINTS.MABAX);
  }
  
  const totalDistance = calculateRouteDistance([origin, ...waypoints, destination]);
  
  return {
    id: 'airways',
    name: 'Ruta por Airways',
    type: 'airways',
    waypoints,
    airways: ['UL620'],
    distance: Math.round(totalDistance),
    estimatedTime: Math.round(totalDistance / 420 * 60), // Ligeramente más lento
    estimatedFuel: Math.round(totalDistance * 6.5),
    altitude: options.cruiseAltitude,
    description: `${origin.icao} UL620 ${waypoints.map(wp => wp.name).join(' ')} ${destination.icao}`
  };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Radio de la Tierra en millas náuticas
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateRouteDistance(points: any[]): number {
  let totalDistance = 0;
  
  for (let i = 0; i < points.length - 1; i++) {
    totalDistance += calculateDistance(
      points[i].latitude, points[i].longitude,
      points[i + 1].latitude, points[i + 1].longitude
    );
  }
  
  return totalDistance;
}

async function validateRoute(waypoints: any[]) {
  const validation = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[],
    totalDistance: 0,
    estimatedTime: 0
  };
  
  // Validar cada waypoint
  for (let i = 0; i < waypoints.length; i++) {
    const wp = waypoints[i];
    
    if (!wp.latitude || !wp.longitude) {
      validation.errors.push(`Waypoint ${i + 1}: Coordenadas inválidas`);
      validation.isValid = false;
    }
    
    if (wp.latitude < -90 || wp.latitude > 90) {
      validation.errors.push(`Waypoint ${i + 1}: Latitud fuera de rango`);
      validation.isValid = false;
    }
    
    if (wp.longitude < -180 || wp.longitude > 180) {
      validation.errors.push(`Waypoint ${i + 1}: Longitud fuera de rango`);
      validation.isValid = false;
    }
  }
  
  // Calcular distancia total si es válida
  if (validation.isValid) {
    validation.totalDistance = calculateRouteDistance(waypoints);
    validation.estimatedTime = Math.round(validation.totalDistance / 450 * 60);
    
    // Advertencias
    if (validation.totalDistance > 3000) {
      validation.warnings.push('Ruta muy larga (>3000 NM)');
    }
    
    if (waypoints.length > 20) {
      validation.warnings.push('Muchos waypoints (>20)');
    }
  }
  
  return validation;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export default router;