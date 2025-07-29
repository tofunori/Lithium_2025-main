# Lithium Battery Recycling Dashboard

A comprehensive React + Vite application for tracking and analyzing lithium battery recycling facilities across North America with advanced data visualization and management capabilities.

## Features

### Core Functionality
- **Interactive Map Visualization**: Leaflet-based mapping with facility markers sized by capacity
- **Comprehensive Facility Management**: Full CRUD operations with form validation
- **Real-time Data Analytics**: Chart.js integration with multiple chart types
- **Document Management System**: Hierarchical file organization with search capabilities
- **Advanced Search & Filtering**: Multi-criteria filtering with debounced search
- **Map Export Functionality**: Export maps as images with HTML2Canvas

### Technical Features
- **Authentication System**: Secure login with Supabase integration
- **Performance Optimization**: Virtual scrolling for large datasets
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Responsive Design**: Bootstrap 5 with mobile-first approach
- **TypeScript Support**: Full type safety and IntelliSense support
- **Modern Development**: Hot reload, ESLint, and modern build tools

## Data Management

The application manages lithium battery recycling facilities with the following key data points:
- Facility location and contact information
- Processing capacity and technology types
- Operational status and licensing information
- Partnership networks and supply chain data
- Document storage and retrieval

## Technology Stack

### Frontend
- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Bootstrap 5** - Responsive UI framework
- **Leaflet** - Interactive mapping library
- **Chart.js** - Data visualization
- **React Router** - Client-side routing

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Neon** - Alternative PostgreSQL provider support
- **Real-time subscriptions** - Live data updates

### Development Tools
- **ESLint** - Code linting and quality
- **TypeScript Compiler** - Type checking
- **Vite Dev Server** - Hot module replacement

## Installation and Setup

### Prerequisites

- **Node.js** (v18 or later) - [Download here](https://nodejs.org/)
- **npm or yarn** - Package manager
- **Supabase account** - [Sign up at supabase.com](https://supabase.com)

### Installation Steps

1. **Clone the repository:**
```bash
git clone <repository-url>
cd Lithium_2025-main
```

2. **Install dependencies:**
```bash
cd frontend
npm install
```

3. **Environment Configuration:**
   - Copy `.env.example` to `.env.local` (if available)
   - Update Supabase credentials in `frontend/src/supabaseClient.ts`
   - Configure database connection settings

4. **Database Setup:**
   - Ensure your Supabase project has the required tables:
     - `facilities` - Core facility information
     - `facility_details` - Extended facility metadata
     - `facility_partners` - Partnership relationships
     - `facility_images` - Image storage references
   - Run migration scripts from the `migrations/` folder

### Running the Application

**Development mode:**
```bash
cd frontend
npm run dev
```

**Production build:**
```bash
npm run build
npm run preview
```

The application will be available at `http://localhost:5173`

## Project Architecture

```
Lithium_2025-main/
├── frontend/           # React + Vite frontend application
│   ├── src/
│   │   ├── components/ # Reusable React components
│   │   ├── context/    # React context providers
│   │   ├── pages/      # Page components
│   │   ├── utils/      # Utility functions
│   │   ├── services/   # API and data services
│   │   ├── hooks/      # Custom React hooks
│   │   ├── types/      # TypeScript definitions
│   │   └── layouts/    # Layout components
│   └── public/         # Static assets
├── data/              # Data files (CSV exports)
├── docs/              # Documentation
├── migrations/        # Database migration scripts
├── scripts/           # Utility scripts
└── CHANGELOG.md       # Project changelog
```

## Database Schema

The application uses the following main tables:
- `facilities` - Core facility information
- `facility_details` - Extended facility details
- `facility_partners` - Partnership information
- `facility_images` - Image storage references

## Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # TypeScript type checking

# Utilities
npm run clean            # Clean build artifacts
npm run health-check     # Run project health check
npm run analyze          # Analyze bundle size
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the GitHub repository.

---

**Built by the Lithium Recycling Team**