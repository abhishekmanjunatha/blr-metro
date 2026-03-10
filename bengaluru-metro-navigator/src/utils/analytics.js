/**
 * Analytics utilities for tracking user interactions
 * Privacy-first approach - no personal data collection
 */

// GA4 measurement ID
const GA_MEASUREMENT_ID = 'G-88Y4EY0RG1';

// Check if analytics is loaded
const isAnalyticsLoaded = () => {
  return typeof window !== 'undefined' && window.gtag;
};

/**
 * Initialize Google Analytics
 * The gtag script is already loaded via index.html.
 * This function is a no-op kept for backwards compatibility.
 */
export function initializeAnalytics() {
  // gtag loaded via <script> in index.html — nothing to do here
}

/**
 * Track page view
 * @param {string} pagePath - Page path
 * @param {string} pageTitle - Page title
 */
export function trackPageView(pagePath, pageTitle) {
  if (!isAnalyticsLoaded()) return;
  
  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle
  });
}

/**
 * Track route search event
 * @param {string} origin - Origin station name
 * @param {string} destination - Destination station name
 * @param {boolean} routeFound - Whether route was found
 */
export function trackRouteSearch(origin, destination, routeFound = true) {
  if (!isAnalyticsLoaded()) return;
  
  window.gtag('event', 'route_search', {
    event_category: 'Journey Planner',
    event_label: `${origin} → ${destination}`,
    route_found: routeFound
  });
  
  // Also track to local storage for trending routes
  updateTrendingRoutes(origin, destination);
}

/**
 * Track attraction search
 * @param {string} query - Search query
 * @param {number} resultsCount - Number of results
 */
export function trackAttractionSearch(query, resultsCount) {
  if (!isAnalyticsLoaded()) return;
  
  window.gtag('event', 'attraction_search', {
    event_category: 'Attraction Navigator',
    event_label: query,
    results_count: resultsCount
  });
}

/**
 * Track attraction view
 * @param {string} attractionName - Attraction name
 * @param {string} category - Attraction category
 */
export function trackAttractionView(attractionName, category) {
  if (!isAnalyticsLoaded()) return;
  
  window.gtag('event', 'attraction_view', {
    event_category: 'Attraction',
    event_label: attractionName,
    attraction_category: category
  });
  
  // Track to local storage for trending
  updateTrendingAttractions(attractionName);
}

/**
 * Track station view
 * @param {string} stationName - Station name
 * @param {string} line - Metro line
 */
export function trackStationView(stationName, line) {
  if (!isAnalyticsLoaded()) return;
  
  window.gtag('event', 'station_view', {
    event_category: 'Station Explorer',
    event_label: stationName,
    metro_line: line
  });
}

/**
 * Track map interaction
 * @param {string} action - Interaction type (zoom, pan, station_click)
 * @param {string} details - Additional details
 */
export function trackMapInteraction(action, details = '') {
  if (!isAnalyticsLoaded()) return;
  
  window.gtag('event', 'map_interaction', {
    event_category: 'Interactive Map',
    event_label: action,
    interaction_details: details
  });
}

/**
 * Track feature usage
 * @param {string} feature - Feature name
 */
export function trackFeatureUsage(feature) {
  if (!isAnalyticsLoaded()) return;
  
  window.gtag('event', 'feature_usage', {
    event_category: 'Features',
    event_label: feature
  });
}

// Local storage keys
const TRENDING_ROUTES_KEY = 'nmn_trending_routes';
const TRENDING_ATTRACTIONS_KEY = 'nmn_trending_attractions';
const RECENT_SEARCHES_KEY = 'nmn_recent_searches';

/**
 * Update trending routes in local storage
 */
function updateTrendingRoutes(origin, destination) {
  try {
    const stored = localStorage.getItem(TRENDING_ROUTES_KEY);
    const routes = stored ? JSON.parse(stored) : {};
    const key = `${origin}|${destination}`;
    
    routes[key] = (routes[key] || 0) + 1;
    
    // Keep only top 50 routes
    const sorted = Object.entries(routes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50);
    
    localStorage.setItem(TRENDING_ROUTES_KEY, JSON.stringify(Object.fromEntries(sorted)));
  } catch (e) {
    // Ignore localStorage errors
  }
}

/**
 * Update trending attractions in local storage
 */
function updateTrendingAttractions(attractionName) {
  try {
    const stored = localStorage.getItem(TRENDING_ATTRACTIONS_KEY);
    const attractions = stored ? JSON.parse(stored) : {};
    
    attractions[attractionName] = (attractions[attractionName] || 0) + 1;
    
    // Keep only top 50
    const sorted = Object.entries(attractions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 50);
    
    localStorage.setItem(TRENDING_ATTRACTIONS_KEY, JSON.stringify(Object.fromEntries(sorted)));
  } catch (e) {
    // Ignore localStorage errors
  }
}

/**
 * Get trending routes
 * @param {number} limit - Number of routes to return
 * @returns {Array} Array of {origin, destination, count}
 */
export function getTrendingRoutes(limit = 5) {
  try {
    const stored = localStorage.getItem(TRENDING_ROUTES_KEY);
    if (!stored) return [];
    
    const routes = JSON.parse(stored);
    return Object.entries(routes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([key, count]) => {
        const [origin, destination] = key.split('|');
        return { origin, destination, count };
      });
  } catch (e) {
    return [];
  }
}

/**
 * Get trending attractions
 * @param {number} limit - Number of attractions to return
 * @returns {Array} Array of {name, count}
 */
export function getTrendingAttractions(limit = 5) {
  try {
    const stored = localStorage.getItem(TRENDING_ATTRACTIONS_KEY);
    if (!stored) return [];
    
    const attractions = JSON.parse(stored);
    return Object.entries(attractions)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  } catch (e) {
    return [];
  }
}

/**
 * Save recent search
 * @param {Object} search - Search object
 */
export function saveRecentSearch(search) {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    let searches = stored ? JSON.parse(stored) : [];
    
    // Add new search at the beginning
    searches = [
      { ...search, timestamp: Date.now() },
      ...searches.filter(s => 
        !(s.origin === search.origin && s.destination === search.destination)
      )
    ].slice(0, 10); // Keep only last 10
    
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch (e) {
    // Ignore localStorage errors
  }
}

/**
 * Get recent searches
 * @param {number} limit - Number of searches to return
 * @returns {Array} Recent searches
 */
export function getRecentSearches(limit = 5) {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!stored) return [];
    
    return JSON.parse(stored).slice(0, limit);
  } catch (e) {
    return [];
  }
}

/**
 * Clear all analytics data
 */
export function clearAnalyticsData() {
  try {
    localStorage.removeItem(TRENDING_ROUTES_KEY);
    localStorage.removeItem(TRENDING_ATTRACTIONS_KEY);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch (e) {
    // Ignore errors
  }
}
