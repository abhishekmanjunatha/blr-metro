import { Link, useLocation } from 'react-router-dom';
import { MapPin, Navigation, Map, Train, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../hooks';

const navItems = [
  { path: '/',            label: 'Journey',  icon: Navigation },
  { path: '/attractions', label: 'Explore',  icon: MapPin },
  { path: '/map',         label: 'Map',      icon: Map },
  { path: '/stations',    label: 'Stations', icon: Train },
];

export default function Header() {
  const location = useLocation();
  const { theme, effectiveTheme, cycleTheme } = useTheme();

  const ThemeIcon = theme === 'system' ? Monitor : effectiveTheme === 'dark' ? Moon : Sun;

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group min-w-0">
            <img
              src={import.meta.env.BASE_URL + 'tinywow_Namma_Metro_Logo_87426246.svg'}
              alt="Namma Metro"
              className="w-9 h-9 md:w-10 md:h-10 object-contain flex-shrink-0 group-hover:scale-105 transition-transform"
            />
            <div>
              <h1 className="text-base md:text-lg font-bold text-gray-900 dark:text-white leading-tight">
                Namma Metro
              </h1>
              <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 -mt-0.5">
                Navigator
              </p>
            </div>
          </Link>

          {/* Desktop Navigation - hidden on mobile (BottomNav handles it) */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Theme toggle */}
          <button
            onClick={cycleTheme}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={`Theme: ${theme}. Tap to change`}
            title={`Theme: ${theme}`}
          >
            <ThemeIcon className="w-5 h-5" />
          </button>

        </div>
      </div>
    </header>
  );
}