import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { UnauthorizedError, ForbiddenError } from './errorHandler';
import { logger } from '../utils/logger';

// Interfaz para el payload del JWT
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Extender Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// Middleware de autenticación JWT
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new UnauthorizedError('No authorization header provided');
    }
    
    // Verificar formato del header
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedError('Invalid authorization header format');
    }
    
    const token = parts[1];
    
    // Verificar y decodificar token
    const decoded = jwt.verify(token, config.security.jwtSecret) as JWTPayload;
    
    // Agregar usuario al request
    req.user = decoded;
    
    // Log de acceso
    logger.info('User authenticated', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
    
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new UnauthorizedError('Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token expired');
    } else if (error.name === 'NotBeforeError') {
      throw new UnauthorizedError('Token not active');
    }
    
    throw error;
  }
};

// Middleware de autorización por roles
export const requireRole = (roles: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      logger.warn('Access denied - insufficient permissions', {
        userId: req.user.userId,
        userRole,
        requiredRoles: allowedRoles,
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      
      throw new ForbiddenError('Insufficient permissions');
    }
    
    next();
  };
};

// Middleware de autenticación opcional
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const decoded = jwt.verify(token, config.security.jwtSecret) as JWTPayload;
        req.user = decoded;
      }
    }
    
    next();
    
  } catch (error) {
    // En autenticación opcional, ignoramos errores de token
    next();
  }
};

// Middleware para validar API Key
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    throw new UnauthorizedError('API key required');
  }
  
  // En un entorno real, validarías la API key contra una base de datos
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey)) {
    logger.warn('Invalid API key attempt', {
      apiKey: apiKey.substring(0, 8) + '...',
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    
    throw new UnauthorizedError('Invalid API key');
  }
  
  logger.info('API key authenticated', {
    apiKey: apiKey.substring(0, 8) + '...',
    ip: req.ip,
    path: req.path,
    method: req.method
  });
  
  next();
};

// Función para generar JWT
export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return (jwt.sign as any)(
    payload,
    config.security.jwtSecret,
    {
      expiresIn: config.security.jwtExpiration,
      issuer: 'aerosynapse',
      audience: 'aerosynapse-users'
    }
  );
};

// Función para verificar token
export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.security.jwtSecret) as JWTPayload;
};

// Función para refrescar token
export const refreshToken = (token: string): string => {
  try {
    const decoded = jwt.verify(token, config.security.jwtSecret, {
      ignoreExpiration: true
    }) as JWTPayload;
    
    // Verificar que el token no sea demasiado antiguo (máximo 7 días)
    const tokenAge = Date.now() / 1000 - decoded.iat;
    const maxAge = 7 * 24 * 60 * 60; // 7 días en segundos
    
    if (tokenAge > maxAge) {
      throw new UnauthorizedError('Token too old to refresh');
    }
    
    // Generar nuevo token
    return generateToken({
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    });
    
  } catch (error) {
    throw new UnauthorizedError('Invalid token for refresh');
  }
};

// Middleware para logging de acceso
export const accessLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('API Access', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId,
      contentLength: res.get('Content-Length')
    });
  });
  
  next();
};

// Middleware para validar origen de request
export const validateOrigin = (allowedOrigins: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.get('Origin') || req.get('Referer');
    
    if (!origin) {
      // Permitir requests sin origen (ej: Postman, curl)
      return next();
    }
    
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      return origin.startsWith(allowed);
    });
    
    if (!isAllowed) {
      logger.warn('Request from unauthorized origin', {
        origin,
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      
      throw new ForbiddenError('Origin not allowed');
    }
    
    next();
  };
};

// Middleware para rate limiting por usuario
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId || req.ip;
    const now = Date.now();
    
    const userRequests = requests.get(userId);
    
    if (!userRequests || now > userRequests.resetTime) {
      // Primera request o ventana expirada
      requests.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    if (userRequests.count >= maxRequests) {
      logger.warn('Rate limit exceeded', {
        userId,
        count: userRequests.count,
        maxRequests,
        ip: req.ip,
        path: req.path
      });
      
      throw new UnauthorizedError('Rate limit exceeded');
    }
    
    userRequests.count++;
    next();
  };
};

// Roles predefinidos
export const ROLES = {
  ADMIN: 'admin',
  OPERATOR: 'operator',
  PILOT: 'pilot',
  VIEWER: 'viewer'
} as const;

// Permisos por rol
export const PERMISSIONS = {
  [ROLES.ADMIN]: ['read', 'write', 'delete', 'admin'],
  [ROLES.OPERATOR]: ['read', 'write'],
  [ROLES.PILOT]: ['read', 'write_own'],
  [ROLES.VIEWER]: ['read']
};

// Middleware para verificar permisos específicos
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    const userPermissions = PERMISSIONS[req.user.role as keyof typeof PERMISSIONS] || [];
    
    if (!userPermissions.includes(permission)) {
      throw new ForbiddenError(`Permission '${permission}' required`);
    }
    
    next();
  };
};

export default authMiddleware;