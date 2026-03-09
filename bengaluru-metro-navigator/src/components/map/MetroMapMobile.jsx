import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  ArrowRightLeft,
  Navigation,
  Info
} from 'lucide-react';
import { useMetroData } from '../../hooks';

// Line metadata with colors and details
const lineMetadata = {
  purple: {
    name: 'Purple Line',
    color: 'bg-purple-600',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-600',
    lightBg: 'bg-purple-50 dark:bg-purple-900/20',
    route: 'Whitefield (Kadugodi) ↔ Challaghatta',
    stations: 37,
    distance: '43 km'
  },
  green: {
    name: 'Green Line',
    color: 'bg-green-600',
    textColor: 'text-green-600',
    borderColor: 'border-green-600',
    lightBg: 'bg-green-50 dark:bg-green-900/20',
    route: 'Nagasandra ↔ Silk Institute',
    stations: 33,
    distance: '30 km'
  },
  yellow: {
    name: 'Yellow Line',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    borderColor: 'border-yellow-500',
    lightBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    route: 'RV Road ↔ Bommasandra',
    stations: 16,
    distance: '18.8 km'
  }
};

// Station item component
function StationItem({ station, lineColor, isInterchange, onStationClick }) {
  return (
    <Link
      to={`/stations/${station.id}`}
      onClick={() => onStationClick?.(station)}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
    >
      {/* Station Indicator */}
      <div className="relative flex-shrink-0">
        <div className={`w-3 h-3 rounded-full ${lineColor} ring-4 ring-gray-100 dark:ring-gray-800`} />
        {isInterchange && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full border border-white dark:border-gray-900" />
        )}
      </div>

      {/* Station Name */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 dark:text-white text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
          {station.name}
        </h4>
        {isInterchange && (
          <span className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1 mt-0.5">
            <ArrowRightLeft className="w-3 h-3" />
            Interchange
          </span>
        )}
      </div>

      {/* Order Number */}
      <div className="text-xs text-gray-500 dark:text-gray-500 font-mono">
        {station.order}
      </div>

      {/* Arrow */}
      <Info className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

// Line section component
function LineSection({ lineId, stations, interchanges, isExpanded, onToggle }) {
  const metadata = lineMetadata[lineId];
  if (!metadata) return null;

  // Sort stations by order
  const sortedStations = useMemo(() => {
    return [...stations].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [stations]);

  // Check if station is interchange
  const isInterchange = (stationId) => {
    if (!interchanges || interchanges.length === 0) return false;
    return interchanges.some(ic => 
      ic.stations?.includes(stationId) || ic.stationIds?.includes(stationId)
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Line Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full p-4 sm:p-5 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        {/* Line Color Bar */}
        <div className={`w-1.5 h-16 ${metadata.color} rounded-full`} />

        {/* Line Info */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {metadata.name}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${metadata.lightBg} ${metadata.textColor} font-medium`}>
              {metadata.stations} stations
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {metadata.route}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {metadata.distance} • Operational
          </p>
        </div>

        {/* Expand Icon */}
        <div className={`flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-6 h-6 text-gray-400" />
        </div>
      </button>

      {/* Station List - Expandable */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="p-4 space-y-1 max-h-[60vh] overflow-y-auto scrollbar-custom">
            {sortedStations.map((station, index) => (
              <div key={station.id}>
                <StationItem
                  station={station}
                  lineColor={metadata.color}
                  isInterchange={isInterchange(station.id)}
                />
                {index < sortedStations.length - 1 && (
                  <div className={`ml-[18px] w-0.5 h-6 ${metadata.color} opacity-30`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MetroMapMobile({ onStationClick }) {
  const { stations, interchanges = [], isLoading } = useMetroData();
  const [expandedLines, setExpandedLines] = useState(['purple']); // Purple line expanded by default

  // Group stations by line
  const stationsByLine = useMemo(() => {
    if (!stations || stations.length === 0) return {};

    const grouped = {};
    stations.forEach(station => {
      if (!grouped[station.line]) {
        grouped[station.line] = [];
      }
      grouped[station.line].push(station);
    });

    return grouped;
  }, [stations]);

  const toggleLine = (lineId) => {
    setExpandedLines(prev => 
      prev.includes(lineId) 
        ? prev.filter(l => l !== lineId)
        : [...prev, lineId]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="skeleton h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!stations || stations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No station data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-purple-600 to-green-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-3">
          <MapPin className="w-6 h-6" />
          <h2 className="text-xl font-bold">Namma Metro Network</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">60+</div>
            <div className="text-xs text-purple-100">Stations</div>
          </div>
          <div>
            <div className="text-2xl font-bold">3</div>
            <div className="text-xs text-purple-100">Lines</div>
          </div>
          <div>
            <div className="text-2xl font-bold">92</div>
            <div className="text-xs text-purple-100">Kilometers</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Info className="w-4 h-4" />
          How to Use
        </h3>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-600 rounded-full" />
            Tap on a line to expand and view all stations
          </li>
          <li className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            Orange dot indicates interchange stations
          </li>
          <li className="flex items-center gap-2">
            <Navigation className="w-3 h-3" />
            Click any station for details and directions
          </li>
        </ul>
      </div>

      {/* Metro Lines */}
      <div className="space-y-4">
        {['purple', 'green', 'yellow'].map(lineId => {
          const lineStations = stationsByLine[lineId];
          if (!lineStations || lineStations.length === 0) {
            return null;
          }
          return (
            <LineSection
              key={lineId}
              lineId={lineId}
              stations={lineStations}
              interchanges={interchanges}
              isExpanded={expandedLines.includes(lineId)}
              onToggle={() => toggleLine(lineId)}
            />
          );
        })}
      </div>

      {/* Interchange Info */}
      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          Interchange Stations
        </h3>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white">Majestic:</span>
            <span>Purple ↔ Green Lines</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white">RV Road:</span>
            <span>Green ↔ Yellow Lines</span>
          </div>
        </div>
      </div>
    </div>
  );
}
