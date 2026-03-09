import { useEffect, useRef } from 'react';

/**
 * AdSense Ad Unit Component
 * Replace with actual ad unit codes when available
 */
export function AdUnit({ 
  slot = 'XXXXXXXX', 
  format = 'auto', 
  responsive = true,
  className = '' 
}) {
  const adRef = useRef(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    // Skip if already loaded or if ads are disabled
    if (isLoaded.current || !window.adsbygoogle) return;
    
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      isLoaded.current = true;
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  // Don't render in development
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center ${className}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ad Placeholder ({format})
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXX"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}

/**
 * Banner Ad - Horizontal ad at top/bottom of page
 */
export function BannerAd({ className = '' }) {
  return (
    <AdUnit 
      slot="BANNER_SLOT" 
      format="horizontal" 
      className={`w-full max-h-24 ${className}`} 
    />
  );
}

/**
 * In-Feed Ad - Native ad in lists
 */
export function InFeedAd({ className = '' }) {
  return (
    <AdUnit 
      slot="INFEED_SLOT" 
      format="fluid" 
      className={className} 
    />
  );
}

/**
 * Square Ad - Sidebar or content area
 */
export function SquareAd({ className = '' }) {
  return (
    <AdUnit 
      slot="SQUARE_SLOT" 
      format="rectangle" 
      responsive={false}
      className={`max-w-sm mx-auto ${className}`} 
    />
  );
}

export default AdUnit;
