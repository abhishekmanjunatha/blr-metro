/**
 * Route Calculator for Namma Metro
 *
 * FARE MODEL:  Distance-based slab pricing (BMRCL Official, effective Feb 9 2025)
 *              Ceiling Rule: Math.ceil(distance) before slab lookup.
 *              Majestic interchange adds 0.8 km track-loop buffer.
 * ROUTING:     Dijkstra's shortest-distance algorithm
 * GRAPH:       Adjacency list with chainage-derived edge distances
 *
 * Official source: BMRCL Fare Fixation Committee Report 2025
 * Distance slabs determine fare based on total route distance in km.
 */

import {
  calculateFare as calculateStationFare,
  buildStationIndex,
  computeTrackDistance,
  lookupFare,
  FARE_SLABS,
  MAJESTIC_INTERCHANGE_BUFFER_KM,
  INTERCHANGE_MAP,
  // Stage 2
  PaymentType,
  PriceTier,
  getPriceTier,
  getMultiplier,
  calculateFinalPrice,
  checkMinimumBalance,
  isHoliday,
  registerHolidays,
  MIN_SMART_CARD_BALANCE,
  // Stage 3
  applyPenalties,
  getStationDetails,
  calculateJourneySummary,
  MINIMUM_FARE,
  SAME_STATION_OVERSTAY_PENALTY,
  SAME_STATION_GRACE_MINUTES,
  MAX_JOURNEY_DURATION_MINUTES,
  OVERSTAY_PENALTY_PER_HOUR,
  MAX_OVERSTAY_PENALTY,
  // Global
  IS_HIKE_ON_HOLD,
} from './fareEngine.js';

// Re-export fare engine for direct station-to-station calculation
export {
  calculateStationFare,
  buildStationIndex,
  computeTrackDistance,
  lookupFare,
  FARE_SLABS,
  MAJESTIC_INTERCHANGE_BUFFER_KM,
  INTERCHANGE_MAP,
  // Stage 2 re-exports
  PaymentType,
  PriceTier,
  getPriceTier,
  getMultiplier,
  calculateFinalPrice,
  checkMinimumBalance,
  isHoliday,
  registerHolidays,
  MIN_SMART_CARD_BALANCE,
  // Stage 3 re-exports
  applyPenalties,
  getStationDetails,
  calculateJourneySummary,
  MINIMUM_FARE,
  SAME_STATION_OVERSTAY_PENALTY,
  SAME_STATION_GRACE_MINUTES,
  MAX_JOURNEY_DURATION_MINUTES,
  OVERSTAY_PENALTY_PER_HOUR,
  MAX_OVERSTAY_PENALTY,
  // Global
  IS_HIKE_ON_HOLD,
};

// ============================================================================
// 1. DISTANCE CALCULATION
// ============================================================================

/**
 * Calculate distance between two stations on the SAME line using chainage.
 * Chainage values represent cumulative track distance (km) from the line origin.
 *
 * @param {Object} station1 - Station object with { line, chainage }
 * @param {Object} station2 - Station object with { line, chainage }
 * @returns {number|null} Distance in km, or null if not computable
 */
export function calculateDistanceFromChainage(station1, station2) {
  if (
    station1.line === station2.line &&
    typeof station1.chainage === 'number' &&
    typeof station2.chainage === 'number'
  ) {
    return Math.abs(station2.chainage - station1.chainage);
  }
  return null;
}

/**
 * Calculate total distance for a single-line route segment.
 *
 * @param {Array} stations - Ordered array of station objects on the same line
 * @returns {number} Distance in km
 */
export function calculateSegmentDistance(stations) {
  if (!stations || stations.length < 2) return 0;

  const first = stations[0];
  const last = stations[stations.length - 1];

  // Same line with chainage → direct difference (most accurate)
  if (
    first.line === last.line &&
    typeof first.chainage === 'number' &&
    typeof last.chainage === 'number'
  ) {
    return Math.abs(last.chainage - first.chainage);
  }

  // Fallback: sum consecutive-pair distances
  let total = 0;
  for (let i = 0; i < stations.length - 1; i++) {
    const d = calculateDistanceFromChainage(stations[i], stations[i + 1]);
    total += d !== null ? d : 1.2; // 1.2 km average inter-station fallback
  }
  return total;
}

/**
 * Calculate total distance for a multi-segment route.
 * Each segment is a single-line portion; distances are independent (different chainage bases).
 *
 * @param {Array} segments - Array of { stations: [...] } objects
 * @returns {number} Total distance in km
 */
export function calculateTotalRouteDistance(segments) {
  if (!segments || segments.length === 0) return 0;
  return segments.reduce((sum, seg) => sum + calculateSegmentDistance(seg.stations), 0);
}

// ============================================================================
// 2. FARE CALCULATION — DISTANCE-BASED (BMRCL Official Feb 9 2025)
// ============================================================================

/**
 * Calculate fare based on total route distance in kilometers.
 * Delegates slab lookup to fareEngine.lookupFare to avoid duplication.
 *
 * @param {number} distanceKm - Total route distance in km
 * @param {string} ticketType - "TOKEN" | "SMART_CARD"
 * @param {boolean} isOffPeak - Non-peak hours flag
 * @param {boolean} isSundayOrHoliday - Sunday / national-holiday flag
 * @returns {number} Fare in ₹
 */
export function calculateFare(
  distanceKm,
  ticketType = 'TOKEN',
  isOffPeak = false,
  isSundayOrHoliday = false
) {
  const d = distanceKm <= 0 ? 0 : Math.ceil(distanceKm);
  let baseFare = lookupFare(d);

  // Smart Card discounts (BMRCL FFC 2025)
  if (ticketType === 'SMART_CARD') {
    if (isSundayOrHoliday || isOffPeak) {
      baseFare = Math.round(baseFare * 0.9);
    } else {
      baseFare = Math.round(baseFare * 0.95);
    }
  }

  return baseFare;
}

/**
 * Calculate fare from route segments by computing total distance first.
 *
 * @param {Array} segments - Route segments with { stations: [...] }
 * @param {string} ticketType
 * @param {boolean} isOffPeak
 * @param {boolean} isSundayOrHoliday
 * @returns {number} Fare in ₹
 */
export function calculateFareFromRoute(
  segments,
  ticketType = 'TOKEN',
  isOffPeak = false,
  isSundayOrHoliday = false
) {
  const totalDistanceKm = calculateTotalRouteDistance(segments);
  return calculateFare(totalDistanceKm, ticketType, isOffPeak, isSundayOrHoliday);
}

// ============================================================================
// 3. GRAPH CONSTRUCTION
// ============================================================================

/**
 * Build a weighted graph of the metro network.
 *
 * - Nodes = station IDs
 * - Edges = track segments with distance (km) and time (min)
 * - Interchange edges connect line-specific station IDs (e.g. majestic ↔ majestic-green)
 *   with distance = 0 and configurable walking time.
 *
 * @param {Array} stations - All station objects
 * @param {Array} interchanges - Interchange definitions
 * @returns {{ graph, stationMap, lineStations }}
 */
export function buildMetroGraph(stations, interchanges = []) {
  const graph = {};
  const stationMap = {};

  // Station lookup
  stations.forEach((station) => {
    stationMap[station.id] = station;
    graph[station.id] = [];
  });

  // Group stations by line
  const lineStations = {};
  stations.forEach((station) => {
    if (!lineStations[station.line]) lineStations[station.line] = [];
    lineStations[station.line].push(station);
  });

  // Create edges between consecutive stations on each line (sorted by order)
  Object.keys(lineStations).forEach((line) => {
    const sorted = lineStations[line].sort((a, b) => a.order - b.order);
    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = sorted[i];
      const next = sorted[i + 1];

      // Distance from chainage; fallback to 1.2 km average
      const distance =
        typeof curr.chainage === 'number' && typeof next.chainage === 'number'
          ? Math.abs(next.chainage - curr.chainage)
          : 1.2;
      const time = 2.5; // avg travel time between adjacent stations (minutes)

      // Bidirectional edges
      graph[curr.id].push({ station: next.id, line, distance, time });
      graph[next.id].push({ station: curr.id, line, distance, time });
    }
  });

  // Helper: resolve line-specific station ID at an interchange
  const getIdForLine = (interchange, line) => {
    if (interchange.stationIds && interchange.stationIds[line]) {
      return interchange.stationIds[line];
    }
    return interchange.stationId;
  };

  // Create interchange connections
  interchanges.forEach((interchange) => {
    const { lines, walkingTime = 5 } = interchange;

    // Connect every pair of lines at this interchange
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const line1 = lines[i];
        const line2 = lines[j];
        const id1 = getIdForLine(interchange, line1);
        const id2 = getIdForLine(interchange, line2);

        if (!stationMap[id1] || !stationMap[id2]) continue;
        if (!graph[id1] || !graph[id2]) continue;

        // Bidirectional: distance 0 (same physical station), walking time only
        if (!graph[id1].find((e) => e.station === id2)) {
          graph[id1].push({
            station: id2,
            line: line2,
            distance: 0,
            time: walkingTime,
            isInterchange: true,
          });
        }
        if (!graph[id2].find((e) => e.station === id1)) {
          graph[id2].push({
            station: id1,
            line: line1,
            distance: 0,
            time: walkingTime,
            isInterchange: true,
          });
        }
      }
    }

    // Legacy fallback: stations with interchangeWith[] but no stationIds mapping
    if (!interchange.stationIds) {
      const mainId = interchange.stationId;
      if (!stationMap[mainId]) return;

      for (let i = 0; i < lines.length; i++) {
        for (let j = i + 1; j < lines.length; j++) {
          const otherLineStations = lineStations[lines[j]];
          if (!otherLineStations) continue;

          otherLineStations.forEach((s2) => {
            if (s2.interchangeWith && s2.interchangeWith.includes(lines[i])) {
              if (!graph[mainId].find((e) => e.station === s2.id && e.line === lines[j])) {
                graph[mainId].push({
                  station: s2.id,
                  line: lines[j],
                  distance: 0,
                  time: walkingTime,
                  isInterchange: true,
                });
              }
              if (!graph[s2.id].find((e) => e.station === mainId && e.line === lines[i])) {
                graph[s2.id].push({
                  station: mainId,
                  line: lines[i],
                  distance: 0,
                  time: walkingTime,
                  isInterchange: true,
                });
              }
            }
          });
        }
      }
    }
  });

  return { graph, stationMap, lineStations };
}

// ============================================================================
// 4. ROUTING — DIJKSTRA'S SHORTEST-DISTANCE ALGORITHM
// ============================================================================

/**
 * Find routes between two stations.
 *
 * Uses Dijkstra's algorithm to find the shortest-distance path.
 * Handles interchange stations that have multiple IDs (one per line).
 *
 * @param {string} startId - Origin station ID
 * @param {string} endId   - Destination station ID
 * @param {Object} metroGraph - From buildMetroGraph()
 * @param {Array}  interchangesData - Interchange definitions
 * @returns {Array} Array of route objects (currently returns best route)
 */
export function findRoutes(startId, endId, metroGraph, interchangesData) {
  const { stationMap } = metroGraph;

  if (!stationMap[startId] || !stationMap[endId]) return [];

  if (startId === endId) {
    return [
      {
        type: 'same-station',
        message: 'Origin and destination are the same station',
        totalTime: 0,
        stationsCount: 0,
        distanceKm: 0,
        fare: 0,
        segments: [],
      },
    ];
  }

  const endStation = stationMap[endId];

  // Gather all destination IDs (interchange stations share names across lines)
  const allDestinations = [endId];
  Object.values(stationMap).forEach((station) => {
    if (station.name === endStation.name && station.id !== endId) {
      allDestinations.push(station.id);
    }
  });

  // Run Dijkstra for each possible destination, pick the best route
  const allRoutes = [];
  for (const destId of allDestinations) {
    const route = dijkstraRoute(startId, destId, metroGraph, interchangesData);
    if (route) allRoutes.push(route);
  }

  if (allRoutes.length === 0) return [];

  // Sort: fewer interchanges preferred, then shorter distance
  allRoutes.sort((a, b) => {
    const ai = (a.interchanges || []).length;
    const bi = (b.interchanges || []).length;
    if (ai !== bi) return ai - bi;
    return a.distanceKm - b.distanceKm;
  });

  return [allRoutes[0]];
}

/**
 * Dijkstra's algorithm: find shortest-distance route between two station IDs.
 * Falls back to manual interchange routing if no path found in graph.
 *
 * @private
 */
function dijkstraRoute(startId, endId, metroGraph, interchangesData) {
  const { graph, stationMap, lineStations } = metroGraph;

  if (!graph[startId] || !graph[endId]) return null;

  const dist = {};
  const prev = {};
  const visited = new Set();

  // Initialize all distances to Infinity
  for (const id of Object.keys(graph)) {
    dist[id] = Infinity;
  }
  dist[startId] = 0;

  // Priority queue (sorted array — adequate for ~100 nodes)
  const pq = [{ id: startId, d: 0 }];

  while (pq.length > 0) {
    pq.sort((a, b) => a.d - b.d);
    const { id: currentId, d: currentDist } = pq.shift();

    if (visited.has(currentId)) continue;
    visited.add(currentId);

    if (currentId === endId) break;

    for (const edge of graph[currentId] || []) {
      if (visited.has(edge.station)) continue;

      const newDist = currentDist + edge.distance;
      if (newDist < dist[edge.station]) {
        dist[edge.station] = newDist;
        prev[edge.station] = currentId;
        pq.push({ id: edge.station, d: newDist });
      }
    }
  }

  // Destination unreachable via graph → try manual interchange routing
  if (dist[endId] === Infinity) {
    return findRouteViaInterchanges(startId, endId, stationMap, lineStations, interchangesData);
  }

  // Reconstruct path
  const path = [];
  let current = endId;
  while (current !== undefined) {
    path.unshift(current);
    current = prev[current];
  }

  if (path[0] !== startId) {
    return findRouteViaInterchanges(startId, endId, stationMap, lineStations, interchangesData);
  }

  return buildRouteFromStationPath(path, stationMap, interchangesData);
}

// ============================================================================
// 5. ROUTE BUILDING — path of IDs → structured route object
// ============================================================================

/**
 * Build a structured route object from a Dijkstra path.
 *
 * Groups consecutive stations into line-based segments, computes total distance
 * via chainage, and derives the fare from the distance slab.
 *
 * @private
 */
function buildRouteFromStationPath(path, stationMap, interchangesData) {
  if (!path || path.length < 2) return null;

  const stations = path.map((id) => stationMap[id]).filter(Boolean);
  if (stations.length < 2) return null;

  // Group into segments by line
  const segments = [];
  let currentSegment = { line: stations[0].line, stations: [stations[0]] };
  const interchangesMade = [];

  for (let i = 1; i < stations.length; i++) {
    const station = stations[i];
    const prevStation = stations[i - 1];

    if (station.line === currentSegment.line) {
      currentSegment.stations.push(station);
    } else {
      // Line change → close current segment, record interchange
      currentSegment.stationsCount = currentSegment.stations.length - 1;
      segments.push(currentSegment);

      const isSamePhysical = station.name === prevStation.name;
      interchangesMade.push({
        stationId: prevStation.id,
        stationName: prevStation.name,
        fromLine: currentSegment.line,
        toLine: station.line,
        walkingTime: isSamePhysical ? 3 : 5,
      });

      // Start new segment on the new line
      currentSegment = { line: station.line, stations: [station] };
    }
  }
  currentSegment.stationsCount = currentSegment.stations.length - 1;
  if (currentSegment.stations.length > 0) {
    segments.push(currentSegment);
  }

  // Total distance from chainage (each segment is independent)
  let totalDistanceKm = calculateTotalRouteDistance(segments);

  // Apply Majestic interchange buffer (0.8 km track-loop geometry)
  const hasMajesticTransfer = interchangesMade.some(
    (ic) => ic.stationId === 'majestic' || ic.stationId === 'majestic-green'
  );
  if (hasMajesticTransfer) {
    totalDistanceKm += MAJESTIC_INTERCHANGE_BUFFER_KM;
  }

  // Station count for display (exclude origin, exclude interchange duplicates)
  const stationsCount = stations.length - 1 - interchangesMade.length;

  // Travel time = track time + interchange walking time
  const interchangeTime = interchangesMade.reduce((s, ic) => s + ic.walkingTime, 0);
  const totalTime = stationsCount * 2.5 + interchangeTime;

  // Fare from total distance (official BMRCL method with ceiling rule)
  const fare = calculateFare(totalDistanceKm);

  return {
    type: interchangesMade.length > 0 ? 'interchange' : 'direct',
    stations,
    stationsCount,
    totalTime: Math.round(totalTime),
    distanceKm: Math.round(totalDistanceKm * 100) / 100,
    fare,
    interchanges: interchangesMade,
    segments,
  };
}

/**
 * Build a direct (single-line) route between two stations.
 * @private
 */
function buildDirectRoute(startId, endId, lineStationsArr, stationMap) {
  const sorted = [...lineStationsArr].sort((a, b) => a.order - b.order);
  const startIdx = sorted.findIndex((s) => s.id === startId);
  const endIdx = sorted.findIndex((s) => s.id === endId);

  if (startIdx === -1 || endIdx === -1) return null;

  const stations = [];
  if (startIdx <= endIdx) {
    for (let i = startIdx; i <= endIdx; i++) stations.push(sorted[i]);
  } else {
    for (let i = startIdx; i >= endIdx; i--) stations.push(sorted[i]);
  }

  const stationsCount = stations.length - 1;
  const segment = { line: stationMap[startId].line, stations, stationsCount };
  const distanceKm = calculateSegmentDistance(stations);
  const fare = calculateFare(distanceKm);

  return {
    type: 'direct',
    line: stationMap[startId].line,
    stations,
    stationsCount,
    totalTime: Math.round(stationsCount * 2.5),
    distanceKm: Math.round(distanceKm * 100) / 100,
    fare,
    interchanges: [],
    segments: [segment],
  };
}

// ============================================================================
// 6. INTERCHANGE FALLBACK ROUTING
// ============================================================================

/**
 * Find route via interchange stations when Dijkstra cannot reach destination.
 * Manually constructs route through known interchange points.
 *
 * @private
 */
function findRouteViaInterchanges(startId, endId, stationMap, lineStations, interchangesData) {
  const startStation = stationMap[startId];
  const endStation = stationMap[endId];
  if (!startStation || !endStation) return null;

  const startLine = startStation.line;
  const endLine = endStation.line;

  // Same line → direct route
  if (startLine === endLine) {
    return buildDirectRoute(startId, endId, lineStations[startLine], stationMap);
  }

  const getIdForLine = (interchange, line) => {
    if (interchange.stationIds && interchange.stationIds[line]) {
      return interchange.stationIds[line];
    }
    return interchange.stationId;
  };

  // --- Try ONE-HOP interchange (direct connection between lines) ---
  for (const interchange of interchangesData || []) {
    if (!interchange.lines.includes(startLine) || !interchange.lines.includes(endLine)) continue;

    const ic1 = getIdForLine(interchange, startLine);
    const ic2 = getIdForLine(interchange, endLine);
    const icStation = stationMap[ic1] || stationMap[ic2];
    if (!icStation) continue;

    const seg1 = getStationsBetween(startId, ic1, startLine, lineStations, stationMap);
    const seg2 = getStationsBetween(ic2, endId, endLine, lineStations, stationMap);
    if (!seg1 || !seg2) continue;

    const segments = [
      { line: startLine, stations: seg1, stationsCount: seg1.length - 1 },
      { line: endLine, stations: seg2, stationsCount: seg2.length - 1 },
    ];
    let totalDistanceKm = calculateTotalRouteDistance(segments);

    // Apply Majestic interchange buffer (0.8 km track-loop geometry)
    const isMajesticTransfer =
      ic1 === 'majestic' || ic1 === 'majestic-green' ||
      ic2 === 'majestic' || ic2 === 'majestic-green';
    if (isMajesticTransfer) {
      totalDistanceKm += MAJESTIC_INTERCHANGE_BUFFER_KM;
    }

    // Physical stations = seg1 + seg2 minus 1 (interchange counted once in combined array)
    const totalPhysicalStations = seg1.length + seg2.length - 1;
    const stationsCount = totalPhysicalStations - 1; // exclude origin
    const interchangeTime = interchange.walkingTime || 5;
    const totalTime = stationsCount * 2.5 + interchangeTime;

    return {
      type: 'interchange',
      stations: [...seg1, ...seg2.slice(1)],
      stationsCount,
      totalTime: Math.round(totalTime),
      distanceKm: Math.round(totalDistanceKm * 100) / 100,
      fare: calculateFare(totalDistanceKm),
      interchanges: [
        {
          stationId: ic1,
          stationName: icStation.name,
          fromLine: startLine,
          toLine: endLine,
          walkingTime: interchangeTime,
        },
      ],
      segments,
    };
  }

  // --- Try TWO-HOP interchange (through an intermediate line) ---
  for (const ic1 of interchangesData || []) {
    if (!ic1.lines.includes(startLine)) continue;

    for (const ic2 of interchangesData || []) {
      if (!ic2.lines.includes(endLine)) continue;

      const commonLine = ic1.lines.find((l) => l !== startLine && ic2.lines.includes(l));
      if (!commonLine) continue;

      const id1Start = getIdForLine(ic1, startLine);
      const id1Common = getIdForLine(ic1, commonLine);
      const id2Common = getIdForLine(ic2, commonLine);
      const id2End = getIdForLine(ic2, endLine);

      const station1 = stationMap[id1Start] || stationMap[id1Common];
      const station2 = stationMap[id2Common] || stationMap[id2End];
      if (!station1 || !station2) continue;

      const seg1 = getStationsBetween(startId, id1Start, startLine, lineStations, stationMap);
      const seg2 = getStationsBetween(id1Common, id2Common, commonLine, lineStations, stationMap);
      const seg3 = getStationsBetween(id2End, endId, endLine, lineStations, stationMap);
      if (!seg1 || !seg2 || !seg3) continue;

      const segments = [
        { line: startLine, stations: seg1, stationsCount: seg1.length - 1 },
        { line: commonLine, stations: seg2, stationsCount: seg2.length - 1 },
        { line: endLine, stations: seg3, stationsCount: seg3.length - 1 },
      ];
      let totalDistanceKm = calculateTotalRouteDistance(segments);

      // Apply Majestic interchange buffer if either hop passes through Majestic
      const ic1Ids = [getIdForLine(ic1, startLine), getIdForLine(ic1, commonLine)];
      const ic2Ids = [getIdForLine(ic2, commonLine), getIdForLine(ic2, endLine)];
      const majesticIds = ['majestic', 'majestic-green'];
      const touchesMajestic =
        ic1Ids.some((id) => majesticIds.includes(id)) ||
        ic2Ids.some((id) => majesticIds.includes(id));
      if (touchesMajestic) {
        totalDistanceKm += MAJESTIC_INTERCHANGE_BUFFER_KM;
      }

      const totalPhysicalStations = seg1.length + seg2.length + seg3.length - 2;
      const stationsCount = totalPhysicalStations - 1;
      const totalInterchangeTime = (ic1.walkingTime || 5) + (ic2.walkingTime || 5);
      const totalTime = stationsCount * 2.5 + totalInterchangeTime;

      return {
        type: 'interchange',
        stations: [...seg1, ...seg2.slice(1), ...seg3.slice(1)],
        stationsCount,
        totalTime: Math.round(totalTime),
        distanceKm: Math.round(totalDistanceKm * 100) / 100,
        fare: calculateFare(totalDistanceKm),
        interchanges: [
          {
            stationId: id1Start,
            stationName: station1.name,
            fromLine: startLine,
            toLine: commonLine,
            walkingTime: ic1.walkingTime || 5,
          },
          {
            stationId: id2Common,
            stationName: station2.name,
            fromLine: commonLine,
            toLine: endLine,
            walkingTime: ic2.walkingTime || 5,
          },
        ],
        segments,
      };
    }
  }

  return null;
}

/**
 * Get ordered array of stations between two points on the same line.
 * @private
 */
function getStationsBetween(startId, endId, line, lineStations, stationMap) {
  const stations = lineStations[line];
  if (!stations) return null;

  const sorted = [...stations].sort((a, b) => a.order - b.order);

  let startIdx = sorted.findIndex((s) => s.id === startId);
  let endIdx = sorted.findIndex((s) => s.id === endId);

  // If station not directly on this line, find interchange connection
  if (startIdx === -1) {
    for (let i = 0; i < sorted.length; i++) {
      if (
        sorted[i].interchangeWith &&
        stationMap[startId] &&
        sorted[i].interchangeWith.includes(stationMap[startId].line)
      ) {
        startIdx = i;
        break;
      }
    }
  }
  if (endIdx === -1) {
    for (let i = 0; i < sorted.length; i++) {
      if (
        sorted[i].interchangeWith &&
        stationMap[endId] &&
        sorted[i].interchangeWith.includes(stationMap[endId].line)
      ) {
        endIdx = i;
        break;
      }
    }
  }

  if (startIdx === -1 || endIdx === -1) return null;

  const result = [];
  if (startIdx <= endIdx) {
    for (let i = startIdx; i <= endIdx; i++) result.push(sorted[i]);
  } else {
    for (let i = startIdx; i >= endIdx; i--) result.push(sorted[i]);
  }
  return result;
}

// ============================================================================
// 7. DISPLAY UTILITIES
// ============================================================================

/** Get Tailwind background class for a metro line */
export function getLineColor(lineId) {
  const colors = {
    purple: 'bg-metro-purple',
    green: 'bg-metro-green',
    yellow: 'bg-metro-yellow',
    pink: 'bg-metro-pink',
    blue: 'bg-blue-500',
  };
  return colors[lineId] || 'bg-gray-500';
}

/** Get hex color for inline styles */
export function getLineHexColor(lineId) {
  const colors = {
    purple: '#8B008B',
    green: '#00A86B',
    yellow: '#FFD700',
    pink: '#FF69B4',
    blue: '#1E90FF',
  };
  return colors[lineId] || '#666666';
}

/** Get human-readable line name */
export function getLineName(lineId) {
  const names = {
    purple: 'Purple Line',
    green: 'Green Line',
    yellow: 'Yellow Line',
    pink: 'Pink Line',
    blue: 'Blue Line',
  };
  return names[lineId] || lineId;
}

/** Format minutes to human-readable duration */
export function formatDuration(minutes) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h} hr ${m} min` : `${h} hr`;
}

/** Get estimated arrival time from now + travel minutes */
export function getEstimatedArrival(minutes) {
  const now = new Date();
  now.setMinutes(now.getMinutes() + minutes);
  return now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}
