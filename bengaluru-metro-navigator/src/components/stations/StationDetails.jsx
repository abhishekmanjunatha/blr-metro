import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Train, 
  MapPin, 
  Clock, 
  Wifi, 
  Car,
  RefreshCw,
  ChevronRight,
  Navigation,
  Accessibility,
  ShoppingBag,
  Coffee
} from 'lucide-react';
import { useStation, useMetroData } from '../../hooks';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { BannerAd } from '../common/AdUnit';
import { trackStationView } from '../../utils/analytics';
import { useEffect } from 'react';

const facilityIcons = {
  wifi: { icon: Wifi, label: 'Free WiFi' },
  parking: { icon: Car, label: 'Parking' },
  atm: { icon: ShoppingBag, label: 'ATM' },
  shops: { icon: ShoppingBag, label: 'Shops' },
  food: { icon: Coffee, label: 'Food Court' },
  accessibility: { icon: Accessibility, label: 'Wheelchair Access' },
  toilet: { icon: MapPin, label: 'Restrooms' }
};

export default function StationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { station, nearbyAttractions } = useStation(id);
  const { stations, lines, isLoading } = useMetroData();

  // Track view
  useEffect(() => {
    if (station) {
      trackStationView(station.id, station.line);
    }
  }, [station]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!station) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorMessage message="Station not found" />
        <Link to="/stations" className="mt-4 inline-flex items-center text-metro-purple hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Stations
        </Link>
      </div>
    );
  }

  const line = lines[station.line];
  const lineColor = {
    purple: 'from-metro-purple',
    green: 'from-metro-green',
    yellow: 'from-metro-yellow',
    pink: 'from-metro-pink'
  }[station.line] || 'from-gray-500';

  // Get adjacent stations
  const lineStations = stations
    .filter(s => s.line === station.line)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  
  const stationIndex = lineStations.findIndex(s => s.id === station.id);
  const prevStation = stationIndex > 0 ? lineStations[stationIndex - 1] : null;
  const nextStation = stationIndex < lineStations.length - 1 ? lineStations[stationIndex + 1] : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-metro-purple transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      {/* Main Card */}
      <div className="card overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${lineColor} to-gray-900 p-6 text-white`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Train className="w-6 h-6" />
                <span className="text-sm opacity-75">{station.code}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">{station.name}</h1>
              <p className="text-lg opacity-75">{station.nameKannada}</p>
            </div>
            <div className="text-right">
              <span className={`badge-${station.line}`}>
                {line?.name || station.line}
              </span>
              {station.structure && (
                <p className="mt-2 text-sm opacity-75">{station.structure}</p>
              )}
            </div>
          </div>
        </div>

        {/* Adjacent Stations */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {/* Previous */}
            <div className="flex-1">
              {prevStation ? (
                <Link 
                  to={`/stations/${prevStation.id}`}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-metro-purple transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm truncate">{prevStation.name}</span>
                </Link>
              ) : (
                <span className="text-sm text-gray-400">Terminus</span>
              )}
            </div>

            {/* Current (center) */}
            <div className="flex items-center gap-2 px-4">
              <div className={`w-4 h-4 rounded-full bg-metro-${station.line}`} />
              <span className="font-medium text-gray-900 dark:text-white hidden sm:inline">
                {station.name}
              </span>
              <div className={`w-4 h-4 rounded-full bg-metro-${station.line}`} />
            </div>

            {/* Next */}
            <div className="flex-1 text-right">
              {nextStation ? (
                <Link 
                  to={`/stations/${nextStation.id}`}
                  className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-metro-purple transition-colors"
                >
                  <span className="text-sm truncate">{nextStation.name}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <span className="text-sm text-gray-400">Terminus</span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Interchange Info */}
          {station.interchangeWith && station.interchangeWith.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300">
                <RefreshCw className="w-5 h-5" />
                <span className="font-semibold">Interchange Station</span>
              </div>
              <p className="mt-2 text-sm text-orange-700 dark:text-orange-400">
                Connect to: {station.interchangeWith.map(l => l.charAt(0).toUpperCase() + l.slice(1) + ' Line').join(', ')}
              </p>
            </div>
          )}

          {/* Facilities */}
          {station.facilities && station.facilities.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Facilities</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {station.facilities.map((facility, index) => {
                  const info = facilityIcons[facility] || { icon: MapPin, label: facility };
                  const Icon = info.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <Icon className="w-5 h-5 text-metro-purple" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{info.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Exits */}
          {station.exits && station.exits.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Exits</h3>
              <div className="space-y-2">
                {station.exits.map((exit, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="w-8 h-8 rounded-full bg-metro-purple text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {exit.number || index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{exit.name}</p>
                      {exit.landmarks && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{exit.landmarks}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plan Journey Button */}
          <Link
            to={`/?from=${station.id}`}
            className="w-full btn-primary flex items-center justify-center"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Plan Journey from {station.name}
          </Link>
        </div>
      </div>

      {/* Ad */}
      <BannerAd />

      {/* Nearby Attractions */}
      {nearbyAttractions.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-metro-purple" />
            Nearby Attractions
          </h3>
          <div className="grid gap-3">
            {nearbyAttractions.slice(0, 5).map(attraction => (
              <Link
                key={attraction.id}
                to={`/attractions/${attraction.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
              >
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-metro-purple transition-colors">
                    {attraction.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {attraction.category} • {attraction.walkingTime || '5'} min walk
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-metro-purple transition-colors" />
              </Link>
            ))}
          </div>
          {nearbyAttractions.length > 5 && (
            <Link
              to={`/attractions?station=${station.id}`}
              className="mt-4 inline-flex items-center text-metro-purple hover:underline"
            >
              View all {nearbyAttractions.length} attractions
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          )}
        </div>
      )}

      {/* Operating Hours */}
      <div className="card p-6">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-metro-green flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Operating Hours</h3>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Daily: 5:00 AM - 11:00 PM
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Train frequency: 3-5 minutes during peak, 8-10 minutes off-peak
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
