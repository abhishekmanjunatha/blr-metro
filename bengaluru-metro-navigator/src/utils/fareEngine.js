/**
 * Namma Metro Fare Engine — Stage 1 + Stage 2 + Stage 3
 *
 * Stage 1: Deterministic distance-slab pricing using official BMRCL Route Km.
 * Stage 2: Smart Card / NCMC discounts, Peak/Off-Peak time windows,
 *           Karnataka Government Holidays, Group Ticket pricing,
 *           and Minimum-Balance guardrail.
 * Stage 3: Operational Penalties (same-station, overstay, system-duration),
 *           Station Amenities metadata, and Journey Summary object.
 *
 * ─── Domain Rules (2025 / 2026 — hike in abeyance) ──────────────────────────
 *
 *   FARE SLABS (Token):
 *     0 < d ≤ 2   → ₹10      |   10 < d ≤ 15  → ₹60
 *     2 < d ≤ 4   → ₹20      |   15 < d ≤ 20  → ₹70
 *     4 < d ≤ 6   → ₹30      |   20 < d ≤ 25  → ₹80
 *     6 < d ≤ 8   → ₹40      |   d > 25       → ₹90 (cap)
 *     8 < d ≤ 10  → ₹50      |
 *
 *   PAYMENT MODIFIERS:
 *     TOKEN / QR .............. 1.00 (no discount)
 *     SMART_CARD / NCMC peak .. 0.95 (5% off)
 *     SMART_CARD / NCMC off-pk  0.90 (10% off)
 *     GROUP (25+ people) ...... 0.85 (15% off)
 *
 *   TIME WINDOWS (IST, Mon–Sat):
 *     Peak:     08:00–12:00, 16:00–21:00
 *     Off-Peak: service-start–08:00, 12:00–16:00, 21:00–close
 *     Sundays + Karnataka Holidays → entire day treated as Off-Peak / 10% tier.
 *
 *   MINIMUM BALANCE GUARDRAIL:
 *     Smart Card entry denied if balance < ₹90 (max possible fare).
 *
 * @module fareEngine
 */

// ============================================================================
// 1. CONSTANTS & ENUMS
// ============================================================================

/**
 * 2026 Fare Hike Status.
 * Set to `true` while the BMRCL fare-hike is on hold.
 * When flipped to `false`, multiplier tables / slab values must be updated.
 * Referenced across all modules and UI components for compatibility.
 */
export const IS_HIKE_ON_HOLD = true;

// ── Payment Type Enum ────────────────────────────────────────────────────────
/** @enum {string} */
export const PaymentType = Object.freeze({
  TOKEN: 'TOKEN',
  QR: 'QR',
  SMART_CARD: 'SMART_CARD',
  NCMC: 'NCMC',
  GROUP: 'GROUP',
});

// ── Price Tier Enum ──────────────────────────────────────────────────────────
/** @enum {string} */
export const PriceTier = Object.freeze({
  PEAK: 'PEAK',
  OFF_PEAK: 'OFF_PEAK',
  HOLIDAY: 'HOLIDAY',
});

// ── Multiplier table: PaymentType × PriceTier → multiplier ──────────────────
const MULTIPLIERS = Object.freeze({
  [PaymentType.TOKEN]:      { [PriceTier.PEAK]: 1.0,  [PriceTier.OFF_PEAK]: 1.0,  [PriceTier.HOLIDAY]: 1.0  },
  [PaymentType.QR]:         { [PriceTier.PEAK]: 1.0,  [PriceTier.OFF_PEAK]: 1.0,  [PriceTier.HOLIDAY]: 1.0  },
  [PaymentType.SMART_CARD]: { [PriceTier.PEAK]: 0.95, [PriceTier.OFF_PEAK]: 0.90, [PriceTier.HOLIDAY]: 0.90 },
  [PaymentType.NCMC]:       { [PriceTier.PEAK]: 0.95, [PriceTier.OFF_PEAK]: 0.90, [PriceTier.HOLIDAY]: 0.90 },
  [PaymentType.GROUP]:      { [PriceTier.PEAK]: 0.85, [PriceTier.OFF_PEAK]: 0.85, [PriceTier.HOLIDAY]: 0.85 },
});

/** Minimum Smart Card / NCMC balance required for entry (₹). */
export const MIN_SMART_CARD_BALANCE = 90;

// ── Penalty Constants (Stage 3) ─────────────────────────────────────────────

/** Minimum fare charged for same-station entry/exit (₹). */
export const MINIMUM_FARE = 10;

/** Overstay penalty for same-station exit after 20 minutes (₹). */
export const SAME_STATION_OVERSTAY_PENALTY = 50;

/** Grace period for same-station exit without overstay penalty (minutes). */
export const SAME_STATION_GRACE_MINUTES = 20;

/** Maximum allowed time inside the paid area for a regular journey (minutes). */
export const MAX_JOURNEY_DURATION_MINUTES = 120;

/** Penalty per additional hour (or part thereof) beyond the limit (₹). */
export const OVERSTAY_PENALTY_PER_HOUR = 50;

/** Maximum total system-duration penalty (₹). */
export const MAX_OVERSTAY_PENALTY = 100;

// ── Peak-hour windows (IST, 24-h format) ────────────────────────────────────
const PEAK_WINDOWS = Object.freeze([
  { start: 8, end: 12 },   // 08:00 – 12:00
  { start: 16, end: 21 },  // 16:00 – 21:00
]);

// ── Karnataka Government Holidays 2026 ──────────────────────────────────────
// Format: "MM-DD".  Easily updatable: add/remove entries for future years.
const KARNATAKA_HOLIDAYS_2026 = Object.freeze([
  '01-01',  // New Year's Day
  '01-14',  // Makar Sankranti
  '01-26',  // Republic Day
  '03-17',  // Ugadi (Kannada New Year)
  '03-30',  // Ramzan / Eid ul-Fitr (tentative lunar)
  '04-06',  // Mahavir Jayanti
  '04-10',  // Good Friday
  '04-14',  // Ambedkar Jayanti
  '05-01',  // May Day / Labour Day
  '05-12',  // Buddha Purnima
  '06-06',  // Bakrid / Eid ul-Adha (tentative lunar)
  '07-06',  // Milad-un-Nabi (tentative lunar)
  '08-15',  // Independence Day
  '08-18',  // Krishna Janmashtami
  '09-05',  // Vinayaka Chaturthi
  '10-01',  // Mahalaya Amavasye
  '10-02',  // Gandhi Jayanti
  '10-09',  // Mahanavami
  '10-10',  // Vijayadashami / Dussehra
  '10-20',  // Maharshi Valmiki Jayanti
  '11-01',  // Rajyotsava Day (Karnataka Formation Day)
  '11-07',  // Kanakadasa Jayanti
  '11-20',  // Deepavali / Naraka Chaturdashi
  '12-25',  // Christmas Day
]);

/**
 * Allow runtime addition of holidays (e.g., loaded from a server).
 * Stored separately so the static list stays immutable.
 * @type {Set<string>}
 */
const _dynamicHolidays = new Set();

/**
 * Register extra holidays at runtime. Format: "MM-DD" or "YYYY-MM-DD".
 * @param {string[]} dates
 */
export function registerHolidays(dates) {
  for (const d of dates) {
    _dynamicHolidays.add(d.length === 10 ? d.slice(5) : d); // normalise to MM-DD
  }
}

/**
 * BMRCL distance-based token fare slabs.
 * Each entry: { maxKm, fare }.  Last entry uses Infinity for the capped fare.
 * @type {ReadonlyArray<{maxKm: number, fare: number}>}
 */
export const FARE_SLABS = Object.freeze([
  { maxKm: 2, fare: 10 },
  { maxKm: 4, fare: 20 },
  { maxKm: 6, fare: 30 },
  { maxKm: 8, fare: 40 },
  { maxKm: 10, fare: 50 },
  { maxKm: 15, fare: 60 },
  { maxKm: 20, fare: 70 },
  { maxKm: 25, fare: 80 },
  { maxKm: Infinity, fare: 90 },
]);

/** Track-loop buffer (km) added for any transfer through Majestic. */
export const MAJESTIC_INTERCHANGE_BUFFER_KM = 0.8;

/**
 * Interchange definitions keyed by a canonical line-pair string.
 *
 *   transferStations — ordered list of interchange station IDs per line.
 *   buffer           — total extra km appended to the route.
 *
 * For Purple ↔ Yellow the path is forced through both Majestic AND RV Road,
 * using the Green Line as the connecting segment.
 */
export const INTERCHANGE_MAP = Object.freeze({
  'green-purple': {
    transferStations: [
      { line: 'purple', stationId: 'majestic' },
      { line: 'green', stationId: 'majestic-green' },
    ],
    buffer: MAJESTIC_INTERCHANGE_BUFFER_KM,
  },
  'green-yellow': {
    transferStations: [
      { line: 'green', stationId: 'rv-road' },
      { line: 'yellow', stationId: 'rv-road-yellow' },
    ],
    buffer: 0,
  },
  'purple-yellow': {
    // Forced two-hop: Purple → (Majestic) → Green → (RV Road) → Yellow
    transferStations: [
      { line: 'purple', stationId: 'majestic' },
      { line: 'green', stationId: 'majestic-green' },
      { line: 'green', stationId: 'rv-road' },
      { line: 'yellow', stationId: 'rv-road-yellow' },
    ],
    buffer: MAJESTIC_INTERCHANGE_BUFFER_KM,
  },
});

// ============================================================================
// 2. STATION INDEX — built once from loaded data
// ============================================================================

/**
 * @typedef {Object} StationRecord
 * @property {string} id       - Unique station identifier
 * @property {string} line     - Line the station belongs to (purple | green | yellow)
 * @property {number} chainage - Distance from the line's origin (km)
 * @property {string} name     - Display name
 */

/**
 * @typedef {Object} StationIndex
 * @property {Map<string, StationRecord>} byId    - Lookup by station ID
 * @property {Map<string, StationRecord[]>} byLine - Stations grouped by line
 */

/**
 * Build an immutable station index from the raw stations array.
 *
 * @param {Array<Object>} stationsArray - Parsed `stations` from stations.json
 * @returns {StationIndex}
 */
export function buildStationIndex(stationsArray) {
  /** @type {Map<string, StationRecord>} */
  const byId = new Map();
  /** @type {Map<string, StationRecord[]>} */
  const byLine = new Map();

  for (const s of stationsArray) {
    if (typeof s.chainage !== 'number') continue; // skip incomplete entries

    const record = {
      id: s.id,
      line: s.line,
      chainage: s.chainage,
      name: s.name,
    };

    byId.set(s.id, record);

    if (!byLine.has(s.line)) byLine.set(s.line, []);
    byLine.get(s.line).push(record);
  }

  return { byId, byLine };
}

// ============================================================================
// 3. DISTANCE CALCULATION
// ============================================================================

/**
 * Compute the track distance between two stations using chainage values.
 *
 * Handles three cases:
 *   1. Same line               → |chainage_B − chainage_A|
 *   2. Adjacent-line transfer   → sum of on-line segments + interchange buffer
 *   3. Two-hop transfer (P↔Y)  → Purple + Green bridge + Yellow + buffer
 *
 * @param {string} startId - Origin station ID
 * @param {string} endId   - Destination station ID
 * @param {StationIndex} index - Pre-built station index
 * @returns {{ rawDistance: number, ceilDistance: number, interchanges: string[], buffer: number } | null}
 */
export function computeTrackDistance(startId, endId, index) {
  const startStation = index.byId.get(startId);
  const endStation = index.byId.get(endId);

  if (!startStation || !endStation) return null;

  // ── Same station ───────────────────────────────────────────────────────
  if (startId === endId) {
    return { rawDistance: 0, ceilDistance: 0, interchanges: [], buffer: 0 };
  }

  const startLine = startStation.line;
  const endLine = endStation.line;

  // ── Same line (direct) ─────────────────────────────────────────────────
  if (startLine === endLine) {
    const raw = Math.abs(endStation.chainage - startStation.chainage);
    return {
      rawDistance: raw,
      ceilDistance: Math.ceil(raw),
      interchanges: [],
      buffer: 0,
    };
  }

  // ── Cross-line: look up the interchange definition ─────────────────────
  const pairKey = [startLine, endLine].sort().join('-');
  const interchange = INTERCHANGE_MAP[pairKey];

  if (!interchange) return null; // unsupported line pair

  // Walk through the ordered transfer stations to accumulate distance
  const segments = buildCrossLineSegments(startStation, endStation, interchange, index);
  if (!segments) return null;

  const rawDistance = segments.totalDistance + interchange.buffer;
  const interchangeNames = segments.interchangeNames;

  return {
    rawDistance,
    ceilDistance: Math.ceil(rawDistance),
    interchanges: interchangeNames,
    buffer: interchange.buffer,
  };
}

/**
 * Build distance segments for a cross-line journey.
 *
 * The `transferStations` array in the interchange definition provides an ordered
 * sequence of waypoints.  We compute each leg as |chainage_A − chainage_B| on
 * the same line.
 *
 * @private
 */
function buildCrossLineSegments(startStation, endStation, interchange, index) {
  const { transferStations } = interchange;
  let totalDistance = 0;
  const interchangeNames = [];

  // The full waypoint sequence: start → transfer₁ → transfer₂ → … → end
  // transferStations are given as { line, stationId } pairs.
  // We need to match each leg's line with the station on that line.

  // Leg 1: startStation → first transfer station on startStation's line
  const firstTransfer = transferStations.find((ts) => ts.line === startStation.line);
  if (!firstTransfer) return null;
  const firstTransferRecord = index.byId.get(firstTransfer.stationId);
  if (!firstTransferRecord) return null;

  totalDistance += Math.abs(startStation.chainage - firstTransferRecord.chainage);
  interchangeNames.push(firstTransferRecord.name);

  // Middle legs: between consecutive transfer-station pairs on the same line
  for (let i = 0; i < transferStations.length - 1; i++) {
    const a = transferStations[i];
    const b = transferStations[i + 1];

    // Skip pairs that are on different lines (those are the actual interchange hops)
    if (a.line !== b.line) continue;

    const recA = index.byId.get(a.stationId);
    const recB = index.byId.get(b.stationId);
    if (!recA || !recB) return null;

    totalDistance += Math.abs(recB.chainage - recA.chainage);
  }

  // Last leg: last transfer station on endStation's line → endStation
  const lastTransfer = [...transferStations].reverse().find((ts) => ts.line === endStation.line);
  if (!lastTransfer) return null;
  const lastTransferRecord = index.byId.get(lastTransfer.stationId);
  if (!lastTransferRecord) return null;

  totalDistance += Math.abs(endStation.chainage - lastTransferRecord.chainage);

  // Collect all interchange point names (de-duped, excluding start/end legs)
  if (lastTransferRecord.name !== firstTransferRecord.name) {
    interchangeNames.push(lastTransferRecord.name);
  }

  return { totalDistance, interchangeNames };
}

// ============================================================================
// 4. FARE LOOKUP
// ============================================================================

/**
 * @typedef {Object} FareModifier
 * @property {number} [multiplier]  - e.g. 0.95 for 5% Smart Card discount
 * @property {string} [label]       - e.g. "Smart Card Peak"
 */

/**
 * Look up the base token fare for a given ceiling distance.
 *
 * @param {number} ceilDistanceKm - `Math.ceil()` of total track distance
 * @param {FareModifier} [modifier] - Optional legacy modifier (Stage 1 compat)
 * @returns {number} Fare in ₹
 */
export function lookupFare(ceilDistanceKm, modifier) {
  if (ceilDistanceKm <= 0) return FARE_SLABS[0].fare;

  let fare = FARE_SLABS[FARE_SLABS.length - 1].fare; // default to cap
  for (const slab of FARE_SLABS) {
    if (ceilDistanceKm <= slab.maxKm) {
      fare = slab.fare;
      break;
    }
  }

  // Legacy Stage 1 hook: apply external modifier
  if (modifier?.multiplier) {
    fare = Math.round(fare * modifier.multiplier);
  }

  return fare;
}

// ============================================================================
// 5. TIME-WINDOW & HOLIDAY LOGIC (Stage 2)
// ============================================================================

/**
 * Check whether a given date (IST) falls on a Karnataka Government Holiday.
 *
 * @param {Date} date - JavaScript Date object (will be interpreted in IST)
 * @returns {boolean}
 */
export function isHoliday(date) {
  const mmdd = _toIST_MMDD(date);
  return KARNATAKA_HOLIDAYS_2026.includes(mmdd) || _dynamicHolidays.has(mmdd);
}

/**
 * Determine the pricing tier for a given timestamp.
 *
 * Rules:
 *   - Sundays → HOLIDAY tier
 *   - Karnataka Government Holidays → HOLIDAY tier
 *   - Mon–Sat within peak windows → PEAK tier
 *   - Everything else → OFF_PEAK tier
 *
 * @param {Date} timestamp - JavaScript Date (interpreted in IST)
 * @returns {PriceTier}
 */
export function getPriceTier(timestamp) {
  const ist = _toISTComponents(timestamp);

  // Sunday (day === 0) — entire day is Off-Peak/Holiday tier
  if (ist.day === 0) return PriceTier.HOLIDAY;

  // Karnataka Government Holiday
  const mmdd = _pad2(ist.month + 1) + '-' + _pad2(ist.date);
  if (KARNATAKA_HOLIDAYS_2026.includes(mmdd) || _dynamicHolidays.has(mmdd)) {
    return PriceTier.HOLIDAY;
  }

  // Mon–Sat: check peak windows
  const hour = ist.hours;
  for (const w of PEAK_WINDOWS) {
    if (hour >= w.start && hour < w.end) return PriceTier.PEAK;
  }

  return PriceTier.OFF_PEAK;
}

/**
 * Get the fare multiplier for a given payment type and price tier.
 *
 * @param {PaymentType} paymentType
 * @param {PriceTier} tier
 * @returns {number} Multiplier (0–1]
 */
export function getMultiplier(paymentType, tier) {
  const paymentRow = MULTIPLIERS[paymentType] ?? MULTIPLIERS[PaymentType.TOKEN];
  return paymentRow[tier] ?? 1.0;
}

/**
 * Apply the correct multiplier to a base token fare.
 *
 * @param {number}      baseFare    - Token fare in ₹ (from slab lookup)
 * @param {PriceTier}   tier        - Current pricing tier
 * @param {PaymentType} paymentType - Payment method
 * @returns {{ discountedFare: number, savings: number, multiplier: number, tierLabel: string }}
 */
export function calculateFinalPrice(baseFare, tier, paymentType) {
  const multiplier = getMultiplier(paymentType, tier);
  const discountedFare = Math.round(baseFare * multiplier);
  const savings = baseFare - discountedFare;

  // Human-readable tier label
  const tierLabels = {
    [PriceTier.PEAK]: 'Peak Hours',
    [PriceTier.OFF_PEAK]: 'Off-Peak Hours',
    [PriceTier.HOLIDAY]: 'Sunday / Holiday',
  };

  return {
    discountedFare,
    savings,
    multiplier,
    tierLabel: tierLabels[tier] ?? 'Standard',
  };
}

/**
 * Check whether a Smart Card with the given balance is allowed entry.
 *
 * BMRCL requires a minimum balance equal to the maximum possible fare (₹90)
 * before tapping in, because the actual destination (and thus fare) is unknown
 * at entry time.
 *
 * @param {number} cardBalance - Current card balance in ₹
 * @returns {{ isEntryAllowed: boolean, message: string }}
 */
export function checkMinimumBalance(cardBalance) {
  if (typeof cardBalance !== 'number' || isNaN(cardBalance)) {
    return { isEntryAllowed: false, message: 'Invalid card balance' };
  }
  if (cardBalance < MIN_SMART_CARD_BALANCE) {
    return {
      isEntryAllowed: false,
      message: `Insufficient balance. Min Balance ₹${MIN_SMART_CARD_BALANCE} required (current: ₹${cardBalance})`,
    };
  }
  return { isEntryAllowed: true, message: 'Entry allowed' };
}

// ── IST helpers ──────────────────────────────────────────────────────────────

/** IST offset from UTC in minutes. */
const IST_OFFSET_MIN = 330; // +5:30

function _toISTComponents(date) {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60_000;
  const istDate = new Date(utcMs + IST_OFFSET_MIN * 60_000);
  return {
    day: istDate.getDay(),      // 0 = Sunday
    month: istDate.getMonth(),  // 0-based
    date: istDate.getDate(),
    hours: istDate.getHours(),
    minutes: istDate.getMinutes(),
  };
}

function _toIST_MMDD(date) {
  const c = _toISTComponents(date);
  return _pad2(c.month + 1) + '-' + _pad2(c.date);
}

function _pad2(n) {
  return String(n).padStart(2, '0');
}

// ============================================================================
// 6. PUBLIC API — calculateFare (Stage 2)
// ============================================================================

/**
 * @typedef {Object} FareResult
 * @property {number}   baseTokenFare     - Token fare before any discount (₹)
 * @property {number}   discountedFare    - Final fare after modifier applied (₹)
 * @property {number}   savings           - Discount amount (₹)
 * @property {number}   rawDistanceKm     - Precise track distance (before ceiling)
 * @property {number}   ceilDistanceKm    - Billing distance (after Math.ceil)
 * @property {number}   bufferKm          - Interchange buffer applied (0 or 0.8)
 * @property {string[]} interchanges      - Names of interchange stations used
 * @property {boolean}  isInterchange     - Whether the journey crosses lines
 * @property {string}   startLine         - Origin line
 * @property {string}   endLine           - Destination line
 * @property {string}   paymentType       - Payment method used
 * @property {string}   priceTier         - PEAK | OFF_PEAK | HOLIDAY
 * @property {string}   tierLabel         - Human-readable tier
 * @property {number}   multiplier        - Applied multiplier
 * @property {string}   entryRequirement  - Smart Card balance note
 * @property {boolean}  [isEntryAllowed]  - Balance check result (Smart Card only)
 */

/**
 * Calculate the BMRCL fare between any two metro stations.
 *
 * This is the primary entry point for the fare engine (Stage 2).
 *
 * @param {string}        startStationId  - Origin station ID
 * @param {string}        endStationId    - Destination station ID
 * @param {StationIndex}  stationIndex    - Pre-built index from `buildStationIndex()`
 * @param {Object}        [options]       - Stage 2 options
 * @param {PaymentType|string} [options.paymentType='TOKEN'] - Payment method
 * @param {Date}          [options.timestamp]   - Travel time (defaults to now)
 * @param {number}        [options.cardBalance]  - Smart Card balance for guardrail
 * @param {FareModifier}  [options.fareModifier] - Legacy Stage 1 modifier (overrides Stage 2 if provided)
 * @returns {FareResult | null} Full fare breakdown, or null if stations not found
 */
export function calculateFare(startStationId, endStationId, stationIndex, options = {}) {
  // ── Normalise options (backward compatible with Stage 1) ─────────────
  let paymentType, timestamp, cardBalance, fareModifier;

  if (options && typeof options === 'object' && !Array.isArray(options)) {
    if ('multiplier' in options || 'label' in options) {
      // Stage 1 legacy call: calculateFare(a, b, idx, { multiplier: 0.95 })
      fareModifier = options;
      paymentType = PaymentType.TOKEN;
      timestamp = new Date();
    } else {
      paymentType = options.paymentType ?? PaymentType.TOKEN;
      timestamp = options.timestamp ?? new Date();
      cardBalance = options.cardBalance;
      fareModifier = options.fareModifier;
    }
  } else {
    paymentType = PaymentType.TOKEN;
    timestamp = new Date();
  }

  // ── Distance computation (Stage 1 core) ──────────────────────────────
  const result = computeTrackDistance(startStationId, endStationId, stationIndex);
  if (!result) return null;

  const { rawDistance, ceilDistance, interchanges, buffer } = result;

  // ── Base token fare ──────────────────────────────────────────────────
  const baseTokenFare = lookupFare(ceilDistance, fareModifier);

  // ── Stage 2: tier + multiplier ───────────────────────────────────────
  const tier = getPriceTier(timestamp);
  const finalPrice = calculateFinalPrice(baseTokenFare, tier, paymentType);

  // ── Smart Card minimum-balance guardrail ─────────────────────────────
  const isSmartCardType =
    paymentType === PaymentType.SMART_CARD || paymentType === PaymentType.NCMC;

  let entryRequirement = 'No balance requirement (token/QR)';
  let isEntryAllowed = true;

  if (isSmartCardType) {
    entryRequirement = `Min Balance ₹${MIN_SMART_CARD_BALANCE} required`;
    if (typeof cardBalance === 'number') {
      const check = checkMinimumBalance(cardBalance);
      isEntryAllowed = check.isEntryAllowed;
      entryRequirement = check.message;
    }
  }

  // ── Assemble result ──────────────────────────────────────────────────
  const startStation = stationIndex.byId.get(startStationId);
  const endStation = stationIndex.byId.get(endStationId);

  return {
    // Stage 2 fields
    baseTokenFare,
    discountedFare: finalPrice.discountedFare,
    savings: finalPrice.savings,
    paymentType,
    priceTier: tier,
    tierLabel: finalPrice.tierLabel,
    multiplier: finalPrice.multiplier,
    entryRequirement,
    ...(isSmartCardType ? { isEntryAllowed } : {}),

    // Stage 1 fields (backward compat — "fare" mirrors discountedFare)
    fare: finalPrice.discountedFare,
    rawDistanceKm: Math.round(rawDistance * 100) / 100,
    ceilDistanceKm: ceilDistance,
    bufferKm: buffer,
    interchanges,
    isInterchange: interchanges.length > 0,
    startLine: startStation?.line ?? '',
    endLine: endStation?.line ?? '',
  };
}

// ============================================================================
// 7. PENALTIES — Operational Rules (Stage 3)
// ============================================================================

/**
 * @typedef {Object} JourneyTimestamps
 * @property {Date}    entryTime     - Tap-in timestamp
 * @property {Date}    exitTime      - Tap-out timestamp
 * @property {boolean} isSameStation - Whether entry and exit station are the same
 */

/**
 * @typedef {Object} PenaltyResult
 * @property {number}  penalty       - Total penalty amount in ₹
 * @property {number}  durationMin   - Actual journey duration in minutes
 * @property {string}  reason        - Human-readable explanation
 * @property {boolean} isOverstay    - Whether any overstay penalty was applied
 */

/**
 * Calculate penalties based on journey duration.
 *
 * Rules:
 *   1. Same Station (entry == exit):
 *      - Exit within 20 min → Minimum Fare (₹10), no penalty.
 *      - Exit after 20 min  → Minimum Fare (₹10) + Overstay Penalty (₹50).
 *
 *   2. Different Stations:
 *      - Journey ≤ 120 min → No penalty.
 *      - Journey > 120 min → ₹50 per additional hour (or part thereof), capped at ₹100.
 *
 * @param {JourneyTimestamps} journeyDetails
 * @returns {PenaltyResult}
 * @throws {Error} If timestamps are invalid or exitTime < entryTime
 */
export function applyPenalties(journeyDetails) {
  const { entryTime, exitTime, isSameStation } = journeyDetails;

  // ── Validate timestamps ────────────────────────────────────────────────
  if (!(entryTime instanceof Date) || isNaN(entryTime.getTime())) {
    throw new Error('Invalid entryTime: must be a valid Date object');
  }
  if (!(exitTime instanceof Date) || isNaN(exitTime.getTime())) {
    throw new Error('Invalid exitTime: must be a valid Date object');
  }
  if (exitTime < entryTime) {
    throw new Error('exitTime cannot be earlier than entryTime');
  }

  const durationMs = exitTime.getTime() - entryTime.getTime();
  const durationMin = durationMs / 60_000;

  // ── Case 1: Same Station ───────────────────────────────────────────────
  if (isSameStation) {
    if (durationMin <= SAME_STATION_GRACE_MINUTES) {
      return {
        penalty: 0,
        durationMin: Math.round(durationMin * 100) / 100,
        reason: `Same-station exit within ${SAME_STATION_GRACE_MINUTES} min grace period. Minimum fare (₹${MINIMUM_FARE}) applies.`,
        isOverstay: false,
      };
    }
    return {
      penalty: SAME_STATION_OVERSTAY_PENALTY,
      durationMin: Math.round(durationMin * 100) / 100,
      reason: `Same-station exit after ${SAME_STATION_GRACE_MINUTES} min. Minimum fare (₹${MINIMUM_FARE}) + Overstay penalty (₹${SAME_STATION_OVERSTAY_PENALTY}).`,
      isOverstay: true,
    };
  }

  // ── Case 2: Different Stations ─────────────────────────────────────────
  if (durationMin <= MAX_JOURNEY_DURATION_MINUTES) {
    return {
      penalty: 0,
      durationMin: Math.round(durationMin * 100) / 100,
      reason: 'Journey completed within allowed time.',
      isOverstay: false,
    };
  }

  // Overstay: ₹50 per additional hour (or part thereof), capped at ₹100
  const overtimeMin = durationMin - MAX_JOURNEY_DURATION_MINUTES;
  const overtimeHours = Math.ceil(overtimeMin / 60);
  const rawPenalty = overtimeHours * OVERSTAY_PENALTY_PER_HOUR;
  const penalty = Math.min(rawPenalty, MAX_OVERSTAY_PENALTY);

  return {
    penalty,
    durationMin: Math.round(durationMin * 100) / 100,
    reason: `Exceeded ${MAX_JOURNEY_DURATION_MINUTES} min limit by ${Math.round(overtimeMin)} min. Penalty: ₹${penalty} (capped at ₹${MAX_OVERSTAY_PENALTY}).`,
    isOverstay: true,
  };
}

// ============================================================================
// 8. STATION AMENITIES — Metadata Lookup (Stage 3)
// ============================================================================

/**
 * @typedef {Object} StationAmenities
 * @property {string}  id           - Station ID
 * @property {string}  name         - Station display name
 * @property {string}  line         - Line identifier
 * @property {Object}  parking      - { twoWheelerSlots: number, fourWheelerSlots: number } or null
 * @property {boolean} restrooms    - Whether restrooms are available
 * @property {boolean} feedingRooms - Whether feeding rooms are available
 * @property {string[]} facilities  - Original facilities list
 * @property {Object|null}  interchangeDetails - Platform transfer info if interchange
 */

/**
 * Retrieve station amenity and metadata details for the UI.
 *
 * Works with raw station objects from stations.json (not the fareEngine index).
 *
 * @param {string} stationId - Station ID to look up
 * @param {Array<Object>} stationsArray - Full stations array from stations.json
 * @returns {StationAmenities | null} Station details, or null if not found
 */
export function getStationDetails(stationId, stationsArray) {
  if (!stationId || !Array.isArray(stationsArray)) return null;

  const station = stationsArray.find((s) => s.id === stationId);
  if (!station) return null;

  const amenities = station.amenities || {};
  const parking = amenities.parking || null;
  const restrooms = amenities.restrooms ?? station.facilities?.includes('restroom') ?? false;
  const feedingRooms = amenities.feedingRooms ?? false;

  return {
    id: station.id,
    name: station.name,
    line: station.line,
    code: station.code,
    structure: station.structure,
    platformType: station.platformType,
    coordinates: station.coordinates,
    parking,
    restrooms,
    feedingRooms,
    facilities: station.facilities || [],
    exits: station.exits || [],
    nearbyAttractions: station.nearbyAttractions || [],
    interchangeDetails: station.interchangeDetails || null,
    isInterchange: station.isInterchange || false,
    sector: station.sector || '',
  };
}

// ============================================================================
// 9. JOURNEY SUMMARY — Final Aggregated Object (Stage 3)
// ============================================================================

/**
 * @typedef {Object} JourneySummary
 * @property {number} totalFare         - Base fare + penalties (₹)
 * @property {Object} breakdown         - { base, discount, penalty }
 * @property {Object} amenities         - { start: StationAmenities, end: StationAmenities }
 * @property {Object} penaltyDetails    - Full PenaltyResult
 * @property {Object} fareDetails       - Full FareResult from calculateFare
 */

/**
 * Produce the final journey summary combining fare, penalties, and amenities.
 *
 * This is the top-level API for Stage 3, composing all previous stages into a
 * single output object.
 *
 * @param {Object} params
 * @param {string}        params.startStationId - Origin station ID
 * @param {string}        params.endStationId   - Destination station ID
 * @param {StationIndex}  params.stationIndex   - Pre-built fare-engine station index
 * @param {Array<Object>} params.stationsArray  - Full stations array from stations.json
 * @param {Object}        [params.options]      - Stage 2 fare options (paymentType, timestamp, cardBalance, fareModifier)
 * @param {Date}          [params.entryTime]    - Tap-in time (for penalty calculation)
 * @param {Date}          [params.exitTime]     - Tap-out time (for penalty calculation)
 * @returns {JourneySummary | null} Complete journey summary, or null if stations not found
 */
export function calculateJourneySummary(params) {
  const {
    startStationId,
    endStationId,
    stationIndex,
    stationsArray,
    options = {},
    entryTime,
    exitTime,
  } = params;

  const isSameStation = startStationId === endStationId;

  // ── Fare Calculation ───────────────────────────────────────────────────
  let fareDetails;
  if (isSameStation) {
    // Same-station: base fare is always MINIMUM_FARE
    const tier = options.timestamp ? getPriceTier(options.timestamp) : getPriceTier(new Date());
    const paymentType = options.paymentType ?? PaymentType.TOKEN;
    const finalPrice = calculateFinalPrice(MINIMUM_FARE, tier, paymentType);

    fareDetails = {
      baseTokenFare: MINIMUM_FARE,
      discountedFare: finalPrice.discountedFare,
      savings: finalPrice.savings,
      fare: finalPrice.discountedFare,
      rawDistanceKm: 0,
      ceilDistanceKm: 0,
      bufferKm: 0,
      interchanges: [],
      isInterchange: false,
      startLine: stationIndex.byId.get(startStationId)?.line ?? '',
      endLine: stationIndex.byId.get(endStationId)?.line ?? '',
      paymentType,
      priceTier: tier,
      tierLabel: finalPrice.tierLabel,
      multiplier: finalPrice.multiplier,
      entryRequirement: 'No balance requirement (token/QR)',
    };
  } else {
    fareDetails = calculateFare(startStationId, endStationId, stationIndex, options);
    if (!fareDetails) return null;
  }

  // ── Penalty Calculation ────────────────────────────────────────────────
  let penaltyDetails = { penalty: 0, durationMin: 0, reason: 'No timestamps provided.', isOverstay: false };

  if (entryTime && exitTime) {
    penaltyDetails = applyPenalties({ entryTime, exitTime, isSameStation });
  }

  // ── Amenities ──────────────────────────────────────────────────────────
  const startAmenities = getStationDetails(startStationId, stationsArray);
  const endAmenities = getStationDetails(endStationId, stationsArray);

  // ── Final Assembly ─────────────────────────────────────────────────────
  const baseFare = fareDetails.discountedFare;
  const penalty = penaltyDetails.penalty;
  const totalFare = baseFare + penalty;
  const discount = fareDetails.baseTokenFare - fareDetails.discountedFare;

  return {
    totalFare,
    breakdown: {
      base: fareDetails.baseTokenFare,
      discount,
      penalty,
    },
    amenities: {
      start: startAmenities,
      end: endAmenities,
    },
    penaltyDetails,
    fareDetails,
  };
}
