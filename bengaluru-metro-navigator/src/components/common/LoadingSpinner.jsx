import { Train } from 'lucide-react';

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizes[size]} animate-spin rounded-full border-2 border-gray-200 border-t-metro-purple`} />
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-metro-purple to-metro-green flex items-center justify-center animate-pulse">
          <Train className="w-10 h-10 text-white" />
        </div>
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-300 rounded-full overflow-hidden">
          <div className="h-full bg-metro-purple animate-loading-bar" />
        </div>
      </div>
      <p className="mt-6 text-gray-600 dark:text-gray-400 animate-pulse">
        Loading metro data...
      </p>
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`card p-4 animate-pulse ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonLine({ width = 'full', className = '' }) {
  const widths = {
    full: 'w-full',
    '3/4': 'w-3/4',
    '1/2': 'w-1/2',
    '1/4': 'w-1/4',
    '1/3': 'w-1/3',
    '2/3': 'w-2/3'
  };

  return (
    <div 
      className={`h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${widths[width]} ${className}`} 
    />
  );
}

// CSS for loading bar animation
const styles = `
@keyframes loading-bar {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

.animate-loading-bar {
  animation: loading-bar 1s ease-in-out infinite;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
