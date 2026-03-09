/**
 * Fare Engine Tests — Stage 2 (Modifiers, Time Windows, Holidays, Guardrail)
 *
 * Validates:
 *   - PaymentType / PriceTier enums
 *   - getPriceTier() time-window logic
 *   - isHoliday() against Karnataka 2026 holidays
 *   - calculateFinalPrice() multiplier application
 *   - checkMinimumBalance() guardrail
 *   - Full calculateFare() with Stage 2 options
 *   - Backward compatibility with Stage 1 API
 *
 * Run: node src/utils/__tests__/fareEngineStage2.test.js
 */

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildStationIndex,
  calculateFare,
  lookupFare,
  PaymentType,
  PriceTier,
  getPriceTier,
  getMultiplier,
  calculateFinalPrice,
  checkMinimumBalance,
  isHoliday,
  registerHolidays,
  MIN_SMART_CARD_BALANCE,
} from '../fareEngine.js';

// ── Load station data ────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const stationsPath = resolve(__dirname, '..', '..', '..', 'public', 'data', 'stations.json');
const rawData = JSON.parse(readFileSync(stationsPath, 'utf-8'));
const INDEX = buildStationIndex(rawData.stations);

// ── Test harness ─────────────────────────────────────────────────────────────

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

// Helper: create a Date for a specific IST time
// (adjusts so the IST components match regardless of local TZ)
function istDate(year, month, day, hour = 10, minute = 0) {
  // Build a UTC date that, when converted to IST (+5:30), gives the target time
  const utcMs = Date.UTC(year, month - 1, day, hour, minute, 0) - 330 * 60_000;
  return new Date(utcMs);
}

// ============================================================================
// 1. ENUMS
// ============================================================================
console.log('\n── Enums ──');

test('PaymentType has all 5 members', () => {
  assert.equal(PaymentType.TOKEN, 'TOKEN');
  assert.equal(PaymentType.QR, 'QR');
  assert.equal(PaymentType.SMART_CARD, 'SMART_CARD');
  assert.equal(PaymentType.NCMC, 'NCMC');
  assert.equal(PaymentType.GROUP, 'GROUP');
});

test('PriceTier has 3 members', () => {
  assert.equal(PriceTier.PEAK, 'PEAK');
  assert.equal(PriceTier.OFF_PEAK, 'OFF_PEAK');
  assert.equal(PriceTier.HOLIDAY, 'HOLIDAY');
});

test('PaymentType is frozen', () => {
  assert.throws(() => { PaymentType.NEW = 'x'; }, TypeError);
});

// ============================================================================
// 2. getPriceTier — Time-Window Logic
// ============================================================================
console.log('\n── getPriceTier ──');

// Monday, March 2 2026
test('Mon 06:00 IST → OFF_PEAK', () => {
  assert.equal(getPriceTier(istDate(2026, 3, 2, 6, 0)), PriceTier.OFF_PEAK);
});

test('Mon 08:00 IST → PEAK (start of window)', () => {
  assert.equal(getPriceTier(istDate(2026, 3, 2, 8, 0)), PriceTier.PEAK);
});

test('Mon 10:30 IST → PEAK', () => {
  assert.equal(getPriceTier(istDate(2026, 3, 2, 10, 30)), PriceTier.PEAK);
});

test('Mon 11:59 IST → PEAK', () => {
  assert.equal(getPriceTier(istDate(2026, 3, 2, 11, 59)), PriceTier.PEAK);
});

test('Mon 12:00 IST → OFF_PEAK (gap between windows)', () => {
  assert.equal(getPriceTier(istDate(2026, 3, 2, 12, 0)), PriceTier.OFF_PEAK);
});

test('Mon 14:00 IST → OFF_PEAK', () => {
  assert.equal(getPriceTier(istDate(2026, 3, 2, 14, 0)), PriceTier.OFF_PEAK);
});

test('Mon 16:00 IST → PEAK (evening window start)', () => {
  assert.equal(getPriceTier(istDate(2026, 3, 2, 16, 0)), PriceTier.PEAK);
});

test('Mon 19:00 IST → PEAK', () => {
  assert.equal(getPriceTier(istDate(2026, 3, 2, 19, 0)), PriceTier.PEAK);
});

test('Mon 20:59 IST → PEAK', () => {
  assert.equal(getPriceTier(istDate(2026, 3, 2, 20, 59)), PriceTier.PEAK);
});

test('Mon 21:00 IST → OFF_PEAK (window ends)', () => {
  assert.equal(getPriceTier(istDate(2026, 3, 2, 21, 0)), PriceTier.OFF_PEAK);
});

test('Mon 23:00 IST → OFF_PEAK', () => {
  assert.equal(getPriceTier(istDate(2026, 3, 2, 23, 0)), PriceTier.OFF_PEAK);
});

// Saturday — same rules as Mon-Fri
test('Sat 09:00 IST → PEAK', () => {
  // 2026-03-07 is Saturday
  assert.equal(getPriceTier(istDate(2026, 3, 7, 9, 0)), PriceTier.PEAK);
});

test('Sat 13:00 IST → OFF_PEAK', () => {
  assert.equal(getPriceTier(istDate(2026, 3, 7, 13, 0)), PriceTier.OFF_PEAK);
});

// Sunday — entire day is HOLIDAY
test('Sun 10:00 IST → HOLIDAY', () => {
  // 2026-03-01 is Sunday
  assert.equal(getPriceTier(istDate(2026, 3, 1, 10, 0)), PriceTier.HOLIDAY);
});

test('Sun 17:00 IST → HOLIDAY (even during normal peak)', () => {
  assert.equal(getPriceTier(istDate(2026, 3, 1, 17, 0)), PriceTier.HOLIDAY);
});

// ============================================================================
// 3. isHoliday — Karnataka Government Holidays 2026
// ============================================================================
console.log('\n── isHoliday ──');

test('Republic Day (Jan 26) → true', () => {
  assert.ok(isHoliday(istDate(2026, 1, 26)));
});

test('Independence Day (Aug 15) → true', () => {
  assert.ok(isHoliday(istDate(2026, 8, 15)));
});

test('Gandhi Jayanti (Oct 2) → true', () => {
  assert.ok(isHoliday(istDate(2026, 10, 2)));
});

test('Rajyotsava Day (Nov 1) → true', () => {
  assert.ok(isHoliday(istDate(2026, 11, 1)));
});

test('Ugadi (Mar 17) → true', () => {
  assert.ok(isHoliday(istDate(2026, 3, 17)));
});

test('Ambedkar Jayanti (Apr 14) → true', () => {
  assert.ok(isHoliday(istDate(2026, 4, 14)));
});

test('May Day (May 1) → true', () => {
  assert.ok(isHoliday(istDate(2026, 5, 1)));
});

test('Deepavali (Nov 20) → true', () => {
  assert.ok(isHoliday(istDate(2026, 11, 20)));
});

test('Random weekday (Mar 3) → false', () => {
  assert.ok(!isHoliday(istDate(2026, 3, 3)));
});

// Holiday overrides peak: getPriceTier on Republic Day at peak time → HOLIDAY
test('Republic Day at 10:00 (peak time) → HOLIDAY tier', () => {
  assert.equal(getPriceTier(istDate(2026, 1, 26, 10, 0)), PriceTier.HOLIDAY);
});

// registerHolidays — dynamic addition
test('registerHolidays adds custom date', () => {
  registerHolidays(['07-04']);
  assert.ok(isHoliday(istDate(2026, 7, 4)));
});

// ============================================================================
// 4. getMultiplier
// ============================================================================
console.log('\n── getMultiplier ──');

test('TOKEN + PEAK → 1.0', () => {
  assert.equal(getMultiplier(PaymentType.TOKEN, PriceTier.PEAK), 1.0);
});

test('TOKEN + HOLIDAY → 1.0', () => {
  assert.equal(getMultiplier(PaymentType.TOKEN, PriceTier.HOLIDAY), 1.0);
});

test('SMART_CARD + PEAK → 0.95', () => {
  assert.equal(getMultiplier(PaymentType.SMART_CARD, PriceTier.PEAK), 0.95);
});

test('SMART_CARD + OFF_PEAK → 0.90', () => {
  assert.equal(getMultiplier(PaymentType.SMART_CARD, PriceTier.OFF_PEAK), 0.90);
});

test('SMART_CARD + HOLIDAY → 0.90', () => {
  assert.equal(getMultiplier(PaymentType.SMART_CARD, PriceTier.HOLIDAY), 0.90);
});

test('NCMC + PEAK → 0.95', () => {
  assert.equal(getMultiplier(PaymentType.NCMC, PriceTier.PEAK), 0.95);
});

test('NCMC + OFF_PEAK → 0.90', () => {
  assert.equal(getMultiplier(PaymentType.NCMC, PriceTier.OFF_PEAK), 0.90);
});

test('GROUP + PEAK → 0.85', () => {
  assert.equal(getMultiplier(PaymentType.GROUP, PriceTier.PEAK), 0.85);
});

test('GROUP + OFF_PEAK → 0.85', () => {
  assert.equal(getMultiplier(PaymentType.GROUP, PriceTier.OFF_PEAK), 0.85);
});

test('GROUP + HOLIDAY → 0.85', () => {
  assert.equal(getMultiplier(PaymentType.GROUP, PriceTier.HOLIDAY), 0.85);
});

test('QR + any tier → 1.0', () => {
  assert.equal(getMultiplier(PaymentType.QR, PriceTier.PEAK), 1.0);
  assert.equal(getMultiplier(PaymentType.QR, PriceTier.OFF_PEAK), 1.0);
});

// ============================================================================
// 5. calculateFinalPrice
// ============================================================================
console.log('\n── calculateFinalPrice ──');

test('₹60 TOKEN PEAK → ₹60, savings 0', () => {
  const r = calculateFinalPrice(60, PriceTier.PEAK, PaymentType.TOKEN);
  assert.equal(r.discountedFare, 60);
  assert.equal(r.savings, 0);
  assert.equal(r.multiplier, 1.0);
});

test('₹60 SMART_CARD PEAK → ₹57, savings 3', () => {
  const r = calculateFinalPrice(60, PriceTier.PEAK, PaymentType.SMART_CARD);
  assert.equal(r.discountedFare, 57);
  assert.equal(r.savings, 3);
});

test('₹60 SMART_CARD OFF_PEAK → ₹54, savings 6', () => {
  const r = calculateFinalPrice(60, PriceTier.OFF_PEAK, PaymentType.SMART_CARD);
  assert.equal(r.discountedFare, 54);
  assert.equal(r.savings, 6);
});

test('₹60 SMART_CARD HOLIDAY → ₹54, savings 6', () => {
  const r = calculateFinalPrice(60, PriceTier.HOLIDAY, PaymentType.SMART_CARD);
  assert.equal(r.discountedFare, 54);
  assert.equal(r.savings, 6);
});

test('₹80 GROUP PEAK → ₹68, savings 12', () => {
  const r = calculateFinalPrice(80, PriceTier.PEAK, PaymentType.GROUP);
  assert.equal(r.discountedFare, 68);
  assert.equal(r.savings, 12);
});

test('₹90 NCMC OFF_PEAK → ₹81, savings 9', () => {
  const r = calculateFinalPrice(90, PriceTier.OFF_PEAK, PaymentType.NCMC);
  assert.equal(r.discountedFare, 81);
  assert.equal(r.savings, 9);
});

test('tierLabel present and correct', () => {
  assert.equal(calculateFinalPrice(10, PriceTier.PEAK, PaymentType.TOKEN).tierLabel, 'Peak Hours');
  assert.equal(calculateFinalPrice(10, PriceTier.OFF_PEAK, PaymentType.TOKEN).tierLabel, 'Off-Peak Hours');
  assert.equal(calculateFinalPrice(10, PriceTier.HOLIDAY, PaymentType.TOKEN).tierLabel, 'Sunday / Holiday');
});

// ============================================================================
// 6. checkMinimumBalance — Guardrail
// ============================================================================
console.log('\n── checkMinimumBalance ──');

test('Balance ₹100 → entry allowed', () => {
  const r = checkMinimumBalance(100);
  assert.equal(r.isEntryAllowed, true);
});

test('Balance ₹90 → entry allowed (exact threshold)', () => {
  const r = checkMinimumBalance(90);
  assert.equal(r.isEntryAllowed, true);
});

test('Balance ₹89 → entry denied', () => {
  const r = checkMinimumBalance(89);
  assert.equal(r.isEntryAllowed, false);
  assert.ok(r.message.includes('Min Balance'));
  assert.ok(r.message.includes('₹90'));
});

test('Balance ₹0 → entry denied', () => {
  assert.equal(checkMinimumBalance(0).isEntryAllowed, false);
});

test('Balance NaN → entry denied', () => {
  assert.equal(checkMinimumBalance(NaN).isEntryAllowed, false);
});

test('MIN_SMART_CARD_BALANCE is 90', () => {
  assert.equal(MIN_SMART_CARD_BALANCE, 90);
});

// ============================================================================
// 7. Full calculateFare — Stage 2 Options
// ============================================================================
console.log('\n── calculateFare (Stage 2 options) ──');

// Peak hour, Smart Card: Indiranagar → MG Road  (3km → ceil 3 → ₹20 base → ₹19 with 5%)
test('SMART_CARD peak: Indiranagar → MG Road = ₹19', () => {
  const r = calculateFare('indiranagar', 'mg-road', INDEX, {
    paymentType: PaymentType.SMART_CARD,
    timestamp: istDate(2026, 3, 3, 10, 0), // Tuesday 10 AM peak
  });
  assert.ok(r);
  assert.equal(r.baseTokenFare, 20);
  assert.equal(r.discountedFare, 19);
  assert.equal(r.savings, 1);
  assert.equal(r.priceTier, PriceTier.PEAK);
  assert.equal(r.paymentType, PaymentType.SMART_CARD);
  assert.equal(r.fare, 19); // backward-compat field
});

// Off-peak, Smart Card: same route → ₹18
test('SMART_CARD off-peak: Indiranagar → MG Road = ₹18', () => {
  const r = calculateFare('indiranagar', 'mg-road', INDEX, {
    paymentType: PaymentType.SMART_CARD,
    timestamp: istDate(2026, 3, 3, 14, 0), // Tuesday 2 PM off-peak
  });
  assert.ok(r);
  assert.equal(r.discountedFare, 18);
  assert.equal(r.savings, 2);
  assert.equal(r.priceTier, PriceTier.OFF_PEAK);
});

// Sunday (holiday tier), Smart Card → 10% off
test('SMART_CARD Sunday: Indiranagar → MG Road = ₹18', () => {
  const r = calculateFare('indiranagar', 'mg-road', INDEX, {
    paymentType: PaymentType.SMART_CARD,
    timestamp: istDate(2026, 3, 1, 10, 0), // Sunday
  });
  assert.ok(r);
  assert.equal(r.discountedFare, 18);
  assert.equal(r.priceTier, PriceTier.HOLIDAY);
  assert.equal(r.tierLabel, 'Sunday / Holiday');
});

// Karnataka Holiday peak time: Republic Day at 10 AM → HOLIDAY tier → 10% off
test('SMART_CARD Republic Day: ₹20 base → ₹18', () => {
  const r = calculateFare('indiranagar', 'mg-road', INDEX, {
    paymentType: PaymentType.SMART_CARD,
    timestamp: istDate(2026, 1, 26, 10, 0), // Mon Jan 26 10 AM — holiday overrides peak
  });
  assert.ok(r);
  assert.equal(r.priceTier, PriceTier.HOLIDAY);
  assert.equal(r.discountedFare, 18);
});

// TOKEN — no discount regardless of tier
test('TOKEN peak: Indiranagar → MG Road = ₹20 (no discount)', () => {
  const r = calculateFare('indiranagar', 'mg-road', INDEX, {
    paymentType: PaymentType.TOKEN,
    timestamp: istDate(2026, 3, 3, 10, 0),
  });
  assert.ok(r);
  assert.equal(r.baseTokenFare, 20);
  assert.equal(r.discountedFare, 20);
  assert.equal(r.savings, 0);
});

// QR — no discount
test('QR off-peak: base = discounted', () => {
  const r = calculateFare('indiranagar', 'mg-road', INDEX, {
    paymentType: PaymentType.QR,
    timestamp: istDate(2026, 3, 3, 14, 0),
  });
  assert.ok(r);
  assert.equal(r.discountedFare, r.baseTokenFare);
});

// GROUP — 15% off regardless of tier
test('GROUP peak: ₹20 base → ₹17', () => {
  const r = calculateFare('indiranagar', 'mg-road', INDEX, {
    paymentType: PaymentType.GROUP,
    timestamp: istDate(2026, 3, 3, 10, 0),
  });
  assert.ok(r);
  assert.equal(r.discountedFare, 17);
  assert.equal(r.savings, 3);
});

// NCMC — same rules as SMART_CARD
test('NCMC peak: same as SMART_CARD', () => {
  const r = calculateFare('indiranagar', 'mg-road', INDEX, {
    paymentType: PaymentType.NCMC,
    timestamp: istDate(2026, 3, 3, 10, 0),
  });
  assert.ok(r);
  assert.equal(r.discountedFare, 19);
});

// ── Minimum balance guardrail ────────────────────────────────────────────────

test('SMART_CARD cardBalance 100 → isEntryAllowed true', () => {
  const r = calculateFare('indiranagar', 'mg-road', INDEX, {
    paymentType: PaymentType.SMART_CARD,
    timestamp: istDate(2026, 3, 3, 10, 0),
    cardBalance: 100,
  });
  assert.ok(r);
  assert.equal(r.isEntryAllowed, true);
});

test('SMART_CARD cardBalance 50 → isEntryAllowed false', () => {
  const r = calculateFare('indiranagar', 'mg-road', INDEX, {
    paymentType: PaymentType.SMART_CARD,
    timestamp: istDate(2026, 3, 3, 10, 0),
    cardBalance: 50,
  });
  assert.ok(r);
  assert.equal(r.isEntryAllowed, false);
  assert.ok(r.entryRequirement.includes('₹90'));
});

test('TOKEN has no isEntryAllowed field', () => {
  const r = calculateFare('indiranagar', 'mg-road', INDEX, {
    paymentType: PaymentType.TOKEN,
    timestamp: istDate(2026, 3, 3, 10, 0),
  });
  assert.ok(r);
  assert.equal('isEntryAllowed' in r, false);
});

// ── entryRequirement string ──────────────────────────────────────────────────

test('entryRequirement for SMART_CARD mentions Min Balance ₹90', () => {
  const r = calculateFare('indiranagar', 'mg-road', INDEX, {
    paymentType: PaymentType.SMART_CARD,
    timestamp: istDate(2026, 3, 3, 10, 0),
  });
  assert.ok(r);
  assert.ok(r.entryRequirement.includes('₹90'));
});

test('entryRequirement for TOKEN mentions no balance requirement', () => {
  const r = calculateFare('indiranagar', 'mg-road', INDEX, {
    paymentType: PaymentType.TOKEN,
    timestamp: istDate(2026, 3, 3, 10, 0),
  });
  assert.ok(r);
  assert.ok(r.entryRequirement.toLowerCase().includes('no balance'));
});

// ============================================================================
// 8. Backward Compatibility — Stage 1 API
// ============================================================================
console.log('\n── Backward Compatibility ──');

test('Legacy Stage 1 call (no options) returns fare & baseTokenFare', () => {
  const r = calculateFare('indiranagar', 'mg-road', INDEX);
  assert.ok(r);
  assert.equal(r.baseTokenFare, 20);
  assert.equal(typeof r.fare, 'number');
  assert.equal(typeof r.rawDistanceKm, 'number');
  assert.equal(typeof r.ceilDistanceKm, 'number');
});

test('Legacy Stage 1 modifier still works', () => {
  const r = calculateFare('indiranagar', 'mg-road', INDEX, { multiplier: 0.50 });
  assert.ok(r);
  assert.equal(r.baseTokenFare, 10); // 20 * 0.5 = 10 via legacy modifier
});

// ── Longer route: Whitefield → Challaghatta (42km → ₹90 cap) ────────────────

test('Stage 2: Whitefield → Challaghatta GROUP → ₹77 (15% off ₹90)', () => {
  const r = calculateFare('whitefield', 'challaghatta', INDEX, {
    paymentType: PaymentType.GROUP,
    timestamp: istDate(2026, 3, 3, 10, 0),
  });
  assert.ok(r);
  assert.equal(r.baseTokenFare, 90);
  assert.equal(r.discountedFare, 77); // Math.round(90 * 0.85)
  assert.equal(r.savings, 13);
});

// ── Cross-line route with Stage 2 ───────────────────────────────────────────

test('Stage 2: Indiranagar → Jayanagar SMART_CARD off-peak', () => {
  const r = calculateFare('indiranagar', 'jayanagar', INDEX, {
    paymentType: PaymentType.SMART_CARD,
    timestamp: istDate(2026, 3, 3, 14, 0), // off-peak
  });
  assert.ok(r);
  assert.equal(r.baseTokenFare, 60); // ceil(13.48) = 14 → ₹60
  assert.equal(r.discountedFare, 54); // 60 * 0.90
  assert.equal(r.isInterchange, true);
  assert.equal(r.priceTier, PriceTier.OFF_PEAK);
});

// ============================================================================
// 9. Output Shape Verification
// ============================================================================
console.log('\n── Output Shape ──');

test('Result has all Stage 2 required fields', () => {
  const r = calculateFare('indiranagar', 'mg-road', INDEX, {
    paymentType: PaymentType.SMART_CARD,
    timestamp: istDate(2026, 3, 3, 10, 0),
    cardBalance: 200,
  });
  assert.ok(r);
  // Required Stage 2 output fields
  assert.equal(typeof r.baseTokenFare, 'number');
  assert.equal(typeof r.discountedFare, 'number');
  assert.equal(typeof r.savings, 'number');
  assert.equal(typeof r.entryRequirement, 'string');
  assert.equal(typeof r.paymentType, 'string');
  assert.equal(typeof r.priceTier, 'string');
  assert.equal(typeof r.tierLabel, 'string');
  assert.equal(typeof r.multiplier, 'number');
  assert.equal(typeof r.isEntryAllowed, 'boolean');
  // Stage 1 fields still present
  assert.equal(typeof r.fare, 'number');
  assert.equal(typeof r.rawDistanceKm, 'number');
  assert.equal(typeof r.ceilDistanceKm, 'number');
  assert.equal(typeof r.bufferKm, 'number');
  assert.ok(Array.isArray(r.interchanges));
  assert.equal(typeof r.isInterchange, 'boolean');
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log(`\n${'═'.repeat(60)}`);
console.log(`  ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${'═'.repeat(60)}\n`);

if (failed > 0) process.exit(1);
