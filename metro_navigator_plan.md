# Bengaluru Metro Navigator - Complete Project Plan

## 🎯 Project Overview

**Project Name:** Bengaluru Metro Navigator (Namma Metro Guide)

**Purpose:** A lightning-fast, elegant web application to help users navigate Bengaluru Metro with route planning, platform information, interchange details, nearby attractions, and point-of-interest discovery.

**Key Philosophy:** Zero friction access - no login/signup, instant information, beautiful design.

---

## 🚀 Core Features & Enhancements

### Feature Set 1: Journey Planner
- **Input:** Current station → Destination station
- **Output:**
  - All possible routes (direct & with interchanges)
  - Platform numbers for boarding and alighting
  - Interchange stations with walking directions
  - Estimated journey time (ETA)
  - Fare information
  - First/Last train timings
  - Live train status (if API available)
  - Peak/off-peak travel suggestions
  - Accessibility information (elevators, escalators)

### Feature Set 2: Attraction Navigator
- **Input:** Tourist attraction or landmark name
- **Output:**
  - Nearest metro station(s)
  - Complete route from user's current location (optional)
  - Walking distance & directions from station
  - Alternative stations if applicable
  - Best entry/exit gates
  - Nearby attractions to club together

### Feature Set 3: Station Explorer
- **Station Details:**
  - Station facilities (parking, restrooms, ATM, food courts)
  - Entry/exit gates with Google Maps integration
  - Nearby landmarks within 500m, 1km, 2km radius
  - Bus connectivity information
  - Auto/cab stand locations
  - Popular destinations from this station

### Feature Set 4: Interactive Metro Map
- **Visual Route Map:**
  - Full network visualization with all lines (Purple, Green, future lines)
  - Zoom in/out functionality
  - Click on stations for quick info
  - Highlight selected route
  - Show interchange points prominently
  - Dark/Light mode toggle

### Feature Set 5: Smart Recommendations
- **Personalized Suggestions (No Login Required):**
  - "Popular routes today"
  - "Trending attractions this week"
  - "Less crowded travel times"
  - "Weekend getaway spots via metro"
  - "Food courts near metro stations"
  - "Quick 2-station hops for shopping"

### Feature Set 6: Travel Assistant
- **Additional Features:**
  - Metro card information & recharge locations
  - QR ticket booking guide
  - Travel tips for first-time users
  - Estimated crowd levels (peak hours indicator)
  - Safety guidelines
  - Lost & found contact information
  - Multi-language support (English, Kannada, Hindi)

---

## 🎨 UI/UX Design Strategy

### Design Principles
1. **Speed First:** Sub-second load time, instant search results
2. **Mobile-First:** 80% users will be on mobile
3. **Minimalist:** Clean, clutter-free interface
4. **Intuitive:** No learning curve, instant understanding
5. **Accessible:** High contrast, readable fonts, voice input ready

### Visual Design System

#### Color Palette
- **Primary:** Namma Metro Purple (#8B008B)
- **Secondary:** Namma Metro Green (#00A86B)
- **Accent:** Vibrant Orange (#FF6B35) for CTAs
- **Background:** Soft White (#F8F9FA) / Dark Mode (#1A1A1A)
- **Text:** Charcoal (#2D3748) / White (#FFFFFF)

#### Typography
- **Headings:** Poppins (Modern, Bold)
- **Body:** Inter (Highly Readable)
- **Metro Info:** Roboto Mono (Technical data)

#### Component Design
- **Cards:** Soft shadows, rounded corners (12px)
- **Buttons:** Prominent, high contrast, 44px minimum height
- **Input Fields:** Large, autocomplete-enabled, with icons
- **Icons:** Lucide icons for consistency

### Layout Structure

#### Homepage Layout
```
┌─────────────────────────────────────┐
│  Logo    Namma Metro Navigator  🌙  │ (Header)
├─────────────────────────────────────┤
│                                     │
│    🚇 Plan Your Journey             │ (Hero Section)
│    [Current Station ▼]              │
│    [Destination Station ▼]          │
│    [Find Route →]                   │
│                                     │
│    OR                               │
│                                     │
│    🎯 Explore Attractions           │
│    [Search attractions...]          │
│                                     │
├─────────────────────────────────────┤
│  Quick Access:                      │
│  [🗺️ Full Map] [⭐ Popular Routes]  │
│  [🎪 Top Attractions] [ℹ️ Metro Info]│
├─────────────────────────────────────┤
│  Today's Trending:                  │
│  • Cubbon Park (230 searches)       │
│  • Indiranagar → MG Road            │
│  • Lalbagh Botanical Garden         │
└─────────────────────────────────────┘
```

#### Route Results Layout
```
┌─────────────────────────────────────┐
│  ← Back    Kengeri → Baiyappanahalli│
├─────────────────────────────────────┤
│  🚄 Option 1: Direct (Fastest)      │
│  ────────────────────────────────   │
│  Purple Line • 45 min • ₹50         │
│                                     │
│  Kengeri (Platform 1)               │
│  ↓ 23 stations                      │
│  Baiyappanahalli (Platform 2)       │
│                                     │
│  [View Detailed Steps]              │
│                                     │
│  Nearby: Orion Mall, Mantri Square  │
├─────────────────────────────────────┤
│  🚄 Option 2: Via Interchange       │
│  ────────────────────────────────   │
│  Purple → Green • 52 min • ₹50      │
│  [View Details]                     │
└─────────────────────────────────────┘
```

#### Attraction Details Layout
```
┌─────────────────────────────────────┐
│  ← Back        Cubbon Park          │
├─────────────────────────────────────┤
│  [Image Carousel]                   │
│                                     │
│  📍 Nearest Station:                │
│  🚇 Vidhana Soudha (Green Line)     │
│     500m walk • 7 minutes           │
│                                     │
│  🗺️ [Get Directions]               │
│                                     │
│  ⏰ Open: 6:00 AM - 6:00 PM         │
│  💰 Entry: Free                     │
│                                     │
│  Nearby Attractions:                │
│  • Vidhana Soudha (200m)            │
│  • ISKCON Temple via Rajajinagar    │
│  • Lalbagh via Lalbagh Station      │
│                                     │
│  [Plan Journey to Here]             │
└─────────────────────────────────────┘
```

### Interaction Design

#### Micro-interactions
- **Loading States:** Smooth skeleton screens
- **Success:** Gentle bounce animation on route found
- **Autocomplete:** Real-time dropdown with highlights
- **Route Visualization:** Animated train moving along route
- **Favorites:** Heart icon fills with color animation

#### Responsive Breakpoints
- **Mobile:** < 768px (Stack vertically, full-width CTAs)
- **Tablet:** 768px - 1024px (2-column layout)
- **Desktop:** > 1024px (3-column with sidebar)

---

## 📊 Analytics Strategy (Privacy-First)

### Anonymous Analytics to Track

#### User Behavior Metrics
1. **Daily Active Users (DAU)**
   - Unique visitors per day
   - Peak usage hours
   - Weekend vs weekday traffic

2. **Route Search Analytics**
   - Most searched routes (Origin → Destination pairs)
   - Average searches per session
   - Direct vs interchange route preferences

3. **Attraction Analytics**
   - Top 10 searched attractions weekly/monthly
   - Seasonal trends (festivals, events)
   - Geographic clusters (which areas more popular)

4. **Feature Usage**
   - Journey Planner vs Attraction Navigator usage ratio
   - Interactive map engagement
   - Station Explorer clicks

5. **Performance Metrics**
   - Average page load time
   - Search response time
   - Bounce rate
   - Session duration

6. **Device & Location**
   - Mobile vs Desktop vs Tablet
   - Browser distribution
   - City-wise traffic (within India)

### Implementation (Privacy-Compliant)

**Tools:**
- **Google Analytics 4 (GA4):** For comprehensive analytics
- **Plausible/Fathom (Alternative):** Privacy-focused, GDPR-compliant
- **Custom Event Tracking:** For specific interactions

**Data Collection Method:**
```javascript
// Anonymous event tracking example
trackEvent({
  category: 'Route Search',
  action: 'Search Completed',
  label: 'Station_A to Station_B',
  value: timestamp,
  anonymousId: generateSessionId() // Session-based, not user-based
})
```

**Privacy Principles:**
- No personal data collection
- No cookies beyond session tracking
- No IP address storage
- Aggregated data only
- Clear privacy policy displayed

### Analytics Dashboard (Admin View)
- Real-time visitor count
- Top 10 routes today
- Top 10 attractions this week
- Traffic source breakdown
- Performance metrics
- Ad revenue tracking

---

## 💰 Monetization Strategy

### Google Ads Integration

#### Ad Placement Strategy
1. **Homepage:** 
   - One banner ad below search section
   - Native ad in "Trending" section

2. **Results Page:**
   - Small banner between route options
   - Sidebar ad (desktop only)

3. **Attraction Page:**
   - Native ad in "Nearby Attractions" section
   - Bottom banner ad

#### Best Practices
- **Maximum 3 ads per page**
- **Non-intrusive placement**
- **Clearly marked as "Advertisement"**
- **No pop-ups or interstitials**
- **Fast loading (async)**
- **Responsive ad units**

#### Implementation
```html
<!-- Google AdSense Auto Ads -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXX"
     crossorigin="anonymous"></script>

<!-- Responsive Display Ad -->
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXX"
     data-ad-slot="XXXXXXX"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
```

#### Revenue Optimization
- **Ad Positions:** A/B test different placements
- **Ad Types:** Mix display, native, and text ads
- **Target Relevant Ads:** Travel, tourism, local businesses
- **Monitor Performance:** Track CTR, viewability, revenue per 1000 impressions

---

## 🛠️ Technical Architecture

### Tech Stack Recommendation

#### Frontend Framework
**Recommended: React with Vite**
- **Why:** Fast development, component reusability, huge ecosystem
- **Alternative:** Next.js (for better SEO)
- **Alternative 2:** SvelteKit (lightest, fastest)

#### Styling
**Recommended: Tailwind CSS**
- **Why:** Rapid development, small bundle size, responsive utilities
- **Component Library:** shadcn/ui or DaisyUI

#### State Management
- **React Context API** (for simple state)
- **Zustand** (lightweight alternative to Redux)

#### Routing
- **React Router v6** (for SPA)
- **File-based routing** (if using Next.js)

#### Maps & Visualization
- **Google Maps JavaScript API** (for directions)
- **Leaflet.js** (open-source alternative)
- **D3.js or SVG** (for custom metro map)
- **React Flow** (for interactive route diagrams)

#### Backend/Database
**Option 1: Static Data Approach (Fastest)**
- **JSON files** with metro data
- **Hosted on CDN**
- **Client-side computation**
- **Best for:** Read-only data like metro routes

**Option 2: Firebase (Recommended)**
- **Firestore:** Store metro data, attractions
- **Firebase Analytics:** Built-in analytics
- **Firebase Hosting:** Fast CDN hosting
- **Cloud Functions:** For dynamic features

**Option 3: Supabase**
- **PostgreSQL database**
- **Real-time subscriptions**
- **Built-in authentication** (for future admin panel)

#### Search & Autocomplete
- **Fuse.js:** Lightweight fuzzy search
- **Algolia:** Premium solution with typo-tolerance
- **Custom Trie implementation:** For station names

#### Analytics
- **Google Analytics 4**
- **Google Tag Manager** (for ad tracking)
- **Custom dashboard:** Using Firebase or Supabase

#### Deployment
- **Vercel** (Best for React/Next.js)
- **Netlify** (Great for static sites)
- **Firebase Hosting** (If using Firebase)
- **GitHub Pages** (Free, basic hosting)

### Data Structure

#### Metro Network Data (JSON)
```json
{
  "lines": [
    {
      "id": "purple",
      "name": "Purple Line",
      "color": "#8B008B",
      "stations": [
        {
          "id": "kengeri",
          "name": "Kengeri",
          "nameKannada": "ಕೆಂಗೇರಿ",
          "platforms": 2,
          "facilities": ["parking", "restroom", "atm"],
          "coordinates": [12.9076, 77.4850],
          "interchangeWith": null,
          "nearbyAttractions": [
            {
              "name": "Wonderla",
              "distance": 8.5,
              "type": "amusement_park"
            }
          ]
        }
      ]
    }
  ],
  "interchanges": [
    {
      "stationId": "majestic",
      "lines": ["purple", "green"],
      "walkingTime": 5
    }
  ]
}
```

#### Attractions Data
```json
{
  "attractions": [
    {
      "id": "cubbon_park",
      "name": "Cubbon Park",
      "nameKannada": "ಕಬ್ಬನ್ ಪಾರ್ಕ್",
      "category": "park",
      "nearestStation": "vidhana_soudha",
      "distance": 500,
      "coordinates": [12.9716, 77.5946],
      "description": "300-acre park in heart of Bangalore",
      "timings": "6:00 AM - 6:00 PM",
      "entryFee": "Free",
      "images": ["url1", "url2"],
      "tags": ["nature", "family", "photography"]
    }
  ]
}
```

#### Route Calculation Algorithm
```javascript
// Dijkstra's algorithm for shortest path
function findRoutes(startStation, endStation, metroGraph) {
  // 1. Find all possible paths
  // 2. Calculate time for each path
  // 3. Consider interchange time
  // 4. Return sorted by time (fastest first)
  // 5. Include platform information
}
```

---

## 📁 Project Structure

```
bengaluru-metro-navigator/
│
├── public/
│   ├── data/
│   │   ├── metro-lines.json
│   │   ├── stations.json
│   │   ├── attractions.json
│   │   └── fares.json
│   ├── images/
│   │   ├── stations/
│   │   ├── attractions/
│   │   └── metro-map.svg
│   └── favicon.ico
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   └── AdUnit.jsx
│   │   ├── journey/
│   │   │   ├── JourneyPlanner.jsx
│   │   │   ├── RouteResults.jsx
│   │   │   ├── RouteCard.jsx
│   │   │   └── StationSelector.jsx
│   │   ├── attractions/
│   │   │   ├── AttractionExplorer.jsx
│   │   │   ├── AttractionCard.jsx
│   │   │   └── AttractionDetails.jsx
│   │   ├── map/
│   │   │   ├── InteractiveMap.jsx
│   │   │   ├── StationMarker.jsx
│   │   │   └── RouteOverlay.jsx
│   │   └── analytics/
│   │       └── EventTracker.jsx
│   │
│   ├── utils/
│   │   ├── routeCalculator.js
│   │   ├── searchAlgorithm.js
│   │   ├── dataLoader.js
│   │   └── analytics.js
│   │
│   ├── hooks/
│   │   ├── useMetroData.js
│   │   ├── useSearch.js
│   │   └── useAnalytics.js
│   │
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── JourneyPlanner.jsx
│   │   ├── AttractionNavigator.jsx
│   │   ├── MetroMap.jsx
│   │   └── StationDetails.jsx
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   └── tailwind.css
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── .env.example
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

---

## 🗓️ Development Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal: Basic infrastructure and data setup**

- [ ] Set up development environment (Vite + React + Tailwind)
- [ ] Create project structure
- [ ] Collect and structure Namma Metro data (stations, lines, timings)
- [ ] Design database schema
- [ ] Create static JSON data files
- [ ] Set up version control (Git/GitHub)
- [ ] Design initial UI mockups

**Deliverable:** Project skeleton with metro data ready

### Phase 2: Core Features (Week 3-4)
**Goal: Journey planner functionality**

- [ ] Build station autocomplete search
- [ ] Implement route calculation algorithm
- [ ] Create Journey Planner UI
- [ ] Display route results with platforms
- [ ] Add interchange information
- [ ] Calculate and display ETA
- [ ] Add fare calculator
- [ ] Mobile responsive design

**Deliverable:** Working journey planner

### Phase 3: Attraction Navigator (Week 5)
**Goal: Attraction-based search**

- [ ] Curate attraction database (100+ locations)
- [ ] Build attraction search functionality
- [ ] Create Attraction Explorer UI
- [ ] Integrate with journey planner
- [ ] Add attraction details page
- [ ] Include images and descriptions
- [ ] Show nearby attractions

**Deliverable:** Complete attraction navigation

### Phase 4: Interactive Map (Week 6)
**Goal: Visual metro network**

- [ ] Design custom metro map (SVG or canvas)
- [ ] Make map interactive (zoom, pan, click)
- [ ] Highlight selected routes
- [ ] Show station information on hover
- [ ] Add dark/light mode
- [ ] Mobile touch optimization

**Deliverable:** Fully interactive metro map

### Phase 5: Polish & Optimization (Week 7)
**Goal: Performance and UX refinement**

- [ ] Optimize load times (code splitting, lazy loading)
- [ ] Add loading states and animations
- [ ] Implement error handling
- [ ] Add offline support (PWA)
- [ ] Cross-browser testing
- [ ] Accessibility audit (WCAG compliance)
- [ ] SEO optimization

**Deliverable:** Production-ready application

### Phase 6: Analytics & Monetization (Week 8)
**Goal: Tracking and revenue**

- [ ] Set up Google Analytics 4
- [ ] Implement custom event tracking
- [ ] Create analytics dashboard
- [ ] Integrate Google AdSense
- [ ] Optimize ad placements
- [ ] A/B test different layouts
- [ ] Add privacy policy page

**Deliverable:** Monetized app with analytics

### Phase 7: Launch & Marketing (Week 9)
**Goal: Public release**

- [ ] Deploy to production (Vercel/Netlify)
- [ ] Set up custom domain
- [ ] Create social media presence
- [ ] Submit to Google Search Console
- [ ] List on relevant directories
- [ ] Share on Reddit, local forums
- [ ] Create demo video

**Deliverable:** Live application with users

### Phase 8: Post-Launch (Week 10+)
**Goal: Iterate and improve**

- [ ] Monitor analytics and user behavior
- [ ] Gather user feedback
- [ ] Fix bugs and issues
- [ ] Add multilingual support
- [ ] Integrate live train tracking (if API available)
- [ ] Add community features (ratings, reviews)
- [ ] Expand attraction database

---

## 📝 Step-by-Step Implementation Guide

### For GitHub Copilot & Claude

This section provides detailed implementation steps for each major component.

---

### 1. Project Initialization

```bash
# Create new Vite + React project
npm create vite@latest bengaluru-metro-navigator -- --template react

# Navigate to project
cd bengaluru-metro-navigator

# Install dependencies
npm install

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install additional libraries
npm install react-router-dom zustand lucide-react fuse.js

# Install shadcn/ui (optional but recommended)
npx shadcn-ui@latest init

# Start development server
npm run dev
```

**Configure Tailwind (tailwind.config.js):**
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'metro-purple': '#8B008B',
        'metro-green': '#00A86B',
        'accent-orange': '#FF6B35',
      }
    },
  },
  plugins: [],
}
```

---

### 2. Data Collection & Structuring

**Create: `public/data/stations.json`**

Collect all Namma Metro stations with this structure:
```json
{
  "purple_line": [
    {
      "id": "challaghatta",
      "code": "CH",
      "name": "Challaghatta",
      "nameKannada": "ಚಲ್ಲಘಟ್ಟ",
      "platforms": 2,
      "coordinates": [12.8987, 77.4765],
      "facilities": ["parking", "elevator", "restroom"],
      "exits": ["East", "West"],
      "interchangeWith": null
    }
    // ... more stations
  ],
  "green_line": [...]
}
```

**Create: `public/data/attractions.json`**
```json
{
  "attractions": [
    {
      "id": "wonderla",
      "name": "Wonderla Amusement Park",
      "nameKannada": "ವಂಡರ್ಲಾ",
      "category": "amusement_park",
      "nearestStations": [
        {
          "stationId": "kengeri",
          "stationName": "Kengeri",
          "distance": 8.5,
          "transportMode": "cab",
          "estimatedTime": 20
        }
      ],
      "coordinates": [12.8350, 77.3937],
      "description": "Premier amusement and water park",
      "timings": "11:00 AM - 6:00 PM",
      "entryFee": "₹1,199 (Weekdays), ₹1,399 (Weekends)",
      "images": ["wonderla1.jpg"],
      "tags": ["family", "adventure", "water_park"],
      "rating": 4.5,
      "website": "https://www.wonderla.com"
    }
    // Add 100+ attractions
  ]
}
```

---

### 3. Route Calculation Logic

**Create: `src/utils/routeCalculator.js`**

```javascript
/**
 * Find all possible routes between two stations
 * @param {string} startStationId - Origin station ID
 * @param {string} endStationId - Destination station ID
 * @param {object} metroData - Complete metro network data
 * @returns {Array} Array of route options sorted by time
 */
export function findRoutes(startStationId, endStationId, metroData) {
  const routes = [];
  
  // Check if both stations on same line (direct route)
  const directRoute = findDirectRoute(startStationId, endStationId, metroData);
  if (directRoute) {
    routes.push(directRoute);
  }
  
  // Find routes with one interchange
  const interchangeRoutes = findInterchangeRoutes(startStationId, endStationId, metroData);
  routes.push(...interchangeRoutes);
  
  // Sort by total time
  routes.sort((a, b) => a.totalTime - b.totalTime);
  
  return routes;
}

function findDirectRoute(start, end, data) {
  // Implementation: Check if both stations exist on same line
  // Calculate number of stations between them
  // Estimate time (2.5 min per station average)
  // Return route object
}

function findInterchangeRoutes(start, end, data) {
  // Implementation: Find common interchange stations
  // Calculate routes via each interchange
  // Add interchange walking time (5 min average)
  // Return array of route objects
}

/**
 * Calculate fare based on distance
 * @param {number} numberOfStations - Stations between origin and destination
 * @returns {number} Fare amount in rupees
 */
export function calculateFare(numberOfStations) {
  // Namma Metro fare structure (as of 2024)
  if (numberOfStations <= 2) return 10;
  if (numberOfStations <= 5) return 15;
  if (numberOfStations <= 8) return 20;
  if (numberOfStations <= 12) return 25;
  if (numberOfStations <= 16) return 30;
  if (numberOfStations <= 20) return 40;
  return 50; // Maximum fare
}
```

---

### 4. Search & Autocomplete

**Create: `src/utils/searchAlgorithm.js`**

```javascript
import Fuse from 'fuse.js';

/**
 * Initialize fuzzy search for stations
 */
export function createStationSearch(stations) {
  const options = {
    keys: ['name', 'nameKannada', 'code'],
    threshold: 0.3, // Adjust for fuzzy matching sensitivity
    includeScore: true,
  };
  
  return new Fuse(stations, options);
}

/**
 * Search stations with autocomplete
 */
export function searchStations(query, fuse) {
  if (!query || query.length < 2) return [];
  
  const results = fuse.search(query);
  return results.map(result => result.item).slice(0, 5); // Top 5 results
}

/**
 * Initialize fuzzy search for attractions
 */
export function createAttractionSearch(attractions) {
  const options = {
    keys: ['name', 'nameKannada', 'category', 'tags'],
    threshold: 0.4,
    includeScore: true,
  };
  
  return new Fuse(attractions, options);
}
```

---

### 5. Core Components

**Create: `src/components/journey/JourneyPlanner.jsx`**

```javascript
import { useState } from 'react';
import { Search } from 'lucide-react';
import StationSelector from './StationSelector';
import RouteResults from './RouteResults';
import { findRoutes } from '../../utils/routeCalculator';

export default function JourneyPlanner({ metroData }) {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = () => {
    if (!origin || !destination) return;
    
    setIsLoading(true);
    
    // Simulate API delay (remove in production)
    setTimeout(() => {
      const foundRoutes = findRoutes(origin.id, destination.id, metroData);
      setRoutes(foundRoutes);
      setIsLoading(false);
      
      // Track analytics
      trackEvent('route_search', {
        origin: origin.name,
        destination: destination.name,
      });
    }, 300);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-metro-purple mb-8">
        Plan Your Journey
      </h1>
      
      <div className="space-y-4">
        <StationSelector
          label="From"
          placeholder="Select origin station"
          value={origin}
          onChange={setOrigin}
          stations={metroData.allStations}
        />
        
        <StationSelector
          label="To"
          placeholder="Select destination station"
          value={destination}
          onChange={setDestination}
          stations={metroData.allStations}
        />
        
        <button
          onClick={handleSearch}
          disabled={!origin || !destination || isLoading}
          className="w-full bg-metro-purple text-white py-3 rounded-lg 
                     flex items-center justify-center gap-2 
                     hover:bg-opacity-90 disabled:opacity-50 
                     transition-all duration-200"
        >
          <Search size={20} />
          {isLoading ? 'Searching...' : 'Find Routes'}
        </button>
      </div>
      
      {routes.length > 0 && (
        <RouteResults 
          routes={routes} 
          origin={origin} 
          destination={destination} 
        />
      )}
    </div>
  );
}
```

**Create: `src/components/journey/StationSelector.jsx`**

```javascript
import { useState, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { searchStations, createStationSearch } from '../../utils/searchAlgorithm';

export default function StationSelector({ label, placeholder, value, onChange, stations }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [fuse, setFuse] = useState(null);

  useEffect(() => {
    if (stations) {
      setFuse(createStation