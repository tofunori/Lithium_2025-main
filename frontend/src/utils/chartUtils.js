/**
 * Utility functions for chart data processing and initialization
 */

/**
 * Process facility data for charts
 * @param {Array} facilitiesData - Array of facility objects
 * @returns {Object} Processed data for charts
 */
export const processFacilityData = (facilitiesData) => {
  if (!facilitiesData || !Array.isArray(facilitiesData) || facilitiesData.length === 0) {
    console.warn('Invalid or empty facilities data provided to processFacilityData');
    return {
      capacityByStatus: { operating: 0, construction: 0, planned: 0 },
      technologies: {},
      regions: {}
    };
  }
  
  console.log('Processing facility data:', facilitiesData);

  // Calculate capacity by status
  const capacityByStatus = {
    operating: 0,
    construction: 0,
    planned: 0
  };
  
  // Calculate technology distribution
  const technologies = {};
  
  // Calculate geographic distribution
  const regions = {};
  
  facilitiesData.forEach(facility => {
    // Process capacity by status
    if (facility.status) {
      const status = facility.status.toLowerCase();
      console.log(`Processing facility ${facility.name} with status: ${status}, volume: ${facility.volume}`);
      
      const volume = Number(facility.volume);
      if (!isNaN(volume)) {
        // Map status to one of our three categories if it doesn't match exactly
        let statusKey = status;
        if (status.includes('operat')) {
          statusKey = 'operating';
        } else if (status.includes('construct')) {
          statusKey = 'construction';
        } else if (status.includes('plan')) {
          statusKey = 'planned';
        }
        
        // Initialize the category if it doesn't exist
        if (!capacityByStatus[statusKey]) {
          capacityByStatus[statusKey] = 0;
        }
        
        capacityByStatus[statusKey] += volume;
        console.log(`Added ${volume} to ${statusKey}, new total: ${capacityByStatus[statusKey]}`);
      } else {
        console.warn(`Invalid volume for facility ${facility.name}: ${facility.volume}`);
      }
    } else {
      console.warn(`Facility missing status: ${facility.name}`);
    }
    
    // Process technology distribution
    if (facility.method) {
      technologies[facility.method] = (technologies[facility.method] || 0) + 1;
    }
    
    // Process geographic distribution
    if (facility.region) {
      regions[facility.region] = (regions[facility.region] || 0) + 1;
    }
  });

  // Ensure all required status categories exist
  const requiredStatuses = ['operating', 'construction', 'planned'];
  requiredStatuses.forEach(status => {
    if (capacityByStatus[status] === undefined) {
      capacityByStatus[status] = 0;
    }
  });

  const result = {
    capacityByStatus,
    technologies,
    regions
  };
  
  console.log('Processed data result:', result);
  return result;
};

/**
 * Get chart colors for consistent styling
 * @returns {Object} Chart colors
 */
export const getChartColors = () => {
  return {
    backgroundColor: [
      'rgba(25, 135, 84, 0.7)',   // Green
      'rgba(255, 193, 7, 0.7)',   // Yellow
      'rgba(13, 202, 240, 0.7)',  // Blue
      'rgba(220, 53, 69, 0.7)',   // Red
      'rgba(111, 66, 193, 0.7)',  // Purple
      'rgba(253, 126, 20, 0.7)',  // Orange
      'rgba(102, 16, 242, 0.7)',  // Indigo
    ],
    borderColor: [
      'rgb(25, 135, 84)',
      'rgb(255, 193, 7)',
      'rgb(13, 202, 240)',
      'rgb(220, 53, 69)',
      'rgb(111, 66, 193)',
      'rgb(253, 126, 20)',
      'rgb(102, 16, 242)',
    ]
  };
};

/**
 * Create a capacity chart configuration
 * @param {Object} capacityByStatus - Capacity data by status
 * @returns {Object} Chart configuration
 */
export const createCapacityChartConfig = (capacityByStatus) => {
  const colors = getChartColors();
  
  console.log('Creating capacity chart config with data:', capacityByStatus);
  
  // Ensure we have valid data values
  const operatingValue = Number(capacityByStatus.operating || 0);
  const constructionValue = Number(capacityByStatus.construction || 0);
  const plannedValue = Number(capacityByStatus.planned || 0);
  
  console.log('Capacity values:', { operatingValue, constructionValue, plannedValue });
  
  return {
    type: 'bar',
    data: {
      labels: ['Operating', 'Under Construction', 'Planned'],
      datasets: [{
        label: 'Processing Capacity (tonnes/year)',
        data: [operatingValue, constructionValue, plannedValue],
        backgroundColor: colors.backgroundColor.slice(0, 3),
        borderColor: colors.borderColor.slice(0, 3),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
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
  };
};

/**
 * Create a technologies chart configuration
 * @param {Object} technologies - Technology distribution data
 * @returns {Object} Chart configuration
 */
export const createTechnologiesChartConfig = (technologies) => {
  const colors = getChartColors();
  const labels = Object.keys(technologies);
  
  console.log('Creating technologies chart config with data:', technologies);
  console.log('Technology labels:', labels);
  
  // If no technologies data, provide default empty chart
  if (labels.length === 0) {
    console.warn('No technology data available for chart');
    return {
      type: 'pie',
      data: {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(200, 200, 200, 0.7)'],
          borderColor: ['rgb(200, 200, 200)'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          },
          tooltip: {
            callbacks: {
              label: function() {
                return 'No technology data available';
              }
            }
          }
        }
      }
    };
  }
  
  return {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: Object.values(technologies),
        backgroundColor: colors.backgroundColor.slice(0, labels.length),
        borderColor: colors.borderColor.slice(0, labels.length),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
              const percentage = Math.round((context.raw / total) * 100);
              return `${context.label}: ${context.raw} (${percentage}%)`;
            }
          }
        }
      }
    }
  };
};

/**
 * Create a regions chart configuration
 * @param {Object} regions - Geographic distribution data
 * @returns {Object} Chart configuration
 */
export const createRegionsChartConfig = (regions) => {
  const colors = getChartColors();
  const labels = Object.keys(regions);
  
  console.log('Creating regions chart config with data:', regions);
  console.log('Region labels:', labels);
  
  // If no regions data, provide default empty chart
  if (labels.length === 0) {
    console.warn('No region data available for chart');
    return {
      type: 'doughnut',
      data: {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: ['rgba(200, 200, 200, 0.7)'],
          borderColor: ['rgb(200, 200, 200)'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right'
          },
          tooltip: {
            callbacks: {
              label: function() {
                return 'No region data available';
              }
            }
          }
        }
      }
    };
  }
  
  return {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: Object.values(regions),
        backgroundColor: colors.backgroundColor.slice(0, labels.length),
        borderColor: colors.borderColor.slice(0, labels.length),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
              const percentage = Math.round((context.raw / total) * 100);
              return `${context.label}: ${context.raw} (${percentage}%)`;
            }
          }
        }
      }
    }
  };
};