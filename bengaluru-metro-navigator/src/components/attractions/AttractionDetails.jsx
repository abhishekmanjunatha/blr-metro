import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Star, 
  Ticket, 
  Train,
  Calendar,
  Navigation,
  Share2,
  ExternalLink,
  Footprints,
  Info
} from 'lucide-react';
import { useAttraction, useMetroData } from '../../hooks';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { BannerAd } from '../common/AdUnit';
import { trackAttractionView } from '../../utils/analytics';
import { useEffect } from 'react';

const categoryInfo = {
  heritage: { icon: '🏛️', color: 'amber', label: 'Heritage Site' },
  spiritual: { icon: '🛕', color: 'purple', label: 'Spiritual Place' },
  shopping: { icon: '🛍️', color: 'pink', label: 'Shopping Destination' },
  nature: { icon: '🌳', color: 'green', label: 'Nature & Parks' },
  food: { icon: '🍽️', color: 'orange', label: 'Food & Dining' },
  entertainment: { icon: '🎭', color: 'blue', label: 'Entertainment' },
  institutions: { icon: '🏢', color: 'gray', label: 'Institution' }
};

export default function AttractionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { attraction, nearestStation, alternateStations } = useAttraction(id);
  const { isLoading } = useMetroData();

  // Track view
  useEffect(() => {
    if (attraction) {
      trackAttractionView(attraction.id, attraction.category);
    }
  }, [attraction]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!attraction) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorMessage message="Attraction not found" />
        <Link to="/attractions" className="mt-4 inline-flex items-center text-metro-purple hover:underline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Attractions
        </Link>
      </div>
    );
  }

  const catInfo = categoryInfo[attraction.category] || categoryInfo.institutions;

  const handleShare = async () => {
    const shareData = {
      title: attraction.name,
      text: `${attraction.name} - ${attraction.description}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.url}`);
    }
  };

  const handlePlanJourney = () => {
    if (nearestStation) {
      navigate(`/?to=${nearestStation.id}`);
    }
  };

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
        {/* Category Header */}
        <div className={`bg-${catInfo.color}-100 dark:bg-${catInfo.color}-900/30 px-6 py-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{catInfo.icon}</span>
              <div>
                <span className={`text-sm font-medium text-${catInfo.color}-800 dark:text-${catInfo.color}-300`}>
                  {catInfo.label}
                </span>
                {attraction.rating && (
                  <div className="flex items-center text-amber-500 mt-1">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="ml-1 text-sm font-medium">{attraction.rating}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {attraction.name}
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400">
              {attraction.nameKannada}
            </p>
          </div>

          {/* Description */}
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {attraction.description}
          </p>

          {/* Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {attraction.timings && (
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <Clock className="w-5 h-5 text-metro-purple mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Timings</p>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {attraction.timings}
                </p>
              </div>
            )}
            
            {attraction.entryFee && (
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <Ticket className="w-5 h-5 text-metro-green mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Entry Fee</p>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {attraction.entryFee}
                </p>
              </div>
            )}
            
            {attraction.bestTime && (
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <Calendar className="w-5 h-5 text-metro-yellow mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Best Time</p>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {attraction.bestTime}
                </p>
              </div>
            )}
            
            {attraction.walkingTime && (
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <Footprints className="w-5 h-5 text-accent-orange mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">From Metro</p>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {attraction.walkingTime} min walk
                </p>
              </div>
            )}
          </div>

          {/* Metro Connection */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-metro-purple/10 px-4 py-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Train className="w-5 h-5 text-metro-purple" />
                Metro Connectivity
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Nearest Station */}
              {nearestStation && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Nearest Station</p>
                    <Link 
                      to={`/stations/${nearestStation.id}`}
                      className="font-medium text-gray-900 dark:text-white hover:text-metro-purple transition-colors"
                    >
                      {nearestStation.name}
                    </Link>
                    <span className={`ml-2 badge-${nearestStation.line}`}>
                      {nearestStation.line.charAt(0).toUpperCase() + nearestStation.line.slice(1)} Line
                    </span>
                  </div>
                  {attraction.distance && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Distance</p>
                      <p className="font-medium text-gray-900 dark:text-white">{attraction.distance}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Alternate Stations */}
              {alternateStations.length > 0 && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Also accessible from</p>
                  <div className="flex flex-wrap gap-2">
                    {alternateStations.map(station => (
                      <Link
                        key={station.id}
                        to={`/stations/${station.id}`}
                        className="px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-metro-purple hover:text-white transition-colors"
                      >
                        {station.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Plan Journey Button */}
              <button
                onClick={handlePlanJourney}
                className="w-full btn-primary"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Plan Journey to {nearestStation?.name || 'this place'}
              </button>
            </div>
          </div>

          {/* Tags */}
          {attraction.tags && attraction.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {attraction.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ad */}
      <BannerAd />

      {/* Tips */}
      <div className="card p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-metro-blue flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Travel Tips</h3>
            <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Check metro timings before planning your visit (5 AM - 11 PM)</li>
              <li>• Use a Metro Smart Card for 5% discount on fares</li>
              <li>• Peak hours: 8-10 AM and 5-8 PM on weekdays</li>
              {attraction.category === 'spiritual' && (
                <li>• Dress modestly when visiting spiritual places</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
