/**
 * useMetroFare — Reactive Fare Calculation Hook (Multi-Tier)
 *
 * Single Source of Truth for fare computation in the UI layer.
 * Returns ALL three fare tiers simultaneously (Token/QR, Smart Card Peak,
 * Smart Card Off-Peak) so the UI can display them in one unified view
 * without requiring a payment-type toggle.
 *
 * All IST conversion uses the fareEngine's internal helpers, which apply
 * a fixed +5:30 offset regardless of the device's local timezone.
 *
 * Usage:
 *   const { multiTierFares, penaltyResult, interchangeInfo, ... } =
 *     useMetroFare({ origin, destination, travelTime, ... });
 */

import { useMemo } from 'react';
import {
  buildStationIndex,
  calculateStationFare,
  calculateJourneySummary,
  getStationDetails,
  getPriceTier,
  calculateFinalPrice,
  applyPenalties,
  PaymentType,
  PriceTier,
  MINIMUM_FARE,
  IS_HIKE_ON_HOLD,
  MAJESTIC_INTERCHANGE_BUFFER_KM,
} from '../utils/routeCalculator';

/**
 * @typedef {Object} UseMetroFareParams
 * @property {Object|null}  origin        - Origin station object (from store)
 * @property {Object|null}  destination   - Destination station object (from store)
 * @property {Date|null}    travelTime    - Timestamp for tier determination (defaults to now)
 * @property {number|null}  cardBalance   - Smart Card balance (for minimum-balance check)
 * @property {Date|null}    entryTime     - Tap-in time (for penalty calculation)
 * @property {Date|null}    exitTime      - Tap-out time (for penalty calculation)
 * @property {Array}        stations      - Full stations array from useMetroData()
 */

/**
 * Reactive fare calculation hook.
 *
 * Returns a memoized fare result that updates whenever inputs change.
 * Handles same-station logic, interchange detection, penalty calculation,
 * and station amenity lookup.
 *
 * @param {UseMetroFareParams} params
 */
export function useMetroFare({
  origin = null,
  destination = null,
  travelTime = null,
  cardBalance = null,
  entryTime = null,
  exitTime = null,
  stations = [],
}) {
  // ── Build station index (memoized on stations array reference) ─────────
  const stationIndex = useMemo(() => {
    if (!stations || stations.length === 0) return null;
    return buildStationIndex(stations);
  }, [stations]);

  // ── Effective timestamp (IST-aware via fareEngine internals) ───────────
  const effectiveTime = travelTime || new Date();

  // ── Price tier (updates on every effectiveTime change) ─────────────────
  const priceTier = useMemo(() => getPriceTier(effectiveTime), [effectiveTime]);

  // ── Detect same-station journey ────────────────────────────────────────
  const isSameStation = !!(origin && destination && origin.id === destination.id);

  // ── Core fare calculation (always TOKEN-based for canonical base fare) ─
  const fareResult = useMemo(() => {
    if (!origin || !destination || !stationIndex) return null;

    if (isSameStation) {
      // Same-station: base = MINIMUM_FARE, no distance calculation
      return {
        baseTokenFare: MINIMUM_FARE,
        discountedFare: MINIMUM_FARE,
        savings: 0,
        fare: MINIMUM_FARE,
        rawDistanceKm: 0,
        ceilDistanceKm: 0,
        bufferKm: 0,
        interchanges: [],
        isInterchange: false,
        startLine: origin.line,
        endLine: destination.line,
        paymentType: PaymentType.TOKEN,
        priceTier,
        tierLabel: 'Standard',
        multiplier: 1,
        entryRequirement: 'No balance requirement (token/QR)',
      };
    }

    return calculateStationFare(origin.id, destination.id, stationIndex, {
      paymentType: PaymentType.TOKEN,
      timestamp: effectiveTime,
      cardBalance,
    });
  }, [origin, destination, stationIndex, effectiveTime, cardBalance, isSameStation, priceTier]);

  // ── Multi-tier fares: Token/QR, Smart Card Peak, Smart Card Off-Peak ──
  const multiTierFares = useMemo(() => {
    if (!fareResult) return null;
    const base = fareResult.baseTokenFare;

    // Token & QR always pay full price regardless of tier
    const tokenPrice = base;

    // Smart Card Peak (5% off)
    const scPeak = calculateFinalPrice(base, PriceTier.PEAK, PaymentType.SMART_CARD);
    // Smart Card Off-Peak (10% off)
    const scOffPeak = calculateFinalPrice(base, PriceTier.OFF_PEAK, PaymentType.SMART_CARD);

    // Current tier actual value (what user pays right now with Smart Card)
    const scCurrent = calculateFinalPrice(base, priceTier, PaymentType.SMART_CARD);

    return {
      base,
      token: tokenPrice,
      smartCardPeak: scPeak.discountedFare,
      smartCardPeakSavings: scPeak.savings,
      smartCardOffPeak: scOffPeak.discountedFare,
      smartCardOffPeakSavings: scOffPeak.savings,
      smartCardCurrent: scCurrent.discountedFare,
      smartCardCurrentSavings: scCurrent.savings,
      currentTier: priceTier,
      isSameStation,
    };
  }, [fareResult, priceTier, isSameStation]);

  // ── Penalty calculation ────────────────────────────────────────────────
  const penaltyResult = useMemo(() => {
    if (!entryTime || !exitTime) {
      return { penalty: 0, durationMin: 0, reason: 'No timestamps provided.', isOverstay: false };
    }
    try {
      return applyPenalties({ entryTime, exitTime, isSameStation });
    } catch {
      return { penalty: 0, durationMin: 0, reason: 'Invalid timestamps.', isOverstay: false };
    }
  }, [entryTime, exitTime, isSameStation]);

  // ── Interchange info (for UI) ──────────────────────────────────────────
  const interchangeInfo = useMemo(() => {
    if (!fareResult || !fareResult.isInterchange) return null;

    const hasMajesticTransfer = fareResult.interchanges?.some(
      (name) =>
        typeof name === 'string' &&
        (name.toLowerCase().includes('majestic') || name.toLowerCase().includes('kempegowda'))
    );

    const hasRVRoadTransfer = fareResult.interchanges?.some(
      (name) =>
        typeof name === 'string' &&
        (name.toLowerCase().includes('rv road') || name.toLowerCase().includes('rashtreeya vidyalaya'))
    );

    return {
      isInterchange: true,
      interchangeStations: fareResult.interchanges || [],
      bufferKm: fareResult.bufferKm || 0,
      hasMajesticTransfer: !!hasMajesticTransfer,
      hasRVRoadTransfer: !!hasRVRoadTransfer,
      majesticBufferNote: hasMajesticTransfer
        ? `Includes ${MAJESTIC_INTERCHANGE_BUFFER_KM} km track-loop buffer at Majestic`
        : null,
      rvRoadTransferNote: hasRVRoadTransfer
        ? 'Transfer at RV Road: Green Line Level 2 ↔ Yellow Line Level 3'
        : null,
    };
  }, [fareResult]);

  // ── Station amenities ──────────────────────────────────────────────────
  const startAmenities = useMemo(
    () => (origin ? getStationDetails(origin.id, stations) : null),
    [origin, stations]
  );
  const endAmenities = useMemo(
    () => (destination ? getStationDetails(destination.id, stations) : null),
    [destination, stations]
  );

  // ── Full journey summary (Stage 3 composite) ──────────────────────────
  const journeySummary = useMemo(() => {
    if (!origin || !destination || !stationIndex) return null;

    return calculateJourneySummary({
      startStationId: origin.id,
      endStationId: destination.id,
      stationIndex,
      stationsArray: stations,
      options: {
        paymentType: PaymentType.TOKEN,
        timestamp: effectiveTime,
        cardBalance,
      },
      entryTime: entryTime || undefined,
      exitTime: exitTime || undefined,
    });
  }, [origin, destination, stationIndex, stations, effectiveTime, cardBalance, entryTime, exitTime]);

  // ── Tier label ─────────────────────────────────────────────────────────
  const tierLabel = useMemo(() => {
    const labels = {
      [PriceTier.PEAK]: 'Peak Hours',
      [PriceTier.OFF_PEAK]: 'Off-Peak Hours',
      [PriceTier.HOLIDAY]: 'Sunday / Holiday',
    };
    return labels[priceTier] ?? 'Standard';
  }, [priceTier]);

  return {
    // Core
    fareResult,
    multiTierFares,
    penaltyResult,

    // Interchange awareness
    interchangeInfo,
    showInterchangeInfo: !!interchangeInfo,

    // Same-station awareness
    isSameStation,

    // Time/Tier
    priceTier,
    tierLabel,

    // Amenities
    startAmenities,
    endAmenities,

    // Full composite
    journeySummary,

    // Global
    isHikeOnHold: IS_HIKE_ON_HOLD,
  };
}
