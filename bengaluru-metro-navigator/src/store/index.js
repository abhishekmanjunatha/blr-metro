import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Main application store using Zustand
 */

// Metro Data Store
export const useMetroStore = create((set, get) => ({
  // Data
  lines: {},
  stations: [],
  interchanges: [],
  attractions: [],
  categories: {},
  fares: null,
  
  // Loading states
  isLoading: true,
  error: null,
  
  // Actions
  setData: (data) => set({
    lines: data.lines || {},
    stations: data.stations || [],
    interchanges: data.interchanges || [],
    attractions: data.attractions || [],
    categories: data.categories || {},
    fares: data.fares || null,
    isLoading: false,
    error: null
  }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error, isLoading: false }),
  
  // Selectors
  getStationById: (id) => get().stations.find(s => s.id === id),
  
  getStationsByLine: (lineId) => 
    get().stations
      .filter(s => s.line === lineId)
      .sort((a, b) => a.order - b.order),
  
  getAttractionById: (id) => get().attractions.find(a => a.id === id),
  
  getAttractionsByStation: (stationId) =>
    get().attractions.filter(a => 
      a.nearestStation === stationId || 
      (a.alternateStations && a.alternateStations.includes(stationId))
    ),
  
  getAttractionsByCategory: (category) =>
    category === 'all' 
      ? get().attractions 
      : get().attractions.filter(a => a.category === category)
}));


// Search History Store (persisted)
export const useSearchStore = create(
  persist(
    (set, get) => ({
      recentSearches: [],
      favoriteRoutes: [],
      favoriteStations: [],
      
      // Add recent search
      addRecentSearch: (search) => set((state) => ({
        recentSearches: [
          { ...search, timestamp: Date.now() },
          ...state.recentSearches.filter(s => 
            !(s.originId === search.originId && s.destinationId === search.destinationId)
          )
        ].slice(0, 10)
      })),
      
      // Clear recent searches
      clearRecentSearches: () => set({ recentSearches: [] }),
      
      // Toggle favorite route
      toggleFavoriteRoute: (route) => set((state) => {
        const key = `${route.originId}-${route.destinationId}`;
        const exists = state.favoriteRoutes.find(r => 
          `${r.originId}-${r.destinationId}` === key
        );
        
        return {
          favoriteRoutes: exists
            ? state.favoriteRoutes.filter(r => 
                `${r.originId}-${r.destinationId}` !== key
              )
            : [...state.favoriteRoutes, { ...route, savedAt: Date.now() }]
        };
      }),
      
      // Check if route is favorite
      isRouteFavorite: (originId, destinationId) =>
        get().favoriteRoutes.some(r => 
          r.originId === originId && r.destinationId === destinationId
        ),
      
      // Toggle favorite station
      toggleFavoriteStation: (stationId) => set((state) => ({
        favoriteStations: state.favoriteStations.includes(stationId)
          ? state.favoriteStations.filter(id => id !== stationId)
          : [...state.favoriteStations, stationId]
      })),
      
      // Check if station is favorite
      isStationFavorite: (stationId) =>
        get().favoriteStations.includes(stationId)
    }),
    {
      name: 'nmn-search-storage',
      version: 1
    }
  )
);


// UI Preferences Store (persisted)
export const usePreferencesStore = create(
  persist(
    (set, get) => ({
      // Theme
      theme: 'system', // 'light' | 'dark' | 'system'
      
      // Language
      language: 'en', // 'en' | 'kn' | 'hi'
      
      // Map preferences
      mapZoom: 1,
      showLabels: true,
      
      // Journey preferences
      preferredLine: null,
      avoidInterchanges: false,
      
      // Actions
      setTheme: (theme) => set({ theme }),
      
      setLanguage: (language) => set({ language }),
      
      setMapZoom: (zoom) => set({ mapZoom: zoom }),
      
      toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
      
      setPreferredLine: (line) => set({ preferredLine: line }),
      
      toggleAvoidInterchanges: () => set((state) => ({ 
        avoidInterchanges: !state.avoidInterchanges 
      })),
      
      // Get effective theme
      getEffectiveTheme: () => {
        const { theme } = get();
        if (theme !== 'system') return theme;
        
        if (typeof window !== 'undefined') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches 
            ? 'dark' 
            : 'light';
        }
        return 'light';
      }
    }),
    {
      name: 'nmn-preferences',
      version: 1
    }
  )
);


// Route Result Store (temporary, not persisted)
export const useRouteStore = create((set) => ({
  origin: null,
  destination: null,
  routes: [],
  selectedRouteIndex: 0,
  isSearching: false,
  
  setOrigin: (station) => set({ origin: station }),
  
  setDestination: (station) => set({ destination: station }),
  
  swapStations: () => set((state) => ({
    origin: state.destination,
    destination: state.origin,
    routes: []
  })),
  
  setRoutes: (routes) => set({ routes, selectedRouteIndex: 0, isSearching: false }),
  
  selectRoute: (index) => set({ selectedRouteIndex: index }),
  
  setSearching: (isSearching) => set({ isSearching }),
  
  clearRoute: () => set({
    origin: null,
    destination: null,
    routes: [],
    selectedRouteIndex: 0
  })
}));
