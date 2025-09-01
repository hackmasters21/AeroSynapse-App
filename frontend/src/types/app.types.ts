// Tipos principales para AeroSynapse

// Tipos de tema
export type ThemeMode = 'light' | 'dark' | 'night';

// Tipos de aeronave
export interface Aircraft {
  id: string;
  callsign: string;
  registration?: string;
  icao24: string;
  latitude: number;
  longitude: number;
  altitude: number; // en pies
  velocity: number; // en nudos
  heading: number; // en grados (0-360)
  verticalRate: number; // pies por minuto
  squawk?: string;
  onGround: boolean;
  lastUpdate: Date;
  origin?: string;
  destination?: string;
  aircraftType?: string;
  airline?: string;
  category?: AircraftCategory;
  emergencyStatus?: EmergencyStatus;
}

export enum AircraftCategory {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  SUPER = 'super'
}

export enum EmergencyStatus {
  NONE = 'none',
  GENERAL = 'general',
  MEDICAL = 'medical',
  MINIMUM_FUEL = 'minimum_fuel',
  NO_COMMUNICATIONS = 'no_communications',
  UNLAWFUL_INTERFERENCE = 'unlawful_interference',
  DOWNED_AIRCRAFT = 'downed_aircraft'
}

// Tipos de alerta
export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  aircraftId?: string;
  position?: Position;
  acknowledged: boolean;
  autoResolve: boolean;
  resolvedAt?: Date;
}

export enum AlertType {
  COLLISION_WARNING = 'collision_warning',
  PROXIMITY_ALERT = 'proximity_alert',
  ALTITUDE_DEVIATION = 'altitude_deviation',
  COURSE_DEVIATION = 'course_deviation',
  WEATHER_WARNING = 'weather_warning',
  AIRSPACE_VIOLATION = 'airspace_violation',
  SYSTEM_ERROR = 'system_error',
  DATA_LOSS = 'data_loss'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Tipos geográficos
export interface Position {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Tipos de ruta
export interface Route {
  id: string;
  name: string;
  origin: Airport;
  destination: Airport;
  waypoints: Waypoint[];
  airways: Airway[];
  distance: number; // en millas náuticas
  estimatedTime: number; // en minutos
  estimatedFuel: number; // en galones
  altitude: number; // altitud de crucero
  createdAt: Date;
  updatedAt: Date;
}

export interface Waypoint {
  id: string;
  name: string;
  type: WaypointType;
  position: Position;
  frequency?: number;
  range?: number; // en millas náuticas
  identifier?: string;
  description?: string;
}

export enum WaypointType {
  AIRPORT = 'airport',
  VOR = 'vor',
  DME = 'dme',
  NDB = 'ndb',
  INTERSECTION = 'intersection',
  GPS = 'gps',
  TACAN = 'tacan',
  ILS = 'ils'
}

export interface Airway {
  id: string;
  name: string;
  type: AirwayType;
  waypoints: string[]; // IDs de waypoints
  minimumAltitude: number;
  maximumAltitude: number;
  direction?: 'bidirectional' | 'eastbound' | 'westbound' | 'northbound' | 'southbound';
}

export enum AirwayType {
  VICTOR = 'victor', // VOR airways (low altitude)
  JET = 'jet', // Jet routes (high altitude)
  RNAV = 'rnav', // RNAV routes
  DIRECT = 'direct' // Direct routes
}

// Tipos de aeropuerto
export interface Airport {
  id: string;
  icao: string;
  iata?: string;
  name: string;
  city: string;
  country: string;
  position: Position;
  elevation: number; // en pies
  runways: Runway[];
  frequencies: Frequency[];
  timezone: string;
  type: AirportType;
}

export enum AirportType {
  INTERNATIONAL = 'international',
  DOMESTIC = 'domestic',
  REGIONAL = 'regional',
  GENERAL_AVIATION = 'general_aviation',
  MILITARY = 'military',
  PRIVATE = 'private'
}

export interface Runway {
  id: string;
  name: string;
  heading: number;
  length: number; // en pies
  width: number; // en pies
  surface: RunwaySurface;
  lighting: boolean;
  ils: boolean;
}

export enum RunwaySurface {
  ASPHALT = 'asphalt',
  CONCRETE = 'concrete',
  GRASS = 'grass',
  GRAVEL = 'gravel',
  DIRT = 'dirt',
  WATER = 'water'
}

export interface Frequency {
  id: string;
  type: FrequencyType;
  frequency: number; // en MHz
  description: string;
}

export enum FrequencyType {
  TOWER = 'tower',
  GROUND = 'ground',
  APPROACH = 'approach',
  DEPARTURE = 'departure',
  ATIS = 'atis',
  UNICOM = 'unicom',
  MULTICOM = 'multicom',
  EMERGENCY = 'emergency'
}

// Tipos de espacio aéreo
export interface Airspace {
  id: string;
  name: string;
  type: AirspaceType;
  class: AirspaceClass;
  geometry: GeoJSON.Polygon;
  minimumAltitude: number;
  maximumAltitude: number;
  active: boolean;
  restrictions?: string[];
  frequency?: number;
}

export enum AirspaceType {
  CONTROLLED = 'controlled',
  UNCONTROLLED = 'uncontrolled',
  RESTRICTED = 'restricted',
  PROHIBITED = 'prohibited',
  DANGER = 'danger',
  MILITARY = 'military',
  TEMPORARY = 'temporary'
}

export enum AirspaceClass {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  G = 'G'
}

// Tipos de filtros
export interface TrafficFilter {
  altitudeMin?: number;
  altitudeMax?: number;
  distanceMax?: number; // en millas náuticas
  aircraftTypes?: string[];
  airlines?: string[];
  showOnGround?: boolean;
  showEmergency?: boolean;
}

// Tipos de configuración
export interface AppSettings {
  theme: ThemeMode;
  units: UnitSystem;
  mapProvider: MapProvider;
  updateInterval: number; // en segundos
  alertSounds: boolean;
  voiceAlerts: boolean;
  autoZoom: boolean;
  showTrails: boolean;
  trailLength: number; // en minutos
  proximityDistance: number; // en millas náuticas
  proximityAltitude: number; // en pies
}

export enum UnitSystem {
  METRIC = 'metric',
  IMPERIAL = 'imperial',
  AVIATION = 'aviation'
}

export enum MapProvider {
  OPENSTREETMAP = 'openstreetmap',
  SATELLITE = 'satellite',
  TERRAIN = 'terrain',
  AVIATION = 'aviation'
}

// Tipos de estado de la aplicación
export interface AppState {
  isLoading: boolean;
  isConnected: boolean;
  lastUpdate: Date | null;
  error: string | null;
  aircraft: Aircraft[];
  alerts: Alert[];
  selectedAircraft: string | null;
  currentRoute: Route | null;
  settings: AppSettings;
  filters: TrafficFilter;
}

// Tipos de eventos
export interface AppEvent {
  type: string;
  payload: any;
  timestamp: Date;
}

// Tipos de API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Tipos de WebSocket
export interface SocketMessage {
  type: SocketMessageType;
  payload: any;
  timestamp: Date;
}

export enum SocketMessageType {
  AIRCRAFT_UPDATE = 'aircraft_update',
  AIRCRAFT_REMOVED = 'aircraft_removed',
  ALERT_NEW = 'alert_new',
  ALERT_RESOLVED = 'alert_resolved',
  SYSTEM_STATUS = 'system_status',
  WEATHER_UPDATE = 'weather_update'
}