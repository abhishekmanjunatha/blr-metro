import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Train, 
  Filter,
  ChevronRight,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { useMetroData, useStationSearch, useDebouncedSearch } from '../../hooks';
import { SkeletonList } from '../common/LoadingSpinner';

const lineFilters = [
  { id: 'all', label: 'All Lines', color: 'bg-gray-500' },
  { id: 'purple', label: 'Purple Line', color: 'bg-metro-purple' },
  { id: 'green', label: 'Green Line', color: 'bg-metro-green' },
  { id: 'yellow', label: 'Yellow Line', color: 'bg-metro-yellow' },
  { id: 'pink', label: 'Pink Line', color: 'bg-metro-pink' }
];

export default function StationList() {
  const { stations, lines, isLoading } = useMetroData();
  const [searchInput, setSearchInput] = useState('');
  const [selectedLine, setSelectedLine] = useState('all');
  const { debouncedValue, setValue } = useDebouncedSearch(200);
  const { results, search } = useStationSearch();

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setValue(value);
  };

  // Search when debounced value changes
  useMemo(() => {
    search(debouncedValue);
  }, [debouncedValue, search]);

  // Get filtered stations
  const filteredStations = useMemo(() => {
    let stationList = debouncedValue ? results : stations;
    
    if (selectedLine !== 'all') {
      stationList = stationList.filter(s => s.line === selectedLine);
    }
    
    // Sort by line then order
    return stationList.sort((a, b) => {
      if (a.line !== b.line) {
        const lineOrder = ['purple', 'green', 'yellow', 'pink'];
        return lineOrder.indexOf(a.line) - lineOrder.indexOf(b.line);
      }
      return (a.order || 0) - (b.order || 0);
    });
  }, [stations, results, selectedLine, debouncedValue]);

  // Group by line for display
  const groupedStations = useMemo(() => {
    if (selectedLine !== 'all') {
      return { [selectedLine]: filteredStations };
    }
    
    return filteredStations.reduce((acc, station) => {
      const line = station.line;
      if (!acc[line]) acc[line] = [];
      acc[line].push(station);
      return acc;
    }, {});
  }, [filteredStations, selectedLine]);

  if (isLoading) {
    return <SkeletonList count={10} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Station Guide
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Explore all {stations.length} metro stations
        </p>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={handleSearch}
            placeholder="Search stations..."
            className="input pl-10"
          />
        </div>

        {/* Line Filters */}
        <div className="flex flex-wrap gap-2">
          {lineFilters.map(filter => (
            <button
              key={filter.id}
              onClick={() => setSelectedLine(filter.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedLine === filter.id
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <div className={`w-3 h-3 rounded-full ${filter.color}`} />
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredStations.length} station{filteredStations.length !== 1 ? 's' : ''}
      </p>

      {/* Stations List */}
      <div className="space-y-6">
        {Object.entries(groupedStations).map(([lineId, lineStations]) => {
          const line = lines[lineId];
          
          return (
            <div key={lineId} className="card overflow-hidden">
              {/* Line Header */}
              <div className={`line-${lineId} px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <Train className="w-5 h-5" />
                  <span className="font-semibold">{line?.name || `${lineId} Line`}</span>
                </div>
                <span className="text-sm opacity-75">
                  {lineStations.length} stations
                </span>
              </div>

              {/* Stations */}
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {lineStations.map((station, index) => {
                  const isInterchange = station.interchangeWith && station.interchangeWith.length > 0;
                  const isTerminus = index === 0 || index === lineStations.length - 1;
                  
                  return (
                    <Link
                      key={station.id}
                      to={`/stations/${station.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                    >
                      {/* Station Indicator */}
                      <div className="relative">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isInterchange 
                            ? 'bg-white border-gray-900 dark:border-white' 
                            : isTerminus
                              ? `bg-metro-${lineId} border-metro-${lineId}`
                              : 'bg-white border-current'
                        }`} 
                        style={{ borderColor: isInterchange ? undefined : lineColors[lineId] }}
                        />
                        {/* Connection line */}
                        {index > 0 && (
                          <div 
                            className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0.5 h-4"
                            style={{ backgroundColor: lineColors[lineId] }}
                          />
                        )}
                        {index < lineStations.length - 1 && (
                          <div 
                            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 h-4"
                            style={{ backgroundColor: lineColors[lineId] }}
                          />
                        )}
                      </div>

                      {/* Station Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-metro-purple transition-colors">
                            {station.name}
                          </h3>
                          {isInterchange && (
                            <RefreshCw className="w-4 h-4 text-orange-500" />
                          )}
                          {isTerminus && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                              Terminus
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {station.nameKannada} • {station.code}
                        </p>
                        {isInterchange && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            Interchange: {station.interchangeWith?.map(l => l.charAt(0).toUpperCase() + l.slice(1)).join(', ')} Line
                          </p>
                        )}
                      </div>

                      {/* Arrow */}
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-metro-purple transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* No Results */}
      {filteredStations.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            No stations found matching your search.
          </p>
        </div>
      )}
    </div>
  );
}

const lineColors = {
  purple: '#8B008B',
  green: '#00A86B',
  yellow: '#FFD700',
  pink: '#FF69B4'
};
