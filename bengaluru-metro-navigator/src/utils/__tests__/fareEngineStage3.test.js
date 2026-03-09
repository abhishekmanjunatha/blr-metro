/**
 * Fare Engine Tests — Stage 3 (Penalties, Amenities, Journey Summary)
 *
 * Validates:
 *   - Penalty constants (configurable)
 *   - applyPenalties() — same-station, within grace, overstay, system-duration
 *   - applyPenalties() — error handling for invalid timestamps
 *   - getStationDetails() — amenities lookup for major hubs
 *   - calculateJourneySummary() — full journey object
 *   - Interchange platform details (Yellow Line)
 *   - Backward compatibility with Stage 1 + Stage 2
 *
 * Run: node src/utils/__tests__/fareEngineStage3.test.js
 */

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildStationIndex,
  calculateFare,
  applyPenalties,
  getStationDetails,
  calculateJourneySummary,
  PaymentType,
  PriceTier,
  getPriceTier,
  calculateFinalPrice,
  MINIMUM_FARE,
  SAME_STATION_OVERSTAY_PENALTY,
  SAME_STATION_GRACE_MINUTES,
  MAX_JOURNEY_DURATION_MINUTES,
  OVERSTAY_PENALTY_PER_HOUR,
  MAX_OVERSTAY_PENALTY,
  MIN_SMART_CARD_BALANCE,
  INTERCHANGE_MAP,
} from '../fareEngine.js';

// ── Load station data ────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const stationsPath = resolve(__dirname, '..', '..', '..', 'public', 'data', 'stations.json');
const rawData = JSON.parse(readFileSync(stationsPath, 'utf-8'));
const stationsArray = rawData.stations;
const stationIndex = buildStationIndex(stationsArray);

// ── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, error: e.message });
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  }
}

function makeDate(minutesFromNow) {
  return new Date(Date.now() + minutesFromNow * 60_000);
}

// ============================================================================
// A. PENALTY CONSTANTS
// ============================================================================
console.log('\n=== A. Penalty Constants ===');

test('MINIMUM_FARE is ₹10', () => {
  assert.equal(MINIMUM_FARE, 10);
});

test('SAME_STATION_OVERSTAY_PENALTY is ₹50', () => {
  assert.equal(SAME_STATION_OVERSTAY_PENALTY, 50);
});

test('SAME_STATION_GRACE_MINUTES is 20', () => {
  assert.equal(SAME_STATION_GRACE_MINUTES, 20);
});

test('MAX_JOURNEY_DURATION_MINUTES is 120', () => {
  assert.equal(MAX_JOURNEY_DURATION_MINUTES, 120);
});

test('OVERSTAY_PENALTY_PER_HOUR is ₹50', () => {
  assert.equal(OVERSTAY_PENALTY_PER_HOUR, 50);
});

test('MAX_OVERSTAY_PENALTY is ₹100', () => {
  assert.equal(MAX_OVERSTAY_PENALTY, 100);
});

// ============================================================================
// B. applyPenalties() — Same Station
// ============================================================================
console.log('\n=== B. applyPenalties() — Same Station ===');

test('Same station, exit within 5 min → no penalty', () => {
  const now = new Date();
  const result = applyPenalties({
    entryTime: now,
    exitTime: new Date(now.getTime() + 5 * 60_000),
    isSameStation: true,
  });
  assert.equal(result.penalty, 0);
  assert.equal(result.isOverstay, false);
  assert.ok(result.durationMin >= 4.9 && result.durationMin <= 5.1);
});

test('Same station, exit at exactly 20 min → no penalty (boundary)', () => {
  const now = new Date();
  const result = applyPenalties({
    entryTime: now,
    exitTime: new Date(now.getTime() + 20 * 60_000),
    isSameStation: true,
  });
  assert.equal(result.penalty, 0);
  assert.equal(result.isOverstay, false);
});

test('Same station, exit at 20.5 min → ₹50 penalty', () => {
  const now = new Date();
  const result = applyPenalties({
    entryTime: now,
    exitTime: new Date(now.getTime() + 20.5 * 60_000),
    isSameStation: true,
  });
  assert.equal(result.penalty, SAME_STATION_OVERSTAY_PENALTY);
  assert.equal(result.isOverstay, true);
});

test('Same station, exit at 60 min → ₹50 penalty', () => {
  const now = new Date();
  const result = applyPenalties({
    entryTime: now,
    exitTime: new Date(now.getTime() + 60 * 60_000),
    isSameStation: true,
  });
  assert.equal(result.penalty, 50);
  assert.equal(result.isOverstay, true);
});

test('Same station, exit at 0 min (instant) → no penalty', () => {
  const now = new Date();
  const result = applyPenalties({
    entryTime: now,
    exitTime: now,
    isSameStation: true,
  });
  assert.equal(result.penalty, 0);
  assert.equal(result.isOverstay, false);
});

// ============================================================================
// C. applyPenalties() — Different Stations (System Duration)
// ============================================================================
console.log('\n=== C. applyPenalties() — System Duration ===');

test('Different stations, 90 min journey → no penalty', () => {
  const now = new Date();
  const result = applyPenalties({
    entryTime: now,
    exitTime: new Date(now.getTime() + 90 * 60_000),
    isSameStation: false,
  });
  assert.equal(result.penalty, 0);
  assert.equal(result.isOverstay, false);
});

test('Different stations, exactly 120 min → no penalty (boundary)', () => {
  const now = new Date();
  const result = applyPenalties({
    entryTime: now,
    exitTime: new Date(now.getTime() + 120 * 60_000),
    isSameStation: false,
  });
  assert.equal(result.penalty, 0);
  assert.equal(result.isOverstay, false);
});

test('Different stations, 121 min → ₹50 penalty (1 partial hour)', () => {
  const now = new Date();
  const result = applyPenalties({
    entryTime: now,
    exitTime: new Date(now.getTime() + 121 * 60_000),
    isSameStation: false,
  });
  assert.equal(result.penalty, 50);
  assert.equal(result.isOverstay, true);
});

test('Different stations, 150 min (30 min over) → ₹50 penalty', () => {
  const now = new Date();
  const result = applyPenalties({
    entryTime: now,
    exitTime: new Date(now.getTime() + 150 * 60_000),
    isSameStation: false,
  });
  assert.equal(result.penalty, 50);
  assert.equal(result.isOverstay, true);
});

test('Different stations, 180 min (60 min over) → ₹50 penalty', () => {
  const now = new Date();
  const result = applyPenalties({
    entryTime: now,
    exitTime: new Date(now.getTime() + 180 * 60_000),
    isSameStation: false,
  });
  assert.equal(result.penalty, 50);
  assert.equal(result.isOverstay, true);
});

test('Different stations, 181 min (61 min over) → ₹100 penalty', () => {
  const now = new Date();
  const result = applyPenalties({
    entryTime: now,
    exitTime: new Date(now.getTime() + 181 * 60_000),
    isSameStation: false,
  });
  assert.equal(result.penalty, 100);
  assert.equal(result.isOverstay, true);
});

test('Different stations, 240 min (120 min over) → capped at ₹100', () => {
  const now = new Date();
  const result = applyPenalties({
    entryTime: now,
    exitTime: new Date(now.getTime() + 240 * 60_000),
    isSameStation: false,
  });
  assert.equal(result.penalty, 100);
  assert.equal(result.isOverstay, true);
});

test('Different stations, 500 min → still capped at ₹100', () => {
  const now = new Date();
  const result = applyPenalties({
    entryTime: now,
    exitTime: new Date(now.getTime() + 500 * 60_000),
    isSameStation: false,
  });
  assert.equal(result.penalty, 100);
  assert.equal(result.isOverstay, true);
});

// ============================================================================
// D. applyPenalties() — Error Handling
// ============================================================================
console.log('\n=== D. applyPenalties() — Error Handling ===');

test('Throws on invalid entryTime', () => {
  assert.throws(
    () => applyPenalties({ entryTime: 'bad', exitTime: new Date(), isSameStation: false }),
    /Invalid entryTime/
  );
});

test('Throws on invalid exitTime', () => {
  assert.throws(
    () => applyPenalties({ entryTime: new Date(), exitTime: 'bad', isSameStation: false }),
    /Invalid exitTime/
  );
});

test('Throws on null entryTime', () => {
  assert.throws(
    () => applyPenalties({ entryTime: null, exitTime: new Date(), isSameStation: false }),
    /Invalid entryTime/
  );
});

test('Throws when exitTime < entryTime', () => {
  const now = new Date();
  assert.throws(
    () =>
      applyPenalties({
        entryTime: now,
        exitTime: new Date(now.getTime() - 60_000),
        isSameStation: false,
      }),
    /exitTime cannot be earlier/
  );
});

test('Throws on NaN Date object', () => {
  assert.throws(
    () =>
      applyPenalties({
        entryTime: new Date('invalid'),
        exitTime: new Date(),
        isSameStation: false,
      }),
    /Invalid entryTime/
  );
});

// ============================================================================
// E. getStationDetails() — Amenities Lookup
// ============================================================================
console.log('\n=== E. getStationDetails() — Amenities ===');

test('Majestic (purple) has parking and feeding rooms', () => {
  const details = getStationDetails('majestic', stationsArray);
  assert.ok(details);
  assert.equal(details.id, 'majestic');
  assert.ok(details.parking);
  assert.equal(details.parking.twoWheelerSlots, 500);
  assert.equal(details.parking.fourWheelerSlots, 80);
  assert.equal(details.restrooms, true);
  assert.equal(details.feedingRooms, true);
  assert.equal(details.isInterchange, true);
});

test('Majestic (green) has same amenities', () => {
  const details = getStationDetails('majestic-green', stationsArray);
  assert.ok(details);
  assert.equal(details.parking.twoWheelerSlots, 500);
  assert.equal(details.feedingRooms, true);
});

test('Mantri Square has 750 two-wheeler, 100 four-wheeler slots', () => {
  const details = getStationDetails('mantri-square-sampige-road', stationsArray);
  assert.ok(details);
  assert.equal(details.parking.twoWheelerSlots, 750);
  assert.equal(details.parking.fourWheelerSlots, 100);
  assert.equal(details.restrooms, true);
  assert.equal(details.feedingRooms, false);
});

test('Indiranagar has parking and restrooms', () => {
  const details = getStationDetails('indiranagar', stationsArray);
  assert.ok(details);
  assert.equal(details.parking.twoWheelerSlots, 400);
  assert.equal(details.parking.fourWheelerSlots, 60);
  assert.equal(details.restrooms, true);
  assert.equal(details.feedingRooms, false);
});

test('Yelachenahalli has parking', () => {
  const details = getStationDetails('yelachenahalli', stationsArray);
  assert.ok(details);
  assert.equal(details.parking.twoWheelerSlots, 350);
  assert.equal(details.parking.fourWheelerSlots, 50);
  assert.equal(details.restrooms, true);
});

test('Station without explicit amenities still returns restroom from facilities', () => {
  const details = getStationDetails('whitefield', stationsArray);
  assert.ok(details);
  assert.equal(details.restrooms, true); // has "restroom" in facilities
  assert.equal(details.parking, null);   // no amenities.parking
  assert.equal(details.feedingRooms, false);
});

test('Returns null for invalid station ID', () => {
  const details = getStationDetails('nonexistent', stationsArray);
  assert.equal(details, null);
});

test('Returns null for null input', () => {
  assert.equal(getStationDetails(null, stationsArray), null);
  assert.equal(getStationDetails('majestic', null), null);
});

test('getStationDetails includes standard fields', () => {
  const details = getStationDetails('majestic', stationsArray);
  assert.ok(details.name);
  assert.ok(details.line);
  assert.ok(details.code);
  assert.ok(details.structure);
  assert.ok(details.platformType);
  assert.ok(details.coordinates);
  assert.ok(Array.isArray(details.facilities));
  assert.ok(Array.isArray(details.exits));
  assert.ok(Array.isArray(details.nearbyAttractions));
  assert.ok(details.sector);
});

// ============================================================================
// F. Yellow Line Interchange Details
// ============================================================================
console.log('\n=== F. Yellow Line Interchange Details ===');

test('RV Road (green) has interchangeDetails for Yellow Line transfer', () => {
  const details = getStationDetails('rv-road', stationsArray);
  assert.ok(details);
  assert.ok(details.interchangeDetails);
  assert.equal(details.interchangeDetails.fromPlatform, 'Level 2 (Green Line)');
  assert.equal(details.interchangeDetails.toPlatform, 'Level 3 (Yellow Line)');
  assert.equal(details.interchangeDetails.walkingTimeMinutes, 3);
});

test('RV Road (yellow) has interchangeDetails for Green Line transfer', () => {
  const details = getStationDetails('rv-road-yellow', stationsArray);
  assert.ok(details);
  assert.ok(details.interchangeDetails);
  assert.equal(details.interchangeDetails.fromPlatform, 'Level 3 (Yellow Line)');
  assert.equal(details.interchangeDetails.toPlatform, 'Level 2 (Green Line)');
});

test('INTERCHANGE_MAP has green-yellow with rv-road transfer stations', () => {
  const gy = INTERCHANGE_MAP['green-yellow'];
  assert.ok(gy);
  assert.equal(gy.transferStations[0].stationId, 'rv-road');
  assert.equal(gy.transferStations[1].stationId, 'rv-road-yellow');
  assert.equal(gy.buffer, 0); // No track-loop buffer at RV Road
});

test('INTERCHANGE_MAP has purple-yellow forced two-hop', () => {
  const py = INTERCHANGE_MAP['purple-yellow'];
  assert.ok(py);
  assert.equal(py.transferStations.length, 4); // majestic → majestic-green → rv-road → rv-road-yellow
  assert.equal(py.transferStations[0].stationId, 'majestic');
  assert.equal(py.transferStations[3].stationId, 'rv-road-yellow');
});

// ============================================================================
// G. calculateJourneySummary() — Full Journey Object
// ============================================================================
console.log('\n=== G. calculateJourneySummary() — Full Journey ===');

test('Regular journey: Whitefield → Majestic with TOKEN', () => {
  const now = new Date();
  const summary = calculateJourneySummary({
    startStationId: 'whitefield',
    endStationId: 'majestic',
    stationIndex,
    stationsArray,
    options: { paymentType: PaymentType.TOKEN, timestamp: now },
    entryTime: now,
    exitTime: new Date(now.getTime() + 45 * 60_000), // 45 min journey
  });

  assert.ok(summary);
  assert.ok(summary.totalFare > 0);
  assert.equal(summary.breakdown.penalty, 0);
  assert.equal(summary.breakdown.base, summary.fareDetails.baseTokenFare);
  assert.equal(summary.breakdown.discount, 0); // TOKEN has no discount
  assert.equal(summary.totalFare, summary.fareDetails.discountedFare);
  assert.ok(summary.amenities.start);
  assert.ok(summary.amenities.end);
  assert.equal(summary.amenities.start.id, 'whitefield');
  assert.equal(summary.amenities.end.id, 'majestic');
  assert.equal(summary.penaltyDetails.isOverstay, false);
});

test('Journey with overstay penalty: Indiranagar → MG Road, 150 min', () => {
  const now = new Date();
  const summary = calculateJourneySummary({
    startStationId: 'indiranagar',
    endStationId: 'mg-road',
    stationIndex,
    stationsArray,
    options: { paymentType: PaymentType.TOKEN },
    entryTime: now,
    exitTime: new Date(now.getTime() + 150 * 60_000),
  });

  assert.ok(summary);
  assert.equal(summary.breakdown.penalty, 50); // 30 min over → 1 partial hour → ₹50
  assert.equal(summary.totalFare, summary.fareDetails.discountedFare + 50);
  assert.equal(summary.penaltyDetails.isOverstay, true);
});

test('Same station journey within grace period', () => {
  const now = new Date();
  const summary = calculateJourneySummary({
    startStationId: 'indiranagar',
    endStationId: 'indiranagar',
    stationIndex,
    stationsArray,
    options: { paymentType: PaymentType.TOKEN },
    entryTime: now,
    exitTime: new Date(now.getTime() + 10 * 60_000),
  });

  assert.ok(summary);
  assert.equal(summary.fareDetails.baseTokenFare, MINIMUM_FARE);
  assert.equal(summary.breakdown.penalty, 0);
  assert.equal(summary.totalFare, MINIMUM_FARE); // TOKEN: no discount, no penalty
  assert.equal(summary.penaltyDetails.isOverstay, false);
  assert.equal(summary.amenities.start.id, 'indiranagar');
  assert.equal(summary.amenities.end.id, 'indiranagar');
});

test('Same station journey with overstay', () => {
  const now = new Date();
  const summary = calculateJourneySummary({
    startStationId: 'majestic',
    endStationId: 'majestic',
    stationIndex,
    stationsArray,
    options: { paymentType: PaymentType.TOKEN },
    entryTime: now,
    exitTime: new Date(now.getTime() + 30 * 60_000), // 30 min > 20 min grace
  });

  assert.ok(summary);
  assert.equal(summary.fareDetails.baseTokenFare, MINIMUM_FARE);
  assert.equal(summary.breakdown.penalty, SAME_STATION_OVERSTAY_PENALTY);
  assert.equal(summary.totalFare, MINIMUM_FARE + SAME_STATION_OVERSTAY_PENALTY); // ₹10 + ₹50 = ₹60
});

test('Summary with Smart Card discount', () => {
  // Use a known weekday peak time (Tuesday 10:00 IST)
  const peakTime = new Date('2026-03-03T04:30:00Z'); // 10:00 IST on Tue
  const summary = calculateJourneySummary({
    startStationId: 'whitefield',
    endStationId: 'majestic',
    stationIndex,
    stationsArray,
    options: { paymentType: PaymentType.SMART_CARD, timestamp: peakTime, cardBalance: 200 },
    entryTime: peakTime,
    exitTime: new Date(peakTime.getTime() + 50 * 60_000),
  });

  assert.ok(summary);
  assert.ok(summary.breakdown.discount > 0); // Smart Card has discount
  assert.equal(summary.breakdown.penalty, 0);
  assert.equal(summary.totalFare, summary.fareDetails.discountedFare);
  // Verify: totalFare = base - discount + penalty
  assert.equal(
    summary.totalFare,
    summary.breakdown.base - summary.breakdown.discount + summary.breakdown.penalty
  );
});

test('Summary without timestamps → no penalty calculated', () => {
  const summary = calculateJourneySummary({
    startStationId: 'whitefield',
    endStationId: 'indiranagar',
    stationIndex,
    stationsArray,
    options: { paymentType: PaymentType.TOKEN },
  });

  assert.ok(summary);
  assert.equal(summary.breakdown.penalty, 0);
  assert.equal(summary.penaltyDetails.reason, 'No timestamps provided.');
});

test('Summary returns null for invalid stations', () => {
  const summary = calculateJourneySummary({
    startStationId: 'nonexistent',
    endStationId: 'majestic',
    stationIndex,
    stationsArray,
  });
  assert.equal(summary, null);
});

test('Summary output has all required fields', () => {
  const now = new Date();
  const summary = calculateJourneySummary({
    startStationId: 'whitefield',
    endStationId: 'majestic',
    stationIndex,
    stationsArray,
    options: { paymentType: PaymentType.TOKEN },
    entryTime: now,
    exitTime: new Date(now.getTime() + 50 * 60_000),
  });

  assert.ok(summary);
  // Top-level fields
  assert.ok('totalFare' in summary);
  assert.ok('breakdown' in summary);
  assert.ok('amenities' in summary);
  assert.ok('penaltyDetails' in summary);
  assert.ok('fareDetails' in summary);

  // Breakdown shape
  assert.ok('base' in summary.breakdown);
  assert.ok('discount' in summary.breakdown);
  assert.ok('penalty' in summary.breakdown);

  // Amenities shape
  assert.ok(summary.amenities.start);
  assert.ok(summary.amenities.end);

  // PenaltyDetails shape
  assert.ok('penalty' in summary.penaltyDetails);
  assert.ok('durationMin' in summary.penaltyDetails);
  assert.ok('reason' in summary.penaltyDetails);
  assert.ok('isOverstay' in summary.penaltyDetails);
});

test('Cross-line journey summary: Whitefield (purple) → Ragigudda (yellow)', () => {
  const now = new Date();
  const summary = calculateJourneySummary({
    startStationId: 'whitefield',
    endStationId: 'ragigudda',
    stationIndex,
    stationsArray,
    options: { paymentType: PaymentType.TOKEN },
    entryTime: now,
    exitTime: new Date(now.getTime() + 80 * 60_000),
  });

  assert.ok(summary);
  assert.ok(summary.totalFare > 0);
  assert.ok(summary.fareDetails.isInterchange);
  assert.equal(summary.breakdown.penalty, 0);
});

// ============================================================================
// H. Edge Cases & Backward Compatibility
// ============================================================================
console.log('\n=== H. Edge Cases & Backward Compatibility ===');

test('calculateFare still works for Stage 1 calls (no options)', () => {
  const result = calculateFare('whitefield', 'majestic', stationIndex);
  assert.ok(result);
  assert.ok(result.fare > 0);
  assert.ok(result.baseTokenFare > 0);
});

test('calculateFare still works with Stage 1 legacy multiplier', () => {
  const result = calculateFare('whitefield', 'majestic', stationIndex, { multiplier: 0.95 });
  assert.ok(result);
  assert.ok(result.fare > 0);
});

test('System duration penalty at exactly 180 min → ₹50', () => {
  // 180 - 120 = 60 min over, exactly 1 hour → ₹50
  const now = new Date();
  const result = applyPenalties({
    entryTime: now,
    exitTime: new Date(now.getTime() + 180 * 60_000),
    isSameStation: false,
  });
  assert.equal(result.penalty, 50);
});

test('System duration penalty at exactly 240 min → ₹100', () => {
  // 240 - 120 = 120 min over = 2 hours → 2 × ₹50 = ₹100, equals cap
  const now = new Date();
  const result = applyPenalties({
    entryTime: now,
    exitTime: new Date(now.getTime() + 240 * 60_000),
    isSameStation: false,
  });
  assert.equal(result.penalty, 100);
});

test('System duration penalty at 300 min still capped at ₹100', () => {
  const now = new Date();
  const result = applyPenalties({
    entryTime: now,
    exitTime: new Date(now.getTime() + 300 * 60_000),
    isSameStation: false,
  });
  assert.equal(result.penalty, 100);
});

test('PenaltyResult.durationMin is accurate', () => {
  const now = new Date();
  const thirtyMin = new Date(now.getTime() + 30 * 60_000);
  const result = applyPenalties({
    entryTime: now,
    exitTime: thirtyMin,
    isSameStation: false,
  });
  assert.ok(Math.abs(result.durationMin - 30) < 0.1);
});

test('Same station exit at exactly entry time → 0 duration, no penalty', () => {
  const now = new Date();
  const result = applyPenalties({
    entryTime: now,
    exitTime: now,
    isSameStation: true,
  });
  assert.equal(result.durationMin, 0);
  assert.equal(result.penalty, 0);
});

test('applyPenalties returns reason string', () => {
  const now = new Date();
  const result = applyPenalties({
    entryTime: now,
    exitTime: new Date(now.getTime() + 10 * 60_000),
    isSameStation: true,
  });
  assert.ok(typeof result.reason === 'string');
  assert.ok(result.reason.length > 0);
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log(`\n${'═'.repeat(60)}`);
console.log(`  Stage 3 Tests: ${passed} passed, ${failed} failed (${passed + failed} total)`);
console.log(`${'═'.repeat(60)}`);

if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach((f) => console.log(`  ✗ ${f.name}: ${f.error}`));
}

process.exit(failed > 0 ? 1 : 0);
