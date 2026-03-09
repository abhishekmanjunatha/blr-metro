/**
 * Data loader utilities
 * Fetches and caches metro data from JSON files
 */

const DATA_CACHE = {
  stations: null,
  attractions: null,
  fares: null,
  lastFetch: null
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch stations data
 * @returns {Promise<Object>} Stations data
 */
export async function fetchStationsData() {
  if (DATA_CACHE.stations && Date.now() - DATA_CACHE.lastFetch < CACHE_DURATION) {
    return DATA_CACHE.stations;
  }
  
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/stations.json`);
    if (!response.ok) throw new Error('Failed to fetch stations');
    
    const data = await response.json();
    DATA_CACHE.stations = data;
    DATA_CACHE.lastFetch = Date.now();
    
    return data;
  } catch (error) {
    console.error('Error loading stations:', error);
    throw error;
  }
}

/**
 * Fetch attractions data
 * @returns {Promise<Object>} Attractions data
 */
export async function fetchAttractionsData() {
  if (DATA_CACHE.attractions && Date.now() - DATA_CACHE.lastFetch < CACHE_DURATION) {
    return DATA_CACHE.attractions;
  }
  
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/attractions.json`);
    if (!response.ok) throw new Error('Failed to fetch attractions');
    
    const data = await response.json();
    DATA_CACHE.attractions = data;
    
    return data;
  } catch (error) {
    console.error('Error loading attractions:', error);
    throw error;
  }
}

/**
 * Fetch fares data
 * @returns {Promise<Object>} Fares data
 */
export async function fetchFaresData() {
  if (DATA_CACHE.fares && Date.now() - DATA_CACHE.lastFetch < CACHE_DURATION) {
    return DATA_CACHE.fares;
  }
  
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/fares.json`);
    if (!response.ok) throw new Error('Failed to fetch fares');
    
    const data = await response.json();
    DATA_CACHE.fares = data;
    
    return data;
  } catch (error) {
    console.error('Error loading fares:', error);
    throw error;
  }
}

/**
 * Fetch all metro data at once
 * @returns {Promise<Object>} All metro data
 */
export async function fetchAllData() {
  try {
    const [stationsData, attractionsData, faresData] = await Promise.all([
      fetchStationsData(),
      fetchAttractionsData(),
      fetchFaresData()
    ]);
    
    return {
      lines: stationsData.lines,
      stations: stationsData.stations,
      interchanges: stationsData.interchanges,
      attractions: attractionsData.attractions,
      categories: attractionsData.categories,
      fares: faresData
    };
  } catch (error) {
    console.error('Error loading all data:', error);
    throw error;
  }
}

/**
 * Get station by ID
 * @param {string} stationId - Station ID
 * @param {Array} stations - Stations array
 * @returns {Object|null} Station object
 */
export function getStationById(stationId, stations) {
  return stations.find(s => s.id === stationId) || null;
}

/**
 * Get stations by line
 * @param {string} lineId - Line ID
 * @param {Array} stations - Stations array
 * @returns {Array} Stations on that line
 */
export function getStationsByLine(lineId, stations) {
  return stations
    .filter(s => s.line === lineId)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get interchange stations
 * @param {Array} stations - Stations array
 * @returns {Array} Interchange stations
 */
export function getInterchangeStations(stations) {
  return stations.filter(s => s.isInterchange || (s.interchangeWith && s.interchangeWith.length > 0));
}

/**
 * Get terminus stations
 * @param {Array} stations - Stations array
 * @returns {Array} Terminus stations
 */
export function getTerminusStations(stations) {
  return stations.filter(s => s.isTerminus);
}

/**
 * Get attraction by ID
 * @param {string} attractionId - Attraction ID
 * @param {Array} attractions - Attractions array
 * @returns {Object|null} Attraction object
 */
export function getAttractionById(attractionId, attractions) {
  return attractions.find(a => a.id === attractionId) || null;
}

/**
 * Clear data cache
 */
export function clearCache() {
  DATA_CACHE.stations = null;
  DATA_CACHE.attractions = null;
  DATA_CACHE.fares = null;
  DATA_CACHE.lastFetch = null;
}

/**
 * Preload all data (useful for service worker)
 */
export async function preloadData() {
  try {
    await fetchAllData();
    console.log('Metro data preloaded successfully');
  } catch (error) {
    console.error('Failed to preload data:', error);
  }
}
