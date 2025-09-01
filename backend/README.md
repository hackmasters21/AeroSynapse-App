# AeroSynapse Backend

Backend API para el Sistema Integrado de Conciencia Situacional y Planificación de Vuelo.

## Características

- **API REST** completa para gestión de aeronaves, rutas, espacios aéreos y alertas
- **WebSocket** para comunicación en tiempo real
- **Base de datos PostgreSQL** con extensión PostGIS para datos geoespaciales
- **Integración con APIs** de tráfico aéreo (OpenSky Network, ADS-B Exchange)
- **Sistema de alertas** con detección de proximidad y colisiones
- **Autenticación JWT** y autorización por roles
- **Rate limiting** y middleware de seguridad
- **Logging estructurado** con Winston
- **Validación de datos** con Joi
- **Manejo de errores** centralizado

## Tecnologías

- **Node.js** 18+
- **TypeScript** 5.x
- **Express.js** 4.x
- **Socket.IO** 4.x
- **PostgreSQL** 14+ con PostGIS
- **Winston** para logging
- **Joi** para validación
- **JWT** para autenticación

## Instalación

### Prerrequisitos

1. **Node.js** 18 o superior
2. **PostgreSQL** 14 o superior con extensión PostGIS
3. **npm** o **yarn**

### Configuración de Base de Datos

1. Instalar PostgreSQL y PostGIS:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib postgis

# macOS con Homebrew
brew install postgresql postgis

# Windows: Descargar desde postgresql.org
```

2. Crear base de datos:
```sql
CREATE DATABASE aerosynapse;
CREATE USER aerosynapse_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE aerosynapse TO aerosynapse_user;

-- Conectar a la base de datos y habilitar PostGIS
\c aerosynapse
CREATE EXTENSION postgis;
```

### Instalación del Backend

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

3. Compilar TypeScript:
```bash
npm run build
```

4. Ejecutar migraciones (opcional):
```bash
npm run migrate
```

## Uso

### Desarrollo

```bash
# Modo desarrollo con recarga automática
npm run dev

# Compilar y ejecutar
npm run build
npm start

# Ejecutar tests
npm test

# Linting
npm run lint
npm run lint:fix
```

### Producción

```bash
# Compilar para producción
npm run build

# Ejecutar en producción
NODE_ENV=production npm start
```

## API Endpoints

### Aeronaves

- `GET /api/aircraft` - Obtener todas las aeronaves activas
- `GET /api/aircraft/:icao24` - Obtener aeronave específica
- `POST /api/aircraft/bounds` - Aeronaves en área geográfica
- `POST /api/aircraft/nearby` - Aeronaves cercanas a una posición
- `GET /api/aircraft/stats` - Estadísticas de aeronaves
- `GET /api/aircraft/types` - Tipos de aeronaves disponibles
- `GET /api/aircraft/airlines` - Aerolíneas disponibles

### Rutas

- `POST /api/routes/calculate` - Calcular rutas entre aeropuertos
- `GET /api/routes/airports` - Lista de aeropuertos
- `GET /api/routes/airports/:icao` - Información de aeropuerto
- `GET /api/routes/waypoints` - Lista de waypoints
- `POST /api/routes/validate` - Validar ruta propuesta
- `GET /api/routes/airways` - Información de airways

### Espacios Aéreos

- `GET /api/airspace` - Obtener espacios aéreos
- `POST /api/airspace/bounds` - Espacios aéreos en área
- `POST /api/airspace/point` - Espacios aéreos que contienen un punto
- `GET /api/airspace/:id` - Información de espacio aéreo específico
- `GET /api/airspace/navaids` - Radioayudas a la navegación
- `POST /api/airspace/navaids/nearby` - Radioayudas cercanas
- `GET /api/airspace/types` - Tipos de espacios aéreos
- `GET /api/airspace/classes` - Clases de espacios aéreos

### Alertas

- `GET /api/alerts` - Obtener alertas con filtros
- `GET /api/alerts/:id` - Obtener alerta específica
- `POST /api/alerts` - Crear nueva alerta
- `PUT /api/alerts/:id/acknowledge` - Reconocer alerta
- `PUT /api/alerts/:id/resolve` - Resolver alerta
- `POST /api/alerts/acknowledge-multiple` - Reconocer múltiples alertas
- `GET /api/alerts/stats` - Estadísticas de alertas
- `GET /api/alerts/history` - Historial de alertas
- `DELETE /api/alerts/cleanup` - Limpiar alertas antiguas

### Sistema

- `GET /health` - Health check del servidor
- `GET /api` - Información de la API

## WebSocket Events

### Eventos del Cliente al Servidor

- `request_initial_data` - Solicitar datos iniciales
- `update_settings` - Actualizar configuración del cliente
- `subscribe_aircraft` - Suscribirse a aeronave específica
- `unsubscribe_aircraft` - Desuscribirse de aeronave
- `acknowledge_alert` - Reconocer alerta
- `request_aircraft_in_bounds` - Solicitar aeronaves en área
- `find_nearby_aircraft` - Buscar aeronaves cercanas
- `heartbeat` - Heartbeat del cliente
- `ping` - Ping para medir latencia

### Eventos del Servidor al Cliente

- `aircraft_update` - Actualización de aeronaves
- `aircraft_specific_update` - Actualización de aeronave específica
- `aircraft_removed` - Aeronave removida
- `alert_new` - Nueva alerta
- `alert_acknowledged` - Alerta reconocida
- `proximity_alert` - Alerta de proximidad
- `collision_warning` - Advertencia de colisión
- `emergency_alert` - Alerta de emergencia
- `system_status` - Estado del sistema
- `heartbeat` - Heartbeat del servidor
- `pong` - Respuesta a ping
- `error` - Error del servidor

## Configuración

### Variables de Entorno Principales

```env
# Servidor
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aerosynapse
DB_USER=postgres
DB_PASSWORD=password

# APIs Externas
OPENSKY_USERNAME=your_username
OPENSKY_PASSWORD=your_password
ADSB_EXCHANGE_API_KEY=your_api_key

# Seguridad
JWT_SECRET=your-secret-key

# Alertas
PROXIMITY_DISTANCE=5.0
PROXIMITY_ALTITUDE=1000
```

### Configuración de APIs Externas

1. **OpenSky Network**: Registro gratuito en https://opensky-network.org/
2. **ADS-B Exchange**: API key de RapidAPI
3. **FlightAware**: API key de FlightAware AeroAPI

## Arquitectura

```
src/
├── config/          # Configuración de la aplicación
├── controllers/      # Controladores de rutas (no implementados)
├── database/         # Conexión y queries de base de datos
├── middleware/       # Middleware personalizado
├── models/          # Modelos de datos (no implementados)
├── routes/          # Definición de rutas de API
├── services/        # Lógica de negocio
├── types/           # Definiciones de tipos TypeScript
├── utils/           # Utilidades y helpers
└── server.ts        # Punto de entrada de la aplicación
```

## Servicios Principales

### AircraftService
- Recolección de datos de aeronaves en tiempo real
- Integración con APIs externas
- Cache en memoria y base de datos
- Rate limiting para APIs

### AlertService
- Detección de proximidad y colisiones
- Gestión de alertas de emergencia
- Sistema de cooldown para evitar spam
- Resolución automática de alertas

### SocketService
- Comunicación WebSocket en tiempo real
- Gestión de suscripciones
- Heartbeat y detección de desconexiones
- Broadcast de actualizaciones

## Logging

El sistema utiliza Winston para logging estructurado:

- **Archivos de log**: `logs/aerosynapse.log` y `logs/error.log`
- **Niveles**: error, warn, info, debug
- **Rotación automática** de archivos
- **Logging específico** para HTTP, WebSocket, base de datos, etc.

## Seguridad

- **Helmet.js** para headers de seguridad
- **CORS** configurado
- **Rate limiting** por IP y usuario
- **Validación de entrada** con Joi
- **Autenticación JWT** opcional
- **Sanitización** de datos

## Monitoreo

- Health check endpoint: `GET /health`
- Métricas de servicios disponibles
- Logging de errores y performance
- Estadísticas de WebSocket y APIs

## Desarrollo

### Estructura de Commits

```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
style: formato de código
refactor: refactorización
test: tests
chore: tareas de mantenimiento
```

### Testing

```bash
# Ejecutar todos los tests
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

## Despliegue

### Docker

```dockerfile
# Dockerfile incluido en el proyecto
docker build -t aerosynapse-backend .
docker run -p 3001:3001 aerosynapse-backend
```

### Variables de Entorno de Producción

- Cambiar `JWT_SECRET` por un valor seguro
- Configurar `NODE_ENV=production`
- Usar HTTPS en producción
- Configurar base de datos con SSL
- Configurar logging apropiado

## Troubleshooting

### Problemas Comunes

1. **Error de conexión a base de datos**:
   - Verificar que PostgreSQL esté ejecutándose
   - Verificar credenciales en `.env`
   - Verificar que PostGIS esté instalado

2. **APIs externas no funcionan**:
   - Verificar API keys
   - Verificar rate limits
   - Verificar conectividad a internet

3. **WebSocket no conecta**:
   - Verificar CORS
   - Verificar firewall
   - Verificar URL del frontend

## Contribución

1. Fork del repositorio
2. Crear rama para feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit de cambios: `git commit -am 'Agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## Licencia

MIT License - ver archivo LICENSE para detalles.

## Soporte

Para soporte técnico o preguntas:
- Crear issue en GitHub
- Contactar al equipo de desarrollo
- Revisar documentación en `/docs`