import { useState, useCallback, memo } from 'react';
import { ArrowRightLeft, Navigation, Clock, Ticket, Loader2 } from 'lucide-react';
import StationSearchInput from '../common/StationSearchInput';
import RouteResults from './RouteResults';
import FareSummary from './FareSummary';
import StationDetailCard from './StationDetailCard';
import { useMetroData, useMetroFare } from '../../hooks';
import { useRouteStore, useSearchStore } from '../../store';
import {
  findRoutes,
  calculateFare,
  getPriceTier,
  calculateFinalPrice,
  PaymentType,
  PriceTier,
  MINIMUM_FARE,
} from '../../utils/routeCalculator';
import { trackRouteSearch } from '../../utils/analytics';

// Memoized swap button for performance
const SwapButton = memo(({ onClick }) => (
  <div className="flex justify-center -my-2 relative z-10">
    <button
      onClick={onClick}
      className="p-2.5 rounded-full bg-gradient-to-br from-purple-100 to-green-100 dark:from-purple-900/30 dark:to-green-900/30 border border-purple-200 dark:border-purple-700 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
      aria-label="Swap stations"
    >
      <ArrowRightLeft className="w-5 h-5 text-purple-700 dark:text-purple-300 rotate-90" />
    </button>
  </div>
));

SwapButton.displayName = 'SwapButton';

// Memoized info section
const QuickInfo = memo(({ tierLabel, isHikeOnHold }) => (
  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
    <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-600 dark:text-gray-400">
      <div className="flex items-center gap-1.5">
        <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        <span className="font-medium">5:00 AM - 11:00 PM</span>
      </div>
      <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
      <div className="flex items-center gap-1.5">
        <Ticket className="w-4 h-4 text-green-600 dark:text-green-400" />
        <span className="font-medium">₹10 - ₹90</span>
      </div>
      {tierLabel && (
        <>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-1.5">
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-800/40 text-purple-700 dark:text-purple-300">
              {tierLabel}
            </span>
          </div>
        </>
      )}
    </div>
  </div>
));

QuickInfo.displayName = 'QuickInfo';

export default function JourneyPlanner() {
  const { stations, interchanges, metroGraph, fares, isLoading } = useMetroData();
  const { 
    origin, 
    destination, 
    routes, 
    isSearching,
    setOrigin, 
    setDestination, 
    setRoutes, 
    swapStations,
    setSearching 
  } = useRouteStore();
  const { addRecentSearch } = useSearchStore();
  
  const [originInput, setOriginInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [error, setError] = useState(null);

  // ── useMetroFare: reactive multi-tier fare calculation ─────────────────
  const {
    fareResult,
    multiTierFares,
    penaltyResult,
    isSameStation,
    priceTier,
    tierLabel,
    startAmenities,
    endAmenities,
    isHikeOnHold,
  } = useMetroFare({
    origin,
    destination,
    travelTime: null, // uses current time (IST via fareEngine)
    cardBalance: null,
    stations,
  });

  // Handle origin change
  const handleOriginChange = useCallback((e) => {
    setOriginInput(e.target.value);
    if (e.station) {
      setOrigin(e.station);
      setError(null);
    } else if (!e.target.value) {
      setOrigin(null);
    }
  }, [setOrigin]);

  // Handle destination change
  const handleDestinationChange = useCallback((e) => {
    setDestinationInput(e.target.value);
    if (e.station) {
      setDestination(e.station);
      setError(null);
    } else if (!e.target.value) {
      setDestination(null);
    }
  }, [setDestination]);

  // Handle swap
  const handleSwap = useCallback(() => {
    const tempInput = originInput;
    setOriginInput(destinationInput);
    setDestinationInput(tempInput);
    swapStations();
  }, [originInput, destinationInput, swapStations]);

  // Handle search
  const handleSearch = useCallback(() => {
    if (!origin || !destination) {
      setError('Please select both origin and destination stations');
      return;
    }

    // ── Same-station: show fare info instead of blocking ─────────────────
    if (origin.id === destination.id) {
      // Set a synthetic "route" for same-station display
      setRoutes([{
        type: 'same-station',
        message: 'Same station entry/exit',
        totalStops: 0,
        stationsCount: 0,
        estimatedTime: 0,
        distanceKm: 0,
        origin: origin.id,
        destination: destination.id,
        originName: origin.name,
        destinationName: destination.name,
        fare: {
          base: MINIMUM_FARE,
          token: MINIMUM_FARE,
          smartCardPeak: MINIMUM_FARE,
          smartCardOffPeak: MINIMUM_FARE,
          tierLabel: tierLabel,
        },
        segments: [],
        interchanges: [],
      }]);
      setSearching(false);
      setError(null);

      trackRouteSearch(origin.id, destination.id, 1);
      addRecentSearch({
        originId: origin.id,
        originName: origin.name,
        destinationId: destination.id,
        destinationName: destination.name,
      });
      return;
    }

    setSearching(true);
    setError(null);

    // Small delay for UX
    setTimeout(() => {
      try {
        const foundRoutes = findRoutes(origin.id, destination.id, metroGraph, interchanges);
        
        // Normalize route data for UI components
        const now = new Date();
        const tier = getPriceTier(now);
        const routesWithFare = foundRoutes.map(route => {
          const stationCount = route.stationsCount || route.totalStations || 0;
          const baseFare = route.fare || calculateFare(route.distanceKm || 0);

          // Compute all three tiers for the unified display
          const scPeak    = calculateFinalPrice(baseFare, PriceTier.PEAK, PaymentType.SMART_CARD);
          const scOffPeak = calculateFinalPrice(baseFare, PriceTier.OFF_PEAK, PaymentType.SMART_CARD);
          
          return {
            ...route,
            // Normalize property names for UI
            totalStops: stationCount,
            estimatedTime: route.totalTime || (stationCount * 2.5),
            origin: origin.id,
            destination: destination.id,
            originName: origin.name,
            destinationName: destination.name,
            // All three fare tiers for unified display
            fare: {
              base: baseFare,
              token: baseFare,
              smartCardPeak: scPeak.discountedFare,
              smartCardOffPeak: scOffPeak.discountedFare,
              tierLabel: tier === PriceTier.PEAK ? 'Peak Hours'
                       : tier === PriceTier.HOLIDAY ? 'Sunday / Holiday'
                       : 'Off-Peak Hours',
            },
            // Ensure segments exist for RouteCard
            segments: route.segments || [{
              line: route.line,
              stations: route.stations || [],
              stationsCount: stationCount
            }]
          };
        });

        setRoutes(routesWithFare);

        // Track search
        trackRouteSearch(origin.id, destination.id, foundRoutes.length);
        
        // Add to recent searches
        addRecentSearch({
          originId: origin.id,
          originName: origin.name,
          destinationId: destination.id,
          destinationName: destination.name
        });

        if (routesWithFare.length === 0) {
          setError('No routes found between these stations');
        }
      } catch (err) {
        setError('Failed to find routes. Please try again.');
        console.error('Route finding error:', err);
      }
      setSearching(false);
    }, 300);
  }, [origin, destination, metroGraph, stations, fares, tierLabel, setSearching, setRoutes, addRecentSearch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <Navigation className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          Plan Your Journey
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Find the best route between metro stations
        </p>
      </div>

      {/* Search Form - Optimized for mobile touch */}
      <div className="space-y-3">
        <div className="grid gap-3">
          {/* Origin */}
          <div className="relative">
            <StationSearchInput
              value={origin?.name || originInput}
              onChange={handleOriginChange}
              placeholder="From station"
              label="From"
              disabled={isLoading}
            />
          </div>

          {/* Swap Button - Memoized */}
          <SwapButton onClick={handleSwap} />

          {/* Destination */}
          <div className="relative">
            <StationSearchInput
              value={destination?.name || destinationInput}
              onChange={handleDestinationChange}
              placeholder="To station"
              label="To"
              disabled={isLoading}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}

          {/* Search Button - Enhanced for mobile */}
          <button
            onClick={handleSearch}
            disabled={isLoading || isSearching}
            className="w-full py-3.5 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 dark:from-purple-600 dark:to-purple-700"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Finding Routes...</span>
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5" />
                <span>Find Routes</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Info - Memoized */}
        <QuickInfo tierLabel={tierLabel} isHikeOnHold={isHikeOnHold} />
      </div>

      {/* ── Live Fare Preview (when both stations selected, before search) ── */}
      {multiTierFares && !routes.length && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <FareSummary
            multiTierFares={multiTierFares}
            tierLabel={tierLabel}
            isSameStation={isSameStation}
            penaltyResult={penaltyResult}
            isHikeOnHold={isHikeOnHold}
            compact
          />
        </div>
      )}

      {/* Route Results */}
      {routes.length > 0 && (
        <div className="space-y-4">
          <RouteResults routes={routes} />

          {/* Fare Summary (full) */}
          {multiTierFares && (
            <FareSummary
              multiTierFares={multiTierFares}
              tierLabel={tierLabel}
              isSameStation={isSameStation}
              penaltyResult={penaltyResult}
              isHikeOnHold={isHikeOnHold}
            />
          )}

          {/* Station Amenities */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {startAmenities && (
              <StationDetailCard amenities={startAmenities} label="Origin" />
            )}
            {endAmenities && (
              <StationDetailCard amenities={endAmenities} label="Destination" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
