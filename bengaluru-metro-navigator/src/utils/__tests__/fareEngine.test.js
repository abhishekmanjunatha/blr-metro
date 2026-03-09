/**
 * Fare Engine Tests — Stage 1
 *
 * Validates the core fare calculation logic against known BMRCL reference fares.
 * Uses the recalibrated chainage values from stations.json.
 */

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildStationIndex,
  calculateFare,
  computeTrackDistance,
  lookupFare,
  FARE_SLABS,
  MAJESTIC_INTERCHANGE_BUFFER_KM,
} from '../fareEngine.js';

// ── Load station data ────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const stationsPath = resolve(__dirname, '..', '..', '..', 'public', 'data', 'stations.json');
const rawData = JSON.parse(readFileSync(stationsPath, 'utf-8'));
const INDEX = buildStationIndex(rawData.stations);

// ── Helpers ──────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(label, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${label}`);
  } catch (err) {
    failed++;
    console.error(`  ✗ ${label}`);
    console.error(`    ${err.message}`);
  }
}

// ============================================================================
// 1. FARE SLAB LOOKUP
// ============================================================================
console.log('\n── Fare Slab Lookup ──');

test('0 km → ₹10', () => assert.equal(lookupFare(0), 10));
test('1 km → ₹10', () => assert.equal(lookupFare(1), 10));
test('2 km → ₹10', () => assert.equal(lookupFare(2), 10));
test('3 km → ₹20', () => assert.equal(lookupFare(3), 20));
test('4 km → ₹20', () => assert.equal(lookupFare(4), 20));
test('5 km → ₹30', () => assert.equal(lookupFare(5), 30));
test('8 km → ₹40', () => assert.equal(lookupFare(8), 40));
test('10 km → ₹50', () => assert.equal(lookupFare(10), 50));
test('15 km → ₹60', () => assert.equal(lookupFare(15), 60));
test('20 km → ₹70', () => assert.equal(lookupFare(20), 70));
test('25 km → ₹80', () => assert.equal(lookupFare(25), 80));
test('26 km → ₹90', () => assert.equal(lookupFare(26), 90));
test('50 km → ₹90 (cap)', () => assert.equal(lookupFare(50), 90));

// ============================================================================
// 2. STATION INDEX
// ============================================================================
console.log('\n── Station Index ──');

test('Whitefield exists on purple line', () => {
  const s = INDEX.byId.get('whitefield');
  assert.ok(s);
  assert.equal(s.line, 'purple');
  assert.equal(s.chainage, 0);
});

test('Majestic (purple) at 24.5 km', () => {
  assert.equal(INDEX.byId.get('majestic').chainage, 24.5);
});

test('Majestic (green) at 15.5 km', () => {
  assert.equal(INDEX.byId.get('majestic-green').chainage, 15.5);
});

test('RV Road (green) at 22.6 km', () => {
  assert.equal(INDEX.byId.get('rv-road').chainage, 22.6);
});

test('RV Road (yellow) at 0 km', () => {
  assert.equal(INDEX.byId.get('rv-road-yellow').chainage, 0);
});

test('Challaghatta at 42.0 km', () => {
  assert.equal(INDEX.byId.get('challaghatta').chainage, 42);
});

test('Silk Institute at 30.3 km', () => {
  assert.equal(INDEX.byId.get('silk-institute').chainage, 30.3);
});

test('BTM Layout (yellow) at 3.3 km', () => {
  assert.equal(INDEX.byId.get('btm-layout').chainage, 3.3);
});

test('Electronic City at 15.8 km', () => {
  assert.equal(INDEX.byId.get('electronic-city').chainage, 15.8);
});

test('Bommasandra at 19.1 km', () => {
  assert.equal(INDEX.byId.get('delta-electronics-bommasandra').chainage, 19.1);
});

// ============================================================================
// 3. SAME-LINE DISTANCE
// ============================================================================
console.log('\n── Same-Line Distance ──');

test('Whitefield → Majestic = 24.5 km', () => {
  const r = computeTrackDistance('whitefield', 'majestic', INDEX);
  assert.equal(r.rawDistance, 24.5);
  assert.equal(r.ceilDistance, 25);
  assert.deepEqual(r.interchanges, []);
});

test('Majestic → Challaghatta = 17.5 km', () => {
  const r = computeTrackDistance('majestic', 'challaghatta', INDEX);
  assert.equal(r.rawDistance, 17.5);
  assert.equal(r.ceilDistance, 18);
});

test('Whitefield → Challaghatta = 42.0 km', () => {
  const r = computeTrackDistance('whitefield', 'challaghatta', INDEX);
  assert.equal(r.rawDistance, 42);
  assert.equal(r.ceilDistance, 42);
});

test('Madavara → Silk Institute = 30.3 km', () => {
  const r = computeTrackDistance('madavara', 'silk-institute', INDEX);
  assert.equal(r.rawDistance, 30.3);
  assert.equal(r.ceilDistance, 31);
});

test('RV Road (yellow) → Bommasandra = 19.1 km', () => {
  const r = computeTrackDistance('rv-road-yellow', 'delta-electronics-bommasandra', INDEX);
  assert.equal(r.rawDistance, 19.1);
  assert.equal(r.ceilDistance, 20);
});

test('Same station → 0 km', () => {
  const r = computeTrackDistance('indiranagar', 'indiranagar', INDEX);
  assert.equal(r.rawDistance, 0);
  assert.equal(r.ceilDistance, 0);
});

// ============================================================================
// 4. CROSS-LINE DISTANCE (Purple ↔ Green via Majestic)
// ============================================================================
console.log('\n── Cross-Line: Purple ↔ Green (via Majestic) ──');

test('Indiranagar (purple) → Jayanagar (green) includes 0.8km buffer', () => {
  const r = computeTrackDistance('indiranagar', 'jayanagar', INDEX);
  assert.ok(r);
  assert.equal(r.buffer, 0.8);
  assert.ok(r.interchanges.length > 0);

  // Indiranagar chainage = 17.83,  Majestic(purple) = 24.5  → |24.5 - 17.83| = 6.67
  // Majestic(green) = 15.5,        Jayanagar = 21.51         → |15.5 - 21.51| = 6.01
  // Total = 6.67 + 6.01 + 0.8 = 13.48
  const expected = Math.abs(24.5 - 17.83) + Math.abs(15.5 - 21.51) + 0.8;
  assert.ok(Math.abs(r.rawDistance - expected) < 0.02, `Expected ~${expected}, got ${r.rawDistance}`);
});

// ============================================================================
// 5. CROSS-LINE DISTANCE (Green ↔ Yellow via RV Road)
// ============================================================================
console.log('\n── Cross-Line: Green ↔ Yellow (via RV Road) ──');

test('Jayanagar (green) → BTM Layout (yellow) has no buffer', () => {
  const r = computeTrackDistance('jayanagar', 'btm-layout', INDEX);
  assert.ok(r);
  assert.equal(r.buffer, 0);

  // Jayanagar = 21.51, RV Road(green) = 22.6 → |22.6 - 21.51| = 1.09
  // RV Road(yellow) = 0, BTM Layout = 3.3     → |3.3 - 0| = 3.3
  // Total = 1.09 + 3.3 = 4.39
  const expected = Math.abs(22.6 - 21.51) + 3.3;
  assert.ok(Math.abs(r.rawDistance - expected) < 0.02, `Expected ~${expected}, got ${r.rawDistance}`);
});

// ============================================================================
// 6. CROSS-LINE DISTANCE (Purple ↔ Yellow via Majestic + RV Road)
// ============================================================================
console.log('\n── Cross-Line: Purple ↔ Yellow (Majestic + RV Road) ──');

test('Indiranagar (purple) → Electronic City (yellow) — two hops', () => {
  const r = computeTrackDistance('indiranagar', 'electronic-city', INDEX);
  assert.ok(r);
  assert.equal(r.buffer, 0.8);

  // Indiranagar = 17.83                    → Majestic(purple) = 24.5  → 6.67
  // Majestic(green) = 15.5                → RV Road(green) = 22.6    → 7.1
  // RV Road(yellow) = 0                   → Electronic City = 15.8   → 15.8
  // Buffer = 0.8
  // Total = 6.67 + 7.1 + 15.8 + 0.8 = 30.37
  const expected =
    Math.abs(24.5 - 17.83) +
    Math.abs(22.6 - 15.5) +
    15.8 +
    0.8;
  assert.ok(Math.abs(r.rawDistance - expected) < 0.02, `Expected ~${expected}, got ${r.rawDistance}`);
});

// ============================================================================
// 7. FULL FARE CALCULATION (calculateFare)
// ============================================================================
console.log('\n── Full Fare Calculation ──');

test('Indiranagar → MG Road (same line, short) = ₹20', () => {
  // Distance = |20.83 - 17.83| = 3.0 → ceil = 3 → slab F2 = ₹20
  const result = calculateFare('indiranagar', 'mg-road', INDEX);
  assert.ok(result);
  assert.equal(result.fare, 20);
  assert.equal(result.isInterchange, false);
});

test('Whitefield → Majestic (24.5 km) → ceil 25 → ₹80', () => {
  const result = calculateFare('whitefield', 'majestic', INDEX);
  assert.ok(result);
  assert.equal(result.ceilDistanceKm, 25);
  assert.equal(result.fare, 80);
});

test('Whitefield → Challaghatta (42 km) → ceil 42 → ₹90 (cap)', () => {
  const result = calculateFare('whitefield', 'challaghatta', INDEX);
  assert.ok(result);
  assert.equal(result.ceilDistanceKm, 42);
  assert.equal(result.fare, 90);
});

test('Madavara → Silk Institute (30.3 km) → ceil 31 → ₹90', () => {
  const result = calculateFare('madavara', 'silk-institute', INDEX);
  assert.ok(result);
  assert.equal(result.ceilDistanceKm, 31);
  assert.equal(result.fare, 90);
});

test('Same station → ₹10', () => {
  const result = calculateFare('indiranagar', 'indiranagar', INDEX);
  assert.ok(result);
  assert.equal(result.fare, 10);
});

test('Indiranagar → Jayanagar (cross-line) includes buffer in fare', () => {
  const result = calculateFare('indiranagar', 'jayanagar', INDEX);
  assert.ok(result);
  assert.equal(result.isInterchange, true);
  assert.equal(result.bufferKm, 0.8);
  // raw ~13.48 → ceil 14 → ₹60
  assert.equal(result.ceilDistanceKm, 14);
  assert.equal(result.fare, 60);
});

test('Jayanagar → BTM Layout (green→yellow, no buffer)', () => {
  const result = calculateFare('jayanagar', 'btm-layout', INDEX);
  assert.ok(result);
  assert.equal(result.bufferKm, 0);
  // raw ~4.39 → ceil 5 → ₹30
  assert.equal(result.ceilDistanceKm, 5);
  assert.equal(result.fare, 30);
});

test('Indiranagar → Electronic City (purple→yellow, two hops)', () => {
  const result = calculateFare('indiranagar', 'electronic-city', INDEX);
  assert.ok(result);
  assert.equal(result.bufferKm, 0.8);
  // raw ~30.37 → ceil 31 → ₹90
  assert.equal(result.ceilDistanceKm, 31);
  assert.equal(result.fare, 90);
});

// ============================================================================
// 8. STAGE 2 HOOK — Fare Modifier
// ============================================================================
console.log('\n── Stage 2 Hook: Fare Modifier ──');

test('Smart Card peak (5% off) on ₹60 base → ₹57', () => {
  const result = calculateFare('indiranagar', 'jayanagar', INDEX, { multiplier: 0.95, label: 'Smart Card Peak' });
  assert.ok(result);
  assert.equal(result.fare, 57);
});

test('Smart Card off-peak (10% off) on ₹60 base → ₹54', () => {
  const result = calculateFare('indiranagar', 'jayanagar', INDEX, { multiplier: 0.90, label: 'Smart Card Off-Peak' });
  assert.ok(result);
  assert.equal(result.fare, 54);
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log(`\n${'═'.repeat(60)}`);
console.log(`  ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${'═'.repeat(60)}\n`);

if (failed > 0) process.exit(1);
