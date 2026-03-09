import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ZoomIn, ZoomOut, Maximize2, Train, Info } from 'lucide-react';
import { useMetroData } from '../../hooks';
import { usePreferencesStore } from '../../store';
import { trackMapInteraction } from '../../utils/analytics';

// Line colors for SVG
const lineColors = {
  purple: '#8B008B',
  green: '#00A86B',
  yellow: '#FFD700',
  pink: '#FF69B4'
};

// SVG dimensions and layout
const MAP_WIDTH = 2400;
const MAP_HEIGHT = 1800;
const STATION_RADIUS = 8;
const INTERCHANGE_RADIUS = 12;

export default function MetroMap({ onStationClick, highlightStations = [] }) {
  const { stations, lines, interchanges, isLoading } = useMetroData();
  const { mapZoom, setMapZoom, showLabels } = usePreferencesStore();
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [hoveredStation, setHoveredStation] = useState(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Calculate station positions based on line and order
  const stationPositions = useMemo(() => {
    if (!stations || stations.length === 0) return {};

    const positions = {};
    
    // Define schematic layout for each line with proper spacing
    // Purple Line has ~37 stations, Green has ~33, Yellow has ~16
    const lineLayouts = {
      // Purple Line - horizontal through center (East-West)
      purple: { 
        startX: 100, 
        startY: 600, 
        direction: 'horizontal', 
        spacing: 60
      },
      // Green Line - vertical through center (North-South)
      green: { 
        startX: 1100, 
        startY: 100, 
        direction: 'vertical', 
        spacing: 50
      },
      // Yellow Line - diagonal from RV Road toward Bommasandra
      yellow: { 
        startX: 1150, 
        startY: 1100, 
        direction: 'diagonal-right', 
        spacing: 65
      },
      // Pink Line (planned)
      pink: { 
        startX: 400, 
        startY: 200, 
        direction: 'diagonal-left', 
        spacing: 50
      }
    };

    // Group and sort stations by line
    const lineStationsMap = {};
    stations.forEach(station => {
      if (!lineStationsMap[station.line]) {
        lineStationsMap[station.line] = [];
      }
      lineStationsMap[station.line].push(station);
    });

    // Sort each line's stations by order
    Object.keys(lineStationsMap).forEach(line => {
      lineStationsMap[line].sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    // Calculate Majestic position (intersection point)
    // Purple Line Majestic is at order 23, Green Line Majestic is at order 17
    const purpleStations = lineStationsMap['purple'] || [];
    const greenStations = lineStationsMap['green'] || [];
    
    const purpleMajesticIdx = purpleStations.findIndex(s => s.id === 'majestic');
    const greenMajesticIdx = greenStations.findIndex(s => s.id === 'majestic-green');
    
    // Calculate intersection point
    const majesticX = 1100; // Green line X position
    const majesticY = 600; // Purple line Y position

    // Calculate positions for each station
    Object.entries(lineStationsMap).forEach(([lineId, lineStns]) => {
      const layout = lineLayouts[lineId];
      if (!layout) return;

      lineStns.forEach((station, index) => {
        let x, y;

        if (lineId === 'purple') {
          // Purple line: horizontal, centered at Majestic
          const offsetFromMajestic = index - purpleMajesticIdx;
          x = majesticX + (offsetFromMajestic * layout.spacing);
          y = majesticY;
        } else if (lineId === 'green') {
          // Green line: vertical, centered at Majestic
          const offsetFromMajestic = index - greenMajesticIdx;
          x = majesticX;
          y = majesticY + (offsetFromMajestic * layout.spacing);
        } else if (lineId === 'yellow') {
          // Yellow line starts from RV Road (Green line order 22)
          // RV Road on Green is at index ~21 (order 22)
          const rvRoadGreenIdx = greenStations.findIndex(s => s.id === 'rv-road');
          const rvRoadY = majesticY + ((rvRoadGreenIdx - greenMajesticIdx) * lineLayouts.green.spacing);
          
          x = majesticX + (index * layout.spacing * 0.7);
          y = rvRoadY + (index * layout.spacing * 0.5);
        } else {
          // Default layout
          switch (layout.direction) {
            case 'horizontal':
              x = layout.startX + (index * layout.spacing);
              y = layout.startY;
              break;
            case 'vertical':
              x = layout.startX;
              y = layout.startY + (index * layout.spacing);
              break;
            case 'diagonal-left':
              x = layout.startX - (index * layout.spacing * 0.5);
              y = layout.startY + (index * layout.spacing * 0.8);
              break;
            default:
              x = layout.startX + (index * layout.spacing);
              y = layout.startY;
          }
        }

        positions[station.id] = { x, y };
      });
    });

    // Ensure interchange stations overlap correctly
    if (positions['majestic'] && positions['majestic-green']) {
      positions['majestic-green'].x = positions['majestic'].x;
      positions['majestic-green'].y = positions['majestic'].y;
    }
    
    if (positions['rv-road'] && positions['rv-road-yellow']) {
      positions['rv-road-yellow'].x = positions['rv-road'].x;
      positions['rv-road-yellow'].y = positions['rv-road'].y;
    }

    return positions;
  }, [stations]);

  // Handle zoom
  const handleZoom = (delta) => {
    const newZoom = Math.max(0.5, Math.min(3, mapZoom + delta));
    setMapZoom(newZoom);
    trackMapInteraction('zoom', { level: newZoom });
  };

  // Handle reset
  const handleReset = () => {
    setMapZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Handle pan
  const handleMouseDown = (e) => {
    if (e.target.tagName !== 'circle' && e.target.tagName !== 'text') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      setStartPan({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (isPanning && e.touches.length === 1) {
      setPan({
        x: e.touches[0].clientX - startPan.x,
        y: e.touches[0].clientY - startPan.y
      });
    }
  };

  // Station click handler
  const handleStationClick = (station) => {
    setSelectedStation(station);
    trackMapInteraction('station_click', { stationId: station.id });
    if (onStationClick) {
      onStationClick(station);
    }
  };

  // Check if station is interchange
  const isInterchange = (stationId) => {
    return interchanges?.some(ic => ic.stations?.includes(stationId)) || 
           stations?.find(s => s.id === stationId)?.interchangeWith?.length > 0;
  };

  // Check if station should be highlighted
  const isHighlighted = (stationId) => {
    return highlightStations.includes(stationId);
  };

  if (isLoading) {
    return (
      <div className="card p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Train className="w-12 h-12 text-metro-purple mx-auto animate-bounce" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading metro map...</p>
        </div>
      </div>
    );
  }

  // Group stations by line for drawing paths
  const lineStations = Object.keys(lines).reduce((acc, lineId) => {
    acc[lineId] = stations
      .filter(s => s.line === lineId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    return acc;
  }, {});

  return (
    <div className="card overflow-hidden">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Train className="w-5 h-5 text-metro-purple" />
          Namma Metro Map
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleZoom(-0.25)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[3rem] text-center">
            {Math.round(mapZoom * 100)}%
          </span>
          <button
            onClick={() => handleZoom(0.25)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Reset view"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden bg-gray-50 dark:bg-gray-900 cursor-grab active:cursor-grabbing"
        style={{ height: '600px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="w-full h-full"
          style={{
            transform: `scale(${mapZoom}) translate(${pan.x / mapZoom}px, ${pan.y / mapZoom}px)`,
            transformOrigin: 'center center'
          }}
        >
          {/* Background Grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="0.5" className="dark:stroke-gray-800" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Draw Lines */}
          {Object.entries(lineStations).map(([lineId, lineStns]) => {
            if (lineStns.length < 2) return null;
            
            const points = lineStns
              .map(s => stationPositions[s.id])
              .filter(Boolean)
              .map(p => `${p.x},${p.y}`)
              .join(' ');

            return (
              <polyline
                key={lineId}
                points={points}
                fill="none"
                stroke={lineColors[lineId] || '#999'}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-opacity"
              />
            );
          })}

          {/* Draw Stations */}
          {stations.map((station, stationIndex) => {
            const pos = stationPositions[station.id];
            if (!pos) return null;

            const isInt = isInterchange(station.id);
            const isHigh = isHighlighted(station.id);
            const radius = isInt ? INTERCHANGE_RADIUS : STATION_RADIUS;
            
            // Determine label position based on line and station index
            // Alternate labels above/below for horizontal lines, left/right for vertical
            const isEvenIndex = stationIndex % 2 === 0;
            let labelX = pos.x;
            let labelY = pos.y;
            let textAnchor = 'start';
            let labelRotation = 0;
            
            if (station.line === 'purple') {
              // Horizontal line - labels alternate above/below, angled
              labelX = pos.x + 5;
              labelY = isEvenIndex ? pos.y - radius - 5 : pos.y + radius + 12;
              labelRotation = -45;
              textAnchor = 'start';
            } else if (station.line === 'green') {
              // Vertical line - alternate left/right
              labelX = isEvenIndex ? pos.x - radius - 10 : pos.x + radius + 10;
              textAnchor = isEvenIndex ? 'end' : 'start';
              labelY = pos.y + 4;
            } else if (station.line === 'yellow') {
              // Diagonal line - labels alternate above/below
              labelX = pos.x + radius + 8;
              labelY = isEvenIndex ? pos.y - 5 : pos.y + 15;
              textAnchor = 'start';
            }

            return (
              <g
                key={station.id}
                className="cursor-pointer station-group"
                onClick={() => handleStationClick(station)}
                onMouseEnter={() => setHoveredStation(station)}
                onMouseLeave={() => setHoveredStation(null)}
              >
                {/* Station Circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius}
                  fill={isHigh ? '#FF6B35' : 'white'}
                  stroke={isInt ? '#333' : lineColors[station.line]}
                  strokeWidth={isInt ? 3 : 2}
                  className="transition-all"
                  style={{
                    filter: hoveredStation?.id === station.id ? 'drop-shadow(0 0 4px rgba(0,0,0,0.3))' : 'none'
                  }}
                />
                
                {/* Interchange indicator */}
                {isInt && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius - 3}
                    fill="none"
                    stroke={lineColors[station.line]}
                    strokeWidth="2"
                  />
                )}

                {/* Station Label - show all stations */}
                {showLabels && (
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor={textAnchor}
                    transform={labelRotation !== 0 ? `rotate(${labelRotation}, ${labelX}, ${labelY})` : undefined}
                    className="text-[9px] fill-gray-700 dark:fill-gray-300 pointer-events-none font-medium"
                  >
                    {station.name.length > 20 ? station.name.slice(0, 20) + '...' : station.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredStation && stationPositions[hoveredStation.id] && (
          <div 
            className="absolute pointer-events-none z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm"
            style={{
              left: '50%',
              top: '16px',
              transform: 'translateX(-50%)'
            }}
          >
            <p className="font-semibold">{hoveredStation.name}</p>
            <p className="text-gray-300 text-xs">{hoveredStation.nameKannada}</p>
            <div className="flex items-center gap-2 mt-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: lineColors[hoveredStation.line] }}
              />
              <span className="text-xs text-gray-300">
                {hoveredStation.line.charAt(0).toUpperCase() + hoveredStation.line.slice(1)} Line
              </span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-xs">
          <p className="font-semibold mb-2 text-gray-900 dark:text-white">Lines</p>
          <div className="space-y-1">
            {Object.entries(lines).map(([id, line]) => (
              <div key={id} className="flex items-center gap-2">
                <div
                  className="w-4 h-1 rounded"
                  style={{ backgroundColor: lineColors[id] }}
                />
                <span className="text-gray-600 dark:text-gray-400">{line.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Station Info */}
        {selectedStation && (
          <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {selectedStation.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedStation.nameKannada}
                </p>
                <span className={`mt-1 inline-block badge-${selectedStation.line}`}>
                  {selectedStation.line.charAt(0).toUpperCase() + selectedStation.line.slice(1)} Line
                </span>
              </div>
              <button
                onClick={() => setSelectedStation(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <Link
              to={`/stations/${selectedStation.id}`}
              className="mt-3 w-full btn-primary text-sm py-2 flex items-center justify-center"
            >
              <Info className="w-4 h-4 mr-2" />
              View Details
            </Link>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
        Click on a station for details • Drag to pan • Use buttons to zoom
      </div>
    </div>
  );
}
