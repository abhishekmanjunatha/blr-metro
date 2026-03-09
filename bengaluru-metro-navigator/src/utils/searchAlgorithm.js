import Fuse from 'fuse.js';

/**
 * Search utilities for stations and attractions
 */

/**
 * Create fuzzy search instance for stations
 * @param {Array} stations - Array of station objects
 * @returns {Fuse} Fuse.js instance
 */
export function createStationSearch(stations) {
  const options = {
    keys: [
      { name: 'name', weight: 0.4 },
      { name: 'nameKannada', weight: 0.2 },
      { name: 'code', weight: 0.3 },
      { name: 'nearbyAttractions', weight: 0.1 }
    ],
    threshold: 0.3,
    distance: 100,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    shouldSort: true,
    findAllMatches: true,
    ignoreLocation: true
  };
  
  return new Fuse(stations, options);
}

/**
 * Create fuzzy search instance for attractions
 * @param {Array} attractions - Array of attraction objects
 * @returns {Fuse} Fuse.js instance
 */
export function createAttractionSearch(attractions) {
  const options = {
    keys: [
      { name: 'name', weight: 0.35 },
      { name: 'nameKannada', weight: 0.15 },
      { name: 'description', weight: 0.15 },
      { name: 'category', weight: 0.15 },
      { name: 'tags', weight: 0.2 }
    ],
    threshold: 0.4,
    distance: 100,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    shouldSort: true,
    findAllMatches: true,
    ignoreLocation: true
  };
  
  return new Fuse(attractions, options);
}

/**
 * Search stations with fuzzy matching
 * @param {string} query - Search query
 * @param {Fuse} fuse - Fuse instance
 * @param {number} limit - Maximum results
 * @returns {Array} Matching stations
 */
export function searchStations(query, fuse, limit = 6) {
  if (!query || query.length < 1) return [];
  
  const results = fuse.search(query, { limit: limit * 2 }); // Get more results to filter
  
  // Group stations by name to filter duplicates (interchange stations)
  const stationsByName = new Map();
  
  results.forEach(result => {
    const station = result.item;
    const existingStation = stationsByName.get(station.name);
    
    if (!existingStation) {
      // First occurrence - add it
      stationsByName.set(station.name, {
        ...station,
        score: result.score,
        matches: result.matches
      });
    } else {
      // Duplicate found (interchange station) - prefer the simpler ID (without suffix)
      // e.g., prefer "majestic" over "majestic-green", "rv-road" over "rv-road-yellow"
      const existingIdParts = existingStation.id.split('-').length;
      const currentIdParts = station.id.split('-').length;
      
      if (currentIdParts < existingIdParts) {
        // Current station has simpler ID, replace existing
        stationsByName.set(station.name, {
          ...station,
          score: result.score,
          matches: result.matches
        });
      }
      // Otherwise keep existing (already has simpler ID or same complexity)
    }
  });
  
  // Return deduplicated results, limited to requested count
  return Array.from(stationsByName.values()).slice(0, limit);
}

/**
 * Search attractions with fuzzy matching
 * @param {string} query - Search query
 * @param {Fuse} fuse - Fuse instance
 * @param {number} limit - Maximum results
 * @returns {Array} Matching attractions
 */
export function searchAttractions(query, fuse, limit = 10) {
  if (!query || query.length < 2) return [];
  
  const results = fuse.search(query, { limit });
  
  return results.map(result => ({
    ...result.item,
    score: result.score,
    matches: result.matches
  }));
}

/**
 * Filter attractions by category
 * @param {Array} attractions - All attractions
 * @param {string} category - Category to filter
 * @returns {Array} Filtered attractions
 */
export function filterByCategory(attractions, category) {
  if (!category || category === 'all') return attractions;
  return attractions.filter(a => a.category === category);
}

/**
 * Filter attractions by metro line
 * @param {Array} attractions - All attractions
 * @param {string} line - Line to filter
 * @returns {Array} Filtered attractions
 */
export function filterByLine(attractions, line) {
  if (!line || line === 'all') return attractions;
  return attractions.filter(a => a.line === line);
}

/**
 * Get nearby attractions for a station
 * @param {string} stationId - Station ID
 * @param {Array} attractions - All attractions
 * @returns {Array} Nearby attractions
 */
export function getNearbyAttractions(stationId, attractions) {
  return attractions.filter(a => 
    a.nearestStation === stationId || 
    (a.alternateStations && a.alternateStations.includes(stationId))
  ).sort((a, b) => (a.distance || 0) - (b.distance || 0));
}

/**
 * Get popular/trending attractions
 * @param {Array} attractions - All attractions
 * @param {number} limit - Maximum results
 * @returns {Array} Popular attractions
 */
export function getPopularAttractions(attractions, limit = 10) {
  // Sort by rating (you could enhance this with actual analytics data)
  return [...attractions]
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, limit);
}

/**
 * Get attractions grouped by category
 * @param {Array} attractions - All attractions
 * @returns {Object} Attractions grouped by category
 */
export function groupByCategory(attractions) {
  return attractions.reduce((acc, attraction) => {
    const category = attraction.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(attraction);
    return acc;
  }, {});
}

/**
 * Highlight matched text in search results
 * @param {string} text - Original text
 * @param {Array} matches - Fuse.js matches
 * @returns {Array} Array of text segments with highlight flags
 */
export function highlightMatches(text, matches) {
  if (!matches || !matches.length) {
    return [{ text, highlight: false }];
  }
  
  const indices = matches
    .filter(m => m.key === 'name')
    .flatMap(m => m.indices)
    .sort((a, b) => a[0] - b[0]);
  
  if (!indices.length) {
    return [{ text, highlight: false }];
  }
  
  const result = [];
  let lastIndex = 0;
  
  indices.forEach(([start, end]) => {
    if (start > lastIndex) {
      result.push({ text: text.slice(lastIndex, start), highlight: false });
    }
    result.push({ text: text.slice(start, end + 1), highlight: true });
    lastIndex = end + 1;
  });
  
  if (lastIndex < text.length) {
    result.push({ text: text.slice(lastIndex), highlight: false });
  }
  
  return result;
}
