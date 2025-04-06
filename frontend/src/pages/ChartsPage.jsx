import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { getFacilityStats, getFacilities } from '../firebase';
import { initializeFacilityData } from '../utils/initializeFirebaseData';
import { mockFacilityStats, mockFacilities } from '../mockData/facilityData';
import {
  processFacilityData,
  createCapacityChartConfig,
  createTechnologiesChartConfig,
  createRegionsChartConfig
} from '../utils/chartUtils';
import './ChartsPage.css';

// Register all Chart.js components
Chart.register(...registerables);

function ChartsPage() {
  // State for stats and charts data
  const [stats, setStats] = useState({
    totalFacilities: 0,
    operatingFacilities: 0,
    constructionFacilities: 0,
    plannedFacilities: 0
  });
  const [chartData, setChartData] = useState(null);
  
  // State for loading and error handling
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  
  // Refs for chart instances
  const capacityChartRef = useRef(null);
  const technologiesChartRef = useRef(null);
  const regionsChartRef = useRef(null);
  
  // Refs for canvas elements
  const capacityCanvasRef = useRef(null);
  const technologiesCanvasRef = useRef(null);
  const regionsCanvasRef = useRef(null);

  // Function to fetch data with error handling and fallback
  const fetchData = async (useFallback = false) => {
    setLoading(true);
    setError(null);
    
    // Initialize facility data if needed
    try {
      await initializeFacilityData();
    } catch (initError) {
      console.warn('Failed to initialize facility data:', initError);
      // Continue with fetching - we'll fall back to mock data if needed
    }
    
    try {
      if (useFallback) {
        throw new Error('Using fallback data intentionally');
      }
      
      // Fetch facility statistics from Firebase
      const statsData = await getFacilityStats();
      setStats(statsData);
      
      // Fetch all facilities for chart data
      const facilitiesData = await getFacilities();
      
      // Process data for charts
      const processedData = processFacilityData(facilitiesData);
      console.log('Processed data for charts:', processedData);
      setChartData(processedData);
      setUsingMockData(false);
      
      // Log success for debugging
      console.log('Successfully loaded data from Firebase');
      
    } catch (error) {
      console.error("Error fetching data:", error);
      
      // If this is the first attempt, try with mock data
      if (!useFallback) {
        console.log('Falling back to mock data');
        setStats(mockFacilityStats);
        const processedData = processFacilityData(mockFacilities);
        setChartData(processedData);
        setUsingMockData(true);
        
        // Set a non-blocking error message for debugging
        setError({
          message: 'Could not fetch live data. Using sample data instead.',
          details: error.toString()
        });
      } else {
        // If we're already using fallback data and still have an error
        setError({
          message: 'Failed to initialize charts with sample data.',
          details: error.toString()
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
  }, []);
  
  // Effect to ensure canvas elements are properly sized
  useEffect(() => {
    const resizeCanvases = () => {
      const canvases = [
        capacityCanvasRef.current,
        technologiesCanvasRef.current,
        regionsCanvasRef.current
      ];
      
      canvases.forEach(canvas => {
        if (canvas) {
          // Force the canvas to take the size of its container
          const container = canvas.parentElement;
          if (container) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
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
  }, []);
  
  // Update charts whenever chartData changes
  useEffect(() => {
    if (chartData && !loading) {
      console.log('Initializing charts with data:', chartData);
      
      // Add a small delay to ensure canvas elements are fully rendered
      const timer = setTimeout(() => {
        initializeCharts();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [chartData, loading]);
  
  // Function to destroy all charts (for cleanup)
  const destroyCharts = () => {
    if (capacityChartRef.current) {
      capacityChartRef.current.destroy();
    }
    if (technologiesChartRef.current) {
      technologiesChartRef.current.destroy();
    }
    if (regionsChartRef.current) {
      regionsChartRef.current.destroy();
    }
  };
  
  // Function to initialize all charts
  const initializeCharts = () => {
    if (!chartData) {
      console.warn('Cannot initialize charts: chartData is null or undefined');
      return;
    }
    
    const { capacityByStatus, technologies, regions } = chartData;
    console.log('Chart data breakdown:', { capacityByStatus, technologies, regions });
    
    // Initialize capacity chart
    if (capacityCanvasRef.current) {
      const capacityCtx = capacityCanvasRef.current.getContext('2d');
      console.log('Capacity canvas element:', capacityCanvasRef.current);
      console.log('Capacity canvas context:', capacityCtx);
      
      // Destroy existing chart if it exists
      if (capacityChartRef.current) {
        capacityChartRef.current.destroy();
      }
      
      const capacityConfig = createCapacityChartConfig(capacityByStatus);
      console.log('Capacity chart config:', capacityConfig);
      
      try {
        capacityChartRef.current = new Chart(capacityCtx, capacityConfig);
        console.log('Capacity chart created successfully:', capacityChartRef.current);
      } catch (error) {
        console.error('Error creating capacity chart:', error);
      }
    } else {
      console.warn('Capacity canvas element not found');
    }

    // Initialize technologies chart
    if (technologiesCanvasRef.current) {
      const technologiesCtx = technologiesCanvasRef.current.getContext('2d');
      console.log('Technologies canvas element:', technologiesCanvasRef.current);
      
      // Destroy existing chart if it exists
      if (technologiesChartRef.current) {
        technologiesChartRef.current.destroy();
      }
      
      const technologiesConfig = createTechnologiesChartConfig(technologies);
      console.log('Technologies chart config:', technologiesConfig);
      
      try {
        technologiesChartRef.current = new Chart(technologiesCtx, technologiesConfig);
        console.log('Technologies chart created successfully:', technologiesChartRef.current);
      } catch (error) {
        console.error('Error creating technologies chart:', error);
      }
    } else {
      console.warn('Technologies canvas element not found');
    }

    // Initialize regions chart
    if (regionsCanvasRef.current) {
      const regionsCtx = regionsCanvasRef.current.getContext('2d');
      console.log('Regions canvas element:', regionsCanvasRef.current);
      
      // Destroy existing chart if it exists
      if (regionsChartRef.current) {
        regionsChartRef.current.destroy();
      }
      
      const regionsConfig = createRegionsChartConfig(regions);
      console.log('Regions chart config:', regionsConfig);
      
      try {
        regionsChartRef.current = new Chart(regionsCtx, regionsConfig);
        console.log('Regions chart created successfully:', regionsChartRef.current);
      } catch (error) {
        console.error('Error creating regions chart:', error);
      }
    } else {
      console.warn('Regions canvas element not found');
    }
  };
  
  // Function to retry data fetching
  const handleRetry = () => {
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
}

export default ChartsPage;