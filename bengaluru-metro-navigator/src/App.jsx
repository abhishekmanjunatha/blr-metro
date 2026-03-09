import { Routes, Route, Link } from 'react-router-dom';
import { useEffect, useState, Suspense, lazy } from 'react';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import BottomNav from './components/common/BottomNav';

// ===== Inline Loading Screen =====
function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin" />
      <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm font-medium">Loading</p>
    </div>
  );
}

// ===== Simple 404 Page =====
function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-5 text-center">
      <div className="text-7xl font-bold text-purple-200 dark:text-purple-900 mb-4">404</div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Page Not Found</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">The page you are looking for does not exist.</p>
      <Link to="/" className="px-6 py-3 bg-purple-700 text-white rounded-lg hover:bg-purple-800 transition-colors">
        Back to Home
      </Link>
    </div>
  );
}

// ===== Lazy load pages for better performance =====
const HomePage = lazy(() => import('./pages/HomePage'));
const AttractionsPage = lazy(() => import('./pages/AttractionsPage'));
const AttractionDetailsPage = lazy(() => import('./pages/AttractionDetailsPage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const StationsPage = lazy(() => import('./pages/StationsPage'));
const StationDetailsPage = lazy(() => import('./pages/StationDetailsPage'));
const AnalyticsDashboard = lazy(() => import('./components/analytics/AnalyticsDashboard'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));

// ===== Main App Component =====
export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) return <LoadingScreen />;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />

      {/* pb-16 on mobile reserves space above the bottom nav bar */}
      <main className="flex-1 pb-16 md:pb-0">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/attractions" element={<AttractionsPage />} />
            <Route path="/attractions/:id" element={<AttractionDetailsPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/stations" element={<StationsPage />} />
            <Route path="/stations/:id" element={<StationDetailsPage />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      {/* Footer only on desktop; BottomNav handles mobile navigation */}
      <div className="hidden md:block">
        <Footer />
      </div>

      <BottomNav />
    </div>
  );
}