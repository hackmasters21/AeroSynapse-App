// Servicio para manejar accidentes aéreos históricos en el mapa

export interface HistoricalAccident {
  id: string;
  name: string;
  date: string;
  location: {
    latitude: number;
    longitude: number;
  };
  aircraft: string;
  fatalities: number;
  description: string;
  cause?: string;
  flightNumber?: string;
}

// Base de datos de accidentes aéreos históricos más significativos con coordenadas GPS
export const historicalAccidents: HistoricalAccident[] = [
  {
    id: 'tenerife-1977',
    name: 'Tenerife Airport Disaster',
    date: '1977-03-27',
    location: {
      latitude: 28.4827,
      longitude: -16.3414
    },
    aircraft: 'Boeing 747 (KLM & Pan Am)',
    fatalities: 583,
    description: 'Runway collision between two Boeing 747s at Los Rodeos Airport, Tenerife.',
    cause: 'Communication error and reduced visibility due to fog',
    flightNumber: 'KLM 4805 & Pan Am 1736'
  },
  {
    id: 'jal123-1985',
    name: 'Japan Airlines Flight 123',
    date: '1985-08-12',
    location: {
      latitude: 36.0,
      longitude: 138.7
    },
    aircraft: 'Boeing 747SR-46',
    fatalities: 520,
    description: 'JAL domestic flight accident at Mount Takamagahara, Japan.',
    cause: 'Structural failure of the rear pressure bulkhead',
    flightNumber: 'JAL 123'
  },
  {
    id: 'charkhi-dadri-1996',
    name: 'Charkhi Dadri Mid-air Collision',
    date: '1996-11-12',
    location: {
      latitude: 28.6,
      longitude: 76.8
    },
    aircraft: 'Boeing 747 & Ilyushin Il-76',
    fatalities: 349,
    description: 'Mid-air collision near New Delhi between Saudi Arabian Airlines and Kazakhstan Airlines.',
    cause: 'Navigation and communication error',
    flightNumber: 'SVA 763 & KZA 1907'
  },
  {
    id: 'american11-2001',
    name: 'September 11 - American Airlines Flight 11',
    date: '2001-09-11',
    location: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    aircraft: 'Boeing 767-223ER',
    fatalities: 1700,
    description: 'Terrorist attack - impact against the North Tower of the World Trade Center.',
    cause: 'Terrorist act - hijacking',
    flightNumber: 'AA 11'
  },
  {
    id: 'united175-2001',
    name: 'September 11 - United Airlines Flight 175',
    date: '2001-09-11',
    location: {
      latitude: 40.7128,
      longitude: -74.0060
    },
    aircraft: 'Boeing 767-222',
    fatalities: 965,
    description: 'Terrorist attack - impact against the South Tower of the World Trade Center.',
    cause: 'Terrorist act - hijacking',
    flightNumber: 'UA 175'
  },
  {
    id: 'turkish981-1974',
    name: 'Turkish Airlines Flight 981',
    date: '1974-03-03',
    location: {
      latitude: 49.0,
      longitude: 2.6
    },
    aircraft: 'McDonnell Douglas DC-10',
    fatalities: 346,
    description: 'Accident in Ermenonville Forest, France.',
    cause: 'Rear cargo door failure',
    flightNumber: 'TK 981'
  },
  {
    id: 'air-india182-1985',
    name: 'Air India Flight 182',
    date: '1985-06-23',
    location: {
      latitude: 51.0,
      longitude: -12.8
    },
    aircraft: 'Boeing 747-237B',
    fatalities: 329,
    description: 'Bomb attack over the Atlantic Ocean.',
    cause: 'Bomb explosion',
    flightNumber: 'AI 182'
  },
  {
    id: 'saudia163-1980',
    name: 'Saudia Flight 163',
    date: '1980-08-19',
    location: {
      latitude: 24.9,
      longitude: 46.7
    },
    aircraft: 'Lockheed L-1011 TriStar',
    fatalities: 301,
    description: 'Onboard fire at King Abdulaziz Airport, Riyadh.',
    cause: 'Cargo compartment fire',
    flightNumber: 'SV 163'
  },
  {
    id: 'iran655-1988',
    name: 'Iran Air Flight 655',
    date: '1988-07-03',
    location: {
      latitude: 26.6,
      longitude: 56.25
    },
    aircraft: 'Airbus A300B2-203',
    fatalities: 290,
    description: 'Shot down by USS Vincennes missile in the Persian Gulf.',
    cause: 'Shot down by military missile',
    flightNumber: 'IR 655'
  },
  {
    id: 'american587-2001',
    name: 'American Airlines Flight 587',
    date: '2001-11-12',
    location: {
      latitude: 40.6,
      longitude: -73.8
    },
    aircraft: 'Airbus A300-605R',
    fatalities: 265,
    description: 'Accident in Queens, New York, shortly after takeoff.',
    cause: 'Vertical stabilizer separation',
    flightNumber: 'AA 587'
  },
  {
    id: 'korean007-1983',
    name: 'Korean Air Flight 007',
    date: '1983-09-01',
    location: {
      latitude: 46.6,
      longitude: 141.3
    },
    aircraft: 'Boeing 747-230B',
    fatalities: 269,
    description: 'Shot down by Soviet fighters near Sakhalin Island.',
    cause: 'Shot down by military missile',
    flightNumber: 'KE 007'
  },
  {
    id: 'twa800-1996',
    name: 'TWA Flight 800',
    date: '1996-07-17',
    location: {
      latitude: 40.6,
      longitude: -72.6
    },
    aircraft: 'Boeing 747-131',
    fatalities: 230,
    description: 'In-flight explosion over the Atlantic Ocean near Long Island.',
    cause: 'Center fuel tank explosion',
    flightNumber: 'TW 800'
  },
  {
    id: 'swissair111-1998',
    name: 'Swissair Flight 111',
    date: '1998-09-02',
    location: {
      latitude: 44.2,
      longitude: -64.1
    },
    aircraft: 'McDonnell Douglas MD-11',
    fatalities: 229,
    description: 'Ocean crash near Nova Scotia, Canada.',
    cause: 'Electrical fire in cockpit',
    flightNumber: 'SR 111'
  },
  {
    id: 'malaysia17-2014',
    name: 'Malaysia Airlines Flight 17',
    date: '2014-07-17',
    location: {
      latitude: 48.1,
      longitude: 38.6
    },
    aircraft: 'Boeing 777-2H6ER',
    fatalities: 298,
    description: 'Shot down over Ukrainian territory during armed conflict.',
    cause: 'Shot down by surface-to-air missile',
    flightNumber: 'MH 17'
  },
  {
    id: 'germanwings9525-2015',
    name: 'Germanwings Flight 9525',
    date: '2015-03-24',
    location: {
      latitude: 44.28,
      longitude: 6.44
    },
    aircraft: 'Airbus A320-211',
    fatalities: 150,
    description: 'Intentionally crashed into the French Alps.',
    cause: 'Co-pilot suicide',
    flightNumber: '4U 9525'
  },
  {
    id: 'ethiopian302-2019',
    name: 'Ethiopian Airlines Flight 302',
    date: '2019-03-10',
    location: {
      latitude: 8.87,
      longitude: 39.16
    },
    aircraft: 'Boeing 737 MAX 8',
    fatalities: 157,
    description: 'Accident near Bishoftu, Ethiopia, shortly after takeoff.',
    cause: 'MCAS system failure',
    flightNumber: 'ET 302'
  },
  {
    id: 'lion610-2018',
    name: 'Lion Air Flight 610',
    date: '2018-10-29',
    location: {
      latitude: -5.8,
      longitude: 107.1
    },
    aircraft: 'Boeing 737 MAX 8',
    fatalities: 189,
    description: 'Accident in the Java Sea, Indonesia.',
    cause: 'MCAS system failure',
    flightNumber: 'JT 610'
  },
  {
    id: 'ukraine752-2020',
    name: 'Ukraine International Airlines Flight 752',
    date: '2020-01-08',
    location: {
      latitude: 35.6,
      longitude: 51.1
    },
    aircraft: 'Boeing 737-800',
    fatalities: 176,
    description: 'Shot down by Iranian missile near Tehran.',
    cause: 'Shot down by military missile',
    flightNumber: 'PS 752'
  },
  {
    id: 'asiana214-2013',
    name: 'Asiana Airlines Flight 214',
    date: '2013-07-06',
    location: {
      latitude: 37.6,
      longitude: -122.4
    },
    aircraft: 'Boeing 777-28EER',
    fatalities: 3,
    description: 'Landing accident in San Francisco.',
    cause: 'Pilot error during approach',
    flightNumber: 'OZ 214'
  },
  {
    id: 'colgan3407-2009',
    name: 'Colgan Air Flight 3407',
    date: '2009-02-12',
    location: {
      latitude: 43.0,
      longitude: -78.7
    },
    aircraft: 'Bombardier Dash 8 Q400',
    fatalities: 50,
    description: 'Accident in Clarence Center, New York.',
    cause: 'Loss of control due to icing',
    flightNumber: 'CJC 3407'
  },
  {
    id: 'west-caribbean-708-2005',
    name: 'West Caribbean Airways Flight 708',
    date: '2005-08-16',
    location: {
      latitude: 9.66639,
      longitude: -72.61111
    },
    aircraft: 'McDonnell Douglas MD-82',
    fatalities: 160,
    description: 'Charter flight crashed in northwest Venezuela during cruise flight.',
    cause: 'Deep stall due to pilot error and inadequate response to aerodynamic stall',
    flightNumber: 'WCW 708'
  },
  {
    id: 'santa-barbara-518-2008',
    name: 'Santa Bárbara Airlines Flight 518',
    date: '2008-02-21',
    location: {
      latitude: 8.655,
      longitude: -71.225
    },
    aircraft: 'ATR 42-300',
    fatalities: 46,
    description: 'Domestic flight crashed into mountains near Mérida, Venezuela, shortly after takeoff.',
    cause: 'Controlled flight into terrain due to navigation error and pilot error',
    flightNumber: 'SBA 518'
  },
  {
    id: 'viasa-742-1969',
    name: 'VIASA Flight 742',
    date: '1969-03-16',
    location: {
      latitude: 10.6,
      longitude: -66.9
    },
    aircraft: 'McDonnell Douglas DC-9-32',
    fatalities: 84,
    description: 'Crashed during approach to Caracas airport in poor weather conditions.',
    cause: 'Pilot error during approach in adverse weather',
    flightNumber: 'VA 742'
  },
  {
    id: 'conviasa-2350-2008',
    name: 'Conviasa Flight 2350',
    date: '2008-09-13',
    location: {
      latitude: 8.6,
      longitude: -71.2
    },
    aircraft: 'ATR 42-320',
    fatalities: 17,
    description: 'Crashed during approach to Mérida airport in mountainous terrain.',
    cause: 'Controlled flight into terrain during approach',
    flightNumber: 'V0 2350'
  },
  {
    id: 'rutaca-225-2010',
    name: 'Rutaca Airlines Flight 225',
    date: '2010-08-13',
    location: {
      latitude: 8.3,
      longitude: -62.7
    },
    aircraft: 'Embraer EMB-120',
    fatalities: 17,
    description: 'Crashed during approach to Puerto Ordaz airport.',
    cause: 'Loss of control during approach',
    flightNumber: 'RUC 225'
  },
  {
    id: 'laser-1903-2009',
    name: 'LASER Airlines Flight 1903',
    date: '2009-09-12',
    location: {
      latitude: 10.5,
      longitude: -66.8
    },
    aircraft: 'McDonnell Douglas MD-83',
    fatalities: 0,
    description: 'Emergency landing at Caracas airport after engine failure.',
    cause: 'Engine failure during flight',
    flightNumber: 'QL 1903'
  }
];

export class AccidentMapService {
  // Obtener todos los accidentes históricos
  static getAllAccidents(): HistoricalAccident[] {
    return historicalAccidents;
  }

  // Filtrar accidentes por rango de fechas
  static getAccidentsByDateRange(startDate: Date, endDate: Date): HistoricalAccident[] {
    return historicalAccidents.filter(accident => {
      const accidentDate = new Date(accident.date);
      return accidentDate >= startDate && accidentDate <= endDate;
    });
  }

  // Filtrar accidentes por número mínimo de víctimas
  static getAccidentsByFatalities(minFatalities: number): HistoricalAccident[] {
    return historicalAccidents.filter(accident => accident.fatalities >= minFatalities);
  }

  // Obtener accidentes dentro de un radio específico
  static getAccidentsInRadius(
    centerLat: number, 
    centerLng: number, 
    radiusKm: number
  ): HistoricalAccident[] {
    return historicalAccidents.filter(accident => {
      const distance = this.calculateDistance(
        centerLat, 
        centerLng, 
        accident.location.latitude, 
        accident.location.longitude
      );
      return distance <= radiusKm;
    });
  }

  // Calcular distancia entre dos puntos (fórmula de Haversine)
  private static calculateDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Obtener accidente por ID
  static getAccidentById(id: string): HistoricalAccident | undefined {
    return historicalAccidents.find(accident => accident.id === id);
  }

  // Obtener estadísticas de accidentes
  static getAccidentStatistics() {
    const totalAccidents = historicalAccidents.length;
    const totalFatalities = historicalAccidents.reduce((sum, accident) => sum + accident.fatalities, 0);
    const averageFatalities = totalFatalities / totalAccidents;
    
    const accidentsByDecade = historicalAccidents.reduce((acc, accident) => {
      const year = new Date(accident.date).getFullYear();
      const decade = Math.floor(year / 10) * 10;
      acc[decade] = (acc[decade] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      totalAccidents,
      totalFatalities,
      averageFatalities: Math.round(averageFatalities),
      accidentsByDecade,
      deadliestAccident: historicalAccidents.reduce((max, accident) => 
        accident.fatalities > max.fatalities ? accident : max
      )
    };
  }
}

export default AccidentMapService;