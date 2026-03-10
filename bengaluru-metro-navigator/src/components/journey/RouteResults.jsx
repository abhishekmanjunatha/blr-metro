import { useState } from 'react';
import { Clock, Ticket, ArrowRight, ChevronDown, ChevronUp, Heart, Share2 } from 'lucide-react';
import RouteCard from './RouteCard';
import { useRouteStore, useSearchStore } from '../../store';
import { formatDuration, getEstimatedArrival } from '../../utils/routeCalculator';

export default function RouteResults({ routes }) {
  const { selectedRouteIndex, selectRoute } = useRouteStore();
  const { toggleFavoriteRoute, isRouteFavorite } = useSearchStore();
  const [showDetails, setShowDetails] = useState(true);

  if (!routes || routes.length === 0) {
    return null;
  }

  const selectedRoute = routes[selectedRouteIndex];
  const isFavorite = isRouteFavorite(selectedRoute.origin, selectedRoute.destination);

  const handleShare = async () => {
    const shareData = {
      title: 'Metro Route',
      text: `Route from ${selectedRoute.originName} to ${selectedRoute.destinationName} - ${selectedRoute.totalStops} stops, ~${formatDuration(selectedRoute.estimatedTime)}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
    }
  };

  const handleFavorite = () => {
    toggleFavoriteRoute({
      originId: selectedRoute.origin,
      destinationId: selectedRoute.destination,
      originName: selectedRoute.originName,
      destinationName: selectedRoute.destinationName
    });
  };

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {routes.length} Route{routes.length > 1 ? 's' : ''} Found
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFavorite}
            className={`p-2 rounded-lg transition-colors ${
              isFavorite 
                ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Share route"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Route Options (if multiple) */}
      {routes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {routes.map((route, index) => (
            <button
              key={index}
              onClick={() => selectRoute(index)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg border transition-colors ${
                index === selectedRouteIndex
                  ? 'border-metro-purple bg-metro-purple/10 text-metro-purple'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="text-sm font-medium">
                {route.interchanges?.length > 0 
                  ? `${route.interchanges.length} interchange${route.interchanges.length > 1 ? 's' : ''}`
                  : 'Direct'}
              </div>
              <div className="text-xs opacity-75">
                {formatDuration(route.estimatedTime || route.totalTime || 0)}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected Route Summary */}
      <div className="card p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Journey Info */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="text-center flex-shrink-0">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {selectedRoute.totalStops || selectedRoute.stationsCount || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">stops</div>
            </div>
            <div className="w-px h-10 bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-1 text-gray-400 flex-shrink-0" />
                <span>{formatDuration(selectedRoute.estimatedTime || selectedRoute.totalTime || 0)}</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">travel time</div>
            </div>
          </div>

          {/* Fare — unified multi-tier display */}
          <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
            <div className="flex items-center text-xl sm:text-2xl font-bold text-metro-green">
              <Ticket className="w-4 h-4 sm:w-5 sm:h-5 mr-1 flex-shrink-0" />
              ₹{typeof selectedRoute.fare === 'object' ? selectedRoute.fare.base : (selectedRoute.fare || '--')}
            </div>
            {typeof selectedRoute.fare === 'object' && selectedRoute.fare.smartCardPeak != null && (
              <div className="text-xs text-gray-500 dark:text-gray-400 text-right whitespace-nowrap">
                Smart Card: ₹{selectedRoute.fare.smartCardPeak}
                <span className="text-gray-400 dark:text-gray-500"> / </span>
                ₹{selectedRoute.fare.smartCardOffPeak}
              </div>
            )}
          </div>
        </div>

        {/* Arrival Time */}
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
          Estimated arrival: <span className="font-medium text-gray-900 dark:text-white">{getEstimatedArrival(selectedRoute.estimatedTime || selectedRoute.totalTime || 0)}</span>
        </div>
      </div>

      {/* Route Details Toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-metro-purple transition-colors"
      >
        {showDetails ? (
          <>
            <ChevronUp className="w-4 h-4" />
            Hide Route Details
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            Show Route Details
          </>
        )}
      </button>

      {/* Detailed Route */}
      {showDetails && <RouteCard route={selectedRoute} />}
    </div>
  );
}
