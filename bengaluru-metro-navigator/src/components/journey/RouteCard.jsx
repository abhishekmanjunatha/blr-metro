import { Link } from 'react-router-dom';
import { useMemo, memo, useState, useCallback } from 'react';
import {
  ArrowRight,
  MapPin,
  Train,
  ArrowLeftRight,
  ChevronDown,
  Circle,
  Clock,
  Footprints,
  Navigation,
  CheckCircle2,
} from 'lucide-react';
import {
  getLineColor,
  getLineName,
  getLineHexColor,
  formatDuration,
  MAJESTIC_INTERCHANGE_BUFFER_KM,
} from '../../utils/routeCalculator';

// ============================================================================
// Helpers
// ============================================================================

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
 * Build a linear timeline from route segments.
 *
 * Entry types: origin, intermediates, interchange, destination
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

    if (isFirst && s.length > 0) {
      entries.push({ type: 'origin', station: s[0], line: seg.line, serial: serial++ });
    }

    const mid = s.length > 2 ? s.slice(1, s.length - 1) : [];
    if (mid.length > 0) {
      const serialStart = serial;
      serial += mid.length;
      entries.push({ type: 'intermediates', stations: mid, line: seg.line, serialStart });
    }

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

/** Count total intermediate stations across all collapsed groups */
function countIntermediateStops(timeline) {
  return timeline
    .filter(e => e.type === 'intermediates')
    .reduce((sum, e) => sum + e.stations.length, 0);
}

/** Count interchanges */
function countInterchanges(timeline) {
  return timeline.filter(e => e.type === 'interchange').length;
}

/** Collect unique line IDs in order */
function getLineSequence(segments) {
  if (!segments?.length) return [];
  const seen = new Set();
  const lines = [];
  for (const seg of segments) {
    if (seg.line && !seen.has(seg.line)) {
      seen.add(seg.line);
      lines.push(seg.line);
    }
  }
  return lines;
}

// ============================================================================
// Journey Summary Bar
// ============================================================================

const JourneySummaryBar = memo(function JourneySummaryBar({ route, timeline }) {
  const stops = (route.totalStops || route.stationsCount || 0);
  const interchanges = countInterchanges(timeline);
  const lines = getLineSequence(route.segments);
  const duration = route.estimatedTime || route.totalTime || 0;

  return (
    <div className="route-summary-bar">
      <div className="route-summary-chips">
        <div className="route-chip">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatDuration(duration)}</span>
        </div>
        <div className="route-chip">
          <Train className="w-3.5 h-3.5" />
          <span>{stops} stops</span>
        </div>
        {interchanges > 0 && (
          <div className="route-chip route-chip-transfer">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>{interchanges} transfer{interchanges > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Line color pills */}
      <div className="route-line-sequence">
        {lines.map((line, i) => (
          <div key={line} className="flex items-center gap-1 sm:gap-1.5">
            {i > 0 && (
              <ArrowRight className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            )}
            <span
              className="route-line-pill"
              style={{ backgroundColor: getLineHexColor(line) }}
            >
              {getLineName(line)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ============================================================================
// Timeline Node — origin, interchange, destination
// ============================================================================

const TimelineNode = memo(function TimelineNode({ entry, showTrack }) {
  const isOrigin      = entry.type === 'origin';
  const isDestination = entry.type === 'destination';
  const isInterchange = entry.type === 'interchange';
  const activeLine    = isInterchange ? entry.toLine : entry.line;
  const trackColor    = getLineColor(activeLine);

  // Label for the node type
  const nodeLabel = isOrigin
    ? 'BOARD'
    : isDestination
      ? 'ALIGHT'
      : 'CHANGE';

  const labelColor = isOrigin
    ? 'route-label-board'
    : isDestination
      ? 'route-label-alight'
      : 'route-label-change';

  return (
    <div className="route-timeline-row" role="listitem">
      {/* ── Left: dot + track ── */}
      <div className="route-timeline-rail">
        {isInterchange ? (
          <div
            className="route-dot-interchange"
            style={{
              background: `linear-gradient(135deg, ${getLineHexColor(entry.fromLine)} 50%, ${getLineHexColor(entry.toLine)} 50%)`,
            }}
            aria-hidden="true"
          >
            <ArrowLeftRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white drop-shadow-sm" />
          </div>
        ) : isOrigin ? (
          <div
            className="route-dot-endpoint"
            style={{ backgroundColor: getLineHexColor(entry.line) }}
            aria-hidden="true"
          >
            <Navigation className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
          </div>
        ) : (
          <div
            className="route-dot-endpoint"
            style={{ backgroundColor: getLineHexColor(entry.line) }}
            aria-hidden="true"
          >
            <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
          </div>
        )}

        {showTrack && (
          <div className={`route-track ${trackColor}`} aria-hidden="true" />
        )}
      </div>

      {/* ── Right: content ── */}
      <div className={`route-timeline-content ${showTrack ? 'pb-1' : ''}`}>
        {/* Type label pill */}
        <span className={`route-label ${labelColor}`}>
          {nodeLabel}
        </span>

        {/* Station name + Kannada */}
        <Link
          to={`/stations/${entry.station?.id}`}
          className="route-station-name"
        >
          {entry.station?.name}
        </Link>
        {entry.station?.nameKannada && (
          <p className="route-station-kannada">{entry.station.nameKannada}</p>
        )}

        {/* Line badge — origin & destination only */}
        {!isInterchange && (
          <span className={`badge-${entry.line} mt-1 text-[11px] leading-none`}>
            {getLineName(entry.line)}
          </span>
        )}

        {/* Transfer details at interchange */}
        {isInterchange && entry.meta && (
          <div className="route-interchange-details" aria-label="Transfer details">
            <div className="route-interchange-banner">
              <Footprints className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold text-[13px] sm:text-sm leading-tight">
                  Change to {getLineName(entry.toLine)}
                </p>
                <p className="text-[11px] sm:text-xs opacity-80 mt-0.5 leading-snug">
                  {entry.meta.note} &bull; ~{entry.meta.walkingTime} min walk
                </p>
              </div>
            </div>
            {entry.meta.bufferKm > 0 && (
              <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 mt-1 ml-1">
                +{entry.meta.bufferKm} km added to fare distance
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// Collapsible Intermediate Stations
// ============================================================================

const IntermediateStops = memo(function IntermediateStops({ stations, line, serialStart }) {
  const [expanded, setExpanded] = useState(false);
  const trackColor = getLineColor(line);

  const toggle = useCallback(() => setExpanded(prev => !prev), []);

  return (
    <div className="route-timeline-row" role="listitem">
      {/* ── Left: continuous track ── */}
      <div className="route-timeline-rail">
        <div className={`route-track-full ${trackColor}`} aria-hidden="true" />
      </div>

      {/* ── Right: collapsible stops ── */}
      <div className="route-timeline-content py-0.5">
        <button
          onClick={toggle}
          className="route-stops-toggle touch-manipulation"
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${stations.length} intermediate stops`}
        >
          <div className="flex items-center gap-2">
            <div className="route-stops-dots" aria-hidden="true">
              <span style={{ backgroundColor: getLineHexColor(line) }} />
              <span style={{ backgroundColor: getLineHexColor(line) }} />
              <span style={{ backgroundColor: getLineHexColor(line) }} />
            </div>
            <span className="text-[13px] sm:text-sm font-medium text-gray-600 dark:text-gray-300">
              {stations.length} stop{stations.length !== 1 ? 's' : ''}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Expanded station list */}
        {expanded && (
          <ul className="route-stops-list animate-slide-down">
            {stations.map((st, j) => (
              <li key={st.id || j} className="route-stops-item">
                <span
                  className="route-stops-dot-sm"
                  style={{ backgroundColor: getLineHexColor(line) }}
                  aria-hidden="true"
                />
                <Link
                  to={`/stations/${st.id}`}
                  className="text-[13px] sm:text-sm text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors touch-manipulation"
                >
                  {st.name}
                </Link>
                {st.nameKannada && (
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-1 sm:ml-1.5 hidden sm:inline">
                    {st.nameKannada}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// Arrival Marker
// ============================================================================

const ArrivalMarker = memo(function ArrivalMarker() {
  return (
    <div className="route-timeline-row pt-1" role="listitem">
      <div className="route-timeline-rail">
        <div className="route-dot-arrival" aria-hidden="true">
          <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-white dark:text-gray-800" />
        </div>
      </div>
      <div className="route-timeline-content">
        <p className="text-[13px] sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
          You've arrived!
        </p>
      </div>
    </div>
  );
});

// ============================================================================
// Main RouteCard
// ============================================================================

export default function RouteCard({ route }) {
  if (!route?.segments) return null;

  const timeline = useMemo(
    () => buildTimeline(route.segments),
    [route.segments],
  );

  return (
    <div className="card route-card overflow-hidden">
      {/* ── Journey Summary ── */}
      <JourneySummaryBar route={route} timeline={timeline} />

      {/* ── Timeline ── */}
      <div className="route-timeline" role="list" aria-label="Journey timeline">
        {timeline.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            Same station entry / exit — no travel required.
          </p>
        )}

        {timeline.map((entry, i) => {
          const isLast = i === timeline.length - 1;

          if (entry.type === 'intermediates') {
            return (
              <IntermediateStops
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

        {timeline.length > 0 && <ArrivalMarker />}
      </div>
    </div>
  );
}
