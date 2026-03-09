import { useState, useRef, useEffect } from 'react';
import { Search, X, MapPin, Train, Clock } from 'lucide-react';
import { useStationSearch, useDebouncedSearch } from '../../hooks';
import { useSearchStore } from '../../store';

export default function StationSearchInput({ 
  value, 
  onChange, 
  placeholder = "Search station...",
  label,
  className = "",
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { search, results, clear, isReady } = useStationSearch();
  const { debouncedValue, setValue } = useDebouncedSearch(200);
  const { recentSearches } = useSearchStore();
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Handle input changes
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange({ target: { value: newValue } });
    setIsOpen(true);
  };

  // Search when debounced value changes
  useEffect(() => {
    if (debouncedValue) {
      search(debouncedValue);
    } else {
      clear();
    }
  }, [debouncedValue, search, clear]);

  // Handle station selection
  const handleSelect = (station) => {
    onChange({ target: { value: station.name }, station });
    clear();
    setValue('');
    setIsOpen(false);
  };

  // Handle clear
  const handleClear = () => {
    onChange({ target: { value: '' } });
    clear();
    setValue('');
    inputRef.current?.focus();
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get line color
  const getLineColor = (line) => {
    const colors = {
      purple: 'bg-metro-purple',
      green: 'bg-metro-green',
      yellow: 'bg-metro-yellow',
      pink: 'bg-metro-pink'
    };
    return colors[line] || 'bg-gray-400';
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={(e) => {
            setIsOpen(true);
            // Select all text on focus for better UX
            e.target.select();
          }}
          placeholder={placeholder}
          disabled={disabled || !isReady}
          className="input pl-10 pr-10"
          autoComplete="off"
        />
        
        {value && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (results.length > 0 || (!value && recentSearches.length > 0)) && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
          {/* Search Results */}
          {results.length > 0 && results.map((station) => (
            <button
              key={station.id}
              onClick={() => handleSelect(station)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className={`w-3 h-3 rounded-full ${getLineColor(station.line)}`} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {station.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {station.nameKannada} • {station.code}
                </p>
              </div>
              <Train className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>
          ))}

          {/* Recent Searches (when no query) */}
          {!value && recentSearches.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900">
                Recent Searches
              </div>
              {recentSearches.slice(0, 5).map((search, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onChange({ target: { value: search.originName || '' } });
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <Clock className="w-4 h-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      {search.originName} → {search.destinationName}
                    </p>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
