import React, { useState, useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { getFacilityStats, getFacilities } from '../firebase';
import './ChartsPage.css';

// Register all Chart.js components
Chart.register(...registerables);

function ChartsPage() {
  const [stats, setStats] = useState({
    totalFacilities: 0,
    operatingFacilities: 0,
    constructionFacilities: 0,
    plannedFacilities: 0
  });

  // Refs for chart instances
  const capacityChartRef = useRef(null);
  const technologiesChartRef = useRef(null);
  const regionsChartRef = useRef(null);
  
  // Refs for canvas elements
  const capacityCanvasRef = useRef(null);
  const technologiesCanvasRef = useRef(null);
  const regionsCanvasRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch facility statistics
        const statsData = await getFacilityStats();
        setStats(statsData);
        
        // Fetch all facilities for chart data
        const facilitiesData = await getFacilities();
        
        // Process data for charts
        processChartData(facilitiesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    fetchData();

    // Cleanup function to destroy charts when component unmounts
    return () => {
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
  }, []);

  const processChartData = (facilitiesData) => {
    // Calculate capacity by status
    const capacityByStatus = {
      operating: 0,
      construction: 0,
      planned: 0
    };
    
    facilitiesData.forEach(facility => {
      if (facility.volume && facility.status) {
        capacityByStatus[facility.status] += facility.volume;
      }
    });
    
    // Calculate technology distribution
    const technologies = {};
    facilitiesData.forEach(facility => {
      if (facility.method) {
        technologies[facility.method] = (technologies[facility.method] || 0) + 1;
      }
    });
    
    // Calculate geographic distribution
    const regions = {};
    facilitiesData.forEach(facility => {
      if (facility.region) {
        regions[facility.region] = (regions[facility.region] || 0) + 1;
      }
    });
    
    // Initialize charts with the processed data
    initializeCharts(capacityByStatus, technologies, regions);
  };
  
  const initializeCharts = (capacityByStatus, technologies, regions) => {
    // Capacity by Status Chart (Bar Chart)
    if (capacityCanvasRef.current) {
      const capacityCtx = capacityCanvasRef.current.getContext('2d');
      
      // Destroy existing chart if it exists
      if (capacityChartRef.current) {
        capacityChartRef.current.destroy();
      }
      
      capacityChartRef.current = new Chart(capacityCtx, {
        type: 'bar',
        data: {
          labels: ['Operating', 'Under Construction', 'Planned'],
          datasets: [{
            label: 'Processing Capacity (tonnes/year)',
            data: [
              capacityByStatus.operating || 0,
              capacityByStatus.construction || 0,
              capacityByStatus.planned || 0
            ],
            backgroundColor: [
              'rgba(25, 135, 84, 0.7)',  // Green for operating
              'rgba(255, 193, 7, 0.7)',  // Yellow for construction
              'rgba(13, 202, 240, 0.7)'  // Blue for planned
            ],
            borderColor: [
              'rgb(25, 135, 84)',
              'rgb(255, 193, 7)',
              'rgb(13, 202, 240)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.raw.toLocaleString()} tonnes`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Tonnes per Year'
              }
            }
          }
        }
      });
    }

    // Technologies Distribution Chart (Pie Chart)
    if (technologiesCanvasRef.current) {
      const technologiesCtx = technologiesCanvasRef.current.getContext('2d');
      
      // Destroy existing chart if it exists
      if (technologiesChartRef.current) {
        technologiesChartRef.current.destroy();
      }
      
      technologiesChartRef.current = new Chart(technologiesCtx, {
        type: 'pie',
        data: {
          labels: Object.keys(technologies),
          datasets: [{
            data: Object.values(technologies),
            backgroundColor: [
              'rgba(13, 110, 253, 0.7)',  // Blue
              'rgba(220, 53, 69, 0.7)',   // Red
              'rgba(25, 135, 84, 0.7)',   // Green
              'rgba(111, 66, 193, 0.7)',  // Purple
              'rgba(255, 193, 7, 0.7)'    // Yellow
            ],
            borderColor: [
              'rgb(13, 110, 253)',
              'rgb(220, 53, 69)',
              'rgb(25, 135, 84)',
              'rgb(111, 66, 193)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'right'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.label}: ${context.raw}%`;
                }
              }
            }
          }
        }
      });
    }

    // Geographic Distribution Chart (Doughnut Chart)
    if (regionsCanvasRef.current) {
      const regionsCtx = regionsCanvasRef.current.getContext('2d');
      
      // Destroy existing chart if it exists
      if (regionsChartRef.current) {
        regionsChartRef.current.destroy();
      }
      
      regionsChartRef.current = new Chart(regionsCtx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(regions),
          datasets: [{
            data: Object.values(regions),
            backgroundColor: [
              'rgba(13, 110, 253, 0.7)',  // Blue
              'rgba(220, 53, 69, 0.7)',   // Red
              'rgba(255, 193, 7, 0.7)',   // Yellow
              'rgba(25, 135, 84, 0.7)',   // Green
              'rgba(111, 66, 193, 0.7)',  // Purple
              'rgba(102, 16, 242, 0.7)',  // Indigo
              'rgba(253, 126, 20, 0.7)'   // Orange
            ],
            borderColor: [
              'rgb(13, 110, 253)',
              'rgb(220, 53, 69)',
              'rgb(255, 193, 7)',
              'rgb(25, 135, 84)',
              'rgb(111, 66, 193)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'right'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.label}: ${context.raw}%`;
                }
              }
            }
          }
        }
      });
    }
  };

  return (
    <div className="charts-container">
      {/* Stats Cards Row */}
      <div className="row mb-4 mt-4">
        <div className="col-md-3">
          <div className="stats-card text-center">
            <div className="icon text-primary">
              <i className="fas fa-industry"></i>
            </div>
            <div className="number">{stats.totalFacilities}</div>
            <div className="label">Total Facilities</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stats-card text-center">
            <div className="icon text-success">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="number">{stats.operatingFacilities}</div>
            <div className="label">Operating</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stats-card text-center">
            <div className="icon text-warning">
              <i className="fas fa-hard-hat"></i>
            </div>
            <div className="number">{stats.constructionFacilities}</div>
            <div className="label">Under Construction</div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stats-card text-center">
            <div className="icon text-info">
              <i className="fas fa-clipboard-list"></i>
            </div>
            <div className="number">{stats.plannedFacilities}</div>
            <div className="label">Planned</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header">
              <h5>Capacity by Status (tonnes per year)</h5>
            </div>
            <div className="card-body">
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
            <div className="card-body">
              <canvas ref={technologiesCanvasRef} id="technologiesChart"></canvas>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>Geographic Distribution</h5>
            </div>
            <div className="card-body">
              <canvas ref={regionsCanvasRef} id="regionsChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChartsPage;