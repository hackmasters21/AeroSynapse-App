// Airport Service with real-world data and flight time calculations
// Data sources: OpenFlights, ICAO, FAA Performance Databases

export interface Airport {
  id: string;
  name: string;
  city: string;
  country: string;
  iata: string | null;
  icao: string | null;
  latitude: number;
  longitude: number;
  altitude: number; // feet
  timezone: number;
  dst: string;
  tzDatabase: string;
  type: string;
  source: string;
}

export interface AircraftPerformance {
  type: string;
  category: 'commercial' | 'business' | 'general' | 'regional';
  cruiseSpeed: number; // knots
  cruiseSpeedMach?: number;
  serviceCeiling: number; // feet
  fuelBurnRate: number; // gallons per hour
  climbRate: number; // feet per minute
  descentRate: number; // feet per minute
  manufacturer: string;
  engines: number;
  maxRange: number; // nautical miles
}

export interface FlightCalculation {
  distance: number; // nautical miles
  flightTime: number; // minutes
  fuelRequired: number; // gallons
  climbTime: number; // minutes
  cruiseTime: number; // minutes
  descentTime: number; // minutes
  optimalAltitude: number; // feet
  alternateAirports: Airport[];
}

// Aircraft performance database based on public FAA and manufacturer data
const AIRCRAFT_PERFORMANCE: { [key: string]: AircraftPerformance } = {
  // Commercial Aircraft
  'B737-800': {
    type: 'Boeing 737-800',
    category: 'commercial',
    cruiseSpeed: 453, // knots TAS
    cruiseSpeedMach: 0.785,
    serviceCeiling: 41000,
    fuelBurnRate: 850, // gallons/hour
    climbRate: 2500,
    descentRate: 2000,
    manufacturer: 'Boeing',
    engines: 2,
    maxRange: 3115
  },
  'A320': {
    type: 'Airbus A320',
    category: 'commercial',
    cruiseSpeed: 447,
    cruiseSpeedMach: 0.78,
    serviceCeiling: 39800,
    fuelBurnRate: 800,
    climbRate: 2200,
    descentRate: 1800,
    manufacturer: 'Airbus',
    engines: 2,
    maxRange: 3300
  },
  'B777-300ER': {
    type: 'Boeing 777-300ER',
    category: 'commercial',
    cruiseSpeed: 490,
    cruiseSpeedMach: 0.84,
    serviceCeiling: 43100,
    fuelBurnRate: 2400,
    climbRate: 2000,
    descentRate: 1500,
    manufacturer: 'Boeing',
    engines: 2,
    maxRange: 7930
  },
  'A380': {
    type: 'Airbus A380',
    category: 'commercial',
    cruiseSpeed: 488,
    cruiseSpeedMach: 0.85,
    serviceCeiling: 43000,
    fuelBurnRate: 4600,
    climbRate: 1500,
    descentRate: 1200,
    manufacturer: 'Airbus',
    engines: 4,
    maxRange: 8200
  },
  // Business Jets
  'G650': {
    type: 'Gulfstream G650',
    category: 'business',
    cruiseSpeed: 488,
    cruiseSpeedMach: 0.85,
    serviceCeiling: 51000,
    fuelBurnRate: 358,
    climbRate: 4000,
    descentRate: 3000,
    manufacturer: 'Gulfstream',
    engines: 2,
    maxRange: 7000
  },
  'CJ4': {
    type: 'Citation CJ4',
    category: 'business',
    cruiseSpeed: 451,
    cruiseSpeedMach: 0.77,
    serviceCeiling: 45000,
    fuelBurnRate: 202,
    climbRate: 3500,
    descentRate: 2500,
    manufacturer: 'Cessna',
    engines: 2,
    maxRange: 2165
  },
  'PC12': {
    type: 'Pilatus PC-12',
    category: 'business',
    cruiseSpeed: 280,
    serviceCeiling: 30000,
    fuelBurnRate: 75,
    climbRate: 1920,
    descentRate: 1500,
    manufacturer: 'Pilatus',
    engines: 1,
    maxRange: 1560
  },
  // General Aviation - Cessna Family
  'C172': {
    type: 'Cessna 172',
    category: 'general',
    cruiseSpeed: 122,
    serviceCeiling: 14200,
    fuelBurnRate: 8.5,
    climbRate: 720,
    descentRate: 500,
    manufacturer: 'Cessna',
    engines: 1,
    maxRange: 696
  },
  'C152': {
    type: 'Cessna 152',
    category: 'general',
    cruiseSpeed: 107,
    serviceCeiling: 14700,
    fuelBurnRate: 6.1,
    climbRate: 715,
    descentRate: 500,
    manufacturer: 'Cessna',
    engines: 1,
    maxRange: 477
  },
  'C182': {
    type: 'Cessna 182',
    category: 'general',
    cruiseSpeed: 145,
    serviceCeiling: 18100,
    fuelBurnRate: 13.5,
    climbRate: 924,
    descentRate: 600,
    manufacturer: 'Cessna',
    engines: 1,
    maxRange: 915
  },
  'C206': {
    type: 'Cessna 206',
    category: 'general',
    cruiseSpeed: 155,
    serviceCeiling: 15800,
    fuelBurnRate: 17.5,
    climbRate: 920,
    descentRate: 700,
    manufacturer: 'Cessna',
    engines: 1,
    maxRange: 840
  },
  'C208': {
    type: 'Cessna 208 Caravan',
    category: 'general',
    cruiseSpeed: 186,
    serviceCeiling: 25000,
    fuelBurnRate: 48,
    climbRate: 924,
    descentRate: 800,
    manufacturer: 'Cessna',
    engines: 1,
    maxRange: 1070
  },
  'C210': {
    type: 'Cessna 210',
    category: 'general',
    cruiseSpeed: 174,
    serviceCeiling: 17300,
    fuelBurnRate: 15.8,
    climbRate: 950,
    descentRate: 700,
    manufacturer: 'Cessna',
    engines: 1,
    maxRange: 1050
  },
  'C310': {
    type: 'Cessna 310',
    category: 'general',
    cruiseSpeed: 220,
    serviceCeiling: 20000,
    fuelBurnRate: 31,
    climbRate: 1662,
    descentRate: 1000,
    manufacturer: 'Cessna',
    engines: 2,
    maxRange: 1200
  },
  'C340': {
    type: 'Cessna 340',
    category: 'general',
    cruiseSpeed: 244,
    serviceCeiling: 29800,
    fuelBurnRate: 38,
    climbRate: 1650,
    descentRate: 1200,
    manufacturer: 'Cessna',
    engines: 2,
    maxRange: 1400
  },
  'C414': {
    type: 'Cessna 414',
    category: 'general',
    cruiseSpeed: 235,
    serviceCeiling: 30200,
    fuelBurnRate: 40,
    climbRate: 1520,
    descentRate: 1100,
    manufacturer: 'Cessna',
    engines: 2,
    maxRange: 1320
  },
  'C421': {
    type: 'Cessna 421',
    category: 'general',
    cruiseSpeed: 240,
    serviceCeiling: 30200,
    fuelBurnRate: 42,
    climbRate: 1540,
    descentRate: 1150,
    manufacturer: 'Cessna',
    engines: 2,
    maxRange: 1350
  },

  // Piper Family
  'PA28': {
    type: 'Piper Cherokee PA-28',
    category: 'general',
    cruiseSpeed: 125,
    serviceCeiling: 14000,
    fuelBurnRate: 9.2,
    climbRate: 660,
    descentRate: 500,
    manufacturer: 'Piper',
    engines: 1,
    maxRange: 630
  },
  'PA28R': {
    type: 'Piper Arrow PA-28R',
    category: 'general',
    cruiseSpeed: 147,
    serviceCeiling: 17000,
    fuelBurnRate: 11.5,
    climbRate: 875,
    descentRate: 600,
    manufacturer: 'Piper',
    engines: 1,
    maxRange: 780
  },
  'PA32': {
    type: 'Piper Saratoga PA-32',
    category: 'general',
    cruiseSpeed: 165,
    serviceCeiling: 17500,
    fuelBurnRate: 16.5,
    climbRate: 1050,
    descentRate: 700,
    manufacturer: 'Piper',
    engines: 1,
    maxRange: 920
  },
  'PA34': {
    type: 'Piper Seneca PA-34',
    category: 'general',
    cruiseSpeed: 225,
    serviceCeiling: 25000,
    fuelBurnRate: 32,
    climbRate: 1460,
    descentRate: 1000,
    manufacturer: 'Piper',
    engines: 2,
    maxRange: 1180
  },
  'PA44': {
    type: 'Piper Seminole PA-44',
    category: 'general',
    cruiseSpeed: 160,
    serviceCeiling: 17800,
    fuelBurnRate: 20,
    climbRate: 1340,
    descentRate: 800,
    manufacturer: 'Piper',
    engines: 2,
    maxRange: 925
  },
  'PA46': {
    type: 'Piper Malibu PA-46',
    category: 'general',
    cruiseSpeed: 213,
    serviceCeiling: 25000,
    fuelBurnRate: 20.5,
    climbRate: 1143,
    descentRate: 900,
    manufacturer: 'Piper',
    engines: 1,
    maxRange: 1343
  },
  'PA46T': {
    type: 'Piper Meridian PA-46T',
    category: 'general',
    cruiseSpeed: 260,
    serviceCeiling: 30000,
    fuelBurnRate: 35,
    climbRate: 1218,
    descentRate: 1000,
    manufacturer: 'Piper',
    engines: 1,
    maxRange: 1000
  },

  // Mooney Family
  'M20C': {
    type: 'Mooney M20C',
    category: 'general',
    cruiseSpeed: 150,
    serviceCeiling: 18500,
    fuelBurnRate: 10.5,
    climbRate: 915,
    descentRate: 600,
    manufacturer: 'Mooney',
    engines: 1,
    maxRange: 800
  },
  'M20J': {
    type: 'Mooney M20J',
    category: 'general',
    cruiseSpeed: 175,
    serviceCeiling: 18000,
    fuelBurnRate: 11.8,
    climbRate: 1030,
    descentRate: 700,
    manufacturer: 'Mooney',
    engines: 1,
    maxRange: 925
  },
  'M20K': {
    type: 'Mooney M20K',
    category: 'general',
    cruiseSpeed: 195,
    serviceCeiling: 25000,
    fuelBurnRate: 13.5,
    climbRate: 1080,
    descentRate: 800,
    manufacturer: 'Mooney',
    engines: 1,
    maxRange: 1050
  },
  'M20R': {
    type: 'Mooney Ovation M20R',
    category: 'general',
    cruiseSpeed: 190,
    serviceCeiling: 25000,
    fuelBurnRate: 15.2,
    climbRate: 1120,
    descentRate: 800,
    manufacturer: 'Mooney',
    engines: 1,
    maxRange: 1150
  },
  'M20TN': {
    type: 'Mooney Acclaim M20TN',
    category: 'general',
    cruiseSpeed: 242,
    serviceCeiling: 25000,
    fuelBurnRate: 18.5,
    climbRate: 1200,
    descentRate: 900,
    manufacturer: 'Mooney',
    engines: 1,
    maxRange: 1300
  },

  // King Air Family
  'BE90': {
    type: 'Beechcraft King Air 90',
    category: 'business',
    cruiseSpeed: 250,
    serviceCeiling: 28100,
    fuelBurnRate: 65,
    climbRate: 1940,
    descentRate: 1200,
    manufacturer: 'Beechcraft',
    engines: 2,
    maxRange: 1200
  },
  'BE200': {
    type: 'Beechcraft King Air 200',
    category: 'business',
    cruiseSpeed: 310,
    serviceCeiling: 35000,
    fuelBurnRate: 125,
    climbRate: 2280,
    descentRate: 1500,
    manufacturer: 'Beechcraft',
    engines: 2,
    maxRange: 1930
  },
  'BE300': {
    type: 'Beechcraft King Air 300',
    category: 'business',
    cruiseSpeed: 315,
    serviceCeiling: 35000,
    fuelBurnRate: 130,
    climbRate: 2250,
    descentRate: 1500,
    manufacturer: 'Beechcraft',
    engines: 2,
    maxRange: 1806
  },
  'BE350': {
    type: 'Beechcraft King Air 350',
    category: 'business',
    cruiseSpeed: 312,
    serviceCeiling: 35000,
    fuelBurnRate: 135,
    climbRate: 2200,
    descentRate: 1500,
    manufacturer: 'Beechcraft',
    engines: 2,
    maxRange: 1806
  },
  'BE350i': {
    type: 'Beechcraft King Air 350i',
    category: 'business',
    cruiseSpeed: 315,
    serviceCeiling: 35000,
    fuelBurnRate: 138,
    climbRate: 2200,
    descentRate: 1500,
    manufacturer: 'Beechcraft',
    engines: 2,
    maxRange: 1800
  },
  'BE250': {
    type: 'Beechcraft King Air 250',
    category: 'business',
    cruiseSpeed: 310,
    serviceCeiling: 35000,
    fuelBurnRate: 120,
    climbRate: 2300,
    descentRate: 1500,
    manufacturer: 'Beechcraft',
    engines: 2,
    maxRange: 1720
  },
  'BE260': {
    type: 'Beechcraft King Air 260',
    category: 'business',
    cruiseSpeed: 315,
    serviceCeiling: 35000,
    fuelBurnRate: 125,
    climbRate: 2250,
    descentRate: 1500,
    manufacturer: 'Beechcraft',
    engines: 2,
    maxRange: 1720
  },
  'BE100': {
    type: 'Beechcraft King Air 100',
    category: 'business',
    cruiseSpeed: 248,
    serviceCeiling: 27400,
    fuelBurnRate: 60,
    climbRate: 1850,
    descentRate: 1200,
    manufacturer: 'Beechcraft',
    engines: 2,
    maxRange: 1100
  },

  // Cessna Citation Family
  'C500': {
    type: 'Cessna Citation I',
    category: 'business',
    cruiseSpeed: 357,
    serviceCeiling: 41000,
    fuelBurnRate: 150,
    climbRate: 3000,
    descentRate: 2000,
    manufacturer: 'Cessna',
    engines: 2,
    maxRange: 1200
  },
  'C501': {
    type: 'Cessna Citation I/SP',
    category: 'business',
    cruiseSpeed: 365,
    serviceCeiling: 41000,
    fuelBurnRate: 155,
    climbRate: 3100,
    descentRate: 2000,
    manufacturer: 'Cessna',
    engines: 2,
    maxRange: 1250
  },
  'C525': {
    type: 'Cessna CitationJet CJ1',
    category: 'business',
    cruiseSpeed: 389,
    serviceCeiling: 41000,
    fuelBurnRate: 132,
    climbRate: 3560,
    descentRate: 2200,
    manufacturer: 'Cessna',
    engines: 2,
    maxRange: 1200
  },
  'C525A': {
    type: 'Cessna CitationJet CJ2',
    category: 'business',
    cruiseSpeed: 404,
    serviceCeiling: 45000,
    fuelBurnRate: 165,
    climbRate: 3700,
    descentRate: 2300,
    manufacturer: 'Cessna',
    engines: 2,
    maxRange: 1550
  },
  'C525B': {
    type: 'Cessna CitationJet CJ3',
    category: 'business',
    cruiseSpeed: 417,
    serviceCeiling: 45000,
    fuelBurnRate: 180,
    climbRate: 3560,
    descentRate: 2400,
    manufacturer: 'Cessna',
    engines: 2,
    maxRange: 1875
  },
  'C525C': {
    type: 'Cessna CitationJet CJ4',
    category: 'business',
    cruiseSpeed: 451,
    serviceCeiling: 45000,
    fuelBurnRate: 202,
    climbRate: 3500,
    descentRate: 2500,
    manufacturer: 'Cessna',
    engines: 2,
    maxRange: 2165
  },
  'C550': {
    type: 'Cessna Citation II',
    category: 'business',
    cruiseSpeed: 417,
    serviceCeiling: 43000,
    fuelBurnRate: 190,
    climbRate: 3200,
    descentRate: 2100,
    manufacturer: 'Cessna',
    engines: 2,
    maxRange: 1550
  },
  'C560': {
    type: 'Cessna Citation V',
    category: 'business',
    cruiseSpeed: 446,
    serviceCeiling: 45000,
    fuelBurnRate: 220,
    climbRate: 3400,
    descentRate: 2200,
    manufacturer: 'Cessna',
    engines: 2,
    maxRange: 2000
  },
  'C650': {
    type: 'Cessna Citation III',
    category: 'business',
    cruiseSpeed: 473,
    serviceCeiling: 51000,
    fuelBurnRate: 280,
    climbRate: 3650,
    descentRate: 2500,
    manufacturer: 'Cessna',
    engines: 2,
    maxRange: 2500
  },
  'C680': {
    type: 'Cessna Citation Sovereign',
    category: 'business',
    cruiseSpeed: 458,
    serviceCeiling: 47000,
    fuelBurnRate: 270,
    climbRate: 3707,
    descentRate: 2400,
    manufacturer: 'Cessna',
    engines: 2,
    maxRange: 3200
  },
  'C700': {
    type: 'Cessna Citation Longitude',
    category: 'business',
    cruiseSpeed: 476,
    serviceCeiling: 45000,
    fuelBurnRate: 320,
    climbRate: 3900,
    descentRate: 2600,
    manufacturer: 'Cessna',
    engines: 2,
    maxRange: 3500
  },
  'C750': {
    type: 'Cessna Citation X',
    category: 'business',
    cruiseSpeed: 527,
    cruiseSpeedMach: 0.92,
    serviceCeiling: 51000,
    fuelBurnRate: 350,
    climbRate: 3560,
    descentRate: 2800,
    manufacturer: 'Cessna',
    engines: 2,
    maxRange: 3460
  },
  // Regional Aircraft
  'E175': {
    type: 'Embraer E175',
    category: 'regional',
    cruiseSpeed: 447,
    cruiseSpeedMach: 0.78,
    serviceCeiling: 41000,
    fuelBurnRate: 570,
    climbRate: 2800,
    descentRate: 2200,
    manufacturer: 'Embraer',
    engines: 2,
    maxRange: 2200
  },
  'CRJ900': {
    type: 'Bombardier CRJ900',
    category: 'regional',
    cruiseSpeed: 447,
    cruiseSpeedMach: 0.78,
    serviceCeiling: 41000,
    fuelBurnRate: 525,
    climbRate: 2900,
    descentRate: 2100,
    manufacturer: 'Bombardier',
    engines: 2,
    maxRange: 1553
  }
};

// Comprehensive world airports database (based on OurAirports and OpenFlights data)
const WORLD_AIRPORTS: Airport[] = [
  // North America
  {
    id: '3830', name: 'John F Kennedy International Airport', city: 'New York', country: 'United States',
    iata: 'JFK', icao: 'KJFK', latitude: 40.639751, longitude: -73.778925, altitude: 13,
    timezone: -5, dst: 'A', tzDatabase: 'America/New_York', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3484', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States',
    iata: 'LAX', icao: 'KLAX', latitude: 33.942536, longitude: -118.408075, altitude: 125,
    timezone: -8, dst: 'A', tzDatabase: 'America/Los_Angeles', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3364', name: 'Hartsfield Jackson Atlanta International Airport', city: 'Atlanta', country: 'United States',
    iata: 'ATL', icao: 'KATL', latitude: 33.636719, longitude: -84.428067, altitude: 1026,
    timezone: -5, dst: 'A', tzDatabase: 'America/New_York', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3370', name: 'Chicago O\'Hare International Airport', city: 'Chicago', country: 'United States',
    iata: 'ORD', icao: 'KORD', latitude: 41.978603, longitude: -87.904842, altitude: 672,
    timezone: -6, dst: 'A', tzDatabase: 'America/Chicago', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3577', name: 'Miami International Airport', city: 'Miami', country: 'United States',
    iata: 'MIA', icao: 'KMIA', latitude: 25.79325, longitude: -80.290556, altitude: 8,
    timezone: -5, dst: 'A', tzDatabase: 'America/New_York', type: 'airport', source: 'OurAirports'
  },
  {
    id: '193', name: 'Toronto Pearson International Airport', city: 'Toronto', country: 'Canada',
    iata: 'YYZ', icao: 'CYYZ', latitude: 43.677223, longitude: -79.630556, altitude: 569,
    timezone: -5, dst: 'A', tzDatabase: 'America/Toronto', type: 'airport', source: 'OurAirports'
  },
  // Europe
  {
    id: '507', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom',
    iata: 'LHR', icao: 'EGLL', latitude: 51.4706, longitude: -0.461941, altitude: 83,
    timezone: 0, dst: 'E', tzDatabase: 'Europe/London', type: 'airport', source: 'OurAirports'
  },
  {
    id: '1382', name: 'Charles de Gaulle International Airport', city: 'Paris', country: 'France',
    iata: 'CDG', icao: 'LFPG', latitude: 49.012779, longitude: 2.55, altitude: 392,
    timezone: 1, dst: 'E', tzDatabase: 'Europe/Paris', type: 'airport', source: 'OurAirports'
  },
  {
    id: '340', name: 'Frankfurt am Main Airport', city: 'Frankfurt', country: 'Germany',
    iata: 'FRA', icao: 'EDDF', latitude: 50.033333, longitude: 8.570556, altitude: 364,
    timezone: 1, dst: 'E', tzDatabase: 'Europe/Berlin', type: 'airport', source: 'OurAirports'
  },
  {
    id: '1555', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands',
    iata: 'AMS', icao: 'EHAM', latitude: 52.308613, longitude: 4.763889, altitude: -11,
    timezone: 1, dst: 'E', tzDatabase: 'Europe/Amsterdam', type: 'airport', source: 'OurAirports'
  },
  {
    id: '1229', name: 'Madrid Barajas International Airport', city: 'Madrid', country: 'Spain',
    iata: 'MAD', icao: 'LEMD', latitude: 40.471926, longitude: -3.56264, altitude: 1998,
    timezone: 1, dst: 'E', tzDatabase: 'Europe/Madrid', type: 'airport', source: 'OurAirports'
  },
  {
    id: '1380', name: 'Rome Fiumicino Airport', city: 'Rome', country: 'Italy',
    iata: 'FCO', icao: 'LIRF', latitude: 41.8002778, longitude: 12.2388889, altitude: 13,
    timezone: 1, dst: 'E', tzDatabase: 'Europe/Rome', type: 'airport', source: 'OurAirports'
  },
  // Asia
  {
    id: '2406', name: 'Tokyo Haneda International Airport', city: 'Tokyo', country: 'Japan',
    iata: 'HND', icao: 'RJTT', latitude: 35.552258, longitude: 139.779694, altitude: 35,
    timezone: 9, dst: 'N', tzDatabase: 'Asia/Tokyo', type: 'airport', source: 'OurAirports'
  },
  {
    id: '2408', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan',
    iata: 'NRT', icao: 'RJAA', latitude: 35.764722, longitude: 140.386389, altitude: 141,
    timezone: 9, dst: 'N', tzDatabase: 'Asia/Tokyo', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3077', name: 'Beijing Capital International Airport', city: 'Beijing', country: 'China',
    iata: 'PEK', icao: 'ZBAA', latitude: 40.080111, longitude: 116.584556, altitude: 116,
    timezone: 8, dst: 'N', tzDatabase: 'Asia/Shanghai', type: 'airport', source: 'OurAirports'
  },
  {
    id: '2207', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore',
    iata: 'SIN', icao: 'WSSS', latitude: 1.350189, longitude: 103.994433, altitude: 22,
    timezone: 8, dst: 'N', tzDatabase: 'Asia/Singapore', type: 'airport', source: 'OurAirports'
  },
  {
    id: '2299', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong',
    iata: 'HKG', icao: 'VHHH', latitude: 22.308919, longitude: 113.914603, altitude: 28,
    timezone: 8, dst: 'N', tzDatabase: 'Asia/Hong_Kong', type: 'airport', source: 'OurAirports'
  },
  // Middle East
  {
    id: '2188', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates',
    iata: 'DXB', icao: 'OMDB', latitude: 25.252778, longitude: 55.364444, altitude: 62,
    timezone: 4, dst: 'N', tzDatabase: 'Asia/Dubai', type: 'airport', source: 'OurAirports'
  },
  {
    id: '2194', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar',
    iata: 'DOH', icao: 'OTHH', latitude: 25.273056, longitude: 51.608056, altitude: 13,
    timezone: 3, dst: 'N', tzDatabase: 'Asia/Qatar', type: 'airport', source: 'OurAirports'
  },
  // South America
  {
    id: '2564', name: 'São Paulo-Guarulhos International Airport', city: 'São Paulo', country: 'Brazil',
    iata: 'GRU', icao: 'SBGR', latitude: -23.435556, longitude: -46.473056, altitude: 2459,
    timezone: -3, dst: 'S', tzDatabase: 'America/Sao_Paulo', type: 'airport', source: 'OurAirports'
  },
  {
    id: '2799', name: 'Jorge Newbery Airfield', city: 'Buenos Aires', country: 'Argentina',
    iata: 'AEP', icao: 'SABE', latitude: -34.559200, longitude: -58.415600, altitude: 18,
    timezone: -3, dst: 'S', tzDatabase: 'America/Argentina/Buenos_Aires', type: 'airport', source: 'OurAirports'
  },
  // Africa
  {
    id: '1566', name: 'OR Tambo International Airport', city: 'Johannesburg', country: 'South Africa',
    iata: 'JNB', icao: 'FAOR', latitude: -26.139166, longitude: 28.246, altitude: 5558,
    timezone: 2, dst: 'N', tzDatabase: 'Africa/Johannesburg', type: 'airport', source: 'OurAirports'
  },
  {
    id: '1128', name: 'Cairo International Airport', city: 'Cairo', country: 'Egypt',
    iata: 'CAI', icao: 'HECA', latitude: 30.121944, longitude: 31.405556, altitude: 382,
    timezone: 2, dst: 'N', tzDatabase: 'Africa/Cairo', type: 'airport', source: 'OurAirports'
  },
  // Oceania
  {
    id: '3361', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia',
    iata: 'SYD', icao: 'YSSY', latitude: -33.946111, longitude: 151.177222, altitude: 21,
    timezone: 10, dst: 'O', tzDatabase: 'Australia/Sydney', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3321', name: 'Melbourne Airport', city: 'Melbourne', country: 'Australia',
    iata: 'MEL', icao: 'YMML', latitude: -37.673333, longitude: 144.843333, altitude: 434,
    timezone: 10, dst: 'O', tzDatabase: 'Australia/Melbourne', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3322', name: 'Brisbane Airport', city: 'Brisbane', country: 'Australia',
    iata: 'BNE', icao: 'YBBN', latitude: -27.384167, longitude: 153.1175, altitude: 13,
    timezone: 10, dst: 'O', tzDatabase: 'Australia/Brisbane', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3323', name: 'Perth Airport', city: 'Perth', country: 'Australia',
    iata: 'PER', icao: 'YPPH', latitude: -31.940278, longitude: 115.966944, altitude: 67,
    timezone: 8, dst: 'O', tzDatabase: 'Australia/Perth', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3324', name: 'Adelaide Airport', city: 'Adelaide', country: 'Australia',
    iata: 'ADL', icao: 'YPAD', latitude: -34.945, longitude: 138.530556, altitude: 20,
    timezone: 9.5, dst: 'O', tzDatabase: 'Australia/Adelaide', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3325', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand',
    iata: 'AKL', icao: 'NZAA', latitude: -37.008056, longitude: 174.791667, altitude: 23,
    timezone: 12, dst: 'Z', tzDatabase: 'Pacific/Auckland', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3326', name: 'Wellington Airport', city: 'Wellington', country: 'New Zealand',
    iata: 'WLG', icao: 'NZWN', latitude: -41.327222, longitude: 174.805278, altitude: 40,
    timezone: 12, dst: 'Z', tzDatabase: 'Pacific/Auckland', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3327', name: 'Christchurch Airport', city: 'Christchurch', country: 'New Zealand',
    iata: 'CHC', icao: 'NZCH', latitude: -43.489444, longitude: 172.532222, altitude: 123,
    timezone: 12, dst: 'Z', tzDatabase: 'Pacific/Auckland', type: 'airport', source: 'OurAirports'
  },

  // Additional North America
  {
    id: '3400', name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'United States',
    iata: 'SEA', icao: 'KSEA', latitude: 47.449, longitude: -122.309306, altitude: 131,
    timezone: -8, dst: 'A', tzDatabase: 'America/Los_Angeles', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3401', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States',
    iata: 'SFO', icao: 'KSFO', latitude: 37.621311, longitude: -122.378968, altitude: 13,
    timezone: -8, dst: 'A', tzDatabase: 'America/Los_Angeles', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3402', name: 'Las Vegas McCarran International Airport', city: 'Las Vegas', country: 'United States',
    iata: 'LAS', icao: 'KLAS', latitude: 36.080056, longitude: -115.15225, altitude: 2181,
    timezone: -8, dst: 'A', tzDatabase: 'America/Los_Angeles', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3403', name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', country: 'United States',
    iata: 'PHX', icao: 'KPHX', latitude: 33.434278, longitude: -112.011583, altitude: 1135,
    timezone: -7, dst: 'A', tzDatabase: 'America/Phoenix', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3404', name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'United States',
    iata: 'DFW', icao: 'KDFW', latitude: 32.896828, longitude: -97.037997, altitude: 607,
    timezone: -6, dst: 'A', tzDatabase: 'America/Chicago', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3405', name: 'Houston George Bush Intercontinental Airport', city: 'Houston', country: 'United States',
    iata: 'IAH', icao: 'KIAH', latitude: 29.984433, longitude: -95.341442, altitude: 97,
    timezone: -6, dst: 'A', tzDatabase: 'America/Chicago', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3406', name: 'Boston Logan International Airport', city: 'Boston', country: 'United States',
    iata: 'BOS', icao: 'KBOS', latitude: 42.364347, longitude: -71.005181, altitude: 19,
    timezone: -5, dst: 'A', tzDatabase: 'America/New_York', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3407', name: 'Washington Dulles International Airport', city: 'Washington', country: 'United States',
    iata: 'IAD', icao: 'KIAD', latitude: 38.944533, longitude: -77.455811, altitude: 313,
    timezone: -5, dst: 'A', tzDatabase: 'America/New_York', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3408', name: 'Montreal Pierre Elliott Trudeau International Airport', city: 'Montreal', country: 'Canada',
    iata: 'YUL', icao: 'CYUL', latitude: 45.470556, longitude: -73.740833, altitude: 118,
    timezone: -5, dst: 'A', tzDatabase: 'America/Toronto', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3409', name: 'Vancouver International Airport', city: 'Vancouver', country: 'Canada',
    iata: 'YVR', icao: 'CYVR', latitude: 49.193889, longitude: -123.184444, altitude: 4,
    timezone: -8, dst: 'A', tzDatabase: 'America/Vancouver', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3410', name: 'Calgary International Airport', city: 'Calgary', country: 'Canada',
    iata: 'YYC', icao: 'CYYC', latitude: 51.113889, longitude: -114.020278, altitude: 3557,
    timezone: -7, dst: 'A', tzDatabase: 'America/Edmonton', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3411', name: 'Mexico City International Airport', city: 'Mexico City', country: 'Mexico',
    iata: 'MEX', icao: 'MMMX', latitude: 19.436303, longitude: -99.072097, altitude: 7316,
    timezone: -6, dst: 'N', tzDatabase: 'America/Mexico_City', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3412', name: 'Cancun International Airport', city: 'Cancun', country: 'Mexico',
    iata: 'CUN', icao: 'MMUN', latitude: 21.036583, longitude: -86.877472, altitude: 22,
    timezone: -5, dst: 'N', tzDatabase: 'America/Cancun', type: 'airport', source: 'OurAirports'
  },

  // Additional Europe
  {
    id: '3500', name: 'Barcelona El Prat Airport', city: 'Barcelona', country: 'Spain',
    iata: 'BCN', icao: 'LEBL', latitude: 41.297078, longitude: 2.078464, altitude: 12,
    timezone: 1, dst: 'E', tzDatabase: 'Europe/Madrid', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3501', name: 'Milan Malpensa Airport', city: 'Milan', country: 'Italy',
    iata: 'MXP', icao: 'LIMC', latitude: 45.630606, longitude: 8.728111, altitude: 768,
    timezone: 1, dst: 'E', tzDatabase: 'Europe/Rome', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3502', name: 'Munich Airport', city: 'Munich', country: 'Germany',
    iata: 'MUC', icao: 'EDDM', latitude: 48.353783, longitude: 11.786086, altitude: 1487,
    timezone: 1, dst: 'E', tzDatabase: 'Europe/Berlin', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3503', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland',
    iata: 'ZUR', icao: 'LSZH', latitude: 47.464722, longitude: 8.549167, altitude: 1416,
    timezone: 1, dst: 'E', tzDatabase: 'Europe/Zurich', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3504', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria',
    iata: 'VIE', icao: 'LOWW', latitude: 48.110278, longitude: 16.569722, altitude: 600,
    timezone: 1, dst: 'E', tzDatabase: 'Europe/Vienna', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3505', name: 'Brussels Airport', city: 'Brussels', country: 'Belgium',
    iata: 'BRU', icao: 'EBBR', latitude: 50.901389, longitude: 4.484444, altitude: 184,
    timezone: 1, dst: 'E', tzDatabase: 'Europe/Brussels', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3506', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark',
    iata: 'CPH', icao: 'EKCH', latitude: 55.617917, longitude: 12.655972, altitude: 17,
    timezone: 1, dst: 'E', tzDatabase: 'Europe/Copenhagen', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3507', name: 'Stockholm Arlanda Airport', city: 'Stockholm', country: 'Sweden',
    iata: 'ARN', icao: 'ESSA', latitude: 59.651944, longitude: 17.918611, altitude: 137,
    timezone: 1, dst: 'E', tzDatabase: 'Europe/Stockholm', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3508', name: 'Oslo Airport', city: 'Oslo', country: 'Norway',
    iata: 'OSL', icao: 'ENGM', latitude: 60.193917, longitude: 11.100361, altitude: 681,
    timezone: 1, dst: 'E', tzDatabase: 'Europe/Oslo', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3509', name: 'Helsinki Airport', city: 'Helsinki', country: 'Finland',
    iata: 'HEL', icao: 'EFHK', latitude: 60.317222, longitude: 24.963333, altitude: 179,
    timezone: 2, dst: 'E', tzDatabase: 'Europe/Helsinki', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3510', name: 'Warsaw Chopin Airport', city: 'Warsaw', country: 'Poland',
    iata: 'WAW', icao: 'EPWA', latitude: 52.165833, longitude: 20.967222, altitude: 362,
    timezone: 1, dst: 'E', tzDatabase: 'Europe/Warsaw', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3511', name: 'Prague Airport', city: 'Prague', country: 'Czech Republic',
    iata: 'PRG', icao: 'LKPR', latitude: 50.100833, longitude: 14.26, altitude: 1247,
    timezone: 1, dst: 'E', tzDatabase: 'Europe/Prague', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3512', name: 'Budapest Airport', city: 'Budapest', country: 'Hungary',
    iata: 'BUD', icao: 'LHBP', latitude: 47.42976, longitude: 19.261093, altitude: 495,
    timezone: 1, dst: 'E', tzDatabase: 'Europe/Budapest', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3513', name: 'Lisbon Airport', city: 'Lisbon', country: 'Portugal',
    iata: 'LIS', icao: 'LPPT', latitude: 38.781311, longitude: -9.135919, altitude: 374,
    timezone: 0, dst: 'E', tzDatabase: 'Europe/Lisbon', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3514', name: 'Athens International Airport', city: 'Athens', country: 'Greece',
    iata: 'ATH', icao: 'LGAV', latitude: 37.936358, longitude: 23.944467, altitude: 308,
    timezone: 2, dst: 'E', tzDatabase: 'Europe/Athens', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3515', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey',
    iata: 'IST', icao: 'LTFM', latitude: 41.275278, longitude: 28.751944, altitude: 325,
    timezone: 3, dst: 'E', tzDatabase: 'Europe/Istanbul', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3516', name: 'Moscow Sheremetyevo Airport', city: 'Moscow', country: 'Russia',
    iata: 'SVO', icao: 'UUEE', latitude: 55.972642, longitude: 37.414589, altitude: 622,
    timezone: 3, dst: 'N', tzDatabase: 'Europe/Moscow', type: 'airport', source: 'OurAirports'
  },

  // Additional Asia
  {
    id: '3600', name: 'Seoul Incheon International Airport', city: 'Seoul', country: 'South Korea',
    iata: 'ICN', icao: 'RKSI', latitude: 37.469075, longitude: 126.450517, altitude: 23,
    timezone: 9, dst: 'N', tzDatabase: 'Asia/Seoul', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3601', name: 'Bangkok Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand',
    iata: 'BKK', icao: 'VTBS', latitude: 13.681108, longitude: 100.747283, altitude: 5,
    timezone: 7, dst: 'N', tzDatabase: 'Asia/Bangkok', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3602', name: 'Kuala Lumpur International Airport', city: 'Kuala Lumpur', country: 'Malaysia',
    iata: 'KUL', icao: 'WMKK', latitude: 2.745578, longitude: 101.709917, altitude: 69,
    timezone: 8, dst: 'N', tzDatabase: 'Asia/Kuala_Lumpur', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3603', name: 'Jakarta Soekarno-Hatta International Airport', city: 'Jakarta', country: 'Indonesia',
    iata: 'CGK', icao: 'WIII', latitude: -6.125567, longitude: 106.655897, altitude: 34,
    timezone: 7, dst: 'N', tzDatabase: 'Asia/Jakarta', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3604', name: 'Manila Ninoy Aquino International Airport', city: 'Manila', country: 'Philippines',
    iata: 'MNL', icao: 'RPLL', latitude: 14.508647, longitude: 121.019581, altitude: 75,
    timezone: 8, dst: 'N', tzDatabase: 'Asia/Manila', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3605', name: 'Ho Chi Minh City Tan Son Nhat Airport', city: 'Ho Chi Minh City', country: 'Vietnam',
    iata: 'SGN', icao: 'VVTS', latitude: 10.818797, longitude: 106.651856, altitude: 33,
    timezone: 7, dst: 'N', tzDatabase: 'Asia/Ho_Chi_Minh', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3606', name: 'Mumbai Chhatrapati Shivaji International Airport', city: 'Mumbai', country: 'India',
    iata: 'BOM', icao: 'VABB', latitude: 19.088686, longitude: 72.867919, altitude: 39,
    timezone: 5.5, dst: 'N', tzDatabase: 'Asia/Kolkata', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3607', name: 'Delhi Indira Gandhi International Airport', city: 'Delhi', country: 'India',
    iata: 'DEL', icao: 'VIDP', latitude: 28.5665, longitude: 77.103088, altitude: 777,
    timezone: 5.5, dst: 'N', tzDatabase: 'Asia/Kolkata', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3608', name: 'Bangalore Kempegowda International Airport', city: 'Bangalore', country: 'India',
    iata: 'BLR', icao: 'VOBL', latitude: 13.198889, longitude: 77.706111, altitude: 3000,
    timezone: 5.5, dst: 'N', tzDatabase: 'Asia/Kolkata', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3609', name: 'Karachi Jinnah International Airport', city: 'Karachi', country: 'Pakistan',
    iata: 'KHI', icao: 'OPKC', latitude: 24.906547, longitude: 67.160797, altitude: 100,
    timezone: 5, dst: 'N', tzDatabase: 'Asia/Karachi', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3610', name: 'Dhaka Hazrat Shahjalal International Airport', city: 'Dhaka', country: 'Bangladesh',
    iata: 'DAC', icao: 'VGHS', latitude: 23.843347, longitude: 90.397783, altitude: 27,
    timezone: 6, dst: 'N', tzDatabase: 'Asia/Dhaka', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3611', name: 'Colombo Bandaranaike International Airport', city: 'Colombo', country: 'Sri Lanka',
    iata: 'CMB', icao: 'VCBI', latitude: 7.180756, longitude: 79.884117, altitude: 30,
    timezone: 5.5, dst: 'N', tzDatabase: 'Asia/Colombo', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3612', name: 'Kathmandu Tribhuvan International Airport', city: 'Kathmandu', country: 'Nepal',
    iata: 'KTM', icao: 'VNKT', latitude: 27.696583, longitude: 85.3591, altitude: 4390,
    timezone: 5.75, dst: 'N', tzDatabase: 'Asia/Kathmandu', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3613', name: 'Taipei Taoyuan International Airport', city: 'Taipei', country: 'Taiwan',
    iata: 'TPE', icao: 'RCTP', latitude: 25.077731, longitude: 121.232822, altitude: 106,
    timezone: 8, dst: 'N', tzDatabase: 'Asia/Taipei', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3614', name: 'Osaka Kansai International Airport', city: 'Osaka', country: 'Japan',
    iata: 'KIX', icao: 'RJBB', latitude: 34.427299, longitude: 135.244247, altitude: 26,
    timezone: 9, dst: 'N', tzDatabase: 'Asia/Tokyo', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3615', name: 'Shanghai Pudong International Airport', city: 'Shanghai', country: 'China',
    iata: 'PVG', icao: 'ZSPD', latitude: 31.143378, longitude: 121.805214, altitude: 13,
    timezone: 8, dst: 'N', tzDatabase: 'Asia/Shanghai', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3616', name: 'Guangzhou Baiyun International Airport', city: 'Guangzhou', country: 'China',
    iata: 'CAN', icao: 'ZGGG', latitude: 23.392436, longitude: 113.298786, altitude: 50,
    timezone: 8, dst: 'N', tzDatabase: 'Asia/Shanghai', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3617', name: 'Shenzhen Bao\'an International Airport', city: 'Shenzhen', country: 'China',
    iata: 'SZX', icao: 'ZGSZ', latitude: 22.639258, longitude: 113.810664, altitude: 13,
    timezone: 8, dst: 'N', tzDatabase: 'Asia/Shanghai', type: 'airport', source: 'OurAirports'
  },

  // Additional Middle East
  {
    id: '3700', name: 'Abu Dhabi International Airport', city: 'Abu Dhabi', country: 'United Arab Emirates',
    iata: 'AUH', icao: 'OMAA', latitude: 24.433, longitude: 54.651111, altitude: 88,
    timezone: 4, dst: 'N', tzDatabase: 'Asia/Dubai', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3701', name: 'Kuwait International Airport', city: 'Kuwait City', country: 'Kuwait',
    iata: 'KWI', icao: 'OKBK', latitude: 29.226567, longitude: 47.968928, altitude: 206,
    timezone: 3, dst: 'N', tzDatabase: 'Asia/Kuwait', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3702', name: 'King Fahd International Airport', city: 'Dammam', country: 'Saudi Arabia',
    iata: 'DMM', icao: 'OEDF', latitude: 26.471194, longitude: 49.797917, altitude: 72,
    timezone: 3, dst: 'N', tzDatabase: 'Asia/Riyadh', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3703', name: 'King Abdulaziz International Airport', city: 'Jeddah', country: 'Saudi Arabia',
    iata: 'JED', icao: 'OEJN', latitude: 21.679564, longitude: 39.156603, altitude: 48,
    timezone: 3, dst: 'N', tzDatabase: 'Asia/Riyadh', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3704', name: 'Tehran Imam Khomeini International Airport', city: 'Tehran', country: 'Iran',
    iata: 'IKA', icao: 'OIIE', latitude: 35.416111, longitude: 51.152222, altitude: 3305,
    timezone: 3.5, dst: 'N', tzDatabase: 'Asia/Tehran', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3705', name: 'Ben Gurion Airport', city: 'Tel Aviv', country: 'Israel',
    iata: 'TLV', icao: 'LLBG', latitude: 32.011389, longitude: 34.886667, altitude: 135,
    timezone: 2, dst: 'N', tzDatabase: 'Asia/Jerusalem', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3706', name: 'Beirut Rafic Hariri International Airport', city: 'Beirut', country: 'Lebanon',
    iata: 'BEY', icao: 'OLBA', latitude: 33.820931, longitude: 35.488389, altitude: 87,
    timezone: 2, dst: 'N', tzDatabase: 'Asia/Beirut', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3707', name: 'Queen Alia International Airport', city: 'Amman', country: 'Jordan',
    iata: 'AMM', icao: 'OJAI', latitude: 31.722556, longitude: 35.993214, altitude: 2395,
    timezone: 2, dst: 'N', tzDatabase: 'Asia/Amman', type: 'airport', source: 'OurAirports'
  },

  // Additional South America
  {
    id: '3800', name: 'Lima Jorge Chávez International Airport', city: 'Lima', country: 'Peru',
    iata: 'LIM', icao: 'SPJC', latitude: -12.021889, longitude: -77.114319, altitude: 113,
    timezone: -5, dst: 'S', tzDatabase: 'America/Lima', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3801', name: 'Bogotá El Dorado International Airport', city: 'Bogotá', country: 'Colombia',
    iata: 'BOG', icao: 'SKBO', latitude: 4.701594, longitude: -74.146947, altitude: 8361,
    timezone: -5, dst: 'N', tzDatabase: 'America/Bogota', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3802', name: 'Santiago Arturo Merino Benítez International Airport', city: 'Santiago', country: 'Chile',
    iata: 'SCL', icao: 'SCEL', latitude: -33.392975, longitude: -70.785803, altitude: 1555,
    timezone: -4, dst: 'S', tzDatabase: 'America/Santiago', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3803', name: 'Caracas Simón Bolívar International Airport', city: 'Caracas', country: 'Venezuela',
    iata: 'CCS', icao: 'SVMI', latitude: 10.601194, longitude: -66.991222, altitude: 235,
    timezone: -4, dst: 'N', tzDatabase: 'America/Caracas', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3804', name: 'Quito Mariscal Sucre International Airport', city: 'Quito', country: 'Ecuador',
    iata: 'UIO', icao: 'SEQM', latitude: -0.129166, longitude: -78.357778, altitude: 9228,
    timezone: -5, dst: 'N', tzDatabase: 'America/Guayaquil', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3805', name: 'La Paz El Alto International Airport', city: 'La Paz', country: 'Bolivia',
    iata: 'LPB', icao: 'SLLP', latitude: -16.513339, longitude: -68.192256, altitude: 13323,
    timezone: -4, dst: 'N', tzDatabase: 'America/La_Paz', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3806', name: 'Asunción Silvio Pettirossi International Airport', city: 'Asunción', country: 'Paraguay',
    iata: 'ASU', icao: 'SGAS', latitude: -25.239975, longitude: -57.519133, altitude: 292,
    timezone: -3, dst: 'S', tzDatabase: 'America/Asuncion', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3807', name: 'Montevideo Carrasco International Airport', city: 'Montevideo', country: 'Uruguay',
    iata: 'MVD', icao: 'SUMU', latitude: -34.838417, longitude: -56.030806, altitude: 105,
    timezone: -3, dst: 'S', tzDatabase: 'America/Montevideo', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3808', name: 'Rio de Janeiro Galeão International Airport', city: 'Rio de Janeiro', country: 'Brazil',
    iata: 'GIG', icao: 'SBGL', latitude: -22.808903, longitude: -43.243647, altitude: 28,
    timezone: -3, dst: 'S', tzDatabase: 'America/Sao_Paulo', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3809', name: 'Brasília International Airport', city: 'Brasília', country: 'Brazil',
    iata: 'BSB', icao: 'SBBR', latitude: -15.871111, longitude: -47.918611, altitude: 3497,
    timezone: -3, dst: 'S', tzDatabase: 'America/Sao_Paulo', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3810', name: 'Salvador Deputado Luís Eduardo Magalhães International Airport', city: 'Salvador', country: 'Brazil',
    iata: 'SSA', icao: 'SBSV', latitude: -12.910994, longitude: -38.331044, altitude: 64,
    timezone: -3, dst: 'S', tzDatabase: 'America/Bahia', type: 'airport', source: 'OurAirports'
  },

  // Additional Africa
  {
    id: '3900', name: 'Lagos Murtala Muhammed International Airport', city: 'Lagos', country: 'Nigeria',
    iata: 'LOS', icao: 'DNMM', latitude: 6.577369, longitude: 3.321156, altitude: 135,
    timezone: 1, dst: 'N', tzDatabase: 'Africa/Lagos', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3901', name: 'Nairobi Jomo Kenyatta International Airport', city: 'Nairobi', country: 'Kenya',
    iata: 'NBO', icao: 'HKJK', latitude: -1.319167, longitude: 36.927778, altitude: 5327,
    timezone: 3, dst: 'N', tzDatabase: 'Africa/Nairobi', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3902', name: 'Addis Ababa Bole International Airport', city: 'Addis Ababa', country: 'Ethiopia',
    iata: 'ADD', icao: 'HAAB', latitude: 8.977889, longitude: 38.799319, altitude: 7625,
    timezone: 3, dst: 'N', tzDatabase: 'Africa/Addis_Ababa', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3903', name: 'Casablanca Mohammed V International Airport', city: 'Casablanca', country: 'Morocco',
    iata: 'CMN', icao: 'GMMN', latitude: 33.367467, longitude: -7.589967, altitude: 656,
    timezone: 1, dst: 'N', tzDatabase: 'Africa/Casablanca', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3904', name: 'Tunis Carthage International Airport', city: 'Tunis', country: 'Tunisia',
    iata: 'TUN', icao: 'DTTA', latitude: 36.851033, longitude: 10.227217, altitude: 22,
    timezone: 1, dst: 'N', tzDatabase: 'Africa/Tunis', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3905', name: 'Algiers Houari Boumediene Airport', city: 'Algiers', country: 'Algeria',
    iata: 'ALG', icao: 'DAAG', latitude: 36.691014, longitude: 3.215408, altitude: 82,
    timezone: 1, dst: 'N', tzDatabase: 'Africa/Algiers', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3906', name: 'Accra Kotoka International Airport', city: 'Accra', country: 'Ghana',
    iata: 'ACC', icao: 'DGAA', latitude: 5.605186, longitude: -0.166786, altitude: 205,
    timezone: 0, dst: 'N', tzDatabase: 'Africa/Accra', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3907', name: 'Dakar Blaise Diagne International Airport', city: 'Dakar', country: 'Senegal',
    iata: 'DSS', icao: 'GOBD', latitude: 14.670333, longitude: -17.073167, altitude: 95,
    timezone: 0, dst: 'N', tzDatabase: 'Africa/Dakar', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3908', name: 'Abidjan Félix-Houphouët-Boigny International Airport', city: 'Abidjan', country: 'Ivory Coast',
    iata: 'ABJ', icao: 'DIAP', latitude: 5.261386, longitude: -3.926294, altitude: 21,
    timezone: 0, dst: 'N', tzDatabase: 'Africa/Abidjan', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3909', name: 'Kinshasa N\'djili International Airport', city: 'Kinshasa', country: 'Democratic Republic of the Congo',
    iata: 'FIH', icao: 'FZAA', latitude: -4.385769, longitude: 15.444531, altitude: 1027,
    timezone: 1, dst: 'N', tzDatabase: 'Africa/Kinshasa', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3910', name: 'Luanda Quatro de Fevereiro Airport', city: 'Luanda', country: 'Angola',
    iata: 'LAD', icao: 'FNLU', latitude: -8.858375, longitude: 13.231178, altitude: 243,
    timezone: 1, dst: 'N', tzDatabase: 'Africa/Luanda', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3911', name: 'Cape Town International Airport', city: 'Cape Town', country: 'South Africa',
    iata: 'CPT', icao: 'FACT', latitude: -33.964806, longitude: 18.601667, altitude: 151,
    timezone: 2, dst: 'N', tzDatabase: 'Africa/Johannesburg', type: 'airport', source: 'OurAirports'
  },
  {
    id: '3912', name: 'Durban King Shaka International Airport', city: 'Durban', country: 'South Africa',
    iata: 'DUR', icao: 'FALE', latitude: -29.614886, longitude: 31.119806, altitude: 295,
    timezone: 2, dst: 'N', tzDatabase: 'Africa/Johannesburg', type: 'airport', source: 'OurAirports'
  }
];

class AirportService {
  private airports: Airport[] = WORLD_AIRPORTS;
  private aircraftPerformance = AIRCRAFT_PERFORMANCE;

  // Get all airports
  getAllAirports(): Airport[] {
    return this.airports;
  }

  // Search airports by ICAO, IATA, city, or name
  searchAirports(query: string): Airport[] {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase().trim();
    return this.airports.filter(airport => 
      airport.icao?.toLowerCase().includes(searchTerm) ||
      airport.iata?.toLowerCase().includes(searchTerm) ||
      airport.name.toLowerCase().includes(searchTerm) ||
      airport.city.toLowerCase().includes(searchTerm) ||
      airport.country.toLowerCase().includes(searchTerm)
    ).slice(0, 20); // Limit results
  }

  // Get airport by ICAO code
  getAirportByICAO(icao: string): Airport | null {
    return this.airports.find(airport => airport.icao === icao.toUpperCase()) || null;
  }

  // Get airport by IATA code
  getAirportByIATA(iata: string): Airport | null {
    return this.airports.find(airport => airport.iata === iata.toUpperCase()) || null;
  }

  // Get available aircraft types
  getAircraftTypes(): string[] {
    return Object.keys(this.aircraftPerformance);
  }

  // Get aircraft performance data
  getAircraftPerformance(aircraftType: string): AircraftPerformance | null {
    return this.aircraftPerformance[aircraftType] || null;
  }

  // Calculate great circle distance between two airports (in nautical miles)
  calculateDistance(origin: Airport, destination: Airport): number {
    const R = 3440.065; // Earth's radius in nautical miles
    const lat1 = origin.latitude * Math.PI / 180;
    const lat2 = destination.latitude * Math.PI / 180;
    const deltaLat = (destination.latitude - origin.latitude) * Math.PI / 180;
    const deltaLon = (destination.longitude - origin.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Calculate optimal cruise altitude based on aircraft type and distance
  calculateOptimalAltitude(aircraftType: string, distance: number): number {
    const performance = this.getAircraftPerformance(aircraftType);
    if (!performance) return 35000; // Default altitude

    // Shorter flights use lower altitudes for efficiency
    if (distance < 300) {
      return Math.min(performance.serviceCeiling * 0.6, 25000);
    } else if (distance < 800) {
      return Math.min(performance.serviceCeiling * 0.8, 35000);
    } else {
      return Math.min(performance.serviceCeiling * 0.9, performance.serviceCeiling);
    }
  }

  // Calculate flight time and fuel consumption
  calculateFlight(
    origin: Airport,
    destination: Airport,
    aircraftType: string,
    cruiseAltitude?: number
  ): FlightCalculation {
    const performance = this.getAircraftPerformance(aircraftType);
    if (!performance) {
      throw new Error(`Aircraft type ${aircraftType} not found`);
    }

    const distance = this.calculateDistance(origin, destination);
    const optimalAltitude = cruiseAltitude || this.calculateOptimalAltitude(aircraftType, distance);
    
    // Calculate climb time (to cruise altitude)
    const climbTime = Math.max(optimalAltitude / performance.climbRate, 5); // minimum 5 minutes
    
    // Calculate descent time (from cruise altitude)
    const descentTime = Math.max(optimalAltitude / performance.descentRate, 5); // minimum 5 minutes
    
    // Calculate cruise distance (accounting for climb/descent distance)
    const climbDistance = (performance.cruiseSpeed * climbTime / 60) * 0.7; // 70% of cruise speed during climb
    const descentDistance = (performance.cruiseSpeed * descentTime / 60) * 0.8; // 80% of cruise speed during descent
    const cruiseDistance = Math.max(distance - climbDistance - descentDistance, 0);
    
    // Calculate cruise time
    const cruiseTime = cruiseDistance / performance.cruiseSpeed * 60; // convert to minutes
    
    // Total flight time
    const totalFlightTime = climbTime + cruiseTime + descentTime;
    
    // Calculate fuel consumption
    const climbFuelRate = performance.fuelBurnRate * 1.5; // Higher fuel burn during climb
    const descentFuelRate = performance.fuelBurnRate * 0.6; // Lower fuel burn during descent
    
    const climbFuel = (climbFuelRate * climbTime / 60);
    const cruiseFuel = (performance.fuelBurnRate * cruiseTime / 60);
    const descentFuel = (descentFuelRate * descentTime / 60);
    const totalFuel = climbFuel + cruiseFuel + descentFuel;
    
    // Add 10% reserve fuel
    const fuelWithReserve = totalFuel * 1.1;
    
    // Find alternate airports (simplified - closest airports)
    const alternateAirports = this.findAlternateAirports(destination, 3);

    return {
      distance: Math.round(distance),
      flightTime: Math.round(totalFlightTime),
      fuelRequired: Math.round(fuelWithReserve),
      climbTime: Math.round(climbTime),
      cruiseTime: Math.round(cruiseTime),
      descentTime: Math.round(descentTime),
      optimalAltitude: Math.round(optimalAltitude),
      alternateAirports
    };
  }

  // Find alternate airports near destination
  private findAlternateAirports(destination: Airport, count: number = 3): Airport[] {
    return this.airports
      .filter(airport => airport.id !== destination.id)
      .map(airport => ({
        ...airport,
        distance: this.calculateDistance(destination, airport)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, count)
      .map(({ distance, ...airport }) => airport);
  }

  // Get airports by region/continent
  getAirportsByRegion(region: string): Airport[] {
    const regionMap: { [key: string]: string[] } = {
      'north-america': ['United States', 'Canada', 'Mexico'],
      'europe': ['United Kingdom', 'France', 'Germany', 'Netherlands', 'Spain', 'Italy'],
      'asia': ['Japan', 'China', 'Singapore', 'Hong Kong', 'South Korea', 'India'],
      'middle-east': ['United Arab Emirates', 'Qatar', 'Saudi Arabia', 'Kuwait'],
      'south-america': ['Brazil', 'Argentina', 'Chile', 'Colombia'],
      'africa': ['South Africa', 'Egypt', 'Morocco', 'Kenya'],
      'oceania': ['Australia', 'New Zealand']
    };

    const countries = regionMap[region] || [];
    return this.airports.filter(airport => countries.includes(airport.country));
  }

  // Format flight time for display
  formatFlightTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  }

  // Format distance for display
  formatDistance(nauticalMiles: number): string {
    const kilometers = nauticalMiles * 1.852;
    return `${nauticalMiles.toLocaleString()} NM (${Math.round(kilometers).toLocaleString()} km)`;
  }

  // Format fuel for display
  formatFuel(gallons: number): string {
    const liters = gallons * 3.78541;
    return `${Math.round(gallons).toLocaleString()} gal (${Math.round(liters).toLocaleString()} L)`;
  }
}

// Export singleton instance
export const airportService = new AirportService();
export default airportService;