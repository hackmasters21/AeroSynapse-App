import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config/config';

// Interfaz para errores personalizados
interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  isOperational?: boolean;
}

// Clase para errores de aplicación
export class AppError extends Error implements CustomError {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;
    
    // Mantener el stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Errores específicos de la aplicación
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, true, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, true, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, true, 'CONFLICT', details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, true, 'DATABASE_ERROR', details);
  }
}

export class ExternalAPIError extends AppError {
  constructor(api: string, message: string, details?: any) {
    super(`External API error (${api}): ${message}`, 502, true, 'EXTERNAL_API_ERROR', details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, true, 'RATE_LIMIT_EXCEEDED');
  }
}

// Función para determinar si un error es operacional
const isOperationalError = (error: CustomError): boolean => {
  if (error.isOperational !== undefined) {
    return error.isOperational;
  }
  
  // Errores conocidos que son operacionales
  const operationalErrors = [
    'ValidationError',
    'CastError',
    'MongoError',
    'PostgresError'
  ];
  
  return operationalErrors.includes(error.name);
};

// Función para formatear errores de base de datos
const formatDatabaseError = (error: any): CustomError => {
  // Error de PostgreSQL
  if (error.code) {
    switch (error.code) {
      case '23505': // Unique violation
        return new ConflictError('Resource already exists', {
          field: error.detail,
          constraint: error.constraint
        });
      case '23503': // Foreign key violation
        return new ValidationError('Referenced resource does not exist', {
          field: error.detail,
          constraint: error.constraint
        });
      case '23502': // Not null violation
        return new ValidationError('Required field is missing', {
          field: error.column
        });
      case '42P01': // Undefined table
        return new DatabaseError('Database table not found', {
          table: error.table
        });
      default:
        return new DatabaseError(error.message, {
          code: error.code,
          detail: error.detail
        });
    }
  }
  
  return new DatabaseError(error.message);
};

// Función para formatear errores de validación
const formatValidationError = (error: any): CustomError => {
  const errors: any = {};
  
  if (error.errors) {
    Object.keys(error.errors).forEach(key => {
      errors[key] = error.errors[key].message;
    });
  }
  
  return new ValidationError('Validation failed', errors);
};

// Función para crear respuesta de error
const createErrorResponse = (error: CustomError, req: Request) => {
  const response: any = {
    success: false,
    error: {
      message: error.message,
      code: error.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }
  };
  
  // Agregar detalles en desarrollo
  if (config.nodeEnv === 'development') {
    response.error.stack = error.stack;
    if (error.details) {
      response.error.details = error.details;
    }
  }
  
  // Agregar ID de request si existe
  if (req.headers['x-request-id']) {
    response.error.requestId = req.headers['x-request-id'];
  }
  
  return response;
};

// Middleware principal de manejo de errores
export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let processedError = error;
  
  // Formatear errores específicos
  if (error.name === 'ValidationError') {
    processedError = formatValidationError(error);
  } else if (error.code && error.code.startsWith('23')) {
    processedError = formatDatabaseError(error);
  } else if (!error.statusCode) {
    // Error no manejado, convertir a error interno
    processedError = new AppError(
      'Internal server error',
      500,
      false,
      'INTERNAL_ERROR'
    );
  }
  
  // Log del error
  const logData = {
    message: processedError.message,
    statusCode: processedError.statusCode,
    code: processedError.code,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    query: req.query,
    params: req.params,
    stack: processedError.stack
  };
  
  if (processedError.statusCode >= 500) {
    logger.error('Server Error', logData);
  } else {
    logger.warn('Client Error', logData);
  }
  
  // Crear respuesta
  const errorResponse = createErrorResponse(processedError, req);
  
  // Enviar respuesta
  res.status(processedError.statusCode || 500).json(errorResponse);
};

// Middleware para manejar rutas no encontradas
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new NotFoundError(`Route ${req.originalUrl}`);
  next(error);
};

// Middleware para capturar errores asíncronos
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Función para manejar errores no capturados
export const handleUncaughtErrors = () => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack
    });
    
    // Cerrar servidor gracefully
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString()
    });
    
    // Cerrar servidor gracefully
    process.exit(1);
  });
};

// Función para validar entrada
export const validateInput = (schema: any, data: any): void => {
  const { error } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    const details: any = {};
    error.details.forEach((detail: any) => {
      details[detail.path.join('.')] = detail.message;
    });
    
    throw new ValidationError('Input validation failed', details);
  }
};

// Función para crear errores HTTP estándar
export const createHttpError = {
  badRequest: (message: string, details?: any) => new ValidationError(message, details),
  unauthorized: (message?: string) => new UnauthorizedError(message),
  forbidden: (message?: string) => new ForbiddenError(message),
  notFound: (resource?: string) => new NotFoundError(resource),
  conflict: (message: string, details?: any) => new ConflictError(message, details),
  internalServer: (message: string, details?: any) => new AppError(message, 500, false, 'INTERNAL_ERROR', details),
  badGateway: (api: string, message: string, details?: any) => new ExternalAPIError(api, message, details),
  rateLimit: (message?: string) => new RateLimitError(message)
};

// Exportar tipos
export type { CustomError };

// Exportar por defecto
export default errorHandler;