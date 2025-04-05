# Lithium Battery Recycling Dashboard

This interactive dashboard provides a comprehensive overview of lithium battery recycling facilities across North America. The dashboard includes an interactive map, detailed facility information, and data visualizations to help understand the current state of the industry.

## Features

- **Interactive Map**: Visualize the geographic distribution of recycling facilities
- **Facility Profiles**: Detailed pages for each facility with comprehensive information
- **Data Visualizations**: Charts showing capacity, technology distribution, and regional breakdown
- **Search & Filter**: Quickly find facilities by name, company, or status

## Getting Started

### Running the Dashboard Locally

Since the dashboard uses JavaScript to load local data files, you need to run it on a local web server to avoid CORS issues. Here are a few ways to do this:

#### Option 1: Using Python

If you have Python installed, you can start a simple HTTP server:

```bash
# Navigate to the dashboard directory
cd "D:\UQTR\Lithium 2025\lithium_dashboard"

# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open your browser and go to: http://localhost:8000

#### Option 2: Using Node.js

If you have Node.js installed, you can use packages like `http-server`:

```bash
# Install http-server globally (if not already installed)
npm install -g http-server

# Navigate to the dashboard directory
cd "D:\UQTR\Lithium 2025\lithium_dashboard"

# Start the server
http-server
```

Then open your browser to the URL shown in the terminal.

### Generating Facility Pages

The dashboard includes a page generator tool to create individual facility pages based on the data in `facilityData.js`.

1. Start your local web server using one of the methods above
2. Navigate to http://localhost:8000/generate_facility_pages.html
3. Click the "Generate All Facility Pages" button
4. Download the generated HTML files and place them in the `facilities/` folder

## Directory Structure

```
lithium_dashboard/
├── index.html                 # Main dashboard page
├── css/
│   └── styles.css             # Dashboard and facility page styles
├── js/
│   ├── dashboard.js           # Dashboard functionality
│   └── facilityData.js        # Facility data and helper functions
├── facilities/                # Individual facility pages
│   ├── licycle-arizona.html   # Example facility page
│   └── ...
├── images/                    # Images folder
│   ├── facilities/            # Facility images
│   └── logos/                 # Company logos
└── generate_facility_pages.html # Tool to generate facility pages
```

## Customizing the Dashboard

### Adding New Facilities

To add new facilities to the dashboard, edit the `facilityData.js` file in the `js/` folder. Add a new feature object to the `features` array following the existing structure.

### Modifying Styles

The dashboard's appearance can be customized by editing the `styles.css` file in the `css/` folder.

## Deploying the Dashboard

To deploy the dashboard to a web server, simply copy all the files to your web hosting. Make sure to maintain the directory structure.

## Data Sources

This dashboard is based on research into lithium battery recycling facilities in North America, with data compiled from:
- Company websites and press releases
- Industry reports and news articles
- Government documents and databases
- Academic research papers

## License

This dashboard is provided for educational and research purposes only.
