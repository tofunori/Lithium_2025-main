# Lithium Battery Recycling Dashboard

A React + Vite application for tracking and analyzing lithium battery recycling facilities across North America.

## 🚀 Features

- Interactive map visualization of recycling facilities
- Comprehensive facility management (CRUD operations)
- Real-time data analytics and charts
- Document management system
- Authentication with Supabase

## 📋 Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Supabase account

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Lithium_2025-main
```

2. Install dependencies:
```bash
cd frontend
npm install
```

3. Configure Supabase:
   - Update the Supabase credentials in `frontend/src/supabaseClient.ts` (or use environment variables)
   - Ensure your Supabase project has the required tables: `facilities`, `facility_details`, `facility_partners`, `facility_images`

## 🚀 Running the Application

Start the development server:

```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
Lithium_2025-main/
├── frontend/           # React + Vite frontend application
│   ├── src/
│   │   ├── components/ # Reusable React components
│   │   ├── context/    # React context providers
│   │   ├── pages/      # Page components
│   │   ├── utils/      # Utility functions
│   │   └── ...
│   └── ...
├── data/              # Data files (CSV exports)
├── docs/              # Documentation
├── migrations/        # Database migration scripts
└── scripts/           # Utility scripts
```

## 🔧 Technologies Used

- **Frontend**: React, TypeScript, Vite
- **Database**: Supabase (PostgreSQL)
- **Styling**: Bootstrap 5, Custom CSS
- **Maps**: Leaflet, React-Leaflet
- **Charts**: Chart.js
- **State Management**: React Context API

## 📊 Database Schema

The application uses the following main tables:
- `facilities` - Core facility information
- `facility_details` - Extended facility details
- `facility_partners` - Partnership information
- `facility_images` - Image storage references

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License. 