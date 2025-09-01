import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { optionalAuth } from '../middleware/auth';
import { AlertService } from '../services/alertService';
import { logger } from '../utils/logger';
import { validateInput, createHttpError } from '../middleware/errorHandler';
import Joi from 'joi';

const router = Router();

// Instancia del servicio de alertas (se inyectará desde el servidor principal)
let alertService: AlertService;

// Función para inyectar el servicio
export const setAlertService = (service: AlertService) => {
  alertService = service;
};

// Esquemas de validación
const alertFilterSchema = Joi.object({
  type: Joi.string().valid(
    'collision_warning',
    'proximity_alert',
    'altitude_deviation',
    'course_deviation',
    'weather_warning',
    'airspace_violation',
    'system_error',
    'data_loss',
    'emergency_squawk'
  ).optional(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  acknowledged: Joi.boolean().optional(),
  aircraftId: Joi.string().max(10).optional(),
  limit: Joi.number().min(1).max(1000).default(100),
  offset: Joi.number().min(0).default(0),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional()
});

const acknowledgeSchema = Joi.object({
  alertId: Joi.string().uuid().required(),
  userId: Joi.string().optional(),
  comment: Joi.string().max(500).optional()
});

const createAlertSchema = Joi.object({
  type: Joi.string().valid(
    'collision_warning',
    'proximity_alert',
    'altitude_deviation',
    'course_deviation',
    'weather_warning',
    'airspace_violation',
    'system_error',
    'data_loss',
    'emergency_squawk'
  ).required(),
  severity: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
  title: Joi.string().max(100).required(),
  message: Joi.string().max(1000).required(),
  aircraftId: Joi.string().max(10).optional(),
  position: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    altitude: Joi.number().min(0).max(60000).optional()
  }).optional(),
  metadata: Joi.object().optional()
});

/**
 * @route GET /api/alerts
 * @desc Obtener alertas con filtros opcionales
 * @access Public
 */
router.get('/', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    // Validar filtros
    const filters = req.query;
    validateInput(alertFilterSchema, filters);
    
    // Obtener alertas del servicio
    const allAlerts = alertService.getActiveAlerts();
    
    // Aplicar filtros
    let filteredAlerts = allAlerts;
    
    if (filters.type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === filters.type);
    }
    
    if (filters.severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === filters.severity);
    }
    
    if (filters.acknowledged !== undefined) {
      const acknowledged = filters.acknowledged === 'true';
      filteredAlerts = filteredAlerts.filter(alert => alert.acknowledged === acknowledged);
    }
    
    if (filters.aircraftId) {
      filteredAlerts = filteredAlerts.filter(alert => alert.aircraftId === filters.aircraftId);
    }
    
    if (filters.startDate) {
      const startDate = new Date(filters.startDate as string);
      filteredAlerts = filteredAlerts.filter(alert => alert.timestamp >= startDate);
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate as string);
      filteredAlerts = filteredAlerts.filter(alert => alert.timestamp <= endDate);
    }
    
    // Ordenar por timestamp (más recientes primero)
    filteredAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Aplicar paginación
    const limit = Number(filters.limit) || 100;
    const offset = Number(filters.offset) || 0;
    const paginatedAlerts = filteredAlerts.slice(offset, offset + limit);
    
    res.json({
      success: true,
      data: {
        alerts: paginatedAlerts,
        pagination: {
          total: filteredAlerts.length,
          limit,
          offset,
          hasNext: offset + limit < filteredAlerts.length,
          hasPrevious: offset > 0
        },
        filters,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    logger.error('Error obteniendo alertas:', error);
    throw error;
  }
}));

/**
 * @route GET /api/alerts/:id
 * @desc Obtener una alerta específica por ID
 * @access Public
 */
router.get('/:id', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const alerts = alertService.getActiveAlerts();
    const alert = alerts.find(a => a.id === id);
    
    if (!alert) {
      // Buscar en historial
      const history = alertService.getAlertHistory(1000);
      const historicalAlert = history.find(a => a.id === id);
      
      if (!historicalAlert) {
        throw createHttpError.notFound('Alerta');
      }
      
      return res.json({
        success: true,
        data: historicalAlert
      });
    }
    
    return res.json({
      success: true,
      data: alert
    });
    
  } catch (error) {
    logger.error(`Error obteniendo alerta ${id}:`, error);
    throw error;
  }
}));

/**
 * @route POST /api/alerts
 * @desc Crear una nueva alerta
 * @access Public
 */
router.post('/', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  // Validar datos de entrada
  validateInput(createAlertSchema, req.body);
  
  const { type, severity, title, message, aircraftId, position, metadata } = req.body;
  
  try {
    const alert = await alertService.createAlert(
      type,
      severity,
      title,
      message,
      aircraftId,
      position,
      metadata
    );
    
    if (!alert) {
      throw createHttpError.badRequest('No se pudo crear la alerta (posible cooldown)');
    }
    
    res.status(201).json({
      success: true,
      data: alert
    });
    
  } catch (error) {
    logger.error('Error creando alerta:', error);
    throw error;
  }
}));

/**
 * @route PUT /api/alerts/:id/acknowledge
 * @desc Reconocer una alerta
 * @access Public
 */
router.put('/:id/acknowledge', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, comment } = req.body;
  
  try {
    const success = await alertService.acknowledgeAlert(id);
    
    if (!success) {
      throw createHttpError.notFound('Alerta');
    }
    
    // Log del reconocimiento
    logger.info('Alerta reconocida', {
      alertId: id,
      userId: userId || 'anonymous',
      comment,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Alerta reconocida exitosamente',
      data: {
        alertId: id,
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy: userId || 'anonymous'
      }
    });
    
  } catch (error) {
    logger.error(`Error reconociendo alerta ${id}:`, error);
    throw error;
  }
}));

/**
 * @route PUT /api/alerts/:id/resolve
 * @desc Resolver una alerta
 * @access Public
 */
router.put('/:id/resolve', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, comment } = req.body;
  
  try {
    const success = await alertService.resolveAlert(id);
    
    if (!success) {
      throw createHttpError.notFound('Alerta');
    }
    
    // Log de la resolución
    logger.info('Alerta resuelta', {
      alertId: id,
      userId: userId || 'anonymous',
      comment,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Alerta resuelta exitosamente',
      data: {
        alertId: id,
        resolvedAt: new Date().toISOString(),
        resolvedBy: userId || 'anonymous'
      }
    });
    
  } catch (error) {
    logger.error(`Error resolviendo alerta ${id}:`, error);
    throw error;
  }
}));

/**
 * @route POST /api/alerts/acknowledge-multiple
 * @desc Reconocer múltiples alertas
 * @access Public
 */
router.post('/acknowledge-multiple', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { alertIds, userId } = req.body;
  
  if (!Array.isArray(alertIds) || alertIds.length === 0) {
    throw createHttpError.badRequest('Se requiere un array de IDs de alertas');
  }
  
  if (alertIds.length > 100) {
    throw createHttpError.badRequest('Máximo 100 alertas por operación');
  }
  
  try {
    const results = [];
    
    for (const alertId of alertIds) {
      const success = await alertService.acknowledgeAlert(alertId);
      results.push({
        alertId,
        success,
        acknowledgedAt: success ? new Date().toISOString() : null
      });
    }
    
    const successCount = results.filter(r => r.success).length;
    
    logger.info('Reconocimiento múltiple de alertas', {
      totalRequested: alertIds.length,
      successful: successCount,
      failed: alertIds.length - successCount,
      userId: userId || 'anonymous'
    });
    
    res.json({
      success: true,
      message: `${successCount} de ${alertIds.length} alertas reconocidas`,
      data: {
        results,
        summary: {
          total: alertIds.length,
          successful: successCount,
          failed: alertIds.length - successCount
        }
      }
    });
    
  } catch (error) {
    logger.error('Error en reconocimiento múltiple:', error);
    throw error;
  }
}));

/**
 * @route GET /api/alerts/stats
 * @desc Obtener estadísticas de alertas
 * @access Public
 */
router.get('/stats', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const serviceStats = alertService.getServiceStats();
    const activeAlerts = alertService.getActiveAlerts();
    const history = alertService.getAlertHistory(1000);
    
    // Calcular estadísticas adicionales
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const stats = {
      ...serviceStats,
      breakdown: {
        total: activeAlerts.length,
        acknowledged: activeAlerts.filter(a => a.acknowledged).length,
        unacknowledged: activeAlerts.filter(a => !a.acknowledged).length,
        critical: activeAlerts.filter(a => a.severity === 'critical').length,
        high: activeAlerts.filter(a => a.severity === 'high').length,
        medium: activeAlerts.filter(a => a.severity === 'medium').length,
        low: activeAlerts.filter(a => a.severity === 'low').length
      },
      trends: {
        last24h: history.filter(a => a.timestamp >= last24h).length,
        lastWeek: history.filter(a => a.timestamp >= lastWeek).length,
        averagePerDay: Math.round(history.filter(a => a.timestamp >= lastWeek).length / 7)
      },
      topAircraftWithAlerts: getTopAircraftWithAlerts(activeAlerts),
      alertFrequencyByHour: getAlertFrequencyByHour(history)
    };
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error obteniendo estadísticas de alertas:', error);
    throw error;
  }
}));

/**
 * @route GET /api/alerts/history
 * @desc Obtener historial de alertas
 * @access Public
 */
router.get('/history', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  const { limit = 100, type, severity } = req.query;
  
  try {
    let history = alertService.getAlertHistory(Number(limit));
    
    // Aplicar filtros
    if (type) {
      history = history.filter(alert => alert.type === type);
    }
    
    if (severity) {
      history = history.filter(alert => alert.severity === severity);
    }
    
    res.json({
      success: true,
      data: {
        alerts: history,
        count: history.length,
        filters: { type, severity, limit }
      }
    });
    
  } catch (error) {
    logger.error('Error obteniendo historial de alertas:', error);
    throw error;
  }
}));

/**
 * @route DELETE /api/alerts/cleanup
 * @desc Limpiar alertas resueltas antiguas
 * @access Public
 */
router.delete('/cleanup', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    // Ejecutar limpieza
    alertService.cleanupAutoResolvedAlerts();
    
    logger.info('Limpieza de alertas ejecutada');
    
    res.json({
      success: true,
      message: 'Limpieza de alertas completada',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error en limpieza de alertas:', error);
    throw error;
  }
}));

// Funciones auxiliares

function getTopAircraftWithAlerts(alerts: any[]): Array<{aircraft: string, count: number}> {
  const aircraftCounts: Record<string, number> = {};
  
  for (const alert of alerts) {
    if (alert.aircraftId) {
      aircraftCounts[alert.aircraftId] = (aircraftCounts[alert.aircraftId] || 0) + 1;
    }
  }
  
  return Object.entries(aircraftCounts)
    .map(([aircraft, count]) => ({ aircraft, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function getAlertFrequencyByHour(alerts: any[]): Record<number, number> {
  const frequency: Record<number, number> = {};
  
  // Inicializar todas las horas
  for (let i = 0; i < 24; i++) {
    frequency[i] = 0;
  }
  
  // Contar alertas por hora
  for (const alert of alerts) {
    const hour = alert.timestamp.getHours();
    frequency[hour]++;
  }
  
  return frequency;
}

export default router;