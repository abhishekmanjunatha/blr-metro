import { Link, useLocation } from 'react-router-dom';
import { Navigation, MapPin, Map, Train } from 'lucide-react';

const navItems = [
  { path: '/',            label: 'Journey',  icon: Navigation },
  { path: '/attractions', label: 'Explore',  icon: MapPin },
  { path: '/map',         label: 'Map',      icon: Map },
  { path: '/stations',    label: 'Stations', icon: Train },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-area-bottom"
      aria-label="Main navigation"
    >
      <div className="flex">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[11px] font-medium transition-colors active:scale-95 ${
                isActive
                  ? 'text-purple-700 dark:text-purple-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              {label}
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-purple-600 rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
