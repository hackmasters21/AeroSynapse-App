import axios from 'axios';

// OpenAIP API Service for real airspace data
// Free worldwide aeronautical data including airspaces, restricted zones, and airways

const OPENAIP_BASE_URL = 'https://api.core.openaip.net/api';
const API_KEY = 'your-openaip-api-key'; // Replace with actual API key

export interface OpenAipAirspace {
  _id: string;
  type: string;
  name: string;
  icaoClass: string;
  activity: string;
  geometry: {
    type: string;
    coordinates: [number, number][][];
  };
  upperLimit: {
    value: number;
    unit: string;
    referenceDatum: string;
  };
  lowerLimit: {
    value: number;
    unit: string;
    referenceDatum: string;
  };
  country: string;
}

export interface OpenAipNavaid {
  _id: string;
  type: string;
  name: string;
  identifier: string;
  frequency: number;
  geometry: {
    type: string;
    coordinates: number[];
  };
  elevation: {
    value: number;
    unit: string;
  };
  country: string;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

class OpenAipService {
  private cache = new Map<string, any>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  // Get airspaces within a bounding box
  async getAirspaces(bounds: BoundingBox): Promise<OpenAipAirspace[]> {
    try {
      const cacheKey = `airspaces_${bounds.north}_${bounds.south}_${bounds.east}_${bounds.west}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }

      const response = await axios.get(`${OPENAIP_BASE_URL}/airspaces`, {
        headers: {
          'x-openaip-api-key': API_KEY,
          'Accept': 'application/json'
        },
        params: {
          bbox: `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`,
          limit: 100
        },
        timeout: 10000
      });

      const airspaces = response.data.items || [];
      
      this.cache.set(cacheKey, {
        data: airspaces,
        timestamp: Date.now()
      });

      return airspaces;
    } catch (error) {
      console.error('Error fetching OpenAIP airspaces:', error);
      return this.getFallbackAirspaces();
    }
  }

  // Get navaids (VOR, NDB, etc.) within a bounding box
  async getNavaids(bounds: BoundingBox): Promise<OpenAipNavaid[]> {
    try {
      const cacheKey = `navaids_${bounds.north}_${bounds.south}_${bounds.east}_${bounds.west}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }

      const response = await axios.get(`${OPENAIP_BASE_URL}/navaids`, {
        headers: {
          'x-openaip-api-key': API_KEY,
          'Accept': 'application/json'
        },
        params: {
          bbox: `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`,
          limit: 50
        },
        timeout: 10000
      });

      const navaids = response.data.items || [];
      
      this.cache.set(cacheKey, {
        data: navaids,
        timestamp: Date.now()
      });

      return navaids;
    } catch (error) {
      console.error('Error fetching OpenAIP navaids:', error);
      return [];
    }
  }

  // Convert OpenAIP airspace type to our internal format
  getAirspaceColor(airspace: OpenAipAirspace): string {
    const type = airspace.type?.toLowerCase();
    const icaoClass = airspace.icaoClass?.toUpperCase();
    
    // Restricted and prohibited zones
    if (type?.includes('restricted') || type?.includes('prohibited') || type?.includes('danger')) {
      return '#ff4444'; // Red
    }
    
    // Military zones
    if (type?.includes('military') || airspace.activity?.toLowerCase().includes('military')) {
      return '#8800cc'; // Purple
    }
    
    // Controlled airspace by class
    switch (icaoClass) {
      case 'A':
        return '#0066cc'; // Blue - Class A
      case 'B':
        return '#0088ff'; // Light Blue - Class B
      case 'C':
        return '#00aaff'; // Cyan - Class C
      case 'D':
        return '#00ccff'; // Light Cyan - Class D
      case 'E':
        return '#66ddff'; // Very Light Blue - Class E
      case 'G':
        return '#999999'; // Gray - Class G (uncontrolled)
      default:
        return '#0066cc'; // Default blue for controlled
    }
  }

  // Get airspace type description
  getAirspaceTypeDescription(airspace: OpenAipAirspace): string {
    const type = airspace.type?.toLowerCase();
    const icaoClass = airspace.icaoClass?.toUpperCase();
    
    if (type?.includes('restricted')) return 'Restricted Zone';
    if (type?.includes('prohibited')) return 'Prohibited Zone';
    if (type?.includes('danger')) return 'Danger Zone';
    if (type?.includes('military')) return 'Military Zone';
    if (type?.includes('temporary')) return 'Temporary Zone';
    
    // ICAO Class descriptions
    switch (icaoClass) {
      case 'A':
        return 'Class A Airspace - IFR only, 18,000+ ft';
      case 'B':
        return 'Class B Airspace - Major airport, clearance required';
      case 'C':
        return 'Class C Airspace - Busy airport, radio contact required';
      case 'D':
        return 'Class D Airspace - Controlled airport';
      case 'E':
        return 'Class E Airspace - Controlled, IFR separation';
      case 'G':
        return 'Class G Airspace - Uncontrolled';
      default:
        return 'Controlled Airspace';
    }
  }

  // Format altitude for display
  formatAltitude(limit: { value: number; unit: string; referenceDatum: string }): string {
    if (!limit) return 'Unknown';
    
    const { value, unit, referenceDatum } = limit;
    
    if (value === 0 && referenceDatum === 'GND') {
      return 'Surface';
    }
    
    if (value >= 18000 && unit === 'ft') {
      return `FL${Math.round(value / 100)}`;
    }
    
    return `${value.toLocaleString()} ${unit} ${referenceDatum}`;
  }

  // Fallback airspaces when API fails
  private getFallbackAirspaces(): OpenAipAirspace[] {
    return [
      {
        _id: 'fallback-ctr-madrid',
        type: 'CTR',
        name: 'Madrid Control Zone',
        icaoClass: 'D',
        activity: 'Controlled Traffic Region',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-3.9, 40.2],
            [-3.5, 40.2],
            [-3.5, 40.6],
            [-3.9, 40.6],
            [-3.9, 40.2]
          ]]
        },
        upperLimit: {
          value: 9500,
          unit: 'ft',
          referenceDatum: 'MSL'
        },
        lowerLimit: {
          value: 0,
          unit: 'ft',
          referenceDatum: 'GND'
        },
        country: 'ES'
      },
      {
        _id: 'fallback-restricted-r1',
        type: 'RESTRICTED',
        name: 'Restricted Area R-1',
        icaoClass: 'G',
        activity: 'Military Operations',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-3.8, 40.3],
            [-3.7, 40.3],
            [-3.7, 40.4],
            [-3.8, 40.4],
            [-3.8, 40.3]
          ]]
        },
        upperLimit: {
          value: 5000,
          unit: 'ft',
          referenceDatum: 'MSL'
        },
        lowerLimit: {
          value: 0,
          unit: 'ft',
          referenceDatum: 'GND'
        },
        country: 'ES'
      },
      {
        _id: 'fallback-danger-d1',
        type: 'DANGER',
        name: 'Danger Area D-1',
        icaoClass: 'G',
        activity: 'Shooting Range',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-3.6, 40.5],
            [-3.5, 40.5],
            [-3.5, 40.6],
            [-3.6, 40.6],
            [-3.6, 40.5]
          ]]
        },
        upperLimit: {
          value: 3000,
          unit: 'ft',
          referenceDatum: 'MSL'
        },
        lowerLimit: {
          value: 0,
          unit: 'ft',
          referenceDatum: 'GND'
        },
        country: 'ES'
      }
    ];
  }

  // Get current map bounds from Leaflet map
  getBoundsFromMap(map: any): BoundingBox {
    const bounds = map.getBounds();
    return {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    };
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

const openAipService = new OpenAipService();
export default openAipService;