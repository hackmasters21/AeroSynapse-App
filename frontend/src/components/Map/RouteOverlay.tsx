import React from 'react';
import { Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Route, Waypoint } from '../../types/app.types';
import { useApp } from '../../contexts/AppContext';

interface RouteOverlayProps {
  route: Route;
}

// Función para crear icono de waypoint
function createWaypointIcon(waypoint: Waypoint, theme: string): L.DivIcon {
  let color = '#00ff88';
  let symbol = '●';
  
  // Color según el tema
  if (theme === 'night') {
    color = '#ff4444';
  }
  
  // Símbolo según el tipo de waypoint
  switch (waypoint.type) {
    case 'airport':
      symbol = '✈';
      break;
    case 'vor':
      symbol = '◆';
      break;
    case 'dme':
      symbol = '◇';
      break;
    case 'ndb':
      symbol = '△';
      break;
    case 'intersection':
      symbol = '▲';
      break;
    case 'gps':
      symbol = '●';
      break;
    case 'tacan':
      symbol = '◈';
      break;
    case 'ils':
      symbol = '║';
      break;
    default:
      symbol = '●';
  }
  
  const html = `
    <div class="waypoint-marker" style="
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${color};
      color: #000;
      border: 2px solid #fff;
      border-radius: 50%;
      font-size: 12px;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      cursor: pointer;
    ">
      ${symbol}
    </div>
  `;
  
  return L.divIcon({
    html,
    className: 'waypoint-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
}

// Función para obtener información del waypoint
function getWaypointInfo(waypoint: Waypoint): string {
  const info = [`Tipo: ${waypoint.type.toUpperCase()}`];
  
  if (waypoint.identifier) {
    info.push(`ID: ${waypoint.identifier}`);
  }
  
  if (waypoint.frequency) {
    info.push(`Frecuencia: ${waypoint.frequency.toFixed(2)} MHz`);
  }
  
  if (waypoint.range) {
    info.push(`Alcance: ${waypoint.range} NM`);
  }
  
  if (waypoint.description) {
    info.push(`Descripción: ${waypoint.description}`);
  }
  
  info.push(`Posición: ${waypoint.position.latitude.toFixed(6)}, ${waypoint.position.longitude.toFixed(6)}`);
  
  return info.join('\n');
}

export default function RouteOverlay({ route }: RouteOverlayProps) {
  const { state } = useApp();
  
  // Crear array de posiciones para la línea de ruta
  const routePositions: [number, number][] = [
    [route.origin.position.latitude, route.origin.position.longitude],
    ...route.waypoints.map(wp => [wp.position.latitude, wp.position.longitude] as [number, number]),
    [route.destination.position.latitude, route.destination.position.longitude]
  ];
  
  // Color de la ruta según el tema
  const routeColor = state.settings.theme === 'night' ? '#ff4444' : '#00ff88';
  
  return (
    <>
      {/* Línea principal de la ruta */}
      <Polyline
        positions={routePositions}
        color={routeColor}
        weight={4}
        opacity={0.8}
        dashArray="10, 5"
      />
      
      {/* Línea de sombra para mejor visibilidad */}
      <Polyline
        positions={routePositions}
        color="#000000"
        weight={6}
        opacity={0.3}
      />
      
      {/* Marcador del aeropuerto de origen */}
      <Marker
        position={[route.origin.position.latitude, route.origin.position.longitude]}
        icon={L.divIcon({
          html: `
            <div style="
              width: 32px;
              height: 32px;
              background: #00ff88;
              border: 3px solid #fff;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              color: #000;
              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            ">
              🛫
            </div>
          `,
          className: 'airport-origin-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16]
        })}
      >
        <Popup>
          <div style={{ minWidth: '200px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#00ff88' }}>🛫 ORIGEN</h3>
            <p><strong>{route.origin.name}</strong></p>
            <p><strong>ICAO:</strong> {route.origin.icao}</p>
            <p><strong>Ciudad:</strong> {route.origin.city}</p>
            <p><strong>Elevación:</strong> {route.origin.elevation} ft</p>
            <p><strong>Posición:</strong> {route.origin.position.latitude.toFixed(6)}, {route.origin.position.longitude.toFixed(6)}</p>
          </div>
        </Popup>
      </Marker>
      
      {/* Marcadores de waypoints */}
      {route.waypoints.map((waypoint, index) => (
        <Marker
          key={waypoint.id}
          position={[waypoint.position.latitude, waypoint.position.longitude]}
          icon={createWaypointIcon(waypoint, state.settings.theme)}
        >
          <Popup>
            <div style={{ minWidth: '180px' }}>
              <h3 style={{ margin: '0 0 8px 0', color: routeColor }}>📍 WAYPOINT {index + 1}</h3>
              <p><strong>{waypoint.name}</strong></p>
              <div style={{ whiteSpace: 'pre-line', fontSize: '0.9em' }}>
                {getWaypointInfo(waypoint)}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      
      {/* Marcador del aeropuerto de destino */}
      <Marker
        position={[route.destination.position.latitude, route.destination.position.longitude]}
        icon={L.divIcon({
          html: `
            <div style="
              width: 32px;
              height: 32px;
              background: #ffaa00;
              border: 3px solid #fff;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 16px;
              color: #000;
              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            ">
              🛬
            </div>
          `,
          className: 'airport-destination-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16]
        })}
      >
        <Popup>
          <div style={{ minWidth: '200px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#ffaa00' }}>🛬 DESTINO</h3>
            <p><strong>{route.destination.name}</strong></p>
            <p><strong>ICAO:</strong> {route.destination.icao}</p>
            <p><strong>Ciudad:</strong> {route.destination.city}</p>
            <p><strong>Elevación:</strong> {route.destination.elevation} ft</p>
            <p><strong>Posición:</strong> {route.destination.position.latitude.toFixed(6)}, {route.destination.position.longitude.toFixed(6)}</p>
          </div>
        </Popup>
      </Marker>
      
      {/* Etiquetas de distancia en segmentos */}
      {routePositions.length > 1 && routePositions.slice(0, -1).map((pos, index) => {
        const nextPos = routePositions[index + 1];
        const midLat = (pos[0] + nextPos[0]) / 2;
        const midLng = (pos[1] + nextPos[1]) / 2;
        
        // Calcular distancia aproximada (fórmula simplificada)
        const distance = Math.sqrt(
          Math.pow((nextPos[0] - pos[0]) * 69, 2) + 
          Math.pow((nextPos[1] - pos[1]) * 69 * Math.cos(pos[0] * Math.PI / 180), 2)
        );
        
        return (
          <Marker
            key={`segment-${index}`}
            position={[midLat, midLng]}
            icon={L.divIcon({
              html: `
                <div style="
                  background: rgba(0, 0, 0, 0.7);
                  color: white;
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-size: 10px;
                  font-family: monospace;
                  white-space: nowrap;
                  border: 1px solid ${routeColor};
                ">
                  ${distance.toFixed(0)} NM
                </div>
              `,
              className: 'distance-label',
              iconSize: [0, 0],
              iconAnchor: [0, 0]
            })}
          />
        );
      })}
      
      {/* Información de la ruta en el primer waypoint */}
      {routePositions.length > 0 && (
        <Marker
          position={routePositions[0]}
          icon={L.divIcon({
            html: `
              <div style="
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px;
                border-radius: 6px;
                font-size: 11px;
                font-family: monospace;
                white-space: nowrap;
                border: 2px solid ${routeColor};
                margin-top: -60px;
                margin-left: 40px;
              ">
                <div style="font-weight: bold; margin-bottom: 4px;">${route.name}</div>
                <div>📏 ${route.distance} NM</div>
                <div>⏱️ ${Math.floor(route.estimatedTime / 60)}h ${route.estimatedTime % 60}m</div>
                <div>⛽ ${route.estimatedFuel} lbs</div>
                <div>🔺 FL${Math.round(route.altitude / 100)}</div>
              </div>
            `,
            className: 'route-info',
            iconSize: [0, 0],
            iconAnchor: [0, 0]
          })}
        />
      )}
    </>
  );
}