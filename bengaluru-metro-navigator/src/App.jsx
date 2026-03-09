import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useEffect, useState, Suspense, lazy } from 'react';

// ===== Inline Loading Screen (no external dependencies) =====
function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin" />
      <h1 className="mt-5 text-2xl font-semibold text-purple-700">
        🚇 Namma Metro Navigator
      </h1>
      <p className="mt-2 text-gray-500">Loading your metro guide...</p>
    </div>
  );
}

// ===== Inline Header (no external dependencies) =====
function SimpleHeader() {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Journey' },
    { path: '/attractions', label: 'Explore' },
    { path: '/map', label: 'Map' },
    { path: '/stations', label: 'Stations' }
  ];
  
  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/tinywow_Namma_Metro_Logo_87426246.svg" 
            alt="Namma Metro" 
            className="w-10 h-10 object-contain"
          />
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-gray-900">Namma Metro</h1>
            <p className="text-xs text-gray-500 -mt-1">Navigator</p>
          </div>
        </Link>
        
        <nav className="flex items-center gap-1">
          {navItems.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === path
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

// ===== Inline Footer =====
function SimpleFooter() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-gray-400">© 2026 Namma Metro Navigator</p>
            <p className="text-sm text-gray-500 mt-1">Your complete guide to Bengaluru Metro</p>
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/analytics" className="text-gray-400 hover:text-white transition-colors">
              Analytics
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ===== Simple 404 Page =====
function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-5 text-center">
      <div className="text-7xl font-bold text-purple-200 mb-4">404</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
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
    // Small delay to ensure CSS is loaded
    const timer = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SimpleHeader />
      
      <main className="flex-1">
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
      
      <SimpleFooter />
    </div>
  );
}
