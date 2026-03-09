import { useState, useEffect, useMemo, useCallback } from 'react';
import { useMetroStore } from '../store';
import { 
  createStationSearch, 
  createAttractionSearch, 
  searchStations, 
  searchAttractions 
} from '../utils/searchAlgorithm';

/**
 * Hook for station search with fuzzy matching
 */
export function useStationSearch() {
  const { stations } = useMetroStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  // Create Fuse instance
  const fuse = useMemo(() => {
    if (stations.length === 0) return null;
    return createStationSearch(stations);
  }, [stations]);
  
  // Search when query changes
  useEffect(() => {
    if (!fuse || !query.trim()) {
      setResults([]);
      return;
    }
    
    const searchResults = searchStations(query, fuse);
    setResults(searchResults);
  }, [query, fuse]);
  
  const search = useCallback((searchQuery) => {
    setQuery(searchQuery);
  }, []);
  
  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);
  
  return {
    query,
    results,
    search,
    clear,
    isReady: fuse !== null
  };
}

/**
 * Hook for attraction search with fuzzy matching
 */
export function useAttractionSearch() {
  const { attractions } = useMetroStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [category, setCategory] = useState('all');
  
  // Create Fuse instance
  const fuse = useMemo(() => {
    if (attractions.length === 0) return null;
    return createAttractionSearch(attractions);
  }, [attractions]);
  
  // Filtered attractions by category
  const filteredAttractions = useMemo(() => {
    if (category === 'all') return attractions;
    return attractions.filter(a => a.category === category);
  }, [attractions, category]);
  
  // Search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults(filteredAttractions);
      return;
    }
    
    if (!fuse) {
      setResults([]);
      return;
    }
    
    let searchResults = searchAttractions(query, fuse, 20);
    
    // Filter by category if not 'all'
    if (category !== 'all') {
      searchResults = searchResults.filter(a => a.category === category);
    }
    
    setResults(searchResults);
  }, [query, fuse, category, filteredAttractions]);
  
  const search = useCallback((searchQuery) => {
    setQuery(searchQuery);
  }, []);
  
  const filterByCategory = useCallback((cat) => {
    setCategory(cat);
  }, []);
  
  const clear = useCallback(() => {
    setQuery('');
    setCategory('all');
  }, []);
  
  return {
    query,
    results,
    category,
    search,
    filterByCategory,
    clear,
    isReady: fuse !== null,
    totalCount: attractions.length
  };
}

/**
 * Hook for combined search (stations + attractions)
 */
export function useCombinedSearch() {
  const { stations, attractions } = useMetroStore();
  const [query, setQuery] = useState('');
  const [stationResults, setStationResults] = useState([]);
  const [attractionResults, setAttractionResults] = useState([]);
  
  // Create Fuse instances
  const stationFuse = useMemo(() => {
    if (stations.length === 0) return null;
    return createStationSearch(stations);
  }, [stations]);
  
  const attractionFuse = useMemo(() => {
    if (attractions.length === 0) return null;
    return createAttractionSearch(attractions);
  }, [attractions]);
  
  // Search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setStationResults([]);
      setAttractionResults([]);
      return;
    }
    
    if (stationFuse) {
      setStationResults(searchStations(query, stationFuse, 5));
    }
    
    if (attractionFuse) {
      setAttractionResults(searchAttractions(query, attractionFuse, 5));
    }
  }, [query, stationFuse, attractionFuse]);
  
  const search = useCallback((searchQuery) => {
    setQuery(searchQuery);
  }, []);
  
  const clear = useCallback(() => {
    setQuery('');
    setStationResults([]);
    setAttractionResults([]);
  }, []);
  
  return {
    query,
    stationResults,
    attractionResults,
    search,
    clear,
    hasResults: stationResults.length > 0 || attractionResults.length > 0
  };
}

/**
 * Hook for debounced search
 */
export function useDebouncedSearch(delay = 300) {
  const [value, setValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return {
    value,
    debouncedValue,
    setValue
  };
}
