import { useMetroData } from '../hooks';
import { JourneyPlanner } from '../components/journey';
import { LoadingPage } from '../components/common/LoadingSpinner';
import { ErrorPage } from '../components/common/ErrorMessage';
import { BannerAd } from '../components/common/AdUnit';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Map, 
  Info, 
  CreditCard, 
  Clock, 
  ArrowRightLeft, 
  Smartphone,
  TrendingUp
} from 'lucide-react';
import { memo } from 'react';

// Memoized Quick Action Card for better performance
const QuickActionCard = memo(({ icon: Icon, title, description, to, color }) => (
  <Link
    to={to}
    className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:scale-[1.02] active:scale-[0.98]"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500`} />
    <div className="relative">
      <div className={`inline-flex p-3 rounded-xl ${color} bg-opacity-10 mb-3`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5 text-base">
        {title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  </Link>
));

QuickActionCard.displayName = 'QuickActionCard';

// Memoized Info Tip for better performance
const InfoTip = memo(({ icon: Icon, title, description, color = "text-purple-600" }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
    <div className={`flex-shrink-0 p-2 rounded-lg bg-gradient-to-br ${color === 'text-purple-600' ? 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20' : color === 'text-green-600' ? 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20' : 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20'}`}>
      <Icon className={`w-5 h-5 ${color} dark:${color.replace('600', '400')}`} />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-0.5">
        {title}
      </h4>
      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  </div>
));

InfoTip.displayName = 'InfoTip';

export default function HomePage() {
  const { isLoading, error } = useMetroData();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return <ErrorPage 
      title="Failed to Load" 
      message={error} 
      onRetry={() => window.location.reload()} 
    />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Journey Planner Card - Primary Focus */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mb-8 border border-gray-100 dark:border-gray-700">
          <JourneyPlanner />
        </div>

        {/* Ad Section */}
        <div className="mb-8">
          <BannerAd />
        </div>

        {/* Quick Actions Grid */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            Quick Access
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              icon={MapPin}
              title="Explore Attractions"
              description="Discover places near metro stations"
              to="/attractions"
              color="bg-purple-600"
            />
            <QuickActionCard
              icon={Map}
              title="Metro Map"
              description="View complete network map"
              to="/map"
              color="bg-green-600"
            />
            <QuickActionCard
              icon={Info}
              title="All Stations"
              description="Browse station details & facilities"
              to="/stations"
              color="bg-blue-600"
            />
            <QuickActionCard
              icon={CreditCard}
              title="Fare Calculator"
              description="Check fares between stations"
              to="/"
              color="bg-orange-600"
            />
          </div>
        </section>

        {/* Info Tips Grid */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-5">
            Travel Smart
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tips Card 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <InfoTip
                icon={CreditCard}
                title="Save with Smart Card"
                description="Get 5% discount on all fares with Namma Metro Smart Card"
                color="text-purple-600"
              />
              <div className="h-px bg-gray-100 dark:bg-gray-700 my-3" />
              <InfoTip
                icon={Clock}
                title="Avoid Peak Hours"
                description="Trains are less crowded before 8 AM and after 8 PM"
                color="text-green-600"
              />
            </div>

            {/* Tips Card 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <InfoTip
                icon={ArrowRightLeft}
                title="Interchange at Majestic"
                description="Main hub connecting Purple and Green lines with easy transfers"
                color="text-blue-600"
              />
              <div className="h-px bg-gray-100 dark:bg-gray-700 my-3" />
              <InfoTip
                icon={Smartphone}
                title="Install as App"
                description="Add to home screen for offline access and faster loading"
                color="text-purple-600"
              />
            </div>
          </div>
        </section>

        {/* Operating Hours */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-green-50 dark:from-purple-900/20 dark:to-green-900/20 rounded-2xl p-6 border border-purple-100 dark:border-purple-800">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Operating Hours
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between items-center py-2 px-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">First Train</span>
              <span className="font-semibold text-gray-900 dark:text-white">5:00 AM</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">Last Train</span>
              <span className="font-semibold text-gray-900 dark:text-white">11:00 PM</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 text-center">
            Fare Range: ₹10 - ₹90 • Frequency: 3-5 minutes during peak hours
          </p>
        </div>
      </div>
    </div>
  );
}
