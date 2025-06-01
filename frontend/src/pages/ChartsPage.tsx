// frontend/src/pages/ChartsPage.tsx
import React, { useState, useEffect, useRef, FC } from 'react';
import { Chart, registerables, ChartConfiguration, TooltipItem } from 'chart.js';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToastContext } from '../context/ToastContext';
import { getFacilityStats, getFacilities, FacilityStats, Facility } from '../services';
import { mockFacilityStats, mockFacilities } from '../mockData/facilityData'; // Assuming mock data matches types or needs adjustment
import {
  processFacilityData,
  createCapacityChartConfig,
  createTechnologiesChartConfig,
  createRegionsChartConfig,
  ProcessedChartData, // Import type
  parseVolume // Import parseVolume
} from '../utils/chartUtils';
import './ChartsPage.css';

// Register all Chart.js components
Chart.register(...registerables);

// Define the structure for the error state
interface ErrorState {
  message: string;
  details?: string;
}

const ChartsPage: FC = () => {
  const { showError, showWarning } = useToastContext();
  
  // State for stats and charts data with types
  const [stats, setStats] = useState<FacilityStats>({
    totalFacilities: 0,
    operatingFacilities: 0,
    constructionFacilities: 0,
    plannedFacilities: 0
  });
  const [chartData, setChartData] = useState<ProcessedChartData | null>(null);

  // State for loading and error handling with types
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [usingMockData, setUsingMockData] = useState<boolean>(false);

  // Refs for chart instances with types
  const capacityChartRef = useRef<Chart | null>(null);
  const technologiesChartRef = useRef<Chart | null>(null);
  const regionsChartRef = useRef<Chart | null>(null);

  // Refs for canvas elements with types
  const capacityCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const technologiesCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const regionsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Function to fetch data with error handling and fallback
  const fetchData = async (useFallback: boolean = false): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      if (useFallback) {
        throw new Error('Using fallback data intentionally');
      }

      // Fetch facility statistics from Supabase (already uses flat structure)
      const statsData: FacilityStats = await getFacilityStats();
      setStats(statsData);

      // Fetch all facilities for chart data from Supabase (now returns Facility[])
      const facilitiesData: Facility[] = await getFacilities(); // Returns Facility[] from supabaseDataService

      // Pass the correct Facility[] data directly to processFacilityData
      // The mapping is no longer needed here as chartUtils now expects the correct Facility type
      const processedData: ProcessedChartData = processFacilityData(facilitiesData);
      console.log('Processed data for charts:', processedData);
      setChartData(processedData);
      setUsingMockData(false);

      // Log success for debugging
      console.log('Successfully loaded data from Supabase');

    } catch (fetchError: unknown) { // Type error as unknown
      console.error("Error fetching data:", fetchError);
      const errorMessage = fetchError instanceof Error ? fetchError.message : 'Unknown error occurred';
      
      // If this is the first attempt, try with mock data
      if (!useFallback) {
        console.log('Falling back to mock data');
        showWarning('Using Mock Data', 'Could not load live data, showing sample data instead.');
        // Assuming mockFacilityStats matches FacilityStats type
        setStats(mockFacilityStats);

        // Process mock data directly (assuming mockFacilities matches Facility structure or needs adjustment)
        // If mockFacilities still uses the OLD structure, it needs mapping here.
        // Assuming mockFacilities needs mapping for demonstration:
        const mappedMockData = mockFacilities.map((f: any) => ({
            ID: f.id || 'mock-id',
            Company: f.properties?.company || 'Mock Company',
            "Facility Name/Site": 'Mock Site', // Add mock data or map if available
            Location: f.properties?.address || 'Mock Location',
            "Operational Status": f.properties?.status || 'Unknown',
            "Primary Recycling Technology": f.properties?.technology || 'Unknown',
            "Annual Processing Capacity (tonnes/year)": parseVolume(f.properties?.capacity), // Use parseVolume if mock capacity is string/mixed
            Latitude: f.properties?.latitude ?? null, // Assuming mock data has these
            Longitude: f.properties?.longitude ?? null,
            "Key Sources/Notes": f.properties?.description || 'Mock notes',
            // Add other necessary fields expected by Facility interface
        }));
        const processedData = processFacilityData(mappedMockData as Facility[]); // Process mapped mock data
        setChartData(processedData);
        setUsingMockData(true);

        // Set a non-blocking error message for debugging
        setError({
          message: 'Could not fetch live data. Using sample data instead.',
          details: fetchError instanceof Error ? fetchError.toString() : String(fetchError) // Safer error handling
        });
      } else {
        // If we're already using fallback data and still have an error
        setError({
          message: 'Failed to initialize charts with sample data.',
          details: fetchError instanceof Error ? fetchError.toString() : String(fetchError)
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchData();

    // Cleanup function to destroy charts when component unmounts
    return () => {
      destroyCharts();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to ensure canvas elements are properly sized
  useEffect(() => {
    const resizeCanvases = () => {
      const canvases: (HTMLCanvasElement | null)[] = [
        capacityCanvasRef.current,
        technologiesCanvasRef.current,
        regionsCanvasRef.current
      ];

      canvases.forEach(canvas => {
        if (canvas) {
          // Force the canvas to take the size of its container
          const container = canvas.parentElement as HTMLElement | null; // Cast parentElement
          if (container) {
            // Ensure dimensions are numbers
            canvas.width = container.clientWidth || 300; // Provide fallback
            canvas.height = container.clientHeight || 150; // Provide fallback
          }
        }
      });
    };

    // Resize canvases on mount
    resizeCanvases();

    // Also resize on window resize
    window.addEventListener('resize', resizeCanvases);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvases);
    };
  }, []); // Empty dependency array

  // Update charts whenever chartData changes
  useEffect(() => {
    if (chartData && !loading) {
      console.log('Initializing charts with data:', chartData);

      // Add a small delay to ensure canvas elements are fully rendered and sized
      const timer = setTimeout(() => {
        initializeCharts();
      }, 150); // Slightly increased delay

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData, loading]); // Dependencies: chartData and loading

  // Function to destroy all charts (for cleanup)
  const destroyCharts = (): void => {
    if (capacityChartRef.current) {
      capacityChartRef.current.destroy();
      capacityChartRef.current = null; // Clear ref
    }
    if (technologiesChartRef.current) {
      technologiesChartRef.current.destroy();
      technologiesChartRef.current = null; // Clear ref
    }
    if (regionsChartRef.current) {
      regionsChartRef.current.destroy();
      regionsChartRef.current = null; // Clear ref
    }
  };

  // Function to initialize all charts
  const initializeCharts = (): void => {
    if (!chartData) {
      console.warn('Cannot initialize charts: chartData is null or undefined');
      return;
    }

    // Ensure chart data components exist
    const { capacityByStatus, technologies, regions } = chartData;
    if (!capacityByStatus || !technologies || !regions) {
         console.warn('Cannot initialize charts: chartData is missing required properties');
         return;
    }

    // Initialize capacity chart
    if (capacityCanvasRef.current) {
      const capacityCtx = capacityCanvasRef.current.getContext('2d');
      if (!capacityCtx) {
        console.error('Failed to get 2D context for capacity chart canvas');
        return;
      }

      // Destroy existing chart if it exists
      if (capacityChartRef.current) {
        capacityChartRef.current.destroy();
      }

      const capacityConfig: ChartConfiguration = createCapacityChartConfig(capacityByStatus);

      try {
        capacityChartRef.current = new Chart(capacityCtx, capacityConfig);
        console.log('Capacity chart created successfully.'); // Simplified log
      } catch (chartError: unknown) { // Type error as unknown
        console.error('Error creating capacity chart:', chartError);
      }
    } else {
      console.warn('Capacity canvas element not found');
    }

    // Initialize technologies chart
    if (technologiesCanvasRef.current) {
      const technologiesCtx = technologiesCanvasRef.current.getContext('2d');
       if (!technologiesCtx) {
        console.error('Failed to get 2D context for technologies chart canvas');
        return;
      }

      // Destroy existing chart if it exists
      if (technologiesChartRef.current) {
        technologiesChartRef.current.destroy();
      }

      const technologiesConfig: ChartConfiguration = createTechnologiesChartConfig(technologies);

      try {
        technologiesChartRef.current = new Chart(technologiesCtx, technologiesConfig);
        console.log('Technologies chart created successfully.'); // Simplified log
      } catch (chartError: unknown) {
        console.error('Error creating technologies chart:', chartError);
      }
    } else {
      console.warn('Technologies canvas element not found');
    }

    // Initialize regions chart
    if (regionsCanvasRef.current) {
      const regionsCtx = regionsCanvasRef.current.getContext('2d');
       if (!regionsCtx) {
        console.error('Failed to get 2D context for regions chart canvas');
        return;
      }

      // Destroy existing chart if it exists
      if (regionsChartRef.current) {
        regionsChartRef.current.destroy();
      }

      const regionsConfig: ChartConfiguration = createRegionsChartConfig(regions);

      try {
        regionsChartRef.current = new Chart(regionsCtx, regionsConfig);
        console.log('Regions chart created successfully.'); // Simplified log
      } catch (chartError: unknown) {
        console.error('Error creating regions chart:', chartError);
      }
    } else {
      console.warn('Regions canvas element not found');
    }
  };

  // Function to retry data fetching
  const handleRetry = (): void => {
    fetchData(false); // Try to fetch live data again
  };

  // Early return for loading state
  if (loading) {
    return (
      <div className="container mt-4">
        <LoadingSpinner 
          size="lg" 
          text="Loading facility statistics and charts..."
          className="justify-content-center"
        />
      </div>
    );
  }

  return (
    <div className="charts-container">
      {/* Error message display */}
      {error && (
        <div className="error-message">
          <h5>
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error.message}
          </h5>
          {error.details && (
            <pre>{error.details}</pre>
          )}
          <button
            className="btn btn-sm btn-outline-danger retry-button"
            onClick={handleRetry}
          >
            <i className="fas fa-sync-alt me-1"></i> Retry with Live Data
          </button>
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="row mb-4 mt-4">
        <div className="col-md-3">
          <div className="stats-card text-center">
            <div className="icon text-primary">
              <i className="fas fa-industry"></i>
            </div>
            <div className="number">
              {loading ? (
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                stats.totalFacilities
              )}
            </div>
            <div className="label">Total Facilities</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stats-card text-center">
            <div className="icon text-success">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="number">
              {loading ? (
                <div className="spinner-border spinner-border-sm text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                stats.operatingFacilities
              )}
            </div>
            <div className="label">Operating</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stats-card text-center">
            <div className="icon text-warning">
              <i className="fas fa-hard-hat"></i>
            </div>
            <div className="number">
              {loading ? (
                <div className="spinner-border spinner-border-sm text-warning" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                stats.constructionFacilities
              )}
            </div>
            <div className="label">Under Construction</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stats-card text-center">
            <div className="icon text-info">
              <i className="fas fa-clipboard-list"></i>
            </div>
            <div className="number">
              {loading ? (
                <div className="spinner-border spinner-border-sm text-info" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                stats.plannedFacilities
              )}
            </div>
            <div className="label">Planned</div>
          </div>
        </div>
      </div>

      {/* Data source indicator */}
      <div className="mb-3">
        <span className={`data-source-indicator ${usingMockData ? 'data-source-mock' : 'data-source-live'}`}>
          <i className={`fas ${usingMockData ? 'fa-database' : 'fa-cloud'} me-1`}></i>
          {usingMockData ? 'Using Sample Data' : 'Live Data'}
        </span>
      </div>

      {/* Charts Row */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <h5>Capacity by Status (tonnes per year)</h5>
            </div>
            <div className="card-body chart-container">
              {loading && (
                <div className="loading-overlay">
                  <div className="spinner-border spinner text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              <canvas ref={capacityCanvasRef} id="capacityChart"></canvas>
            </div>
          </div>
        </div>
      </div>
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>Recycling Technologies Distribution</h5>
            </div>
            <div className="card-body chart-container">
              {loading && (
                <div className="loading-overlay">
                  <div className="spinner-border spinner text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              <canvas ref={technologiesCanvasRef} id="technologiesChart"></canvas>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>Geographic Distribution</h5>
            </div>
            <div className="card-body chart-container">
              {loading && (
                <div className="loading-overlay">
                  <div className="spinner-border spinner text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              <canvas ref={regionsCanvasRef} id="regionsChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsPage;
