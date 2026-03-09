/**
 * StationDetailCard — Amenities & Metadata Display
 *
 * Dynamically pulls parking slots, restroom availability, feeding rooms,
 * interchange platform details, and nearby attractions from the synced
 * stations.json data via getStationDetails().
 *
 * Used in journey results to show amenities for start/end stations.
 */

import { memo } from 'react';
import {
  Car,
  Bike,
  MapPin,
  Baby,
  ArrowLeftRight,
  Train,
  Building2,
  ShowerHead,
} from 'lucide-react';

/**
 * @param {Object} props
 * @param {Object|null} props.amenities - StationAmenities from getStationDetails()
 * @param {string}      [props.label]   - "Origin" | "Destination" etc.
 * @param {boolean}     [props.compact] - Compact layout mode
 */
function StationDetailCardInner({ amenities, label = '', compact = false }) {
  if (!amenities) return null;

  const {
    name,
    line,
    parking,
    restrooms,
    feedingRooms,
    facilities,
    interchangeDetails,
    isInterchange,
    structure,
    sector,
    nearbyAttractions,
  } = amenities;

  // Line color mapping
  const lineColors = {
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    pink: 'bg-pink-500',
  };
  const lineDot = lineColors[line] || 'bg-gray-500';

  if (compact) {
    return (
      <div className="flex items-start gap-2 text-sm">
        <div className={`w-2.5 h-2.5 rounded-full ${lineDot} mt-1.5 flex-shrink-0`} />
        <div className="min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate">{name}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {parking && (
              <span>🅿️ {parking.twoWheelerSlots + parking.fourWheelerSlots} slots</span>
            )}
            {restrooms && <span>🚻 Restrooms</span>}
            {feedingRooms && <span>👶 Feeding Room</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${lineDot} flex-shrink-0`} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {name}
              </h4>
              {label && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex-shrink-0 ml-2">
                  {label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="capitalize">{line} Line</span>
              {structure && (
                <>
                  <span>•</span>
                  <span className="capitalize">{structure}</span>
                </>
              )}
              {sector && (
                <>
                  <span>•</span>
                  <span>{sector}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Amenities Grid */}
      <div className="px-4 py-3 grid grid-cols-2 gap-3">
        {/* Parking */}
        {parking ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Parking
            </span>
            <div className="flex items-center gap-1.5 text-sm text-gray-900 dark:text-white">
              <Bike className="w-4 h-4 text-blue-500" />
              <span>{parking.twoWheelerSlots} Two-Wheeler</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-900 dark:text-white">
              <Car className="w-4 h-4 text-blue-500" />
              <span>{parking.fourWheelerSlots} Four-Wheeler</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Parking
            </span>
            <span className="text-sm text-gray-400 dark:text-gray-500">Not available</span>
          </div>
        )}

        {/* Facilities */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Facilities
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-sm">
              <ShowerHead className="w-4 h-4 text-green-500" />
              <span className={restrooms ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
                Restrooms {restrooms ? '✓' : '✗'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Baby className="w-4 h-4 text-pink-500" />
              <span className={feedingRooms ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
                Feeding Room {feedingRooms ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interchange Details */}
      {isInterchange && interchangeDetails && (
        <div className="px-4 py-2.5 bg-orange-50 dark:bg-orange-900/10 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2">
            <ArrowLeftRight className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-medium text-orange-800 dark:text-orange-200">
                Interchange Station
              </p>
              <p className="text-orange-600 dark:text-orange-400 mt-0.5">
                {interchangeDetails.fromPlatform} → {interchangeDetails.toPlatform}
              </p>
              <p className="text-orange-500 dark:text-orange-300">
                ~{interchangeDetails.walkingTimeMinutes} min walking
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Nearby Attractions */}
      {nearbyAttractions && nearbyAttractions.length > 0 && (
        <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">Nearby: </span>
              {nearbyAttractions.slice(0, 3).join(', ')}
              {nearbyAttractions.length > 3 && ` +${nearbyAttractions.length - 3} more`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const StationDetailCard = memo(StationDetailCardInner);
StationDetailCard.displayName = 'StationDetailCard';
export default StationDetailCard;
