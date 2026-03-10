import { useEffect } from 'react';
import { BarChart3, TrendingUp, Users, MapPin, Clock } from 'lucide-react';
import { getTrendingRoutes, getTrendingAttractions } from '../../utils/analytics';

/**
 * Analytics Dashboard Component
 * Displays trending routes, attractions, and usage statistics
 * This is for admin/owner view - can be protected with auth later
 */
export default function AnalyticsDashboard() {
  const trendingRoutes = getTrendingRoutes(10);
  const trendingAttractions = getTrendingAttractions(10);

  useEffect(() => {
    // Track dashboard view
    if (window.gtag) {
      window.gtag('event', 'dashboard_view', {
        event_category: 'Analytics',
        event_label: 'Dashboard Accessed'
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-metro-purple" />
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Track user behavior and trending searches
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Users}
            title="Daily Active Users"
            value="---"
            subtitle="Check GA4 for live data"
            color="purple"
          />
          <StatCard
            icon={TrendingUp}
            title="Route Searches"
            value={trendingRoutes.reduce((sum, r) => sum + r.count, 0)}
            subtitle="Total tracked searches"
            color="green"
          />
          <StatCard
            icon={MapPin}
            title="Attraction Views"
            value={trendingAttractions.reduce((sum, a) => sum + a.count, 0)}
            subtitle="Total tracked views"
            color="orange"
          />
          <StatCard
            icon={Clock}
            title="Avg. Session"
            value="---"
            subtitle="Check GA4 for live data"
            color="blue"
          />
        </div>

        {/* Trending Routes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <TrendingCard
            icon={TrendingUp}
            title="Top 10 Trending Routes"
            items={trendingRoutes}
            renderItem={(route) => (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-metro-purple rounded-full" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {route.origin} → {route.destination}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {route.count} searches
                </span>
              </div>
            )}
            emptyMessage="No route searches tracked yet"
          />

          {/* Trending Attractions */}
          <TrendingCard
            icon={MapPin}
            title="Top 10 Trending Attractions"
            items={trendingAttractions}
            renderItem={(attraction) => (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-metro-green rounded-full" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {attraction.name}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {attraction.count} views
                </span>
              </div>
            )}
            emptyMessage="No attraction views tracked yet"
          />
        </div>

        {/* Analytics Integration Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-metro-purple" />
            Real-Time Analytics
          </h2>
          <div className="space-y-4">
            <InfoRow
              label="Google Analytics 4"
              value="View detailed analytics in your GA4 dashboard"
              link="https://analytics.google.com"
            />
            <InfoRow
              label="Performance Metrics"
              value="Page load time, bounce rate, session duration"
              note="Available in GA4 Real-time and Reports sections"
            />
            <InfoRow
              label="Device Breakdown"
              value="Mobile vs Desktop vs Tablet traffic"
              note="Check GA4 > Reports > Tech > Tech Details"
            />
            <InfoRow
              label="Location Data"
              value="City-wise and region-wise traffic"
              note="Check GA4 > Reports > User > User Attributes > Demographics"
            />

          </div>
        </div>


      </div>
    </div>
  );
}

// Helper Components

function StatCard({ icon: Icon, title, value, subtitle, color }) {
  const colorClasses = {
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className={`inline-flex p-3 rounded-lg ${colorClasses[color]} mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </h3>
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
        {title}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-500">
        {subtitle}
      </p>
    </div>
  );
}

function TrendingCard({ icon: Icon, title, items, renderItem, emptyMessage }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Icon className="w-5 h-5 text-metro-purple" />
        {title}
      </h2>
      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div key={index}>{renderItem(item)}</div>
          ))
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            {emptyMessage}
          </p>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, note, link }) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-3 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            {label}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {value}
          </p>
          {note && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {note}
            </p>
          )}
        </div>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-metro-purple hover:underline whitespace-nowrap"
          >
            View →
          </a>
        )}
      </div>
    </div>
  );
}
