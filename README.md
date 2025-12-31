# Clean Water Monitoring - Frontend

React frontend application for the Clean Water Monitoring System.

## Live Demo

[https://cleanwatermonitoring.com](https://cleanwatermonitoring.com)

## Features

- Real-time Dashboard - Live sensor data visualization
- Interactive Map - Leaflet-based location mapping
- Water Quality Monitoring - pH, Turbidity, Temperature tracking
- Issue Reporting - Submit and track water quality issues
- Role-based UI - Different views for Admin, Lab Staff, and Users
- Responsive Design - Mobile-friendly interface

## Tech Stack

- **React** - UI Library
- **Vite** - Build Tool
- **Chakra UI** - Component Library
- **Leaflet** - Map Library
- **Chart.js** - Data Visualization
- **React Query** - Data Fetching
- **React Router** - Navigation

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components
├── services/       # API service layer
├── context/        # React context (Auth, Theme)
├── hooks/          # Custom hooks
└── utils/          # Helper functions
```

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

```env
VITE_API_URL=http://localhost:5001
VITE_LIFF_ID=your-liff-id
```

## Deployment

Deployed on **Vercel** with auto-deploy from main branch.

## User Roles

| Role | Access |
|------|--------|
| User | View map, report issues |
| Lab Staff | Upload lab documents, manage logs |
| Admin | Full access, user management |

## License

ISC
