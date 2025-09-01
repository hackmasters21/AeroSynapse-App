# AeroSynapse - Sistema Integrado de Conciencia Situacional y Planificación de Vuelo

**AeroSynapse** es una herramienta web avanzada de conciencia situacional y planificación de vuelo diseñada para pilotos profesionales y de aviación general. Combina datos de tráfico aéreo en tiempo real, información meteorológica multi-fuente, planificación de rutas y análisis de seguridad histórica en una interfaz web unificada y profesional.

## 🚀 Características Principales

### 🛩️ Tráfico Aéreo en Tiempo Real
- Visualización de aeronaves en tiempo real tipo FlightRadar24
- Información detallada de cada aeronave (matrícula, tipo, origen/destino)
- Filtros avanzados por altitud, tipo de aeronave, compañía
- Alertas de proximidad y detección de conflictos

### ⚠️ Sistema de Prevención de Colisiones (TCAS-like)
- Algoritmos avanzados de detección de proximidad
- Alertas visuales y auditivas de conflictos potenciales
- Cálculo de tiempo hasta aproximación más cercana
- Sugerencias de resolución basadas en reglas del aire

### 🌦️ Módulo de Meteorología Avanzada
- **Agregación multi-fuente** de datos meteorológicos (AWC, NOAA, EUMETSAT, RainViewer)
- **Sistema de confianza** que evalúa la concordancia entre fuentes
- **METARs, TAFs y SIGMETs** en tiempo real
- **Overlays meteorológicos** (radar, satélite, vientos en altura)
- **Índice de confianza** para toma de decisiones informada

### 🛡️ Módulo de Seguridad e Historial de Accidentes
- **Base de datos de accidentes** (NTSB, Aviation Safety Network)
- **Análisis de riesgo por ubicación** con factores múltiples
- **Visualización de accidentes históricos** en el mapa
- **Estadísticas de seguridad** y tendencias temporales
- **Alertas de seguridad** automáticas por clusters de accidentes

### 🗺️ Planificación de Rutas Inteligente
- Calculadora de rutas directas y por airways
- Base de datos completa de aeropuertos y waypoints
- Información de combustible, tiempo y distancia
- Integración con cartas de navegación

### 🌐 Información de Espacios Aéreos (FIR)
- Visualización de fronteras FIR, CTR, TMA
- Base de datos de radioayudas (VOR, DME, NDB, ILS)
- Espacios aéreos restringidos y peligrosos
- Frecuencias y procedimientos específicos

### 🌍 Soporte Multiidioma
- **Inglés, Español, Portugués y Francés**
- **Cambio dinámico** de idioma con selector visual
- **Inglés por defecto** - los usuarios pueden cambiar al idioma preferido
- **Interfaz completamente traducida**

### 🎨 Interfaz de Usuario Profesional
- **Modo noche** optimizado para cabina
- **Paneles redimensionables** y personalizables
- **Colores estándar de aviación** para interpretación rápida
- **Responsive design** para diferentes dispositivos
- **Herramienta web** accesible desde cualquier navegador

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** con TypeScript
- **Material-UI** para componentes
- **Leaflet** para mapas interactivos
- **Socket.IO** para comunicación en tiempo real
- **React-i18next** para internacionalización
- **Context API** para gestión de estado

### Backend
- **Node.js** con Express y TypeScript
- **PostgreSQL** con PostGIS para datos geoespaciales
- **Socket.IO** para WebSocket
- **Winston** para logging
- **Joi** para validación de datos
- **APIs externas** para datos meteorológicos y de seguridad

## 📁 Estructura del Proyecto

```
AeroSynapse/
├── frontend/          # Aplicación React Web
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── contexts/      # Contextos de estado
│   │   ├── hooks/         # Hooks personalizados
│   │   ├── i18n/          # Sistema de internacionalización
│   │   ├── services/      # Servicios de API
│   │   ├── types/         # Tipos TypeScript
│   │   └── utils/         # Utilidades
│   └── public/        # Archivos estáticos
├── backend/           # API y servicios
│   ├── src/
│   │   ├── config/        # Configuración
│   │   ├── database/      # Base de datos
│   │   ├── middleware/    # Middleware
│   │   ├── routes/        # Rutas de API
│   │   ├── services/      # Lógica de negocio
│   │   └── utils/         # Utilidades
│   └── .env.example   # Variables de entorno
├── docs/              # Documentación
└── README.md          # Este archivo
```

## 🌐 URLs de Acceso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## 🌍 Soporte de Idiomas

La aplicación inicia en **inglés por defecto** y los usuarios pueden cambiar al idioma preferido usando el selector de idioma en la interfaz:
- 🇺🇸 **English** (Por defecto)
- 🇪🇸 **Español**
- 🇧🇷 **Português**
- 🇫🇷 **Français**

## 📖 Documentación

- [README en Inglés](README.en.md)
- [README en Español](README.md)
- [README en Portugués](README.pt.md)
- [README en Francés](README.fr.md)
- [Documentación del Backend](backend/README.md)

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18 o superior
- PostgreSQL 14+ con PostGIS
- npm o yarn

### Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone <repository-url>
   cd AeroSynapse
   ```

2. **Instalar dependencias del frontend:**
   ```bash
   cd frontend
   npm install
   ```

3. **Instalar dependencias del backend:**
   ```bash
   cd ../backend
   npm install
   ```

4. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

5. **Configurar base de datos PostgreSQL:**
   ```sql
   CREATE DATABASE aerosynapse;
   CREATE USER aerosynapse_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE aerosynapse TO aerosynapse_user;
   
   -- Conectar a la base de datos y habilitar PostGIS
   \c aerosynapse
   CREATE EXTENSION postgis;
   ```

6. **Compilar TypeScript:**
   ```bash
   npm run build
   ```

7. **Iniciar servicios:**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev
   
   # Terminal 2: Frontend
   cd frontend
   npm start
   ```

## 🤝 Contribución

1. Fork del repositorio
2. Crear rama para feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit de cambios: `git commit -am 'Agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles.

## 🆘 Soporte

Para soporte técnico o preguntas:
- Crear issue en GitHub
- Contactar al equipo de desarrollo
- Revisar documentación en `/docs`

---

**AeroSynapse** - Herramienta profesional de conciencia situacional y planificación de vuelo para aviación.