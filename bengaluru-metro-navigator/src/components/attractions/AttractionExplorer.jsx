import { useState, useEffect } from 'react';
import { Search, Filter, X, Grid, List } from 'lucide-react';
import { useAttractionSearch, useDebouncedSearch } from '../../hooks';
import AttractionCard from './AttractionCard';
import { InFeedAd } from '../common/AdUnit';

const categories = [
  { id: 'all', label: 'All', icon: '🎯' },
  { id: 'heritage', label: 'Heritage', icon: '🏛️' },
  { id: 'spiritual', label: 'Spiritual', icon: '🛕' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'nature', label: 'Nature', icon: '🌳' },
  { id: 'food', label: 'Food', icon: '🍽️' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎭' },
  { id: 'institutions', label: 'Institutions', icon: '🏢' }
];

export default function AttractionExplorer() {
  const [searchInput, setSearchInput] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const { debouncedValue, setValue } = useDebouncedSearch(300);
  
  const { 
    results, 
    category, 
    search, 
    filterByCategory, 
    isReady, 
    totalCount 
  } = useAttractionSearch();

  // Handle search input
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setValue(value);
  };

  // Update search when debounced value changes
  useEffect(() => {
    search(debouncedValue);
  }, [debouncedValue, search]);

  // Handle category change
  const handleCategoryChange = (catId) => {
    filterByCategory(catId);
    setShowFilters(false);
  };

  // Clear search
  const handleClear = () => {
    setSearchInput('');
    setValue('');
    search('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Explore Bengaluru
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Discover {totalCount}+ attractions connected by Namma Metro
        </p>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={handleSearch}
            placeholder="Search attractions, places, food..."
            className="input pl-10 pr-10"
            disabled={!isReady}
          />
          {searchInput && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Category Pills - Desktop */}
        <div className="hidden md:flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === cat.id
                  ? 'bg-metro-purple text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className="mr-1">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filter Button - Mobile */}
        <div className="flex md:hidden items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <Filter className="w-4 h-4" />
            Filter: {categories.find(c => c.id === category)?.label}
          </button>
          
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-metro-purple text-white' : 'text-gray-400'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-metro-purple text-white' : 'text-gray-400'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Filter Dropdown */}
        {showFilters && (
          <div className="md:hidden grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  category === cat.id
                    ? 'bg-metro-purple text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {results.length} attraction{results.length !== 1 ? 's' : ''}
        </p>
        <div className="hidden md:flex gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-metro-purple text-white' : 'text-gray-400'}`}
            aria-label="Grid view"
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-metro-purple text-white' : 'text-gray-400'}`}
            aria-label="List view"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Results Grid/List */}
      <div className={
        viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-4'
      }>
        {results.map((attraction, index) => (
          <>
            <AttractionCard 
              key={attraction.id} 
              attraction={attraction} 
              viewMode={viewMode}
            />
            {/* Insert ad every 6 items */}
            {(index + 1) % 6 === 0 && index < results.length - 1 && (
              <div key={`ad-${index}`} className={viewMode === 'grid' ? 'sm:col-span-2 lg:col-span-3' : ''}>
                <InFeedAd />
              </div>
            )}
          </>
        ))}
      </div>

      {/* No Results */}
      {results.length === 0 && isReady && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No attractions found. Try a different search or category.
          </p>
          <button
            onClick={() => {
              handleClear();
              filterByCategory('all');
            }}
            className="mt-4 text-metro-purple hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
