/**
 * InterchangeAlert — Interchange awareness UI component
 *
 * Displays when a route includes a transfer at Majestic or RV Road.
 * Shows the 0.8km buffer note, platform-level transfer instructions,
 * and walking time estimates.
 */

import { memo } from 'react';
import { ArrowLeftRight, Info, Route } from 'lucide-react';

/**
 * @param {Object} props
 * @param {Object} props.interchangeInfo - From useMetroFare().interchangeInfo
 */
function InterchangeAlertInner({ interchangeInfo }) {
  if (!interchangeInfo) return null;

  const {
    hasMajesticTransfer,
    hasRVRoadTransfer,
    majesticBufferNote,
    rvRoadTransferNote,
    bufferKm,
  } = interchangeInfo;

  return (
    <div className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-orange-800 dark:text-orange-200">
        <ArrowLeftRight className="w-4 h-4" />
        <span>Line Transfer Required</span>
      </div>

      {hasMajesticTransfer && (
        <div className="flex items-start gap-2 ml-6">
          <Route className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-orange-700 dark:text-orange-300">
            <p className="font-medium">Majestic (Kempegowda Station)</p>
            <p className="mt-0.5">Purple Line ↔ Green Line • Underground interchange • ~5 min walking</p>
            {majesticBufferNote && (
              <p className="mt-0.5 flex items-center gap-1 text-orange-500 dark:text-orange-400">
                <Info className="w-3 h-3" />
                {majesticBufferNote}
              </p>
            )}
          </div>
        </div>
      )}

      {hasRVRoadTransfer && (
        <div className="flex items-start gap-2 ml-6">
          <Route className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-orange-700 dark:text-orange-300">
            <p className="font-medium">RV Road (Rashtreeya Vidyalaya Road)</p>
            <p className="mt-0.5">Green Line Level 2 ↔ Yellow Line Level 3 • ~3 min walking</p>
            {rvRoadTransferNote && (
              <p className="mt-0.5 flex items-center gap-1 text-orange-500 dark:text-orange-400">
                <Info className="w-3 h-3" />
                {rvRoadTransferNote}
              </p>
            )}
          </div>
        </div>
      )}

      {bufferKm > 0 && (
        <p className="text-xs text-orange-500 dark:text-orange-400 ml-6">
          Total interchange buffer added to fare distance: +{bufferKm} km
        </p>
      )}
    </div>
  );
}

export const InterchangeAlert = memo(InterchangeAlertInner);
InterchangeAlert.displayName = 'InterchangeAlert';
export default InterchangeAlert;
