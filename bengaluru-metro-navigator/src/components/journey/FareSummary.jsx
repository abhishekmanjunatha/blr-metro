/**
 * FareSummary — Unified, Single-View Fare Display
 *
 * Displays all three price tiers simultaneously in one card:
 *   • Token / QR          — full slab fare (primary focus)
 *   • Smart Card (Peak)   — 5% discount
 *   • Smart Card (Off-Peak) — 10% discount
 *
 * Also includes:
 *   • Same-station entry/exit warning
 *   • Overstay penalty row (if applicable)
 *   • "2026 fare hike on hold" badge
 *   • BMRCL accuracy disclaimer
 *
 * Accepts the `multiTierFares` object from useMetroFare().
 */

import { memo } from 'react';
import {
  Ticket,
  CreditCard,
  AlertTriangle,
  Clock,
  Info,
  Smartphone,
} from 'lucide-react';
import { PriceTier } from '../../utils/routeCalculator';

// ── Tier indicator dot: green for off-peak, amber for peak, blue for holiday ─
const TIER_STYLES = {
  [PriceTier.PEAK]:     { dot: 'bg-amber-500',  label: 'Peak Hours' },
  [PriceTier.OFF_PEAK]: { dot: 'bg-green-500',  label: 'Off-Peak Hours' },
  [PriceTier.HOLIDAY]:  { dot: 'bg-blue-500',   label: 'Sunday / Holiday' },
};

/**
 * @param {Object}  props
 * @param {Object}  props.multiTierFares  — from useMetroFare().multiTierFares
 * @param {string}  props.tierLabel       — "Peak Hours" | "Off-Peak Hours" | "Sunday / Holiday"
 * @param {boolean} props.isSameStation
 * @param {Object}  props.penaltyResult   — { penalty, durationMin, reason, isOverstay }
 * @param {boolean} props.isHikeOnHold
 * @param {boolean} [props.compact]       — inline / preview mode
 */
function FareSummaryInner({
  multiTierFares,
  tierLabel = 'Standard',
  isSameStation = false,
  penaltyResult = null,
  isHikeOnHold = true,
  compact = false,
}) {
  if (!multiTierFares) return null;

  const {
    base,
    token,
    smartCardPeak,
    smartCardPeakSavings,
    smartCardOffPeak,
    smartCardOffPeakSavings,
    smartCardCurrent,
    smartCardCurrentSavings,
    currentTier,
  } = multiTierFares;

  const penalty  = penaltyResult?.penalty ?? 0;
  const hasPenalty = penalty > 0;
  const tierStyle = TIER_STYLES[currentTier] ?? { dot: 'bg-gray-400', label: tierLabel };

  // ── Compact mode (pre-search live preview) ─────────────────────────────
  if (compact) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 space-y-2">
        {/* Token / QR — primary */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
            <Ticket className="w-3.5 h-3.5" />
            Token / QR
          </span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">₹{token}</span>
        </div>
        {/* Smart Card current tier */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <CreditCard className="w-3 h-3" />
            Smart Card ({tierStyle.label})
          </span>
          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
            ₹{smartCardCurrent}
            {smartCardCurrentSavings > 0 && (
              <span className="ml-1 text-xs font-normal">save ₹{smartCardCurrentSavings}</span>
            )}
          </span>
        </div>
        {isSameStation && (
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            Same station — minimum entry fee ₹{base}
          </p>
        )}
      </div>
    );
  }

  // ── Full card ──────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      {/* ── Header ── */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-green-50 dark:from-purple-900/20 dark:to-green-900/20 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Fare Summary
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-800/40 text-purple-700 dark:text-purple-300 flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${tierStyle.dot}`} />
            {tierStyle.label}
          </span>
        </div>
      </div>

      {/* ── Same-station warning ── */}
      {isSameStation && (
        <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Same Station Entry / Exit
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              Minimum entry fee of ₹{base} applies. Overstay penalty after 20 minutes.
            </p>
          </div>
        </div>
      )}

      {/* ── Price rows ── */}
      <div className="px-4 py-3 space-y-3">
        {/* Token / QR — primary row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <Ticket className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <span className="font-medium">Token / QR</span>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">₹{token}</span>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed border-gray-200 dark:border-gray-700" />

        {/* Smart Card prices */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5" />
            Smart Card Price
          </p>

          {/* Peak */}
          <div className="flex items-center justify-between pl-5">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Peak
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">(5% off)</span>
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              ₹{smartCardPeak}
              {smartCardPeakSavings > 0 && (
                <span className="ml-1.5 text-xs font-normal text-green-600 dark:text-green-400">
                  save ₹{smartCardPeakSavings}
                </span>
              )}
            </span>
          </div>

          {/* Off-Peak */}
          <div className="flex items-center justify-between pl-5">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Off-Peak
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">(10% off)</span>
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              ₹{smartCardOffPeak}
              {smartCardOffPeakSavings > 0 && (
                <span className="ml-1.5 text-xs font-normal text-green-600 dark:text-green-400">
                  save ₹{smartCardOffPeakSavings}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Penalty row (if applicable) */}
        {hasPenalty && (
          <>
            <div className="border-t border-dashed border-gray-200 dark:border-gray-700" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Overstay Penalty</span>
              </div>
              <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                +₹{penalty}
              </span>
            </div>
            {penaltyResult?.reason && (
              <p className="text-xs text-red-500 dark:text-red-400 pl-6">
                {penaltyResult.reason}
              </p>
            )}
          </>
        )}

        {/* Duration info */}
        {penaltyResult && penaltyResult.durationMin > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 pl-6">
            <Clock className="w-3 h-3" />
            <span>Journey duration: {Math.round(penaltyResult.durationMin)} min</span>
          </div>
        )}
      </div>

      {/* ── Footer: hike status + disclaimer ── */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 space-y-2">
        {isHikeOnHold && (
          <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
            <Info className="w-3 h-3 flex-shrink-0" />
            <span>2026 fare hike on hold — current BMRCL slab rates apply</span>
          </div>
        )}

        {/* BMRCL Disclaimer */}
        <p className="text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
          Note: Fares are estimated based on current BMRCL data and may not
          always be 100% accurate. Please verify the final fare at the station
          or via official BMRCL sources before traveling.
        </p>
      </div>
    </div>
  );
}

export const FareSummary = memo(FareSummaryInner);
FareSummary.displayName = 'FareSummary';
export default FareSummary;
