import React, { useState, useEffect, useRef, FC } from 'react';
import { Chart, registerables, ChartConfiguration, TooltipItem } from 'chart.js';
import { getFacilityStats, getFacilities, FacilityStats, FacilityData } from '../firebase'; // Import types
import { initializeFacilityData } from '../utils/initializeFirebaseData'; // Assuming this is still JS or handles TS implicitly
import { mockFacilityStats, mockFacilities } from '../mockData/facilityData'; // Assuming mock data matches types or needs adjustment
import {
  processFacilityData,
  createCapacityChartConfig,
  createTechnologiesChartConfig,
  createRegionsChartConfig,
  ProcessedChartData, // Import type
  Facility as ChartUtilsFacility // Import and alias Facility type from chartUtils
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

    // Initialize facility data if needed
    try {
      // Assuming initializeFacilityData is compatible or doesn't need explicit typing here
      await initializeFacilityData();
    } catch (initError: unknown) { // Type error as unknown
      console.warn('Failed to initialize facility data:', initError);
      // Continue with fetching - we'll fall back to mock data if needed
    }

    try {
      if (useFallback) {
        throw new Error('Using fallback data intentionally');
      }

      // Fetch facility statistics from Firebase
      const statsData: FacilityStats = await getFacilityStats();
      setStats(statsData);

      // Fetch all facilities for chart data
      const facilitiesData: FacilityData[] = await getFacilities();

      // Map FacilityData[] to ChartUtilsFacility[] before processing
      const facilitiesForChartUtils: ChartUtilsFacility[] = facilitiesData.map(f => ({
          // Map fields from FacilityData.properties to ChartUtilsFacility
          name: f.properties.company || f.id, // Use company or ID as name
          status: f.properties.status,
          volume: f.properties.capacity, // Map capacity to volume
          method: f.properties.technology, // Map technology to method
          region: f.properties.address, // Map address to region (adjust if a dedicated region field exists)
          // Add other relevant mappings if needed by processFacilityData
      }));


      // Process data for charts using the mapped data
      const processedData: ProcessedChartData = processFacilityData(facilitiesForChartUtils);
      console.log('Processed data for charts:', processedData);
      setChartData(processedData);
      setUsingMockData(false);

      // Log success for debugging
      console.log('Successfully loaded data from Firebase');

    } catch (fetchError: unknown) { // Type error as unknown
      console.error("Error fetching data:", fetchError);

      // If this is the first attempt, try with mock data
      if (!useFallback) {
        console.log('Falling back to mock data');
        // Assuming mockFacilityStats matches FacilityStats type
        setStats(mockFacilityStats);

        // Map mockFacilities (assuming they match FacilityData structure) to ChartUtilsFacility[]
         const mockFacilitiesForChartUtils: ChartUtilsFacility[] = mockFacilities.map((f: any) => ({ // Use 'any' for mock data flexibility or define a mock type
            name: f.company || f.name || f.id || 'Unknown Mock Facility', // Access directly
            status: f.status, // Access directly
            volume: f.volume, // Access directly and use correct property name 'volume'
            method: f.method, // Access directly and use correct property name 'method'
            region: f.region, // Access directly and use correct property name 'region'
         }));
        const processedData = processFacilityData(mockFacilitiesForChartUtils);
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
            console.log(`Resized canvas to ${canvas.width}x${canvas.height}`);
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
    console.log('Chart data breakdown:', { capacityByStatus, technologies, regions });

    // Initialize capacity chart
    if (capacityCanvasRef.current) {
      const capacityCtx = capacityCanvasRef.current.getContext('2d');
      if (!capacityCtx) {
        console.error('Failed to get 2D context for capacity chart canvas');
        return;
      }
      console.log('Capacity canvas element:', capacityCanvasRef.current);
      console.log('Capacity canvas context:', capacityCtx);

      // Destroy existing chart if it exists
      if (capacityChartRef.current) {
        capacityChartRef.current.destroy();
      }

      const capacityConfig: ChartConfiguration = createCapacityChartConfig(capacityByStatus);
      console.log('Capacity chart config:', capacityConfig);

      try {
        capacityChartRef.current = new Chart(capacityCtx, capacityConfig);
        console.log('Capacity chart created successfully:', capacityChartRef.current);
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
      console.log('Technologies canvas element:', technologiesCanvasRef.current);

      // Destroy existing chart if it exists
      if (technologiesChartRef.current) {
        technologiesChartRef.current.destroy();
      }

      const technologiesConfig: ChartConfiguration = createTechnologiesChartConfig(technologies);
      console.log('Technologies chart config:', technologiesConfig);

      try {
        technologiesChartRef.current = new Chart(technologiesCtx, technologiesConfig);
        console.log('Technologies chart created successfully:', technologiesChartRef.current);
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
      console.log('Regions canvas element:', regionsCanvasRef.current);

      // Destroy existing chart if it exists
      if (regionsChartRef.current) {
        regionsChartRef.current.destroy();
      }

      const regionsConfig: ChartConfiguration = createRegionsChartConfig(regions);
      console.log('Regions chart config:', regionsConfig);

      try {
        regionsChartRef.current = new Chart(regionsCtx, regionsConfig);
        console.log('Regions chart created successfully:', regionsChartRef.current);
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