/**
 * Recalibrate stations.json chainage values to match BMRCL official track distances.
 *
 * Source of Truth:
 *   Purple Line (Origin: Whitefield): Majestic = 24.5 km, Challaghatta = 42.0 km
 *   Green Line  (Origin: Madavara):   Majestic = 15.5 km, RV Road = 22.6 km, Silk Institute = 30.3 km
 *   Yellow Line (Origin: RV Road):    BTM Layout = 3.3 km, Electronic City = 15.8 km, Bommasandra = 19.1 km
 */

const fs = require('fs');
const path = require('path');

const stationsPath = path.join(__dirname, '..', 'public', 'data', 'stations.json');
const data = JSON.parse(fs.readFileSync(stationsPath, 'utf-8'));

// ── Reference points (current chainage → new chainage) ──────────────────
const REF = {
  purple: [
    { id: 'whitefield',   oldCh: 0,     newCh: 0    },
    { id: 'majestic',     oldCh: 28.67, newCh: 24.5 },
    { id: 'challaghatta', oldCh: 45.92, newCh: 42.0 },
  ],
  green: [
    { id: 'madavara',       oldCh: 0,     newCh: 0    },
    { id: 'majestic-green', oldCh: 17.84, newCh: 15.5 },
    { id: 'rv-road',        oldCh: 24.34, newCh: 22.6 },
    { id: 'silk-institute', oldCh: 33.46, newCh: 30.3 },
  ],
  yellow: [
    { id: 'rv-road-yellow',                oldCh: 0,     newCh: 0    },
    { id: 'btm-layout',                    oldCh: 4.60,  newCh: 3.3  },
    { id: 'electronic-city',               oldCh: 15.35, newCh: 15.8 },
    { id: 'delta-electronics-bommasandra',  oldCh: 20.35, newCh: 19.1 },
  ],
};

function piecewiseRescale(oldChainage, refs) {
  // Find which segment this chainage falls into
  for (let i = 0; i < refs.length - 1; i++) {
    const lo = refs[i];
    const hi = refs[i + 1];
    if (oldChainage >= lo.oldCh - 0.001 && oldChainage <= hi.oldCh + 0.001) {
      const oldRange = hi.oldCh - lo.oldCh;
      if (oldRange === 0) return lo.newCh;
      const t = (oldChainage - lo.oldCh) / oldRange;
      const newRange = hi.newCh - lo.newCh;
      return Math.round((lo.newCh + t * newRange) * 100) / 100;
    }
  }
  // Beyond last segment – extrapolate from last segment
  const last = refs[refs.length - 1];
  const prev = refs[refs.length - 2];
  const scale = (last.newCh - prev.newCh) / (last.oldCh - prev.oldCh);
  return Math.round((last.newCh + (oldChainage - last.oldCh) * scale) * 100) / 100;
}

// ── Apply recalibration to every station ─────────────────────────────────
let updated = 0;
data.stations.forEach((station) => {
  const refs = REF[station.line];
  if (!refs) return; // skip pink/blue lines
  if (typeof station.chainage !== 'number') return;

  const oldCh = station.chainage;
  const newCh = piecewiseRescale(oldCh, refs);
  if (oldCh !== newCh) {
    console.log(`  ${station.line.padEnd(7)} ${station.id.padEnd(45)} ${oldCh.toFixed(2).padStart(6)} → ${newCh.toFixed(2).padStart(6)}`);
    station.chainage = newCh;
    updated++;
  }
});

// ── Update line-level length metadata ────────────────────────────────────
if (data.lines.purple) data.lines.purple.length = 42.0;
if (data.lines.green)  data.lines.green.length  = 30.3;
if (data.lines.yellow) data.lines.yellow.length = 19.1;

console.log(`\nRecalibrated ${updated} stations.`);

// ── Verify reference points ──────────────────────────────────────────────
console.log('\n── Verification ──');
for (const [line, refs] of Object.entries(REF)) {
  for (const ref of refs) {
    const station = data.stations.find((s) => s.id === ref.id);
    if (station) {
      const ok = station.chainage === ref.newCh ? '✓' : '✗';
      console.log(`  ${ok} ${station.id.padEnd(45)} chainage=${station.chainage} (expected ${ref.newCh})`);
    }
  }
}

fs.writeFileSync(stationsPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
console.log('\nstations.json updated successfully.');
