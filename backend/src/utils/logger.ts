import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from '../config/config';

// Crear directorio de logs si no existe
const logDir = path.dirname(config.logging.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Formato personalizado para logs
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Agregar stack trace si existe
    if (stack) {
      log += `\n${stack}`;
    }
    
    // Agregar metadata si existe
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Formato para consola (más legible)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// Configurar transports
const transports: winston.transport[] = [
  // Archivo para todos los logs
  new winston.transports.File({
    filename: config.logging.file,
    level: config.logging.level,
    format: customFormat,
    maxsize: parseInt(config.logging.maxSize.replace('m', '')) * 1024 * 1024,
    maxFiles: config.logging.maxFiles,
    tailable: true
  }),
  
  // Archivo separado para errores
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: customFormat,
    maxsize: 5 * 1024 * 1024, // 5MB
    maxFiles: 5
  })
];

// Agregar consola en desarrollo
if (config.nodeEnv !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: consoleFormat
    })
  );
}

// Crear logger
export const logger = winston.createLogger({
  level: config.logging.level,
  format: customFormat,
  transports,
  // No salir en errores
  exitOnError: false
});

// Funciones de utilidad para logging específico
export const loggers = {
  // Logger para requests HTTP
  http: (req: any, res: any, responseTime?: number) => {
    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: responseTime ? `${responseTime}ms` : undefined
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  },
  
  // Logger para WebSocket
  websocket: (event: string, data?: any) => {
    logger.info('WebSocket Event', {
      event,
      data: data ? JSON.stringify(data) : undefined,
      timestamp: new Date().toISOString()
    });
  },
  
  // Logger para base de datos
  database: (operation: string, table?: string, duration?: number, error?: any) => {
    const logData = {
      operation,
      table,
      duration: duration ? `${duration}ms` : undefined,
      error: error ? error.message : undefined
    };
    
    if (error) {
      logger.error('Database Operation Failed', logData);
    } else {
      logger.debug('Database Operation', logData);
    }
  },
  
  // Logger para APIs externas
  externalApi: (api: string, endpoint: string, status: number, duration?: number, error?: any) => {
    const logData = {
      api,
      endpoint,
      status,
      duration: duration ? `${duration}ms` : undefined,
      error: error ? error.message : undefined
    };
    
    if (error || status >= 400) {
      logger.warn('External API Call Failed', logData);
    } else {
      logger.debug('External API Call', logData);
    }
  },
  
  // Logger para alertas
  alert: (type: string, severity: string, message: string, aircraftId?: string) => {
    logger.info('Alert Generated', {
      type,
      severity,
      message,
      aircraftId,
      timestamp: new Date().toISOString()
    });
  },
  
  // Logger para performance
  performance: (operation: string, duration: number, details?: any) => {
    const logData = {
      operation,
      duration: `${duration}ms`,
      details
    };
    
    if (duration > 1000) {
      logger.warn('Slow Operation', logData);
    } else {
      logger.debug('Performance', logData);
    }
  },
  
  // Logger para seguridad
  security: (event: string, ip: string, details?: any) => {
    logger.warn('Security Event', {
      event,
      ip,
      details,
      timestamp: new Date().toISOString()
    });
  }
};

// Middleware para capturar logs de Express
export const expressLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    loggers.http(req, res, duration);
  });
  
  next();
};

// Función para logs estructurados
export const structuredLog = (level: string, message: string, metadata?: any) => {
  logger.log(level, message, metadata);
};

// Función para medir tiempo de ejecución
export const timeExecution = async <T>(operation: string, fn: () => Promise<T>): Promise<T> => {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    loggers.performance(operation, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    loggers.performance(operation, duration, { error: error.message });
    throw error;
  }
};

// Función para logs de desarrollo
export const devLog = (message: string, data?: any) => {
  if (config.nodeEnv === 'development') {
    console.log(`🔧 [DEV] ${message}`, data || '');
  }
};

// Función para logs de debug con colores
export const debugLog = {
  info: (message: string, data?: any) => {
    if (config.nodeEnv === 'development') {
      console.log(`ℹ️  ${message}`, data || '');
    }
  },
  success: (message: string, data?: any) => {
    if (config.nodeEnv === 'development') {
      console.log(`✅ ${message}`, data || '');
    }
  },
  warning: (message: string, data?: any) => {
    if (config.nodeEnv === 'development') {
      console.log(`⚠️  ${message}`, data || '');
    }
  },
  error: (message: string, data?: any) => {
    if (config.nodeEnv === 'development') {
      console.log(`❌ ${message}`, data || '');
    }
  },
  aircraft: (message: string, data?: any) => {
    if (config.nodeEnv === 'development') {
      console.log(`🛩️  ${message}`, data || '');
    }
  },
  websocket: (message: string, data?: any) => {
    if (config.nodeEnv === 'development') {
      console.log(`🔌 ${message}`, data || '');
    }
  },
  database: (message: string, data?: any) => {
    if (config.nodeEnv === 'development') {
      console.log(`📊 ${message}`, data || '');
    }
  }
};

// Exportar logger por defecto
export default logger;