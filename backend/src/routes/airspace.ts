import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { optionalAuth } from '../middleware/auth';
import { logger } from '../utils/logger';
import { validateInput, createHttpError } from '../middleware/errorHandler';
import Joi from 'joi';

const router = Router();

// Esquemas de validación
const boundsSchema = Joi.object({
  north: Joi.number().min(-90).max(90).required(),
  south: Joi.number().min(-90).max(90).required(),
  east: Joi.number().min(-180).max(180).required(),
  west: Joi.number().min(-180).max(180).required()
});

const pointSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  altitude: Joi.number().min(0).max(60000).optional()
});

// Datos simulados de espacios aéreos
const AIRSPACES = [
  {
    id: 'fir-madrid',
    name: 'FIR Madrid',
    type: 'controlled',
    class: 'A',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-6.0, 39.0],
        [-1.0, 39.0],
        [-1.0, 43.0],
        [-6.0, 43.0],
        [-6.0, 39.0]
      ]]
    },
    minimumAltitude: 0,
    maximumAltitude: 66000,
    active: true,
    frequency: 119.7,
    description: 'Región de Información de Vuelo de Madrid'
  },
  {
    id: 'ctr-madrid',
    name: 'CTR Madrid',
    type: 'controlled',
    class: 'D',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-3.9, 40.2],
        [-3.5, 40.2],
        [-3.5, 40.6],
        [-3.9, 40.6],
        [-3.9, 40.2]
      ]]
    },
    minimumAltitude: 0,
    maximumAltitude: 9500,
    active: true,
    frequency: 118.9,
    description: 'Zona de Control de Madrid'
  },
  {
    id: 'tma-madrid',
    name: 'TMA Madrid',
    type: 'controlled',
    class: 'C',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-4.2, 39.9],
        [-3.2, 39.9],
        [-3.2, 40.9],
        [-4.2, 40.9],
        [-4.2, 39.9]
      ]]
    },
    minimumAltitude: 9500,
    maximumAltitude: 24500,
    active: true,
    frequency: 120.8,
    description: 'Área Terminal de Madrid'
  },
  {
    id: 'restricted-r1',
    name: 'Zona Restringida R-1',
    type: 'restricted',
    class: 'G',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-3.8, 40.3],
        [-3.7, 40.3],
        [-3.7, 40.4],
        [-3.8, 40.4],
        [-3.8, 40.3]
      ]]
    },
    minimumAltitude: 0,
    maximumAltitude: 5000,
    active: true,
    restrictions: ['Prohibido vuelo civil', 'Zona militar'],
    description: 'Zona restringida para actividades militares'
  },
  {
    id: 'danger-d1',
    name: 'Zona Peligrosa D-1',
    type: 'danger',
    class: 'G',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-3.6, 40.5],
        [-3.5, 40.5],
        [-3.5, 40.6],
        [-3.6, 40.6],
        [-3.6, 40.5]
      ]]
    },
    minimumAltitude: 0,
    maximumAltitude: 3000,
    active: true,
    restrictions: ['Actividad de tiro', 'Horario: 08:00-18:00 UTC'],
    description: 'Zona peligrosa por actividades de tiro'
  },
  {
    id: 'prohibited-p1',
    name: 'Zona Prohibida P-1',
    type: 'prohibited',
    class: 'G',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-3.75, 40.45],
        [-3.70, 40.45],
        [-3.70, 40.50],
        [-3.75, 40.50],
        [-3.75, 40.45]
      ]]
    },
    minimumAltitude: 0,
    maximumAltitude: 60000,
    active: true,
    restrictions: ['Prohibido todo tipo de vuelo', 'Zona de seguridad nacional'],
    description: 'Zona prohibida permanente'
  }
];

// Datos simulados de radioayudas
const NAVAIDS = [
  {
    id: 'mad-vor',
    name: 'Madrid VOR',
    type: 'vor',
    identifier: 'MAD',
    frequency: 116.2,
    latitude: 40.4719,
    longitude: -3.5626,
    elevation: 2001,
    range: 200,
    magnetic_variation: 1.5,
    description: 'VOR de Madrid-Barajas'
  },
  {
    id: 'bcn-vor',
    name: 'Barcelona VOR',
    type: 'vor',
    identifier: 'BCN',
    frequency: 115.1,
    latitude: 41.2971,
    longitude: 2.0833,
    elevation: 12,
    range: 200,
    magnetic_variation: 2.1,
    description: 'VOR de Barcelona'
  },
  {
    id: 'mad-dme',
    name: 'Madrid DME',
    type: 'dme',
    identifier: 'MAD',
    frequency: 116.2,
    latitude: 40.4719,
    longitude: -3.5626,
    elevation: 2001,
    range: 200,
    description: 'DME de Madrid-Barajas'
  },
  {
    id: 'tol-ndb',
    name: 'Toledo NDB',
    type: 'ndb',
    identifier: 'TOL',
    frequency: 385.0,
    latitude: 39.8628,
    longitude: -4.0228,
    elevation: 515,
    range: 50,
    description: 'NDB de Toledo'
  }
];

/**
 * @route GET /api/airspace
 * @desc Obtener todos los espacios aéreos
 * @access Public
 */
router.get('/', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { type, class: airspaceClass, active } = req.query;
  
  let airspaces = [...AIRSPACES];
  
  // Filtrar por tipo
  if (type && typeof type === 'string') {
    airspaces = airspaces.filter(airspace => airspace.type === type);
  }
  
  // Filtrar por clase
  if (airspaceClass && typeof airspaceClass === 'string') {
    airspaces = airspaces.filter(airspace => airspace.class === airspaceClass);
  }
  
  // Filtrar por estado activo
  if (active !== undefined) {
    const isActive = active === 'true';
    airspaces = airspaces.filter(airspace => airspace.active === isActive);
  }
  
  res.json({
    success: true,
    data: {
      airspaces,
      count: airspaces.length,
      filters: { type, class: airspaceClass, active }
    }
  });
}));

/**
 * @route POST /api/airspace/bounds
 * @desc Obtener espacios aéreos en un área específica
 * @access Public
 */
router.post('/bounds', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  // Validar bounds
  validateInput(boundsSchema, req.body);
  
  const bounds = req.body;
  
  try {
    // Filtrar espacios aéreos que intersectan con el área
    const airspacesInBounds = AIRSPACES.filter(airspace => {
      return intersectsWithBounds(airspace.geometry, bounds);
    });
    
    res.json({
      success: true,
      data: {
        airspaces: airspacesInBounds,
        bounds,
        count: airspacesInBounds.length
      }
    });
    
  } catch (error) {
    logger.error('Error obteniendo espacios aéreos en área:', error);
    throw error;
  }
}));

/**
 * @route POST /api/airspace/point
 * @desc Verificar qué espacios aéreos contienen un punto específico
 * @access Public
 */
router.post('/point', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  // Validar punto
  validateInput(pointSchema, req.body);
  
  const { latitude, longitude, altitude } = req.body;
  
  try {
    // Encontrar espacios aéreos que contienen el punto
    const containingAirspaces = AIRSPACES.filter(airspace => {
      const withinHorizontal = pointInPolygon(
        [longitude, latitude],
        airspace.geometry.coordinates[0]
      );
      
      const withinVertical = altitude === undefined || (
        altitude >= airspace.minimumAltitude &&
        altitude <= airspace.maximumAltitude
      );
      
      return withinHorizontal && withinVertical;
    });
    
    res.json({
      success: true,
      data: {
        point: { latitude, longitude, altitude },
        airspaces: containingAirspaces,
        count: containingAirspaces.length
      }
    });
    
  } catch (error) {
    logger.error('Error verificando punto en espacios aéreos:', error);
    throw error;
  }
}));

/**
 * @route GET /api/airspace/:id
 * @desc Obtener información detallada de un espacio aéreo
 * @access Public
 */
router.get('/:id', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const airspace = AIRSPACES.find(as => as.id === id);
  
  if (!airspace) {
    throw createHttpError.notFound('Espacio aéreo');
  }
  
  res.json({
    success: true,
    data: airspace
  });
}));

/**
 * @route GET /api/airspace/navaids
 * @desc Obtener radioayudas a la navegación
 * @access Public
 */
router.get('/navaids', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { type, identifier } = req.query;
  
  let navaids = [...NAVAIDS];
  
  // Filtrar por tipo
  if (type && typeof type === 'string') {
    navaids = navaids.filter(navaid => navaid.type === type);
  }
  
  // Filtrar por identificador
  if (identifier && typeof identifier === 'string') {
    navaids = navaids.filter(navaid => 
      navaid.identifier.toLowerCase().includes(identifier.toLowerCase())
    );
  }
  
  res.json({
    success: true,
    data: {
      navaids,
      count: navaids.length,
      filters: { type, identifier }
    }
  });
}));

/**
 * @route POST /api/airspace/navaids/nearby
 * @desc Buscar radioayudas cercanas a una posición
 * @access Public
 */
router.post('/navaids/nearby', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { latitude, longitude, radius = 100 } = req.body;
  
  if (!latitude || !longitude) {
    throw createHttpError.badRequest('Latitud y longitud requeridas');
  }
  
  try {
    const nearbyNavaids = NAVAIDS.filter(navaid => {
      const distance = calculateDistance(
        latitude, longitude,
        navaid.latitude, navaid.longitude
      );
      return distance <= radius;
    }).map(navaid => ({
      ...navaid,
      distance: calculateDistance(
        latitude, longitude,
        navaid.latitude, navaid.longitude
      )
    })).sort((a, b) => a.distance - b.distance);
    
    res.json({
      success: true,
      data: {
        navaids: nearbyNavaids,
        center: { latitude, longitude },
        radius,
        count: nearbyNavaids.length
      }
    });
    
  } catch (error) {
    logger.error('Error buscando radioayudas cercanas:', error);
    throw error;
  }
}));

/**
 * @route GET /api/airspace/types
 * @desc Obtener tipos de espacios aéreos disponibles
 * @access Public
 */
router.get('/types', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const types = [
    {
      type: 'controlled',
      name: 'Espacio Aéreo Controlado',
      description: 'Espacio aéreo donde se proporciona servicio de control de tránsito aéreo'
    },
    {
      type: 'uncontrolled',
      name: 'Espacio Aéreo No Controlado',
      description: 'Espacio aéreo donde no se proporciona servicio de control'
    },
    {
      type: 'restricted',
      name: 'Zona Restringida',
      description: 'Zona con restricciones de vuelo por razones de seguridad'
    },
    {
      type: 'prohibited',
      name: 'Zona Prohibida',
      description: 'Zona donde está prohibido el vuelo de aeronaves civiles'
    },
    {
      type: 'danger',
      name: 'Zona Peligrosa',
      description: 'Zona donde pueden existir actividades peligrosas para las aeronaves'
    },
    {
      type: 'military',
      name: 'Zona Militar',
      description: 'Zona reservada para operaciones militares'
    }
  ];
  
  res.json({
    success: true,
    data: types
  });
}));

/**
 * @route GET /api/airspace/classes
 * @desc Obtener clases de espacios aéreos
 * @access Public
 */
router.get('/classes', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const classes = [
    {
      class: 'A',
      name: 'Clase A',
      description: 'Solo vuelos IFR, separación proporcionada entre todas las aeronaves'
    },
    {
      class: 'B',
      name: 'Clase B',
      description: 'Vuelos IFR y VFR, separación proporcionada entre todas las aeronaves'
    },
    {
      class: 'C',
      name: 'Clase C',
      description: 'Vuelos IFR y VFR, separación IFR/IFR e IFR/VFR'
    },
    {
      class: 'D',
      name: 'Clase D',
      description: 'Vuelos IFR y VFR, separación solo IFR/IFR'
    },
    {
      class: 'E',
      name: 'Clase E',
      description: 'Vuelos IFR y VFR, separación solo IFR/IFR'
    },
    {
      class: 'G',
      name: 'Clase G',
      description: 'Vuelos IFR y VFR, sin separación proporcionada'
    }
  ];
  
  res.json({
    success: true,
    data: classes
  });
}));

// Funciones auxiliares

function intersectsWithBounds(geometry: any, bounds: any): boolean {
  // Simplificado: verificar si algún punto del polígono está dentro de los bounds
  const coordinates = geometry.coordinates[0];
  
  for (const [lng, lat] of coordinates) {
    if (lng >= bounds.west && lng <= bounds.east &&
        lat >= bounds.south && lat <= bounds.north) {
      return true;
    }
  }
  
  return false;
}

function pointInPolygon(point: number[], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
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

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export default router;