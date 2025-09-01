import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { optionalAuth } from '../middleware/auth';
import { NotamService } from '../services/notamService';
import { logger } from '../utils/logger';
import { validateInput, createHttpError } from '../middleware/errorHandler';
import Joi from 'joi';

const router = Router();

// Instancia del servicio de NOTAMs
let notamService: NotamService;

try {
  notamService = new NotamService();
  logger.info('NotamService inicializado correctamente');
} catch (error) {
  logger.error('Error inicializando NotamService:', error);
  throw error;
}

// Esquemas de validación
const icaoCodesSchema = Joi.object({
  icaoCodes: Joi.array().items(Joi.string().length(4).uppercase()).min(1).max(10).required(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  classification: Joi.array().items(Joi.string().valid('I', 'II', 'III', 'IV', 'V')).optional(),
  traffic: Joi.array().items(Joi.string().valid('I', 'N', 'IV', 'V')).optional()
});

const searchSchema = Joi.object({
  icaoCodes: Joi.array().items(Joi.string().length(4).uppercase()).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  classification: Joi.array().items(Joi.string().valid('I', 'II', 'III', 'IV', 'V')).optional(),
  traffic: Joi.array().items(Joi.string().valid('I', 'N', 'IV', 'V')).optional(),
  radius: Joi.number().min(1).max(500).optional(),
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required()
  }).optional()
});

/**
 * @route GET /api/notam/icao/:icaoCodes
 * @desc Obtener NOTAMs para códigos ICAO específicos
 * @access Public
 */
router.get('/icao/:icaoCodes', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const icaoCodesParam = req.params.icaoCodes;
    
    if (!icaoCodesParam) {
      throw createHttpError.badRequest('Códigos ICAO requeridos');
    }
    
    // Separar códigos ICAO por comas
    const icaoCodes = icaoCodesParam.split(',').map(code => code.trim().toUpperCase());
    
    // Validar códigos ICAO
    if (icaoCodes.length === 0 || icaoCodes.length > 10) {
      throw createHttpError.badRequest('Debe proporcionar entre 1 y 10 códigos ICAO');
    }
    
    for (const code of icaoCodes) {
      if (!/^[A-Z]{4}$/.test(code)) {
        throw createHttpError.badRequest(`Código ICAO inválido: ${code}`);
      }
    }
    
    const notams = await notamService.getFAANotams(icaoCodes);
    
    res.json({
      success: true,
      data: {
        notams,
        count: notams.length,
        icaoCodes,
        summary: {
          active: notams.filter(n => new Date() >= n.schedule.startDate && new Date() <= n.schedule.endDate).length,
          permanent: notams.filter(n => n.schedule.permanent).length,
          estimated: notams.filter(n => n.schedule.estimated).length
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`Error obteniendo NOTAMs para ${req.params.icaoCodes}:`, error);
    throw error;
  }
}));

/**
 * @route POST /api/notam/search
 * @desc Buscar NOTAMs con filtros avanzados
 * @access Public
 */
router.post('/search', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const { error, value } = searchSchema.validate(req.body);
    
    if (error) {
      throw createHttpError.badRequest(`Datos de búsqueda inválidos: ${error.details[0].message}`);
    }
    
    const filters = value;
    
    const notams = await notamService.searchNotams(filters);
    
    res.json({
      success: true,
      data: {
        notams,
        count: notams.length,
        filters,
        summary: {
          byClassification: {
            I: notams.filter(n => n.classification === 'I').length,
            II: notams.filter(n => n.classification === 'II').length,
            III: notams.filter(n => n.classification === 'III').length,
            IV: notams.filter(n => n.classification === 'IV').length,
            V: notams.filter(n => n.classification === 'V').length
          },
          byTraffic: {
            I: notams.filter(n => n.traffic === 'I').length,
            N: notams.filter(n => n.traffic === 'N').length,
            IV: notams.filter(n => n.traffic === 'IV').length,
            V: notams.filter(n => n.traffic === 'V').length
          },
          bySource: {
            faa: notams.filter(n => n.source === 'faa').length,
            icao: notams.filter(n => n.source === 'icao').length,
            eurocontrol: notams.filter(n => n.source === 'eurocontrol').length
          }
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error buscando NOTAMs:', error);
    throw error;
  }
}));

/**
 * @route GET /api/notam/stats
 * @desc Obtener estadísticas del servicio de NOTAMs
 * @access Public
 */
router.get('/stats', optionalAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = notamService.getServiceStats();
    
    res.json({
      success: true,
      data: {
        service: 'NotamService',
        version: '1.0.0',
        stats,
        endpoints: {
          '/icao/:icaoCodes': 'Obtener NOTAMs por códigos ICAO',
          '/search': 'Buscar NOTAMs con filtros',
          '/stats': 'Estadísticas del servicio'
        },
        supportedSources: ['faa', 'icao', 'eurocontrol'],
        supportedClassifications: ['I', 'II', 'III', 'IV', 'V'],
        supportedTrafficTypes: ['I', 'N', 'IV', 'V']
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error obteniendo estadísticas de NOTAMs:', error);
    throw error;
  }
}));

/**
 * @route GET /api/notam/health
 * @desc Verificar el estado del servicio de NOTAMs
 * @access Public
 */
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Probar con un aeropuerto conocido
    const testNotams = await notamService.getFAANotams(['KJFK']);
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        service: 'NotamService',
        testResult: {
          icaoCode: 'KJFK',
          notamsFound: testNotams.length,
          responseTime: Date.now()
        },
        uptime: process.uptime(),
        memory: process.memoryUsage()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Error en health check de NOTAMs:', error);
    
    res.status(503).json({
      success: false,
      error: {
        message: 'Servicio de NOTAMs no disponible',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * @route GET /api/notam/disclaimer
 * @desc Obtener disclaimer legal para NOTAMs
 * @access Public
 */
router.get('/disclaimer', asyncHandler(async (req: Request, res: Response) => {
  const lang = req.query.lang as string || 'en';
  
  const disclaimers = {
    en: "NOTICE TO AIRMEN (NOTAM) INFORMATION FOR PLANNING PURPOSES ONLY. NOTAMs ARE DYNAMIC AND SUBJECT TO CHANGE. ALWAYS CONSULT OFFICIAL SOURCES (ATIS, ASOS, VOLMET) AND CONTACT AIR TRAFFIC CONTROL (ATC) FOR REAL-TIME INFORMATION DURING FLIGHT. THIS SERVICE IS NOT INTENDED FOR NAVIGATION OR OPERATIONAL USE.",
    es: "INFORMACIÓN DE AVISO A LOS AVIADORES (NOTAM) SOLO PARA FINES DE PLANIFICACIÓN. LOS NOTAMs SON DINÁMICOS Y ESTÁN SUJETOS A CAMBIOS. SIEMPRE CONSULTE FUENTES OFICIALES (ATIS, ASOS, VOLMET) Y CONTACTE AL CONTROL DE TRÁFICO AÉREO (ATC) PARA INFORMACIÓN EN TIEMPO REAL DURANTE EL VUELO. ESTE SERVICIO NO ESTÁ DESTINADO PARA USO NAVEGACIONAL U OPERACIONAL.",
    pt: "INFORMAÇÃO DE AVISO AOS AVIADORES (NOTAM) APENAS PARA FINS DE PLANEJAMENTO. NOTAMs SÃO DINÂMICOS E SUJEITOS A MUDANÇAS. SEMPRE CONSULTE FONTES OFICIAIS (ATIS, ASOS, VOLMET) E CONTATE O CONTROLE DE TRÁFEGO AÉREO (ATC) PARA INFORMAÇÕES EM TEMPO REAL DURANTE O VOO. ESTE SERVIÇO NÃO SE DESTINA AO USO NAVEGACIONAL OU OPERACIONAL.",
    fr: "INFORMATIONS D'AVIS AUX AVIATEURS (NOTAM) À DES FINS DE PLANIFICATION UNIQUEMENT. LES NOTAMs SONT DYNAMIQUES ET SUJETS À CHANGEMENT. CONSULTEZ TOUJOURS LES SOURCES OFFICIELLES (ATIS, ASOS, VOLMET) ET CONTACTEZ LE CONTRÔLE DU TRAFIC AÉRIEN (ATC) POUR DES INFORMATIONS EN TEMPS RÉEL PENDANT LE VOL. CE SERVICE N'EST PAS DESTINÉ À UN USAGE NAVIGATIONNEL OU OPÉRATIONNEL."
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
function validateIcaoCode(code: string): boolean {
  return /^[A-Z]{4}$/.test(code);
}

function formatNotamResponse(notams: any[], icaoCodes: string[]) {
  return {
    notams,
    count: notams.length,
    icaoCodes,
    summary: {
      active: notams.filter(n => {
        const now = new Date();
        return now >= new Date(n.schedule.startDate) && now <= new Date(n.schedule.endDate);
      }).length,
      permanent: notams.filter(n => n.schedule.permanent).length,
      estimated: notams.filter(n => n.schedule.estimated).length
    }
  };
}

export default router;