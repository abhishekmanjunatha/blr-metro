/**
 * FareBreakdown — Synchronized fare display component
 *
 * Displays:
 *   • Base Fare  — raw distance-slab price (token)
 *   • Discount   — Smart Card / NCMC / Group savings
 *   • Penalty    — Same-station or overstay charges
 *   • Final Total — actual amount deducted at the gate
 *
 * Reacts instantly to payment-type toggles, time changes, and same-station state.
 */

import { memo } from 'react';
import {
  Ticket,
  CreditCard,
  AlertTriangle,
  Clock,
  TrendingDown,
  Info,
} from 'lucide-react';

/**
 * @param {Object} props
 * @param {Object} props.breakdown        - { base, discount, penalty, total }
 * @param {string} props.tierLabel        - "Peak Hours" | "Off-Peak Hours" | "Sunday / Holiday"
 * @param {string} props.paymentType      - PaymentType enum value
 * @param {boolean} props.isSameStation   - Whether entry === exit station
 * @param {Object} props.penaltyResult    - { penalty, durationMin, reason, isOverstay }
 * @param {boolean} props.isHikeOnHold    - Global hike status flag
 * @param {boolean} [props.compact]       - Compact layout for inline use
 */
function FareBreakdownInner({
  breakdown = { base: 0, discount: 0, penalty: 0, total: 0 },
  tierLabel = 'Standard',
  paymentType = 'TOKEN',
  isSameStation = false,
  penaltyResult = null,
  isHikeOnHold = true,
  compact = false,
}) {
  const { base, discount, penalty, total } = breakdown;
  const hasDiscount = discount > 0;
  const hasPenalty = penalty > 0;

  // Payment method label
  const paymentLabels = {
    TOKEN: 'Token',
    QR: 'QR Code',
    SMART_CARD: 'Smart Card',
    NCMC: 'NCMC',
    GROUP: 'Group Ticket',
  };
  const paymentLabel = paymentLabels[paymentType] || paymentType;

  if (compact) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {paymentLabel}
          </span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            ₹{total}
          </span>
        </div>
        {hasDiscount && (
          <span className="text-xs text-green-600 dark:text-green-400">
            Save ₹{discount} ({tierLabel})
          </span>
        )}
        {hasPenalty && (
          <span className="text-xs text-red-600 dark:text-red-400">
            +₹{penalty} penalty
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-green-50 dark:from-purple-900/20 dark:to-green-900/20 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Fare Breakdown
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-800/40 text-purple-700 dark:text-purple-300">
            {tierLabel}
          </span>
        </div>
      </div>

      {/* Same-station warning */}
      {isSameStation && (
        <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Same Station Entry/Exit
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              Minimum entry fee of ₹{base} applies. Overstay penalty after 20 minutes.
            </p>
          </div>
        </div>
      )}

      {/* Line items */}
      <div className="px-4 py-3 space-y-3">
        {/* Base Fare */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Ticket className="w-4 h-4" />
            <span>Base Fare {isSameStation ? '(Minimum Entry)' : '(Token)'}</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            ₹{base}
          </span>
        </div>

        {/* Discount */}
        {hasDiscount && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <TrendingDown className="w-4 h-4" />
              <span>{paymentLabel} Discount</span>
            </div>
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              −₹{discount}
            </span>
          </div>
        )}

        {/* Penalty */}
        {hasPenalty && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Overstay Penalty</span>
            </div>
            <span className="text-sm font-semibold text-red-600 dark:text-red-400">
              +₹{penalty}
            </span>
          </div>
        )}

        {/* Penalty reason */}
        {penaltyResult?.isOverstay && (
          <div className="text-xs text-red-500 dark:text-red-400 ml-6">
            {penaltyResult.reason}
          </div>
        )}

        {/* Duration info */}
        {penaltyResult && penaltyResult.durationMin > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 ml-6">
            <Clock className="w-3 h-3" />
            <span>Journey duration: {Math.round(penaltyResult.durationMin)} min</span>
          </div>
        )}
      </div>

      {/* Divider + Total */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-gray-900 dark:text-white">
            Final Total
          </span>
          <span className="text-xl font-bold text-metro-green">
            ₹{total}
          </span>
        </div>

        {/* Payment method + hike info */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <CreditCard className="w-3 h-3" />
            <span>{paymentLabel}</span>
          </div>
          {isHikeOnHold && (
            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
              <Info className="w-3 h-3" />
              <span>2026 fare hike on hold</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const FareBreakdown = memo(FareBreakdownInner);
FareBreakdown.displayName = 'FareBreakdown';
export default FareBreakdown;
