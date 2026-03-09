import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Clock, 
  Star, 
  Ticket, 
  Train,
  ArrowRight,
  Footprints 
} from 'lucide-react';

const categoryIcons = {
  heritage: '🏛️',
  spiritual: '🛕',
  shopping: '🛍️',
  nature: '🌳',
  food: '🍽️',
  entertainment: '🎭',
  institutions: '🏢'
};

const categoryColors = {
  heritage: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  spiritual: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  shopping: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  nature: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  food: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  entertainment: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  institutions: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
};

export default function AttractionCard({ attraction, viewMode = 'grid' }) {
  const categoryIcon = categoryIcons[attraction.category] || '📍';
  const categoryColor = categoryColors[attraction.category] || categoryColors.institutions;

  if (viewMode === 'list') {
    return (
      <Link 
        to={`/attractions/${attraction.id}`}
        className="card p-4 flex gap-4 hover:shadow-lg transition-shadow group"
      >
        {/* Icon */}
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 ${categoryColor}`}>
          {categoryIcon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-metro-purple transition-colors">
                {attraction.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {attraction.nameKannada}
              </p>
            </div>
            {attraction.rating && (
              <div className="flex items-center text-amber-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="ml-1 text-sm font-medium">{attraction.rating}</span>
              </div>
            )}
          </div>

          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {attraction.description}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Train className="w-4 h-4" />
              {attraction.nearestStationName || 'Metro connected'}
            </span>
            {attraction.walkingTime && (
              <span className="flex items-center gap-1">
                <Footprints className="w-4 h-4" />
                {attraction.walkingTime} min
              </span>
            )}
            {attraction.entryFee && (
              <span className="flex items-center gap-1">
                <Ticket className="w-4 h-4" />
                {attraction.entryFee}
              </span>
            )}
          </div>
        </div>

        <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 self-center group-hover:text-metro-purple transition-colors" />
      </Link>
    );
  }

  // Grid View
  return (
    <Link 
      to={`/attractions/${attraction.id}`}
      className="card overflow-hidden hover:shadow-lg transition-shadow group"
    >
      {/* Category Header */}
      <div className={`px-4 py-2 flex items-center justify-between ${categoryColor}`}>
        <span className="text-sm font-medium capitalize">{attraction.category}</span>
        <span className="text-lg">{categoryIcon}</span>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-metro-purple transition-colors">
            {attraction.name}
          </h3>
          {attraction.rating && (
            <div className="flex items-center text-amber-500 flex-shrink-0">
              <Star className="w-4 h-4 fill-current" />
              <span className="ml-1 text-sm font-medium">{attraction.rating}</span>
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {attraction.nameKannada}
        </p>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {attraction.description}
        </p>

        {/* Metro Info */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Train className="w-4 h-4 text-metro-purple" />
              <span className="text-gray-700 dark:text-gray-300 truncate">
                {attraction.nearestStationName || 'Metro connected'}
              </span>
            </div>
            {attraction.walkingTime && (
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Footprints className="w-4 h-4" />
                <span>{attraction.walkingTime}m</span>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        {attraction.tags && attraction.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {attraction.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
