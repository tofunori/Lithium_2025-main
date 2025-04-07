import { ChartConfiguration, ChartData, ChartOptions, TooltipItem } from 'chart.js';

/**
 * Utility functions for chart data processing and initialization
 */

// Define interfaces for data structures
export interface Facility {
  name: string;
  status?: string; // Make status optional as the code checks for its existence
  volume?: string | number; // Allow string or number, as it's converted later
  method?: string;
  region?: string;
  // Add other potential properties if known, otherwise keep it flexible
  [key: string]: any; // Allow other properties
}

interface CapacityByStatus {
  operating: number;
  construction: number;
  planned: number;
  [key: string]: number; // Allow for other potential status keys initially
}

interface StringCountMap {
  [key: string]: number;
}

export interface ProcessedChartData {
  capacityByStatus: CapacityByStatus;
  technologies: StringCountMap;
  regions: StringCountMap;
}

interface ChartColors {
  backgroundColor: string[];
  borderColor: string[];
}

// Type the function parameters and return values
/**
 * Parses a volume string (e.g., "20,000 tonnes per year", "Unknown", "40,000+") into a number.
 * Returns 0 for non-numeric or unparseable values.
 * @param volumeInput - The volume value (string or number)
 * @returns The parsed volume as a number, or 0 if invalid.
 */
const parseVolume = (volumeInput: string | number | undefined | null): number => {
  if (typeof volumeInput === 'number') {
    return isNaN(volumeInput) ? 0 : volumeInput;
  }

  if (typeof volumeInput !== 'string' || volumeInput.trim() === '' || volumeInput.toLowerCase() === 'unknown') {
    return 0;
  }

  // Remove commas, units, and other non-numeric characters except the decimal point
  // Also handle potential '+' signs
  const cleanedString = volumeInput
    .replace(/,/g, '') // Remove commas
    .replace(/\s*tonnes.*$/i, '') // Remove "tonnes per year" etc.
    .replace(/\s*\(.*\)$/, '') // Remove content in parentheses like "(initial)"
    .replace(/\+/g, '') // Remove '+' signs
    .trim(); // Trim whitespace

  // Handle cases where only non-numeric chars were present after cleaning
  if (cleanedString === '') {
      return 0;
  }

  const parsed = parseFloat(cleanedString);
  return isNaN(parsed) ? 0 : parsed;
};


/**
 * Process facility data for charts
 * @param {Facility[]} facilitiesData - Array of facility objects
 * @returns {ProcessedChartData} Processed data for charts
 */
export const processFacilityData = (facilitiesData: Facility[]): ProcessedChartData => {
  if (!facilitiesData || !Array.isArray(facilitiesData) || facilitiesData.length === 0) {
    console.warn('Invalid or empty facilities data provided to processFacilityData');
    return {
      capacityByStatus: { operating: 0, construction: 0, planned: 0 },
      technologies: {},
      regions: {}
    };
  }

  console.log('Processing facility data:', facilitiesData);

  // Initialize with types
  const capacityByStatus: CapacityByStatus = {
    operating: 0,
    construction: 0,
    planned: 0
  };

  const technologies: StringCountMap = {};
  const regions: StringCountMap = {};

  facilitiesData.forEach((facility: Facility) => {
    // Process capacity by status
    if (facility.status) {
      const status: string = facility.status.toLowerCase();
      console.log(`Processing facility ${facility.name} with status: ${status}, volume: ${facility.volume}`);

      const volume: number = parseVolume(facility.volume); // Use helper to parse volume
      if (!isNaN(volume)) {
        // Map status to one of our three categories if it doesn't match exactly
        let statusKey: string = status;
        if (status.includes('operat')) {
          statusKey = 'operating';
        } else if (status.includes('construct')) {
          statusKey = 'construction';
        } else if (status.includes('plan')) {
          statusKey = 'planned';
        }

        // Initialize the category if it doesn't exist (though already initialized above)
        if (capacityByStatus[statusKey] === undefined) {
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

  // Ensure all required status categories exist (already done by initialization type)
  // const requiredStatuses: string[] = ['operating', 'construction', 'planned'];
  // requiredStatuses.forEach(status => {
  //   if (capacityByStatus[status] === undefined) {
  //     capacityByStatus[status] = 0;
  //   }
  // });

  const result: ProcessedChartData = {
    capacityByStatus,
    technologies,
    regions
  };

  console.log('Processed data result:', result);
  return result;
};

/**
 * Get chart colors for consistent styling
 * @returns {ChartColors} Chart colors
 */
export const getChartColors = (): ChartColors => {
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

// Define a type for Chart.js configuration, importing necessary types
type ChartJsConfig = ChartConfiguration; // Use ChartConfiguration for better typing

/**
 * Create a capacity chart configuration
 * @param {CapacityByStatus} capacityByStatus - Capacity data by status
 * @returns {ChartJsConfig} Chart configuration
 */
export const createCapacityChartConfig = (capacityByStatus: CapacityByStatus): ChartJsConfig => {
  const colors: ChartColors = getChartColors();

  console.log('Creating capacity chart config with data:', capacityByStatus);

  // Ensure we have valid data values
  const operatingValue: number = Number(capacityByStatus.operating || 0);
  const constructionValue: number = Number(capacityByStatus.construction || 0);
  const plannedValue: number = Number(capacityByStatus.planned || 0);

  console.log('Capacity values:', { operatingValue, constructionValue, plannedValue });

  return {
    type: 'bar', // Type remains 'bar'
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
            // Explicitly type the context parameter for the tooltip callback
            label: function(context: TooltipItem<'bar'>): string {
              // Ensure context.raw is treated as a number
              const value = typeof context.raw === 'number' ? context.raw : 0;
              return `${context.dataset.label}: ${value.toLocaleString()} tonnes`;
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
 * @param {StringCountMap} technologies - Technology distribution data
 * @returns {ChartJsConfig} Chart configuration
 */
export const createTechnologiesChartConfig = (technologies: StringCountMap): ChartJsConfig => {
  const colors: ChartColors = getChartColors();
  const labels: string[] = Object.keys(technologies);

  console.log('Creating technologies chart config with data:', technologies);
  console.log('Technology labels:', labels);

  // If no technologies data, provide default empty chart
  if (labels.length === 0) {
    console.warn('No technology data available for chart');
    return {
      type: 'pie', // Type remains 'pie'
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
            position: 'right' as const // Use 'as const' for literal type
          },
          tooltip: {
            callbacks: {
              label: function(): string { // No context needed here
                return 'No technology data available';
              }
            }
          }
        }
      }
    };
  }

  const dataValues: number[] = Object.values(technologies); // Explicitly type dataValues

  return {
    type: 'pie', // Type remains 'pie'
    data: {
      labels: labels,
      datasets: [{
        data: dataValues,
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
          position: 'right' as const // Use 'as const' for literal type
        },
        tooltip: {
          callbacks: {
            // Explicitly type the context parameter
            label: function(context: TooltipItem<'pie'>): string {
              // Ensure context.dataset.data exists and is an array of numbers
              const total = (context.dataset.data as number[] || []).reduce((sum, val) => sum + val, 0);
              // Ensure context.raw is treated as a number
              const value = typeof context.raw === 'number' ? context.raw : 0;
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  };
};

/**
 * Create a regions chart configuration
 * @param {StringCountMap} regions - Geographic distribution data
 * @returns {ChartJsConfig} Chart configuration
 */
export const createRegionsChartConfig = (regions: StringCountMap): ChartJsConfig => {
  const colors: ChartColors = getChartColors();
  const labels: string[] = Object.keys(regions);

  console.log('Creating regions chart config with data:', regions);
  console.log('Region labels:', labels);

  // If no regions data, provide default empty chart
  if (labels.length === 0) {
    console.warn('No region data available for chart');
    return {
      type: 'doughnut', // Type remains 'doughnut'
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
            position: 'right' as const // Use 'as const' for literal type
          },
          tooltip: {
            callbacks: {
              label: function(): string { // No context needed
                return 'No region data available';
              }
            }
          }
        }
      }
    };
  }

  const dataValues: number[] = Object.values(regions); // Explicitly type dataValues

  return {
    type: 'doughnut', // Type remains 'doughnut'
    data: {
      labels: labels,
      datasets: [{
        data: dataValues,
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
          position: 'right' as const // Use 'as const' for literal type
        },
        tooltip: {
          callbacks: {
            // Explicitly type the context parameter
            label: function(context: TooltipItem<'doughnut'>): string {
               // Ensure context.dataset.data exists and is an array of numbers
              const total = (context.dataset.data as number[] || []).reduce((sum, val) => sum + val, 0);
              // Ensure context.raw is treated as a number
              const value = typeof context.raw === 'number' ? context.raw : 0;
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  };
};