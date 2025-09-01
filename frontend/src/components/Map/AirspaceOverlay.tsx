import React, { useState, useEffect } from 'react';
import { Polygon, Popup, useMap } from 'react-leaflet';
import { Airspace, AirspaceType, AirspaceClass } from '../../types/app.types';
import { useApp } from '../../contexts/AppContext';
import openAipService, { OpenAipAirspace } from '../../services/openAipService';

// Datos simulados de espacios aéreos
const MOCK_AIRSPACES: Airspace[] = [
  {
    id: 'fir-madrid',
    name: 'FIR Madrid',
    type: AirspaceType.CONTROLLED,
    class: AirspaceClass.A,
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [-6.0, 39.0],
        [-1.0, 39.0],
        [-1.0, 43.0],
        [-6.0, 43.0],
        [-6.0, 39.0]
      ]]
    },
    minimumAltitude: 0,
    maximumAltitude: 66000,
    active: true,
    frequency: 119.7
  },
  {
    id: 'ctr-madrid',
    name: 'CTR Madrid',
    type: AirspaceType.CONTROLLED,
    class: AirspaceClass.D,
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
    minimumAltitude: 0,
    maximumAltitude: 9500,
    active: true,
    frequency: 118.9
  },
  {
    id: 'restricted-r1',
    name: 'Zona Restringida R-1',
    type: AirspaceType.RESTRICTED,
    class: AirspaceClass.G,
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
    minimumAltitude: 0,
    maximumAltitude: 5000,
    active: true,
    restrictions: ['Civil flight prohibited', 'Military zone']
  },
  {
    id: 'danger-d1',
    name: 'Zona Peligrosa D-1',
    type: AirspaceType.DANGER,
    class: AirspaceClass.G,
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
    minimumAltitude: 0,
    maximumAltitude: 3000,
    active: true,
    restrictions: ['Shooting activity', 'Schedule: 08:00-18:00 UTC']
  }
];

export default function AirspaceOverlay() {
  const { state } = useApp();
  const map = useMap();
  const [airspaces, setAirspaces] = useState<OpenAipAirspace[]>([]);
  const [showAirspaces, setShowAirspaces] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Load real airspace data from OpenAIP
  const loadAirspaces = async () => {
    if (!map) return;
    
    setLoading(true);
    try {
      const bounds = openAipService.getBoundsFromMap(map);
      const realAirspaces = await openAipService.getAirspaces(bounds);
      setAirspaces(realAirspaces);
    } catch (error) {
      console.error('Error loading airspaces:', error);
      // Fallback to mock data if API fails
      setAirspaces(openAipService['getFallbackAirspaces']());
    } finally {
      setLoading(false);
    }
  };
  
  // Load airspaces on mount and when map moves
  useEffect(() => {
    loadAirspaces();
  }, [map]);
  
  // Reload airspaces when map bounds change
  useEffect(() => {
    if (!map) return;
    
    const handleMoveEnd = () => {
      loadAirspaces();
    };
    
    map.on('moveend', handleMoveEnd);
    
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map]);
  
  // Function to get airspace color using OpenAIP service
  const getAirspaceColor = (airspace: OpenAipAirspace): string => {
    return openAipService.getAirspaceColor(airspace);
  };
  
  // Function to get opacity based on airspace type
  const getOpacity = (airspace: OpenAipAirspace): number => {
    const type = airspace.type?.toLowerCase();
    
    if (type?.includes('restricted') || type?.includes('prohibited') || type?.includes('danger')) {
      return 0.4; // More opaque for dangerous zones
    }
    if (type?.includes('military')) {
      return 0.35;
    }
    if (type?.includes('temporary')) {
      return 0.25;
    }
    return 0.2; // Less opaque for normal controlled airspace
  };
  
  // Function to get airspace type description using OpenAIP service
  const getAirspaceTypeDescription = (airspace: OpenAipAirspace): string => {
    return openAipService.getAirspaceTypeDescription(airspace);
  };
  
  // Function to convert OpenAIP coordinates to Leaflet format
  const convertCoordinates = (coordinates: [number, number][]): [number, number][] => {
    return coordinates.map(coord => [coord[1], coord[0]] as [number, number]);
  };
  
  // Function to format altitude using OpenAIP service
  const formatAltitude = (limit: { value: number; unit: string; referenceDatum: string }): string => {
    return openAipService.formatAltitude(limit);
  };
  
  if (!showAirspaces) {
    return null;
  }
  
  return (
    <>
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50px',
          left: '16px',
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Loading airspace data...
        </div>
      )}
      
      {airspaces.map((airspace) => {
         const positions = convertCoordinates(airspace.geometry.coordinates[0]);
         const color = getAirspaceColor(airspace);
         const opacity = getOpacity(airspace);
         const type = airspace.type?.toLowerCase();
        
        return (
          <Polygon
            key={airspace._id}
            positions={positions}
            pathOptions={{
              color: color,
              weight: 2,
              opacity: 0.8,
              fillColor: color,
              fillOpacity: opacity,
              dashArray: type?.includes('temporary') ? '10, 5' : undefined
            }}
          >
            <Popup>
              <div style={{ minWidth: '280px' }}>
                <h3 style={{ 
                  margin: '0 0 8px 0', 
                  color: color,
                  borderBottom: `2px solid ${color}`,
                  paddingBottom: '4px'
                }}>
                  {airspace.name}
                </h3>
                
                <div style={{ marginBottom: '8px' }}>
                  <strong>Type:</strong> {getAirspaceTypeDescription(airspace)}
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <strong>ICAO Class:</strong> {airspace.icaoClass || 'Unknown'}
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <strong>Altitudes:</strong> {formatAltitude(airspace.lowerLimit)} - {formatAltitude(airspace.upperLimit)}
                </div>
                
                {airspace.activity && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Activity:</strong> {airspace.activity}
                  </div>
                )}
                
                <div style={{ marginBottom: '8px' }}>
                  <strong>Country:</strong> {airspace.country}
                </div>
                
                {/* Special warnings for restricted zones */}
                {(type?.includes('restricted') || 
                  type?.includes('prohibited') || 
                  type?.includes('danger') ||
                  type?.includes('military')) && (
                  <div style={{
                    marginTop: '8px',
                    padding: '6px',
                    backgroundColor: '#ff4444',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.85em',
                    fontWeight: 'bold',
                    textAlign: 'center'
                  }}>
                    ⚠️ CAUTION: RESTRICTED AIRSPACE
                  </div>
                )}
                
                <div style={{ 
                  marginTop: '8px', 
                  fontSize: '0.75em', 
                  color: '#666',
                  borderTop: '1px solid #eee',
                  paddingTop: '4px'
                }}>
                  Data source: OpenAIP
                </div>
              </div>
            </Popup>
          </Polygon>
        );
      })}
      
      {/* Leyenda de espacios aéreos */}
      <div style={{
        position: 'absolute',
        top: '80px',
        left: '16px',
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '12px',
        borderRadius: '6px',
        fontSize: '11px',
        minWidth: '180px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.3)', paddingBottom: '4px' }}>
          Airspace
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#0066cc', marginRight: '6px' }}></div>
          <span style={{ fontSize: '10px' }}>Class A (18,000+ ft)</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#0088ff', marginRight: '6px' }}></div>
          <span style={{ fontSize: '10px' }}>Class B (Major airports)</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#00aaff', marginRight: '6px' }}></div>
          <span style={{ fontSize: '10px' }}>Class C (Busy airports)</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#00ccff', marginRight: '6px' }}></div>
          <span style={{ fontSize: '10px' }}>Class D (Controlled)</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#66ddff', marginRight: '6px' }}></div>
          <span style={{ fontSize: '10px' }}>Class E (Controlled)</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
          <div style={{ width: '10px', height: '10px', backgroundColor: '#999999', marginRight: '6px' }}></div>
          <span style={{ fontSize: '10px' }}>Class G (Uncontrolled)</span>
        </div>
        
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.2)', marginTop: '6px', paddingTop: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
            <div style={{ width: '10px', height: '10px', backgroundColor: '#ff4444', marginRight: '6px' }}></div>
            <span style={{ fontSize: '10px' }}>Restricted</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
            <div style={{ width: '10px', height: '10px', backgroundColor: '#ff8800', marginRight: '6px' }}></div>
            <span style={{ fontSize: '10px' }}>Danger</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
            <div style={{ width: '10px', height: '10px', backgroundColor: '#8800cc', marginRight: '6px' }}></div>
            <span style={{ fontSize: '10px' }}>Military</span>
          </div>
        </div>
        
        <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.7 }}>
          Click on a zone for more information
        </div>
      </div>
    </>
  );
}