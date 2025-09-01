# AeroSynapse - Integrated Situational Awareness and Flight Planning System

**AeroSynapse** is an advanced web-based situational awareness and flight planning tool designed for professional and general aviation pilots. It combines real-time air traffic data, multi-source weather information, route planning, and historical safety analysis in a unified and professional web interface.

## 🚀 Main Features

### 🛩️ Real-Time Air Traffic
- FlightRadar24-style real-time aircraft visualization
- Detailed information for each aircraft (registration, type, origin/destination)
- Advanced filters by altitude, aircraft type, airline
- Proximity alerts and conflict detection

### ⚠️ Collision Avoidance System (TCAS-like)
- Advanced proximity detection algorithms
- Visual and auditory alerts for potential conflicts
- Time to closest approach calculation
- Resolution suggestions based on air traffic rules

### 🌦️ Advanced Weather Module
- **Multi-source aggregation** of weather data (AWC, NOAA, EUMETSAT, RainViewer)
- **Confidence system** that evaluates agreement between sources
- **METARs, TAFs and SIGMETs** in real time
- **Weather overlays** (radar, satellite, winds aloft)
- **Confidence index** for informed decision making

### 🛡️ Safety and Accident History Module
- **Accident database** (NTSB, Aviation Safety Network)
- **Location risk analysis** with multiple factors
- **Historical accident visualization** on the map
- **Safety statistics** and temporal trends
- **Automatic safety alerts** for accident clusters

### 🗺️ Intelligent Route Planning
- Direct and airways route calculator
- Complete database of airports and waypoints
- Fuel, time and distance information
- Integration with navigation charts

### 🌐 Airspace Information (FIR)
- Visualization of FIR, CTR, TMA boundaries
- Navigation aids database (VOR, DME, NDB, ILS)
- Restricted and dangerous airspaces
- Specific frequencies and procedures

### 🌍 Multi-language Support
- **English, Spanish, Portuguese and French**
- **Dynamic language switching**
- **Automatic browser language detection**
- **Fully translated interface**

### 🎨 Professional User Interface
- **Night mode** optimized for cockpit
- **Resizable and customizable panels**
- **Standard aviation colors** for quick interpretation
- **Responsive design** for different devices
- **Web tool** accessible from any browser

## 🛠️ Technologies Used

### Frontend
- **React 18** with TypeScript
- **Material-UI** for components
- **Leaflet** for interactive maps
- **Socket.IO** for real-time communication
- **React-i18next** for internationalization
- **Context API** for state management

### Backend
- **Node.js** with Express and TypeScript
- **PostgreSQL** with PostGIS for geospatial data
- **Socket.IO** for WebSocket
- **Winston** for logging
- **Joi** for data validation
- **External APIs** for weather and safety data

## 📁 Project Structure

```
AeroSynapse/
├── frontend/          # React Web Application
│   ├── src/
│   │   ├── components/    # React Components
│   │   ├── contexts/      # State Contexts
│   │   ├── hooks/         # Custom Hooks
│   │   ├── i18n/          # Internationalization System
│   │   ├── services/      # API Services
│   │   ├── types/         # TypeScript Types
│   │   └── utils/         # Utilities
│   └── public/        # Static Files
├── backend/           # API and Services
│   ├── src/
│   │   ├── config/        # Configuration
│   │   ├── database/      # Database
│   │   ├── middleware/    # Middleware
│   │   ├── routes/        # API Routes
│   │   ├── services/      # Business Logic
│   │   └── utils/         # Utilities
│   └── .env.example   # Environment Variables
├── docs/              # Documentation
└── README.md          # This File
```

## 🚀 Installation and Configuration

### Prerequisites
- Node.js 18 or higher
- PostgreSQL 14+ with PostGIS
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd AeroSynapse
   ```

2. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies:**
   ```bash
   cd ../backend
   npm install
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configurations
   ```

5. **Configure PostgreSQL database:**
   ```sql
   CREATE DATABASE aerosynapse;
   CREATE USER aerosynapse_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE aerosynapse TO aerosynapse_user;
   
   -- Connect to database and enable PostGIS
   \c aerosynapse
   CREATE EXTENSION postgis;
   ```

6. **Compile TypeScript:**
   ```bash
   npm run build
   ```

7. **Start services:**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev
   
   # Terminal 2: Frontend
   cd frontend
   npm start
   ```

## 🌐 Access URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health

## 🌍 Language Support

The application automatically detects the browser language and supports:
- 🇺🇸 **English** (Default)
- 🇪🇸 **Spanish**
- 🇧🇷 **Portuguese**
- 🇫🇷 **French**

Users can change the language using the language selector in the interface.

## 📖 Documentation

- [English README](README.en.md)
- [Spanish README](README.md)
- [Portuguese README](README.pt.md)
- [French README](README.fr.md)
- [Backend Documentation](backend/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For technical support or questions:
- Create an issue on GitHub
- Contact the development team
- Review documentation in `/docs`

---

**AeroSynapse** - Professional aviation situational awareness and flight planning tool.