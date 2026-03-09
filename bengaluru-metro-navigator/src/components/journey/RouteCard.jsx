import { Link } from 'react-router-dom';
import { useMemo, memo } from 'react';
import { ArrowRight, MapPin, Train } from 'lucide-react';
import {
  getLineColor,
  getLineName,
  getLineHexColor,
  MAJESTIC_INTERCHANGE_BUFFER_KM,
} from '../../utils/routeCalculator';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Derive contextual transfer metadata from the interchange station name.
 * Returns walking time, fare buffer, and a human-readable description.
 */
function getInterchangeMeta(stationName, fromLine, toLine) {
  const n = (stationName || '').toLowerCase();

  if (n.includes('majestic') || n.includes('kempegowda')) {
    return {
      walkingTime: 5,
      bufferKm: MAJESTIC_INTERCHANGE_BUFFER_KM,
      note: 'Underground interchange',
    };
  }

  if (n.includes('rv road') || n.includes('rashtreeya vidyalaya')) {
    const from = fromLine === 'yellow' ? 'Level 3' : 'Level 2';
    const to   = toLine   === 'yellow' ? 'Level 3' : 'Level 2';
    return { walkingTime: 3, bufferKm: 0, note: `${from} → ${to} transfer` };
  }

  return { walkingTime: 4, bufferKm: 0, note: 'Station interchange' };
}

/**
 * Flatten route segments into a linear sequence of timeline entries.
 *
 * Entry types:
 *   origin         – first station of the journey
 *   intermediates  – collapsed list of pass-through stations
 *   interchange    – line-change node with transfer metadata
 *   destination    – final station of the journey
 */
function buildTimeline(segments) {
  if (!segments?.length) return [];
  const entries = [];
  let serial = 1;

  segments.forEach((seg, i) => {
    const isFirst = i === 0;
    const isLast  = i === segments.length - 1;
    const next    = segments[i + 1];
    const s       = seg.stations || [];

    // Origin — first station of the first segment
    if (isFirst && s.length > 0) {
      entries.push({ type: 'origin', station: s[0], line: seg.line, serial: serial++ });
    }

    // Intermediates — everything between the anchored first & last station
    const mid = s.length > 2 ? s.slice(1, s.length - 1) : [];
    if (mid.length > 0) {
      const serialStart = serial;
      serial += mid.length;
      entries.push({ type: 'intermediates', stations: mid, line: seg.line, serialStart });
    }

    // Interchange — junction between this segment and the next
    if (!isLast && next?.stations?.length) {
      const station = next.stations[0];
      entries.push({
        type: 'interchange',
        station,
        fromLine: seg.line,
        toLine: next.line,
        meta: getInterchangeMeta(station?.name, seg.line, next.line),
        serial: serial++,
      });
    }

    // Destination — last station of the last segment
    if (isLast && s.length > 1) {
      entries.push({
        type: 'destination',
        station: s[s.length - 1],
        line: seg.line,
        serial: serial++,
      });
    }
  });

  return entries;
}

// ============================================================================
// Timeline sub-components
// ============================================================================

/**
 * Renders a single station node row: dot ▸ content, with an optional
 * track line extending downward to the next row.
 *
 * Handles three roles: origin, interchange and destination.
 * At interchange nodes the dot uses a bicolor gradient and transfer
 * details are rendered inline below the station name.
 */
const TimelineNode = memo(function TimelineNode({ entry, showTrack }) {
  const isInterchange = entry.type === 'interchange';
  const activeLine    = isInterchange ? entry.toLine : entry.line;
  const trackColor    = getLineColor(activeLine);

  // ── Dot styling ──
  const dotSize  = isInterchange ? 'w-5 h-5' : 'w-3.5 h-3.5';
  const dotBg    = isInterchange ? '' : getLineColor(entry.line);
  const dotRing  = isInterchange
    ? 'ring-2 ring-white dark:ring-gray-800 shadow-md'
    : 'ring-[3px] ring-white dark:ring-gray-800';
  const dotStyle = isInterchange
    ? {
        background: `linear-gradient(
          135deg,
          ${getLineHexColor(entry.fromLine)} 50%,
          ${getLineHexColor(entry.toLine)} 50%
        )`,
      }
    : undefined;

  return (
    <div className="flex gap-3" role="listitem">
      {/* ── Left column: dot + track ── */}
      <div className="flex flex-col items-center w-5 flex-shrink-0">
        <div
          className={`${dotSize} rounded-full ${dotBg} ${dotRing} flex-shrink-0 z-[1]`}
          style={dotStyle}
          aria-hidden="true"
        />
        {showTrack && (
          <div className={`w-0.5 flex-1 ${trackColor}`} aria-hidden="true" />
        )}
      </div>

      {/* ── Right column: content ── */}
      <div className={`flex-1 min-w-0 ${showTrack ? 'pb-4' : ''}`}>
        {/* Station name + line badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold flex items-center justify-center mt-0.5">
              {entry.serial}
            </span>
            <div className="min-w-0">
              <Link
                to={`/stations/${entry.station?.id}`}
                className="font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors break-words"
              >
                {entry.station?.name}
              </Link>
              {entry.station?.nameKannada && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {entry.station.nameKannada}
                </p>
              )}
            </div>
          </div>

          {/* Line badge — origin & destination only */}
          {!isInterchange && (
            <span className={`badge-${entry.line} flex-shrink-0 text-xs`}>
              {getLineName(entry.line)}
            </span>
          )}
        </div>

        {/* ── Interchange: inline transfer details ── */}
        {isInterchange && entry.meta && (
          <div className="mt-1.5 space-y-0.5" aria-label="Transfer details">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: getLineHexColor(entry.toLine) }}
                aria-hidden="true"
              />
              Change to {getLineName(entry.toLine)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 pl-3.5">
              {entry.meta.note} • ~{entry.meta.walkingTime} min walk
            </p>
            {entry.meta.bufferKm > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 pl-3.5">
                +{entry.meta.bufferKm} km added to fare distance
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Renders the collapsible intermediate-stations section.
 * The track line runs continuously through the left column.
 */
const TimelineTrack = memo(function TimelineTrack({ stations, line, serialStart }) {
  const trackColor = getLineColor(line);

  return (
    <div className="flex gap-3" role="listitem">
      {/* ── Left column: continuous track ── */}
      <div className="flex flex-col items-center w-5 flex-shrink-0">
        <div className={`w-0.5 flex-1 ${trackColor}`} aria-hidden="true" />
      </div>

      {/* ── Right column: content ── */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Train className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {stations.length} intermediate station
              {stations.length !== 1 && 's'}
            </span>
          </p>
          <details className="mt-1">
            <summary className="text-xs text-purple-600 dark:text-purple-400 cursor-pointer hover:underline select-none">
              View all stops
            </summary>
            <ul className="mt-1.5 space-y-1 pl-0.5">
              {stations.map((st, j) => (
                <li
                  key={st.id || j}
                  className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2"
                >
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] font-bold flex items-center justify-center">
                    {serialStart + j}
                  </span>
                  <span>
                    {st.name}
                    {st.nameKannada && (
                      <span className="text-gray-400 dark:text-gray-500 ml-1.5 text-xs">
                        {st.nameKannada}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// Main component
// ============================================================================

export default function RouteCard({ route }) {
  if (!route?.segments) return null;

  // Flatten segments into a linear timeline — memoised for perf
  const timeline = useMemo(
    () => buildTimeline(route.segments),
    [route.segments],
  );

  return (
    <div className="card overflow-hidden">
      {/* ── Route Header ── */}
      <div className="bg-gradient-to-r from-metro-purple to-metro-purple/80 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium truncate">{route.originName}</span>
          </div>
          <ArrowRight className="w-5 h-5 flex-shrink-0 mx-2" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-medium truncate">{route.destinationName}</span>
            <MapPin className="w-5 h-5 flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* ── Unified Timeline ── */}
      <div className="p-4" role="list" aria-label="Journey timeline">
        {/* Same-station fallback */}
        {timeline.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
            Same station entry / exit — no travel required.
          </p>
        )}

        {timeline.map((entry, i) => {
          const isLast = i === timeline.length - 1;

          if (entry.type === 'intermediates') {
            return (
              <TimelineTrack
                key={`track-${i}`}
                stations={entry.stations}
                line={entry.line}
                serialStart={entry.serialStart}
              />
            );
          }

          return (
            <TimelineNode
              key={`node-${i}`}
              entry={entry}
              showTrack={!isLast}
            />
          );
        })}

        {/* ── Arrival marker ── */}
        {timeline.length > 0 && (
          <div className="flex gap-3 pt-2" role="listitem">
            <div className="flex flex-col items-center w-5 flex-shrink-0">
              <div className="w-3.5 h-3.5 rounded-full bg-gray-900 dark:bg-white ring-[3px] ring-gray-200 dark:ring-gray-700" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              You've arrived!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
