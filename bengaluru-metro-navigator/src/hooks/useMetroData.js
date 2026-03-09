import { useState, useEffect, useMemo } from 'react';
import { useMetroStore } from '../store';
import { fetchAllData } from '../utils/dataLoader';
import { buildMetroGraph } from '../utils/routeCalculator';

/**
 * Hook to load and access metro data
 */
export function useMetroData() {
  const { 
    lines, 
    stations, 
    interchanges, 
    attractions, 
    categories,
    fares,
    isLoading, 
    error, 
    setData, 
    setLoading, 
    setError 
  } = useMetroStore();
  
  useEffect(() => {
    const loadData = async () => {
      // Skip if already loaded
      if (stations.length > 0) return;
      
      setLoading(true);
      try {
        const data = await fetchAllData();
        setData(data);
      } catch (err) {
        setError(err.message || 'Failed to load metro data');
      }
    };
    
    loadData();
  }, []);
  
  // Build graph when stations are loaded
  const metroGraph = useMemo(() => {
    if (stations.length === 0) return null;
    return buildMetroGraph(stations, interchanges);
  }, [stations, interchanges]);
  
  return {
    lines,
    stations,
    interchanges,
    attractions,
    categories,
    fares,
    metroGraph,
    isLoading,
    error
  };
}

/**
 * Hook to get station data
 */
export function useStation(stationId) {
  const { stations, attractions } = useMetroStore();
  
  const station = useMemo(() => 
    stations.find(s => s.id === stationId),
    [stations, stationId]
  );
  
  const nearbyAttractions = useMemo(() =>
    attractions.filter(a => 
      a.nearestStation === stationId || 
      (a.alternateStations && a.alternateStations.includes(stationId))
    ),
    [attractions, stationId]
  );
  
  return { station, nearbyAttractions };
}

/**
 * Hook to get line data
 */
export function useLine(lineId) {
  const { lines, stations } = useMetroStore();
  
  const line = lines[lineId];
  
  const lineStations = useMemo(() =>
    stations
      .filter(s => s.line === lineId)
      .sort((a, b) => a.order - b.order),
    [stations, lineId]
  );
  
  return { line, stations: lineStations };
}

/**
 * Hook to get attraction data
 */
export function useAttraction(attractionId) {
  const { attractions, stations } = useMetroStore();
  
  const attraction = useMemo(() =>
    attractions.find(a => a.id === attractionId),
    [attractions, attractionId]
  );
  
  const nearestStation = useMemo(() => {
    if (!attraction) return null;
    return stations.find(s => s.id === attraction.nearestStation);
  }, [attraction, stations]);
  
  const alternateStations = useMemo(() => {
    if (!attraction?.alternateStations) return [];
    return stations.filter(s => attraction.alternateStations.includes(s.id));
  }, [attraction, stations]);
  
  return { attraction, nearestStation, alternateStations };
}
