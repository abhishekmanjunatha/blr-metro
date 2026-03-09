import { Map as MapIcon, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useState } from 'react';

export default function MapPage() {
  const [zoom, setZoom] = useState(1);

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-4">
          <MapIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <h1 className="text-2xl font-bold">Metro Network Map</h1>
          <p className="text-sm text-gray-600 mt-1">Bengaluru Namma Metro Route Map</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <button 
              onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
              <span className="text-sm">Zoom Out</span>
            </button>
            <span className="text-sm font-medium px-4 py-2 bg-gray-50 rounded-lg">
              {Math.round(zoom * 100)}%
            </span>
            <button 
              onClick={() => setZoom(Math.min(2, zoom + 0.2))}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
              <span className="text-sm">Zoom In</span>
            </button>
            <button 
              onClick={() => setZoom(1)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors text-purple-700"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="text-sm">Reset</span>
            </button>
          </div>

          <div className="overflow-auto border border-gray-200 rounded-lg" style={{ maxHeight: '70vh' }}>
            <img 
              src="/metro-map.png" 
              alt="Bengaluru Namma Metro Network Map" 
              className="w-full h-auto transition-transform"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-100 via-green-100 to-yellow-100 rounded-lg p-6">
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600">37</div>
              <div className="text-sm text-gray-700">Purple Line Stations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">30</div>
              <div className="text-sm text-gray-700">Green Line Stations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">16</div>
              <div className="text-sm text-gray-700">Yellow Line Stations</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
