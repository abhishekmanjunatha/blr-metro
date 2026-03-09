/**
 * Test Suite for Namma Metro Route Calculator
 *
 * Tests cover:
 *   - Distance calculation from chainage
 *   - Fare calculation (distance-based slabs)
 *   - Graph construction
 *   - Dijkstra routing (same-line, interchange, multi-interchange)
 *   - Edge cases (same station, invalid stations, long routes)
 *
 * Run via: node src/utils/__tests__/routeCalculator.test.js
 * (Standalone — no test framework needed)
 */

import {
  calculateDistanceFromChainage,
  calculateSegmentDistance,
  calculateTotalRouteDistance,
  calculateFare,
  calculateFareFromRoute,
  buildMetroGraph,
  findRoutes,
} from '../routeCalculator.js';

// ============================================================================
// Test Harness
// ============================================================================

let passCount = 0;
let failCount = 0;
const failures = [];

function assert(condition, testName) {
  if (condition) {
    passCount++;
  } else {
    failCount++;
    failures.push(testName);
    console.error(`  FAIL: ${testName}`);
  }
}

function assertApprox(actual, expected, tolerance, testName) {
  const ok = Math.abs(actual - expected) <= tolerance;
  if (ok) {
    passCount++;
  } else {
    failCount++;
    failures.push(`${testName} (got ${actual}, expected ~${expected})`);
    console.error(`  FAIL: ${testName} — got ${actual}, expected ~${expected} ±${tolerance}`);
  }
}

function section(name) {
  console.log(`\n=== ${name} ===`);
}

// ============================================================================
// Test Data — Minimal station set for unit tests
// ============================================================================

const TEST_STATIONS = [
  // Purple Line subset
  { id: 'whitefield', line: 'purple', order: 1, chainage: 0.0, name: 'Whitefield', interchangeWith: null },
  { id: 'indiranagar', line: 'purple', order: 16, chainage: 20.87, name: 'Indiranagar', interchangeWith: null },
  { id: 'mg-road', line: 'purple', order: 19, chainage: 24.37, name: 'M.G. Road', interchangeWith: ['pink'] },
  { id: 'majestic', line: 'purple', order: 23, chainage: 28.67, name: 'Majestic', interchangeWith: ['green'], isInterchange: true },
  { id: 'challaghatta', line: 'purple', order: 37, chainage: 45.92, name: 'Challaghatta', interchangeWith: null },
  // Fill in intermediate purple stations for graph edges
  { id: 'hopefarm', line: 'purple', order: 2, chainage: 1.39, name: 'Hopefarm', interchangeWith: null },
  { id: 'kadugodi-tp', line: 'purple', order: 3, chainage: 2.47, name: 'Kadugodi Tree Park', interchangeWith: null },
  { id: 'pattandur', line: 'purple', order: 4, chainage: 3.98, name: 'Pattandur Agrahara', interchangeWith: null },
  { id: 'sssh', line: 'purple', order: 5, chainage: 5.37, name: 'Sri Sathya Sai Hospital', interchangeWith: null },
  { id: 'nallurhalli', line: 'purple', order: 6, chainage: 6.43, name: 'Nallurhalli', interchangeWith: null },
  { id: 'kundalahalli', line: 'purple', order: 7, chainage: 7.55, name: 'Kundalahalli', interchangeWith: null },
  { id: 'seetharamapalya', line: 'purple', order: 8, chainage: 8.71, name: 'Seetharamapalya', interchangeWith: null },
  { id: 'hoodi', line: 'purple', order: 9, chainage: 9.98, name: 'Hoodi', interchangeWith: null },
  { id: 'garudacharapalya', line: 'purple', order: 10, chainage: 11.60, name: 'Garudacharapalya', interchangeWith: null },
  { id: 'singayyanapalya', line: 'purple', order: 11, chainage: 13.12, name: 'Singayyanapalya', interchangeWith: null },
  { id: 'kr-puram', line: 'purple', order: 12, chainage: 14.82, name: 'KR Puram', interchangeWith: ['blue'] },
  { id: 'benniganahalli', line: 'purple', order: 13, chainage: 16.27, name: 'Benniganahalli', interchangeWith: null },
  { id: 'baiyappanahalli', line: 'purple', order: 14, chainage: 17.57, name: 'Baiyappanahalli', interchangeWith: null },
  { id: 'svr', line: 'purple', order: 15, chainage: 19.37, name: 'Swami Vivekananda Road', interchangeWith: null },
  // orders 16=indiranagar, already above
  { id: 'halasuru', line: 'purple', order: 17, chainage: 22.27, name: 'Halasuru', interchangeWith: null },
  { id: 'trinity', line: 'purple', order: 18, chainage: 23.37, name: 'Trinity', interchangeWith: null },
  // order 19=mg-road, already above
  { id: 'cubbon-park', line: 'purple', order: 20, chainage: 25.47, name: 'Cubbon Park', interchangeWith: null },
  { id: 'vidhana-soudha', line: 'purple', order: 21, chainage: 26.67, name: 'Vidhana Soudha', interchangeWith: null },
  { id: 'smv', line: 'purple', order: 22, chainage: 27.67, name: 'Sir M. Visvesvaraya', interchangeWith: null },
  // order 23=majestic, already above
  { id: 'city-railway', line: 'purple', order: 24, chainage: 29.67, name: 'City Railway Station', interchangeWith: null },
  { id: 'magadi-road', line: 'purple', order: 25, chainage: 31.17, name: 'Magadi Road', interchangeWith: null },
  { id: 'hosahalli', line: 'purple', order: 26, chainage: 32.27, name: 'Hosahalli', interchangeWith: null },
  { id: 'vijayanagar', line: 'purple', order: 27, chainage: 33.37, name: 'Vijayanagar', interchangeWith: null },
  { id: 'attiguppe', line: 'purple', order: 28, chainage: 34.67, name: 'Attiguppe', interchangeWith: null },
  { id: 'deepanjali', line: 'purple', order: 29, chainage: 35.87, name: 'Deepanjali Nagar', interchangeWith: null },
  { id: 'mysuru-road', line: 'purple', order: 30, chainage: 36.97, name: 'Mysuru Road', interchangeWith: null },
  { id: 'pantharapalya', line: 'purple', order: 31, chainage: 38.37, name: 'Pantharapalya', interchangeWith: null },
  { id: 'rr-nagar', line: 'purple', order: 32, chainage: 39.57, name: 'RR Nagar', interchangeWith: null },
  { id: 'jnanabharathi', line: 'purple', order: 33, chainage: 40.87, name: 'Jnanabharathi', interchangeWith: null },
  { id: 'pattanagere', line: 'purple', order: 34, chainage: 41.87, name: 'Pattanagere', interchangeWith: null },
  { id: 'kengeri-bt', line: 'purple', order: 35, chainage: 43.07, name: 'Kengeri BT', interchangeWith: null },
  { id: 'kengeri', line: 'purple', order: 36, chainage: 43.87, name: 'Kengeri', interchangeWith: null },
  // order 37=challaghatta, already above

  // Green Line subset
  { id: 'nagasandra', line: 'green', order: 4, chainage: 3.14, name: 'Nagasandra', interchangeWith: null },
  { id: 'majestic-green', line: 'green', order: 17, chainage: 17.84, name: 'Majestic', interchangeWith: ['purple'], isInterchange: true },
  { id: 'silk-institute', line: 'green', order: 32, chainage: 33.46, name: 'Silk Institute', interchangeWith: null },
  // Fill intermediate green stations
  { id: 'madavara', line: 'green', order: 1, chainage: 0.0, name: 'Madavara', interchangeWith: null },
  { id: 'chikkabidarakallu', line: 'green', order: 2, chainage: 1.32, name: 'Chikkabidarakallu', interchangeWith: null },
  { id: 'manjunathanagar', line: 'green', order: 3, chainage: 2.30, name: 'Manjunathanagar', interchangeWith: null },
  // nagasandra order=4
  { id: 'dasarahalli', line: 'green', order: 5, chainage: 4.34, name: 'Dasarahalli', interchangeWith: null },
  { id: 'jalahalli', line: 'green', order: 6, chainage: 5.34, name: 'Jalahalli', interchangeWith: null },
  { id: 'peenya-industry', line: 'green', order: 7, chainage: 6.34, name: 'Peenya Industry', interchangeWith: null },
  { id: 'peenya', line: 'green', order: 8, chainage: 7.34, name: 'Peenya', interchangeWith: null },
  { id: 'goraguntepalya', line: 'green', order: 9, chainage: 8.34, name: 'Goraguntepalya', interchangeWith: null },
  { id: 'yeshwanthpur', line: 'green', order: 10, chainage: 9.34, name: 'Yeshwanthpur', interchangeWith: null },
  { id: 'ssf', line: 'green', order: 11, chainage: 10.54, name: 'Sandal Soap Factory', interchangeWith: null },
  { id: 'mahalakshmi', line: 'green', order: 12, chainage: 11.54, name: 'Mahalakshmi', interchangeWith: null },
  { id: 'rajajinagar', line: 'green', order: 13, chainage: 12.54, name: 'Rajajinagar', interchangeWith: null },
  { id: 'mkr', line: 'green', order: 14, chainage: 13.54, name: 'Mahakavi Kuvempu Road', interchangeWith: null },
  { id: 'srirampura', line: 'green', order: 15, chainage: 14.74, name: 'Srirampura', interchangeWith: null },
  { id: 'mantri-sq', line: 'green', order: 16, chainage: 15.84, name: 'Mantri Square', interchangeWith: null },
  // majestic-green order=17
  { id: 'chickpete', line: 'green', order: 18, chainage: 18.84, name: 'Chickpete', interchangeWith: null },
  { id: 'kr-market', line: 'green', order: 19, chainage: 19.34, name: 'KR Market', interchangeWith: null },
  { id: 'national-college', line: 'green', order: 20, chainage: 20.34, name: 'National College', interchangeWith: null },
  { id: 'lalbagh', line: 'green', order: 21, chainage: 21.34, name: 'Lalbagh', interchangeWith: null },
  { id: 'south-end', line: 'green', order: 22, chainage: 22.34, name: 'South End Circle', interchangeWith: null },
  { id: 'jayanagar', line: 'green', order: 23, chainage: 23.34, name: 'Jayanagar', interchangeWith: null },
  { id: 'rv-road', line: 'green', order: 24, chainage: 24.34, name: 'RV Road', interchangeWith: ['yellow'], isInterchange: true },
  { id: 'banashankari', line: 'green', order: 25, chainage: 25.34, name: 'Banashankari', interchangeWith: null },
  { id: 'jp-nagar', line: 'green', order: 26, chainage: 26.34, name: 'JP Nagar', interchangeWith: null },
  { id: 'yelachenahalli', line: 'green', order: 27, chainage: 27.24, name: 'Yelachenahalli', interchangeWith: null },
  { id: 'konanakunte', line: 'green', order: 28, chainage: 28.44, name: 'Konanakunte Cross', interchangeWith: null },
  { id: 'doddakallasandra', line: 'green', order: 29, chainage: 29.54, name: 'Doddakallasandra', interchangeWith: null },
  { id: 'vajarahalli', line: 'green', order: 30, chainage: 30.74, name: 'Vajarahalli', interchangeWith: null },
  { id: 'thalaghattapura', line: 'green', order: 31, chainage: 31.84, name: 'Thalaghattapura', interchangeWith: null },
  // silk-institute order=32

  // Yellow Line subset
  { id: 'rv-road-yellow', line: 'yellow', order: 0, chainage: 0.0, name: 'RV Road', interchangeWith: ['green'], isInterchange: true },
  { id: 'ragigudda', line: 'yellow', order: 1, chainage: 1.90, name: 'Ragigudda', interchangeWith: null },
  { id: 'jayadeva', line: 'yellow', order: 2, chainage: 3.35, name: 'Jayadeva Hospital', interchangeWith: ['pink'] },
  { id: 'btm-layout', line: 'yellow', order: 3, chainage: 4.60, name: 'BTM Layout', interchangeWith: null },
  { id: 'csb', line: 'yellow', order: 4, chainage: 5.85, name: 'Central Silk Board', interchangeWith: ['blue'] },
  { id: 'bommanahalli', line: 'yellow', order: 5, chainage: 7.30, name: 'Bommanahalli', interchangeWith: null },
  { id: 'hongasandra', line: 'yellow', order: 6, chainage: 8.65, name: 'Hongasandra', interchangeWith: null },
  { id: 'kudlu-gate', line: 'yellow', order: 7, chainage: 9.90, name: 'Kudlu Gate', interchangeWith: null },
  { id: 'singasandra', line: 'yellow', order: 8, chainage: 11.45, name: 'Singasandra', interchangeWith: null },
  { id: 'hosa-road', line: 'yellow', order: 9, chainage: 12.85, name: 'Hosa Road', interchangeWith: null },
  { id: 'beratena', line: 'yellow', order: 10, chainage: 14.15, name: 'Beratena Agrahara', interchangeWith: null },
  { id: 'electronic-city', line: 'yellow', order: 11, chainage: 15.35, name: 'Electronic City', interchangeWith: null },
  { id: 'konappana', line: 'yellow', order: 12, chainage: 16.65, name: 'Konappana Agrahara', interchangeWith: null },
  { id: 'huskur', line: 'yellow', order: 13, chainage: 17.85, name: 'Huskur Road', interchangeWith: null },
  { id: 'hebbagodi', line: 'yellow', order: 14, chainage: 18.95, name: 'Hebbagodi', interchangeWith: null },
  { id: 'bommasandra', line: 'yellow', order: 15, chainage: 20.35, name: 'Bommasandra', interchangeWith: null },
];

const TEST_INTERCHANGES = [
  {
    stationId: 'majestic',
    stationIds: { purple: 'majestic', green: 'majestic-green' },
    name: 'Majestic',
    lines: ['purple', 'green'],
    walkingTime: 5,
  },
  {
    stationId: 'rv-road',
    stationIds: { green: 'rv-road', yellow: 'rv-road-yellow' },
    name: 'RV Road',
    lines: ['green', 'yellow'],
    walkingTime: 3,
  },
];

// ============================================================================
// Build graph once for routing tests
// ============================================================================

const metroGraph = buildMetroGraph(TEST_STATIONS, TEST_INTERCHANGES);

// ============================================================================
// TEST 1: Distance Calculation
// ============================================================================

section('Distance Calculation');

// Same-line distance (Purple)
const sIndiranagar = { line: 'purple', chainage: 20.87 };
const sMajestic = { line: 'purple', chainage: 28.67 };
assertApprox(
  calculateDistanceFromChainage(sIndiranagar, sMajestic),
  7.8,
  0.01,
  'Indiranagar → Majestic distance = 7.8 km'
);

// Same-line distance (Green)
const sMajesticG = { line: 'green', chainage: 17.84 };
const sRvRoad = { line: 'green', chainage: 24.34 };
assertApprox(
  calculateDistanceFromChainage(sMajesticG, sRvRoad),
  6.5,
  0.01,
  'Majestic(G) → RV Road distance = 6.5 km'
);

// Different lines → null
assert(
  calculateDistanceFromChainage(sIndiranagar, sMajesticG) === null,
  'Cross-line distance returns null'
);

// Segment distance
const segStations = [
  { line: 'purple', chainage: 20.87 },
  { line: 'purple', chainage: 22.27 },
  { line: 'purple', chainage: 24.37 },
  { line: 'purple', chainage: 28.67 },
];
assertApprox(
  calculateSegmentDistance(segStations),
  7.8,
  0.01,
  'Segment distance Indiranagar→Majestic = 7.8 km (uses first-last chainage)'
);

// Empty / single station
assert(calculateSegmentDistance([]) === 0, 'Empty segment → 0');
assert(calculateSegmentDistance([{ line: 'purple', chainage: 5 }]) === 0, 'Single station → 0');

// ============================================================================
// TEST 2: Fare Calculation (Distance-Based Slabs)
// ============================================================================

section('Fare Calculation — Distance Slabs');

// Slab boundary tests
assert(calculateFare(0) === 10, 'Same station (0 km) = ₹10');
assert(calculateFare(1.5) === 10, '1.5 km = ₹10 (F1)');
assert(calculateFare(2) === 10, '2.0 km = ₹10 (F1 boundary)');
assert(calculateFare(2.1) === 20, '2.1 km = ₹20 (F2)');
assert(calculateFare(4) === 20, '4.0 km = ₹20 (F2 boundary)');
assert(calculateFare(4.1) === 30, '4.1 km = ₹30 (F3)');
assert(calculateFare(6) === 30, '6.0 km = ₹30 (F3 boundary)');
assert(calculateFare(7.8) === 40, '7.8 km = ₹40 (F4) — Indiranagar→Majestic');
assert(calculateFare(10) === 50, '10.0 km = ₹50 (F5 boundary)');
assert(calculateFare(14.3) === 60, '14.3 km = ₹60 (F6)');
assert(calculateFare(15) === 60, '15.0 km = ₹60 (F6 boundary)');
assert(calculateFare(18) === 70, '18.0 km = ₹70 (F7)');
assert(calculateFare(20) === 70, '20.0 km = ₹70 (F7 boundary)');
assert(calculateFare(20.87) === 80, '20.87 km = ₹80 (F8) — Whitefield→Indiranagar');
assert(calculateFare(25) === 80, '25.0 km = ₹80 (F8 boundary)');
assert(calculateFare(28.67) === 90, '28.67 km = ₹90 (F9) — Whitefield→Majestic');
assert(calculateFare(29.65) === 90, '29.65 km = ₹90 (F9) — Indiranagar→Electronic City');
assert(calculateFare(30) === 90, '30.0 km = ₹90 (F9 boundary)');
assert(calculateFare(45.92) === 90, '45.92 km = ₹90 (F10 cap) — Whitefield→Challaghatta');
assert(calculateFare(100) === 90, '100 km = ₹90 (cap)');

// Smart Card tests
assert(calculateFare(7.8, 'SMART_CARD', false, false) === 38, '7.8 km Smart Card peak = ₹38');
assert(calculateFare(7.8, 'SMART_CARD', true, false) === 36, '7.8 km Smart Card off-peak = ₹36');
assert(calculateFare(7.8, 'SMART_CARD', false, true) === 36, '7.8 km Smart Card Sunday = ₹36');

// Reference table validation (from Fare Calculation Logic.txt)
assert(calculateFare(6.5) === 40, 'Majestic → Indiranagar ≈ 6.5 km = ₹40');
assert(calculateFare(14.2) === 60, 'Majestic → KR Puram ≈ 14.2 km = ₹60');
assert(calculateFare(28.5) === 90, 'Majestic → Whitefield ≈ 28.5 km = ₹90');
assert(calculateFare(18.0) === 70, 'Whitefield → Indiranagar ≈ 18 km = ₹70');
assert(calculateFare(3.5) === 20, 'Indiranagar → MG Road ≈ 3.5 km = ₹20');

// Negative / zero edge cases
assert(calculateFare(-5) === 10, 'Negative distance = ₹10 (same station)');

// ============================================================================
// TEST 3: calculateFareFromRoute
// ============================================================================

section('calculateFareFromRoute');

const testSegments = [
  { stations: [{ line: 'purple', chainage: 20.87 }, { line: 'purple', chainage: 28.67 }] },
  { stations: [{ line: 'green', chainage: 17.84 }, { line: 'green', chainage: 24.34 }] },
  { stations: [{ line: 'yellow', chainage: 0.0 }, { line: 'yellow', chainage: 15.35 }] },
];
assertApprox(
  calculateTotalRouteDistance(testSegments),
  29.65,
  0.01,
  'Total distance Indiranagar→Majestic→RV Road→Electronic City = 29.65 km'
);
assert(
  calculateFareFromRoute(testSegments) === 90,
  'Fare for 29.65 km route = ₹90'
);

// ============================================================================
// TEST 4: Graph Construction
// ============================================================================

section('Graph Construction');

const { graph, stationMap, lineStations } = metroGraph;

assert(Object.keys(stationMap).length === TEST_STATIONS.length, 'All stations in stationMap');
assert(Object.keys(graph).length === TEST_STATIONS.length, 'All stations have graph entries');

// Check edge exists between adjacent Purple stations
const whitefieldEdges = graph['whitefield'];
assert(
  whitefieldEdges.some((e) => e.station === 'hopefarm'),
  'Whitefield has edge to Hopefarm'
);
const whToHopefarmEdge = whitefieldEdges.find((e) => e.station === 'hopefarm');
assertApprox(whToHopefarmEdge.distance, 1.39, 0.01, 'Whitefield→Hopefarm distance = 1.39 km');

// Check interchange edge exists
const majesticEdges = graph['majestic'];
assert(
  majesticEdges.some((e) => e.station === 'majestic-green' && e.isInterchange),
  'Majestic(purple) has interchange edge to Majestic(green)'
);
const interchangeEdge = majesticEdges.find((e) => e.station === 'majestic-green');
assert(interchangeEdge.distance === 0, 'Interchange edge distance = 0');
assert(interchangeEdge.time === 5, 'Interchange edge walking time = 5 min');

// RV Road interchange
const rvRoadEdges = graph['rv-road'];
assert(
  rvRoadEdges.some((e) => e.station === 'rv-road-yellow' && e.isInterchange),
  'RV Road(green) has interchange edge to RV Road(yellow)'
);

// ============================================================================
// TEST 5: Routing — Same Line (Direct)
// ============================================================================

section('Routing — Same Line');

// MG Road → Indiranagar (Purple, short)
const r1 = findRoutes('mg-road', 'indiranagar', metroGraph, TEST_INTERCHANGES);
assert(r1.length > 0, 'MG Road → Indiranagar: route found');
if (r1.length > 0) {
  const route = r1[0];
  assert(route.type === 'direct', 'MG Road → Indiranagar: direct route');
  assertApprox(route.distanceKm, 3.5, 0.1, 'MG Road → Indiranagar: ~3.5 km');
  assert(route.fare === 20, 'MG Road → Indiranagar: ₹20');
  assert(route.interchanges.length === 0, 'MG Road → Indiranagar: no interchanges');
}

// Whitefield → Majestic (Purple, long)
const r2 = findRoutes('whitefield', 'majestic', metroGraph, TEST_INTERCHANGES);
assert(r2.length > 0, 'Whitefield → Majestic: route found');
if (r2.length > 0) {
  const route = r2[0];
  assert(route.type === 'direct', 'Whitefield → Majestic: direct route');
  assertApprox(route.distanceKm, 28.67, 0.1, 'Whitefield → Majestic: ~28.67 km');
  assert(route.fare === 90, 'Whitefield → Majestic: ₹90');
}

// Whitefield → Challaghatta (longest Purple)
const r3 = findRoutes('whitefield', 'challaghatta', metroGraph, TEST_INTERCHANGES);
assert(r3.length > 0, 'Whitefield → Challaghatta: route found');
if (r3.length > 0) {
  const route = r3[0];
  assertApprox(route.distanceKm, 45.92, 0.1, 'Whitefield → Challaghatta: ~45.92 km');
  assert(route.fare === 90, 'Whitefield → Challaghatta: ₹90 (cap)');
}

// Nagasandra → Silk Institute (Green, end-to-end minus first 3 green stations)
const r4 = findRoutes('nagasandra', 'silk-institute', metroGraph, TEST_INTERCHANGES);
assert(r4.length > 0, 'Nagasandra → Silk Institute: route found');
if (r4.length > 0) {
  const route = r4[0];
  assert(route.type === 'direct', 'Nagasandra → Silk Institute: direct');
  assertApprox(route.distanceKm, 30.32, 0.1, 'Nagasandra → Silk Institute: ~30.32 km');
  assert(route.fare === 90, 'Nagasandra → Silk Institute: ₹90');
}

// ============================================================================
// TEST 6: Routing — One Interchange
// ============================================================================

section('Routing — One Interchange');

// Indiranagar (Purple) → Jayanagar (Green) via Majestic
const r5 = findRoutes('indiranagar', 'jayanagar', metroGraph, TEST_INTERCHANGES);
assert(r5.length > 0, 'Indiranagar → Jayanagar: route found');
if (r5.length > 0) {
  const route = r5[0];
  assert(route.type === 'interchange', 'Indiranagar → Jayanagar: interchange route');
  assert(route.interchanges.length >= 1, 'Indiranagar → Jayanagar: at least 1 interchange');
  // Distance: Purple 20.87→28.67 = 7.8 km + Green 17.84→23.34 = 5.5 km + 0.8 km Majestic buffer = 14.1 km
  assertApprox(route.distanceKm, 14.1, 0.5, 'Indiranagar → Jayanagar: ~14.1 km (incl. 0.8 buffer)');
  assert(route.fare === 60, 'Indiranagar → Jayanagar: ₹60 (10-15 km slab)');
}

// Majestic → Yeshwanthpur (same physical interchange station, but green line transit)
const r6 = findRoutes('majestic', 'yeshwanthpur', metroGraph, TEST_INTERCHANGES);
assert(r6.length > 0, 'Majestic → Yeshwanthpur: route found');
if (r6.length > 0) {
  const route = r6[0];
  // Majestic(purple) → Majestic(green) → ... → Yeshwanthpur
  // Distance: Green 17.84→9.34 = 8.5 km
  // Note: The route goes purple→majestic→majestic-green→...→yeshwanthpur
  // Purple segment is just majestic (0 km), green segment is 8.5 km
  assertApprox(route.distanceKm, 8.5, 1.0, 'Majestic → Yeshwanthpur: ~8.5 km');
  assert(route.fare === 50, 'Majestic → Yeshwanthpur: ₹50 (8-10 km slab)');
}

// ============================================================================
// TEST 7: Routing — Two Interchanges
// ============================================================================

section('Routing — Two Interchanges');

// Indiranagar (Purple) → Electronic City (Yellow)
// Purple: Indiranagar→Majestic = 7.8 km
// Green:  Majestic→RV Road    = 6.5 km
// Yellow: RV Road→E-City      = 15.35 km
// Total: 29.65 km → ₹90
const r7 = findRoutes('indiranagar', 'electronic-city', metroGraph, TEST_INTERCHANGES);
assert(r7.length > 0, 'Indiranagar → Electronic City: route found');
if (r7.length > 0) {
  const route = r7[0];
  assert(route.type === 'interchange', 'Indiranagar → Electronic City: interchange route');
  assert(route.interchanges.length === 2, 'Indiranagar → Electronic City: 2 interchanges');
  // 7.8 + 6.5 + 15.35 + 0.8 (Majestic buffer) = 30.45 km
  assertApprox(route.distanceKm, 30.45, 0.5, 'Indiranagar → Electronic City: ~30.45 km (incl. 0.8 buffer)');
  assert(route.fare === 90, 'Indiranagar → Electronic City: ₹90');
}

// Whitefield → Bommasandra (Purple → Green → Yellow, longest cross-line)
const r8 = findRoutes('whitefield', 'bommasandra', metroGraph, TEST_INTERCHANGES);
assert(r8.length > 0, 'Whitefield → Bommasandra: route found');
if (r8.length > 0) {
  const route = r8[0];
  assert(route.interchanges.length === 2, 'Whitefield → Bommasandra: 2 interchanges');
  // Purple: 0→28.67=28.67 + Green: 17.84→24.34=6.5 + Yellow: 0→20.35=20.35 + 0.8 buffer = 56.32 km
  assertApprox(route.distanceKm, 56.32, 0.5, 'Whitefield → Bommasandra: ~56.32 km (incl. 0.8 buffer)');
  assert(route.fare === 90, 'Whitefield → Bommasandra: ₹90 (cap)');
}

// ============================================================================
// TEST 8: Edge Cases
// ============================================================================

section('Edge Cases');

// Same station
const rSame = findRoutes('indiranagar', 'indiranagar', metroGraph, TEST_INTERCHANGES);
assert(rSame.length > 0, 'Same station: returns result');
assert(rSame[0].type === 'same-station', 'Same station: type is same-station');
assert(rSame[0].fare === 0, 'Same station: fare = 0');

// Invalid station
const rInvalid = findRoutes('nonexistent', 'indiranagar', metroGraph, TEST_INTERCHANGES);
assert(rInvalid.length === 0, 'Invalid origin: returns empty');

const rInvalid2 = findRoutes('indiranagar', 'nonexistent', metroGraph, TEST_INTERCHANGES);
assert(rInvalid2.length === 0, 'Invalid destination: returns empty');

// Adjacent stations (minimum fare)
const rAdj = findRoutes('whitefield', 'hopefarm', metroGraph, TEST_INTERCHANGES);
assert(rAdj.length > 0, 'Adjacent stations: route found');
if (rAdj.length > 0) {
  assertApprox(rAdj[0].distanceKm, 1.39, 0.01, 'Whitefield → Hopefarm: 1.39 km');
  assert(rAdj[0].fare === 10, 'Whitefield → Hopefarm: ₹10 (minimum fare)');
}

// ============================================================================
// TEST 9: All fares are non-negative and within bounds
// ============================================================================

section('Validation — All Fares Valid');

const stationIds = TEST_STATIONS.map((s) => s.id);
let invalidFares = 0;
let negativeDist = 0;
let zeroFare = 0;
let maxFareSeen = 0;

// Test a sample of 50 random pairs
const samplePairs = [];
for (let i = 0; i < Math.min(50, stationIds.length); i++) {
  const j = (i * 7 + 13) % stationIds.length; // pseudo-random selection
  if (i !== j) samplePairs.push([stationIds[i], stationIds[j]]);
}

for (const [from, to] of samplePairs) {
  const routes = findRoutes(from, to, metroGraph, TEST_INTERCHANGES);
  if (routes.length > 0) {
    const route = routes[0];
    if (route.fare < 0) invalidFares++;
    if (route.distanceKm < 0) negativeDist++;
    if (route.fare === 0 && route.type !== 'same-station') zeroFare++;
    if (route.fare > maxFareSeen) maxFareSeen = route.fare;
  }
}

assert(invalidFares === 0, `No negative fares (found: ${invalidFares})`);
assert(negativeDist === 0, `No negative distances (found: ${negativeDist})`);
assert(zeroFare === 0, `No zero fares for non-same routes (found: ${zeroFare})`);
assert(maxFareSeen <= 90, `Max fare ≤ ₹90 cap (seen: ₹${maxFareSeen})`);

// ============================================================================
// Results
// ============================================================================

console.log('\n========================================');
console.log(`  RESULTS: ${passCount} passed, ${failCount} failed`);
console.log('========================================');

if (failures.length > 0) {
  console.log('\nFailed tests:');
  failures.forEach((f) => console.log(`  - ${f}`));
}

process.exit(failCount > 0 ? 1 : 0);
