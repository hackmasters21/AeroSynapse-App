import { Pool, PoolClient } from 'pg';
import { config } from '../config/config';
import { logger, debugLog } from '../utils/logger';

// Configuración de la conexión
const poolConfig = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
  max: config.database.maxConnections,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,
  query_timeout: 30000
};

// Pool de conexiones
let pool: Pool | null = null;

// Clase para manejar la base de datos
class Database {
  private pool: Pool | null = null;
  private isConnected = false;

  // Conectar a la base de datos
  async connect(): Promise<void> {
    try {
      debugLog.database('Conectando a PostgreSQL...');
      
      this.pool = new Pool(poolConfig);
      pool = this.pool;
      
      // Configurar eventos del pool
      this.pool.on('connect', (client: PoolClient) => {
        debugLog.database('Nueva conexión establecida');
      });
      
      this.pool.on('error', (err: Error) => {
        logger.error('Error en el pool de conexiones:', err);
      });
      
      this.pool.on('remove', () => {
        debugLog.database('Conexión removida del pool');
      });
      
      // Probar la conexión
      const client = await this.pool.connect();
      
      try {
        // Verificar versión de PostgreSQL
        const versionResult = await client.query('SELECT version()');
        debugLog.success(`PostgreSQL conectado: ${versionResult.rows[0].version}`);
        
        // Verificar extensión PostGIS
        const postgisResult = await client.query(
          "SELECT PostGIS_Version() as version"
        );
        debugLog.success(`PostGIS disponible: ${postgisResult.rows[0].version}`);
        
        this.isConnected = true;
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      logger.error('Error conectando a la base de datos:', error);
      throw error;
    }
  }
  
  // Desconectar de la base de datos
  async disconnect(): Promise<void> {
    if (this.pool) {
      debugLog.database('Cerrando conexiones de base de datos...');
      await this.pool.end();
      this.pool = null;
      pool = null;
      this.isConnected = false;
      debugLog.success('Base de datos desconectada');
    }
  }
  
  // Obtener cliente del pool
  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Base de datos no conectada');
    }
    return await this.pool.connect();
  }
  
  // Ejecutar query simple
  async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    const client = await this.getClient();
    
    try {
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      
      debugLog.database(`Query ejecutado en ${duration}ms`);
      
      return result;
    } catch (error) {
      logger.error('Error ejecutando query:', {
        query: text,
        params,
        error: error.message
      });
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Ejecutar transacción
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error en transacción:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Verificar estado de conexión
  isHealthy(): boolean {
    return this.isConnected && this.pool !== null;
  }
  
  // Obtener estadísticas del pool
  getPoolStats() {
    if (!this.pool) {
      return null;
    }
    
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };
  }
}

// Instancia singleton
export const database = new Database();

// Funciones de utilidad para queries comunes
export const queries = {
  // Insertar aeronave
  insertAircraft: async (aircraft: any) => {
    const query = `
      INSERT INTO aircraft (
        icao24, callsign, registration, latitude, longitude, altitude,
        velocity, heading, vertical_rate, on_ground, squawk, 
        aircraft_type, airline, origin, destination, last_update
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      )
      ON CONFLICT (icao24) DO UPDATE SET
        callsign = EXCLUDED.callsign,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        altitude = EXCLUDED.altitude,
        velocity = EXCLUDED.velocity,
        heading = EXCLUDED.heading,
        vertical_rate = EXCLUDED.vertical_rate,
        on_ground = EXCLUDED.on_ground,
        squawk = EXCLUDED.squawk,
        last_update = EXCLUDED.last_update
      RETURNING *
    `;
    
    const params = [
      aircraft.icao24,
      aircraft.callsign,
      aircraft.registration,
      aircraft.latitude,
      aircraft.longitude,
      aircraft.altitude,
      aircraft.velocity,
      aircraft.heading,
      aircraft.verticalRate,
      aircraft.onGround,
      aircraft.squawk,
      aircraft.aircraftType,
      aircraft.airline,
      aircraft.origin,
      aircraft.destination,
      new Date()
    ];
    
    return await database.query(query, params);
  },
  
  // Obtener aeronaves activas
  getActiveAircraft: async (maxAge: number = 300) => {
    const query = `
      SELECT * FROM aircraft 
      WHERE last_update > NOW() - INTERVAL '${maxAge} seconds'
      ORDER BY last_update DESC
    `;
    
    return await database.query(query);
  },
  
  // Buscar aeronaves por área geográfica
  getAircraftInBounds: async (bounds: { north: number, south: number, east: number, west: number }) => {
    const query = `
      SELECT * FROM aircraft 
      WHERE latitude BETWEEN $1 AND $2
        AND longitude BETWEEN $3 AND $4
        AND last_update > NOW() - INTERVAL '300 seconds'
      ORDER BY last_update DESC
    `;
    
    const params = [bounds.south, bounds.north, bounds.west, bounds.east];
    return await database.query(query, params);
  },
  
  // Insertar alerta
  insertAlert: async (alert: any) => {
    const query = `
      INSERT INTO alerts (
        id, type, severity, title, message, aircraft_id, 
        latitude, longitude, altitude, acknowledged, auto_resolve, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      )
      RETURNING *
    `;
    
    const params = [
      alert.id,
      alert.type,
      alert.severity,
      alert.title,
      alert.message,
      alert.aircraftId,
      alert.position?.latitude,
      alert.position?.longitude,
      alert.position?.altitude,
      alert.acknowledged,
      alert.autoResolve,
      alert.timestamp
    ];
    
    return await database.query(query, params);
  },
  
  // Obtener alertas activas
  getActiveAlerts: async () => {
    const query = `
      SELECT * FROM alerts 
      WHERE (auto_resolve = false OR created_at > NOW() - INTERVAL '1 hour')
      ORDER BY created_at DESC
    `;
    
    return await database.query(query);
  },
  
  // Buscar aeronaves cercanas
  findNearbyAircraft: async (latitude: number, longitude: number, radiusNM: number) => {
    // Convertir millas náuticas a grados (aproximado)
    const radiusDegrees = radiusNM / 60;
    
    const query = `
      SELECT *, 
        ST_Distance(
          ST_Point($2, $1)::geography,
          ST_Point(longitude, latitude)::geography
        ) / 1852 as distance_nm
      FROM aircraft 
      WHERE ST_DWithin(
        ST_Point($2, $1)::geography,
        ST_Point(longitude, latitude)::geography,
        $3 * 1852
      )
      AND last_update > NOW() - INTERVAL '300 seconds'
      ORDER BY distance_nm
    `;
    
    const params = [latitude, longitude, radiusNM];
    return await database.query(query, params);
  },
  
  // Limpiar datos antiguos
  cleanupOldData: async () => {
    const queries = [
      // Eliminar aeronaves antiguas (más de 1 hora sin actualizar)
      "DELETE FROM aircraft WHERE last_update < NOW() - INTERVAL '1 hour'",
      
      // Eliminar alertas resueltas antiguas (más de 24 horas)
      "DELETE FROM alerts WHERE acknowledged = true AND created_at < NOW() - INTERVAL '24 hours'",
      
      // Eliminar alertas auto-resueltas antiguas (más de 2 horas)
      "DELETE FROM alerts WHERE auto_resolve = true AND created_at < NOW() - INTERVAL '2 hours'"
    ];
    
    for (const query of queries) {
      await database.query(query);
    }
  }
};

// Función para inicializar esquema de base de datos
export const initializeSchema = async () => {
  debugLog.database('Inicializando esquema de base de datos...');
  
  const schemas = [
    // Habilitar PostGIS
    'CREATE EXTENSION IF NOT EXISTS postgis;',
    
    // Tabla de aeronaves
    `CREATE TABLE IF NOT EXISTS aircraft (
      id SERIAL PRIMARY KEY,
      icao24 VARCHAR(6) UNIQUE NOT NULL,
      callsign VARCHAR(8),
      registration VARCHAR(10),
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      altitude INTEGER,
      velocity DOUBLE PRECISION,
      heading DOUBLE PRECISION,
      vertical_rate DOUBLE PRECISION,
      on_ground BOOLEAN DEFAULT false,
      squawk VARCHAR(4),
      aircraft_type VARCHAR(20),
      airline VARCHAR(50),
      origin VARCHAR(4),
      destination VARCHAR(4),
      emergency_status VARCHAR(20) DEFAULT 'none',
      last_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    // Índices para aeronaves
    'CREATE INDEX IF NOT EXISTS idx_aircraft_icao24 ON aircraft(icao24);',
    'CREATE INDEX IF NOT EXISTS idx_aircraft_location ON aircraft(latitude, longitude);',
    'CREATE INDEX IF NOT EXISTS idx_aircraft_last_update ON aircraft(last_update);',
    'CREATE INDEX IF NOT EXISTS idx_aircraft_callsign ON aircraft(callsign);',
    
    // Tabla de alertas
    `CREATE TABLE IF NOT EXISTS alerts (
      id VARCHAR(50) PRIMARY KEY,
      type VARCHAR(30) NOT NULL,
      severity VARCHAR(10) NOT NULL,
      title VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      aircraft_id VARCHAR(6),
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      altitude INTEGER,
      acknowledged BOOLEAN DEFAULT false,
      auto_resolve BOOLEAN DEFAULT false,
      resolved_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    // Índices para alertas
    'CREATE INDEX IF NOT EXISTS idx_alerts_aircraft_id ON alerts(aircraft_id);',
    'CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);',
    'CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);',
    'CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);',
    
    // Tabla de rutas
    `CREATE TABLE IF NOT EXISTS routes (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      origin_icao VARCHAR(4) NOT NULL,
      destination_icao VARCHAR(4) NOT NULL,
      waypoints JSONB,
      airways JSONB,
      distance DOUBLE PRECISION,
      estimated_time INTEGER,
      estimated_fuel DOUBLE PRECISION,
      altitude INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    // Tabla de espacios aéreos
    `CREATE TABLE IF NOT EXISTS airspaces (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(20) NOT NULL,
      class VARCHAR(1),
      geometry GEOMETRY(POLYGON, 4326),
      minimum_altitude INTEGER,
      maximum_altitude INTEGER,
      active BOOLEAN DEFAULT true,
      frequency DOUBLE PRECISION,
      restrictions JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    // Índice espacial para airspaces
    'CREATE INDEX IF NOT EXISTS idx_airspaces_geometry ON airspaces USING GIST(geometry);'
  ];
  
  for (const schema of schemas) {
    try {
      await database.query(schema);
    } catch (error) {
      logger.error('Error creando esquema:', { schema, error: error.message });
      throw error;
    }
  }
  
  debugLog.success('Esquema de base de datos inicializado');
};

// Exportar pool para uso directo si es necesario
export { pool };
export default database;