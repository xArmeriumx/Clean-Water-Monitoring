# Clean Water Monitoring - Frontend

React-based web application for monitoring water quality in real-time. Features an interactive map, sensor data visualization, and role-based access for different user types.

## Live Demo

**Production URL:** [https://cleanwatermonitoring.com](https://cleanwatermonitoring.com)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [User Roles](#user-roles)
- [Pages](#pages)
- [Components](#components)
- [Deployment](#deployment)
- [License](#license)

---

## Features

### Core Features
- **Real-time Dashboard** - Live sensor data with auto-refresh
- **Interactive Map** - Leaflet-based location mapping
- **Water Quality Charts** - Historical data visualization
- **Multi-language** - Thai localization support

### User Features
- **LINE LIFF Integration** - Login via LINE account
- **Issue Reporting** - Submit water quality concerns with photos
- **Location Finder** - Search and view monitoring points
- **QR Code Scanner** - Quick access to location details

### Admin Features
- **User Management** - Create, edit, delete users
- **Location Management** - CRUD operations for monitoring points
- **Device Management** - Link/unlink IoT devices
- **Lab Document Upload** - Manage PDF lab reports

### Lab Staff Features
- **Log Management** - View and export sensor logs
- **Lab Document Upload** - Upload test results
- **PDF Report Generation** - Generate downloadable reports

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 |
| Build Tool | Vite |
| UI Library | Chakra UI |
| Styling | Tailwind CSS + Emotion |
| Routing | React Router v6 |
| State Management | React Query (TanStack) |
| Charts | Chart.js + react-chartjs-2 |
| Maps | Leaflet + react-leaflet |
| Animations | Framer Motion |
| LINE Integration | @line/liff |
| PDF | @react-pdf/renderer, react-pdf |

---

## Project Structure

```
src/
├── components/             # Reusable UI components
│   ├── common/             # Shared components (Button, Modal, etc.)
│   ├── charts/             # Chart components
│   ├── map/                # Map-related components
│   └── layout/             # Layout components (Navbar, Sidebar)
│
├── pages/                  # Page components
│   ├── public/             # Public pages (Landing, Map)
│   ├── admin/              # Admin pages
│   ├── labstaff/           # Lab staff pages
│   └── user/               # User pages
│
├── services/               # API service layer
│   ├── api.js              # Axios instance
│   ├── authService.js      # Authentication API
│   ├── locationService.js  # Location API
│   └── userService.js      # User API
│
├── context/                # React context providers
│   ├── AuthContext.jsx     # Authentication state
│   └── ThemeContext.jsx    # Theme configuration
│
├── hooks/                  # Custom React hooks
│   ├── useAuth.js          # Authentication hook
│   ├── useLocations.js     # Location data hook
│   └── useSensorData.js    # Real-time sensor hook
│
├── utils/                  # Utility functions
│   ├── helpers.js          # Common helpers
│   ├── formatters.js       # Data formatters
│   └── validators.js       # Input validation
│
├── assets/                 # Static assets
│   ├── images/             # Images
│   └── icons/              # Icons
│
├── App.jsx                 # Root component
└── main.jsx                # Entry point
```

---

## Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Backend API running (see Backend repo)

### Installation

```bash
# Clone the repository
git clone https://github.com/xArmeriumx/Clean-Water-Monitoring.git

# Navigate to project directory
cd Clean-Water-Monitoring

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5001

# LINE LIFF
VITE_LIFF_ID=your-liff-id

# Map Configuration (optional)
VITE_MAP_CENTER_LAT=13.7563
VITE_MAP_CENTER_LNG=100.5018
VITE_MAP_DEFAULT_ZOOM=10
```

---

## User Roles

| Role | Access Level | Features |
|------|--------------|----------|
| **Guest** | Public | View map, location details |
| **User (LINE)** | Logged in via LIFF | Report issues, view history |
| **Lab Staff** | Staff login | Upload documents, manage logs |
| **Admin** | Full access | All features + user management |

---

## Pages

### Public Pages
| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Home page with introduction |
| `/map` | Map | Interactive monitoring map |
| `/location/:id` | Location Detail | Single location info |

### User Pages (LIFF)
| Route | Page | Description |
|-------|------|-------------|
| `/scan` | QR Scanner | Scan location QR codes |
| `/report` | Report Issue | Submit water quality issue |
| `/history` | History | View submitted issues |

### Admin Pages
| Route | Page | Description |
|-------|------|-------------|
| `/admin/login` | Login | Admin authentication |
| `/admin/dashboard` | Dashboard | Overview statistics |
| `/admin/locations` | Locations | Manage monitoring points |
| `/admin/users` | Users | User management |
| `/admin/devices` | Devices | Device management |

### Lab Staff Pages
| Route | Page | Description |
|-------|------|-------------|
| `/labstaff/login` | Login | Staff authentication |
| `/labstaff/logs` | Logs | View sensor logs |
| `/labstaff/upload` | Upload | Upload lab documents |

---

## Components

### Key Components

```jsx
// Map Component
<MonitoringMap
  locations={locations}
  onLocationClick={handleClick}
  showCurrentLocation={true}
/>

// Sensor Chart
<WaterQualityChart
  locationId="location-id"
  dateRange={{ start, end }}
  metrics={['pH', 'turbidity', 'temperature']}
/>

// Location Card
<LocationCard
  location={location}
  showDetails={true}
  onViewClick={handleView}
/>
```

---

## API Integration

### Authentication Flow

1. **LIFF Login** (Users)
   - Initialize LIFF SDK
   - Get LINE user profile
   - Create/update user in backend

2. **Admin/Staff Login**
   - Get CSRF token from `/api/csrf-token`
   - Submit credentials to `/api/users/login`
   - JWT stored in HttpOnly cookie

### Data Fetching

Using TanStack Query for server state management:

```jsx
// Example: Fetch locations
const { data: locations, isLoading } = useQuery({
  queryKey: ['locations'],
  queryFn: () => locationService.getAll(),
});
```

---

## Deployment

### Vercel (Current)

Auto-deployed from main branch with the following configuration:

**vercel.json**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### Manual Build

```bash
# Build for production
npm run build

# Output directory: dist/
```

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Android)

---

## Performance Optimizations

- **Code Splitting** - Lazy loading for routes
- **Image Optimization** - Lazy loading images
- **Caching** - React Query cache management
- **Bundle Size** - Tree shaking enabled

---

## License

ISC License

---

## Author

**Napat Pamornsut**
- GitHub: [@NapatPamornsuT](https://github.com/NapatPamornsuT)
