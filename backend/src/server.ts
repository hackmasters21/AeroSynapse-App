import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Importar configuración y servicios
import { config } from './config/config';
import { logger } from './utils/logger';
import { database } from './database/connection';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

// Importar rutas
import aircraftRoutes from './routes/aircraft';
import routeRoutes from './routes/routes';
import airspaceRoutes from './routes/airspace';
import alertRoutes from './routes/alerts';
import notamRoutes from './routes/notam';

// Importar servicios de WebSocket
import { setupSocketHandlers } from './services/socketService';
import { AircraftService } from './services/aircraftService';
import { AlertService } from './services/alertService';

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app = express();
const server = createServer(app);

// Configurar Socket.IO con CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env['FRONTEND_URL'] || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  points: 100, // Número de requests
  duration: 60, // Por minuto
});

// Middleware de rate limiting
const rateLimitMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    await rateLimiter.consume(req.ip || 'unknown');
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded'
    });
  }
};

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));

// CORS
app.use(cors({
  origin: process.env['FRONTEND_URL'] || "http://localhost:3000",
  credentials: true
}));

// Compresión
app.use(compression());

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimitMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'] || 'development',
    version: process.env['npm_package_version'] || '1.0.0'
  });
});

// API Routes
app.use('/api/aircraft', aircraftRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/airspace', airspaceRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/notam', notamRoutes);

// Ruta de información de la API
app.get('/api', (req, res) => {
  res.json({
    name: 'AeroSynapse API',
    version: '1.0.0',
    description: 'API para Sistema de Conciencia Situacional y Planificación de Vuelo',
    endpoints: {
      aircraft: '/api/aircraft',
      routes: '/api/routes',
      airspace: '/api/airspace',
      alerts: '/api/alerts',
      health: '/health'
    },
    websocket: {
      url: '/socket.io',
      events: [
        'aircraft_update',
        'aircraft_removed',
        'alert_new',
        'alert_resolved',
        'proximity_alert',
        'collision_warning',
        'system_status'
      ]
    }
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Inicializar servicios
let aircraftService: AircraftService;
let alertService: AlertService;

// Función para inicializar la aplicación
async function initializeApp() {
  try {
    logger.info('🚀 Iniciando AeroSynapse Backend...');
    
    // Conectar a la base de datos (comentado para demo sin DB)
    // logger.info('📊 Conectando a la base de datos...');
    // await database.connect();
    // logger.info('✅ Base de datos conectada');
    logger.info('✅ Ejecutando en modo demo sin base de datos');
    
    // Inicializar servicios
    logger.info('🔧 Inicializando servicios...');
    aircraftService = new AircraftService();
    alertService = new AlertService();
    
    // Configurar WebSocket handlers
    logger.info('🔌 Configurando WebSocket...');
    setupSocketHandlers(io, aircraftService, alertService);
    
    // Iniciar servicios de datos en tiempo real
    logger.info('📡 Iniciando servicios de datos en tiempo real...');
    await aircraftService.startDataCollection();
    
    // Iniciar el servidor
    const port = config.port || 3001;
    server.listen(port, () => {
      logger.info(`🌟 AeroSynapse Backend ejecutándose en puerto ${port}`);
      logger.info(`📱 Frontend URL: ${process.env['FRONTEND_URL'] || 'http://localhost:3000'}`);
      logger.info(`🔗 API URL: http://localhost:${port}/api`);
      logger.info(`🔌 WebSocket URL: http://localhost:${port}/socket.io`);
      logger.info(`🏥 Health Check: http://localhost:${port}/health`);
    });
    
  } catch (error) {
    logger.error('❌ Error inicializando la aplicación:', error);
    process.exit(1);
  }
}

// Manejo de señales del sistema
process.on('SIGTERM', async () => {
  logger.info('🛑 SIGTERM recibido, cerrando servidor...');
  
  // Detener servicios
  if (aircraftService) {
    await aircraftService.stopDataCollection();
  }
  
  // Cerrar conexiones
  server.close(() => {
    logger.info('✅ Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('🛑 SIGINT recibido, cerrando servidor...');
  
  // Detener servicios
  if (aircraftService) {
    await aircraftService.stopDataCollection();
  }
  
  // Cerrar conexiones
  server.close(() => {
    logger.info('✅ Servidor cerrado');
    process.exit(0);
  });
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('💥 Excepción no capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Promise rechazada no manejada:', reason);
  logger.error('En promise:', promise);
  process.exit(1);
});

// Inicializar la aplicación
initializeApp();

// Exportar para testing
export { app, server, io };