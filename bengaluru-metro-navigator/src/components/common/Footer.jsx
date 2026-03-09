import { Link } from 'react-router-dom';
import { Train, Heart, ExternalLink, Phone, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-metro-purple to-metro-green flex items-center justify-center">
                <Train className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Namma Metro Navigator
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Your Bengaluru Metro Guide
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
              Plan your journey, explore attractions, and navigate Bengaluru with ease. 
              Discover the city's best spots connected by Namma Metro.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/" 
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-metro-purple transition-colors"
                >
                  Plan Journey
                </Link>
              </li>
              <li>
                <Link 
                  to="/attractions" 
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-metro-purple transition-colors"
                >
                  Explore Attractions
                </Link>
              </li>
              <li>
                <Link 
                  to="/map" 
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-metro-purple transition-colors"
                >
                  Metro Map
                </Link>
              </li>
              <li>
                <Link 
                  to="/stations" 
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-metro-purple transition-colors"
                >
                  Station Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* BMRCL Links */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              Official Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://english.bmrc.co.in" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-metro-purple transition-colors inline-flex items-center"
                >
                  BMRCL Official
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </li>
              <li>
                <a 
                  href="tel:080-22969555"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-metro-purple transition-colors inline-flex items-center"
                >
                  <Phone className="w-3 h-3 mr-1" />
                  080-22969555
                </a>
              </li>
              <li>
                <a 
                  href="mailto:prm@bmrc.co.in"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-metro-purple transition-colors inline-flex items-center"
                >
                  <Mail className="w-3 h-3 mr-1" />
                  prm@bmrc.co.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              © {currentYear} Namma Metro Navigator. Not affiliated with BMRCL.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center">
              Made with <Heart className="w-3 h-3 mx-1 text-red-500" /> for Bengaluru
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
