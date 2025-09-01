// Live ATC Service - Integration with LiveATC.net API
// Based on https://github.com/Isaiah-Hamilton/live-atc

export interface RadioStation {
  id: string;
  name: string;
  frequency: string;
  type: 'music' | 'news' | 'talk' | 'classical' | 'jazz' | 'rock' | 'pop' | 'country';
  region?: string;
  country: string;
  city: string;
  streamUrl?: string;
  listeners?: number;
  status: 'online' | 'offline' | 'unknown';
  isPlaying?: boolean;
  description?: string;
  website?: string;
  timezone?: string;
  language?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Mantener compatibilidad con el tipo anterior
export type ATCStation = RadioStation;

export interface ATCFeed {
  id: string;
  name: string;
  mount: string;
  type: string;
  listeners: number;
  status: string;
  bitrate: number;
  genre: string;
  description: string;
  website: string;
  location: string;
  country: string;
  frequency?: string;
}

class RadioService {
  private baseUrl = 'https://radio.garden';
  private feedsCache: ATCFeed[] = [];
  private lastFetchTime = 0;
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Get all available radio stations
  async getRadioFeeds(): Promise<ATCFeed[]> {
    const now = Date.now();
    if (this.feedsCache.length > 0 && (now - this.lastFetchTime) < this.cacheTimeout) {
      return this.feedsCache;
    }

    // Using curated radio station data for pilots
    console.info('Loading radio stations by region for pilot entertainment');
    
    // Use fallback data which contains real radio stations
    this.feedsCache = this.getFallbackFeeds();
    this.lastFetchTime = now;
    return this.feedsCache;
  }

  // Mantener compatibilidad
  async getATCFeeds(): Promise<ATCFeed[]> {
    return this.getRadioFeeds();
  }

  // Convert ATC feeds to station format
  async getATCStations(): Promise<ATCStation[]> {
    const feeds = await this.getATCFeeds();
    return feeds.map(feed => this.convertFeedToStation(feed));
  }

  // Get stations by region
  async getStationsByRegion(region: string): Promise<ATCStation[]> {
    const stations = await this.getATCStations();
    return stations.filter(station => 
      station.region?.toLowerCase() === region.toLowerCase() ||
      station.country.toLowerCase().includes(region.toLowerCase()) ||
      station.name.toLowerCase().includes(region.toLowerCase())
    );
  }

  // Get stations by country
  async getStationsByCountry(country: string): Promise<ATCStation[]> {
    const stations = await this.getATCStations();
    return stations.filter(station => 
      station.country.toLowerCase().includes(country.toLowerCase())
    );
  }

  // Get popular stations (high listener count)
  async getPopularStations(minListeners: number = 50): Promise<ATCStation[]> {
    const stations = await this.getATCStations();
    return stations
      .filter(station => (station.listeners || 0) >= minListeners)
      .sort((a, b) => (b.listeners || 0) - (a.listeners || 0));
  }

  // Search stations by name or location
  async searchStations(query: string): Promise<ATCStation[]> {
    const stations = await this.getATCStations();
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) return stations;

    return stations.filter(station =>
      station.name.toLowerCase().includes(searchTerm) ||
      station.city.toLowerCase().includes(searchTerm) ||
      station.country.toLowerCase().includes(searchTerm) ||
      station.frequency.includes(searchTerm) ||
      station.description?.toLowerCase().includes(searchTerm)
    );
  }

  // Get stream URL for a station
  getStreamUrl(station: ATCStation): string {
    if (station.streamUrl) {
      return station.streamUrl;
    }
    
    // Generate stream URL based on station ID
    const mount = station.id.replace(/_/g, '-');
    return `${this.baseUrl}/play/${mount}`;
  }

  // Get direct audio stream URL with fallback options
  getDirectStreamUrl(station: ATCStation): string {
    if (station.streamUrl) {
      return station.streamUrl;
    }
    
    // Try multiple stream servers for better reliability
    const mount = station.id.replace(/_/g, '-');
    
    // Primary stream URL
    return `https://d1.liveatc.net/${mount}`;
  }
  
  // Get alternative stream URLs for fallback
  getAlternativeStreamUrls(station: ATCStation): string[] {
    const mount = station.id.replace(/_/g, '-');
    return [
      `https://d1.liveatc.net/${mount}`,
      `https://d2.liveatc.net/${mount}`,
      `https://d3.liveatc.net/${mount}`,
      // Note: These are example URLs - actual LiveATC infrastructure may vary
      // In production, you would use the actual available stream servers
    ];
  }

  // Convert feed to station format
  private convertFeedToStation(feed: ATCFeed): ATCStation {
    const type = this.determineStationType(feed.name, feed.description);
    const frequency = this.extractFrequency(feed.name, feed.description);
    
    return {
      id: feed.id || feed.mount,
      name: feed.name,
      frequency: frequency || 'Unknown',
      type,
      country: feed.country || 'Unknown',
      city: this.extractCity(feed.location),
      streamUrl: `https://d1.liveatc.net/${feed.mount}`,
      listeners: feed.listeners || 0,
      status: feed.status === 'online' ? 'online' : 'offline',
      description: feed.description,
      website: feed.website
    };
  }

  // Determine station type from name and description
  private determineStationType(name: string, description: string): ATCStation['type'] {
    const text = `${name} ${description}`.toLowerCase();
    
    if (text.includes('classical') || text.includes('symphony')) return 'classical';
    if (text.includes('jazz')) return 'jazz';
    if (text.includes('news') || text.includes('talk')) return 'news';
    if (text.includes('pop') || text.includes('hit')) return 'pop';
    if (text.includes('rock')) return 'rock';
    if (text.includes('country')) return 'country';
    
    return 'music'; // Default
  }



  // Extract frequency from name or description
  private extractFrequency(name: string, description: string): string | undefined {
    const text = `${name} ${description}`;
    const freqMatch = text.match(/(\d{2,3}\.\d{1,3})/);
    return freqMatch?.[0];
  }

  // Extract city from location string
  private extractCity(location: string): string {
    if (!location) return 'Unknown';
    
    // Remove country and state info, keep city
    const parts = location.split(',');
    return parts[0]?.trim() || location;
  }

  // Radio stations data organized by regions for pilots
  private getFallbackFeeds(): ATCFeed[] {
    return [
      // Estados Unidos
      {
        id: 'kqed_fm',
        name: 'KQED Public Radio',
        mount: 'kqed_fm',
        type: 'news',
        listeners: 1250,
        status: 'online',
        bitrate: 128,
        genre: 'News/Talk',
        description: 'NPR News and Classical Music from San Francisco',
        website: 'https://www.kqed.org',
        location: 'San Francisco, CA',
        country: 'USA',
        frequency: '88.5 FM'
      },
      {
        id: 'wnyc_fm',
        name: 'WNYC Public Radio',
        mount: 'wnyc_fm',
        type: 'news',
        listeners: 980,
        status: 'online',
        bitrate: 128,
        genre: 'News/Talk',
        description: 'New York Public Radio - News and Talk',
        website: 'https://www.wnyc.org',
        location: 'New York, NY',
        country: 'USA',
        frequency: '93.9 FM'
      },
      {
        id: 'jazz24',
        name: 'Jazz24',
        mount: 'jazz24',
        type: 'jazz',
        listeners: 756,
        status: 'online',
        bitrate: 128,
        genre: 'Jazz',
        description: 'Contemporary and Traditional Jazz 24/7',
        website: 'https://www.jazz24.org',
        location: 'Seattle, WA',
        country: 'USA',
        frequency: '88.5 HD2'
      },
      {
        id: 'classical_kusc',
        name: 'Classical KUSC',
        mount: 'classical_kusc',
        type: 'classical',
        listeners: 892,
        status: 'online',
        bitrate: 128,
        genre: 'Classical',
        description: 'Classical Music from Los Angeles',
        website: 'https://www.kusc.org',
        location: 'Los Angeles, CA',
        country: 'USA',
        frequency: '91.5 FM'
      },
      
      // Reino Unido
      {
        id: 'bbc_radio1',
        name: 'BBC Radio 1',
        mount: 'bbc_radio1',
        type: 'pop',
        listeners: 1445,
        status: 'online',
        bitrate: 128,
        genre: 'Pop/Rock',
        description: 'The UK\'s most popular music station',
        website: 'https://www.bbc.co.uk/radio1',
        location: 'London',
        country: 'UK',
        frequency: '97-99 FM'
      },
      {
        id: 'bbc_radio4',
        name: 'BBC Radio 4',
        mount: 'bbc_radio4',
        type: 'talk',
        listeners: 823,
        status: 'online',
        bitrate: 128,
        genre: 'News/Talk',
        description: 'Intelligent speech and current affairs',
        website: 'https://www.bbc.co.uk/radio4',
        location: 'London',
        country: 'UK',
        frequency: '92-95 FM'
      },
      
      // Francia
      {
        id: 'france_inter',
        name: 'France Inter',
        mount: 'france_inter',
        type: 'talk',
        listeners: 567,
        status: 'online',
        bitrate: 128,
        genre: 'News/Talk',
        description: 'Radio généraliste du service public français',
        website: 'https://www.franceinter.fr',
        location: 'Paris',
        country: 'France',
        frequency: '87.8 FM'
      },
      {
        id: 'fip_radio',
        name: 'FIP Radio',
        mount: 'fip_radio',
        type: 'music',
        listeners: 445,
        status: 'online',
        bitrate: 128,
        genre: 'Eclectic Music',
        description: 'Musique éclectique sans publicité',
        website: 'https://www.fip.fr',
        location: 'Paris',
        country: 'France',
        frequency: '105.1 FM'
      },
      
      // Alemania
      {
        id: 'deutschlandfunk',
        name: 'Deutschlandfunk',
        mount: 'deutschlandfunk',
        type: 'news',
        listeners: 678,
        status: 'online',
        bitrate: 128,
        genre: 'News/Talk',
        description: 'Nachrichten und Information aus Deutschland',
        website: 'https://www.deutschlandfunk.de',
        location: 'Cologne',
        country: 'Germany',
        frequency: '100.5 FM'
      },
      
      // España
      {
        id: 'radio_nacional',
        name: 'Radio Nacional de España',
        mount: 'radio_nacional',
        type: 'news',
        listeners: 534,
        status: 'online',
        bitrate: 128,
        genre: 'News/Talk',
        description: 'Radio pública española de información',
        website: 'https://www.rtve.es/radio',
        location: 'Madrid',
        country: 'Spain',
        frequency: '88.2 FM'
      },
      
      // Canadá
      {
        id: 'cbc_radio1',
        name: 'CBC Radio One',
        mount: 'cbc_radio1',
        type: 'news',
        listeners: 234,
        status: 'online',
        bitrate: 128,
        genre: 'News/Talk',
        description: 'Canadian public radio news and current affairs',
        website: 'https://www.cbc.ca/radio',
        location: 'Toronto, ON',
        country: 'Canada',
        frequency: '99.1 FM'
      },
      
      // Australia
      {
        id: 'abc_classic',
        name: 'ABC Classic FM',
        mount: 'abc_classic',
        type: 'classical',
        listeners: 189,
        status: 'online',
        bitrate: 128,
        genre: 'Classical',
        description: 'Australia\'s classical music radio station',
        website: 'https://www.abc.net.au/classic',
        location: 'Sydney, NSW',
        country: 'Australia',
        frequency: '92.9 FM'
      },
      
      // Brasil
      {
        id: 'radio_cultura',
        name: 'Rádio Cultura FM',
        mount: 'radio_cultura',
        type: 'classical',
        listeners: 156,
        status: 'online',
        bitrate: 128,
        genre: 'Classical/Jazz',
        description: 'Música erudita e jazz do Brasil',
        website: 'https://www.culturaradio.com.br',
        location: 'São Paulo, SP',
        country: 'Brazil',
        frequency: '103.3 FM'
      },
      
      // Japón
      {
        id: 'nhk_fm',
        name: 'NHK FM',
        mount: 'nhk_fm',
        type: 'classical',
        listeners: 298,
        status: 'online',
        bitrate: 128,
        genre: 'Classical/Cultural',
        description: 'Japanese public radio with classical music',
        website: 'https://www.nhk.or.jp',
        location: 'Tokyo',
        country: 'Japan',
        frequency: '82.5 FM'
      }
    ];
  }

  // Get station status (check if stream is available)
  async checkStationStatus(station: ATCStation): Promise<'online' | 'offline'> {
    try {
      const streamUrl = this.getDirectStreamUrl(station);
      const response = await fetch(streamUrl, {
        method: 'HEAD',
        timeout: 5000
      } as any);
      
      return response.ok ? 'online' : 'offline';
    } catch (error) {
      return 'offline';
    }
  }

  // Get listener count for a station
  async getListenerCount(station: ATCStation): Promise<number> {
    try {
      // This would require access to LiveATC's stats API
      // For now, return cached value or estimate
      return station.listeners || 0;
    } catch (error) {
      return 0;
    }
  }

  // Group stations by type
  groupStationsByType(stations: ATCStation[]): { [key: string]: ATCStation[] } {
    return {
      popular: stations.filter(s => (s.listeners || 0) > 500).sort((a, b) => (b.listeners || 0) - (a.listeners || 0)),
      music: stations.filter(s => s.type === 'music' || s.type === 'pop' || s.type === 'rock'),
      news: stations.filter(s => s.type === 'news' || s.type === 'talk'),
      classical: stations.filter(s => s.type === 'classical'),
      jazz: stations.filter(s => s.type === 'jazz'),
      international: stations.filter(s => !['USA', 'UK', 'Canada'].includes(s.country)),
      other: stations.filter(s => !['music', 'news', 'talk', 'classical', 'jazz', 'pop', 'rock'].includes(s.type))
    };
  }

  // Format frequency for display
  formatFrequency(frequency: string): string {
    if (!frequency || frequency === 'Unknown') return 'N/A';
    
    // Ensure proper formatting (XXX.XX)
    const num = parseFloat(frequency);
    if (isNaN(num)) return frequency;
    
    return num.toFixed(2);
  }

  // Get station type color
  getStationTypeColor(type: ATCStation['type']): string {
    const colors = {
      music: '#E91E63',
      pop: '#E91E63',
      rock: '#F44336',
      news: '#2196F3',
      talk: '#2196F3',
      classical: '#9C27B0',
      jazz: '#FF9800',
      country: '#8BC34A'
    };
    
    return colors[type] || '#757575';
  }

  // Get station type icon
  getStationTypeIcon(type: ATCStation['type']): string {
    const icons = {
      music: '🎵',
      pop: '🎵',
      rock: '🎸',
      news: '📰',
      talk: '🎙️',
      classical: '🎼',
      jazz: '🎷',
      country: '🤠'
    };
    
    return icons[type] || '📻';
  }
}

// Export singleton instance
const radioService = new RadioService();
// Mantener compatibilidad con el nombre anterior
const liveAtcService = radioService;
export default liveAtcService;
export { radioService };