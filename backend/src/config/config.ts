import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

interface Config {
  // Servidor
  port: number;
  nodeEnv: string;
  
  // Base de datos
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    ssl: boolean;
    maxConnections: number;
  };
  
  // APIs externas
  apis: {
    adsbExchange: {
      url: string;
      apiKey?: string;
      rateLimit: number;
    };
    openSky: {
      url: string;
      username?: string;
      password?: string;
      rateLimit: number;
    };
    flightAware: {
      url: string;
      apiKey?: string;
      rateLimit: number;
    };
  };
  
  // WebSocket
  websocket: {
    updateInterval: number;
    maxConnections: number;
    heartbeatInterval: number;
  };
  
  // Seguridad
  security: {
    jwtSecret: string;
    jwtExpiration: string;
    bcryptRounds: number;
    rateLimitWindow: number;
    rateLimitMax: number;
  };
  
  // Alertas
  alerts: {
    proximityDistance: number; // en millas náuticas
    proximityAltitude: number; // en pies
    collisionWarningTime: number; // en segundos
    maxAlertsPerMinute: number;
  };
  
  // Logging
  logging: {
    level: string;
    file: string;
    maxSize: string;
    maxFiles: number;
  };
}

export const config: Config = {
  // Configuración del servidor
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Configuración de base de datos
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'aerosynapse',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10)
  },
  
  // Configuración de APIs externas
  apis: {
    adsbExchange: {
      url: process.env.ADSB_EXCHANGE_URL || 'https://adsbexchange-com1.p.rapidapi.com/v2',
      apiKey: process.env.ADSB_EXCHANGE_API_KEY,
      rateLimit: parseInt(process.env.ADSB_EXCHANGE_RATE_LIMIT || '60', 10) // requests per minute
    },
    openSky: {
      url: process.env.OPENSKY_URL || 'https://opensky-network.org/api',
      username: process.env.OPENSKY_USERNAME,
      password: process.env.OPENSKY_PASSWORD,
      rateLimit: parseInt(process.env.OPENSKY_RATE_LIMIT || '100', 10)
    },
    flightAware: {
      url: process.env.FLIGHTAWARE_URL || 'https://aeroapi.flightaware.com/aeroapi',
      apiKey: process.env.FLIGHTAWARE_API_KEY,
      rateLimit: parseInt(process.env.FLIGHTAWARE_RATE_LIMIT || '500', 10)
    }
  },
  
  // Configuración de WebSocket
  websocket: {
    updateInterval: parseInt(process.env.WS_UPDATE_INTERVAL || '5000', 10), // ms
    maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS || '1000', 10),
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10) // ms
  },
  
  // Configuración de seguridad
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtExpiration: process.env.JWT_EXPIRATION || '24h',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
  },
  
  // Configuración de alertas
  alerts: {
    proximityDistance: parseFloat(process.env.PROXIMITY_DISTANCE || '5.0'), // NM
    proximityAltitude: parseInt(process.env.PROXIMITY_ALTITUDE || '1000', 10), // ft
    collisionWarningTime: parseInt(process.env.COLLISION_WARNING_TIME || '60', 10), // seconds
    maxAlertsPerMinute: parseInt(process.env.MAX_ALERTS_PER_MINUTE || '10', 10)
  },
  
  // Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/aerosynapse.log',
    maxSize: process.env.LOG_MAX_SIZE || '10m',
    maxFiles: parseInt(process.env.LOG_MAX_FILES || '5', 10)
  }
};

// Validar configuración crítica
function validateConfig() {
  const errors: string[] = [];
  
  // Validar puerto
  if (config.port < 1 || config.port > 65535) {
    errors.push('Puerto inválido');
  }
  
  // Validar configuración de base de datos
  if (!config.database.host) {
    errors.push('Host de base de datos requerido');
  }
  
  if (!config.database.name) {
    errors.push('Nombre de base de datos requerido');
  }
  
  // Validar JWT secret en producción
  if (config.nodeEnv === 'production' && config.security.jwtSecret === 'your-super-secret-jwt-key-change-in-production') {
    errors.push('JWT_SECRET debe ser cambiado en producción');
  }
  
  // Validar intervalos
  if (config.websocket.updateInterval < 1000) {
    errors.push('Intervalo de actualización WebSocket muy bajo (mínimo 1000ms)');
  }
  
  if (config.alerts.proximityDistance <= 0) {
    errors.push('Distancia de proximidad debe ser mayor a 0');
  }
  
  if (errors.length > 0) {
    throw new Error(`Errores de configuración:\n${errors.join('\n')}`);
  }
}

// Validar configuración al cargar
validateConfig();

// Configuraciones específicas por entorno
export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
export const isTesting = config.nodeEnv === 'test';

// Configuración de CORS
export const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};

// Configuración de rate limiting por endpoint
export const rateLimitConfigs = {
  default: {
    windowMs: config.security.rateLimitWindow,
    max: config.security.rateLimitMax,
    message: 'Demasiadas solicitudes desde esta IP'
  },
  api: {
    windowMs: 60000, // 1 minuto
    max: 100,
    message: 'Límite de API excedido'
  },
  auth: {
    windowMs: 900000, // 15 minutos
    max: 5,
    message: 'Demasiados intentos de autenticación'
  }
};

// Configuración de headers de seguridad
export const securityHeaders = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
};

// Exportar configuración por defecto
export default config;