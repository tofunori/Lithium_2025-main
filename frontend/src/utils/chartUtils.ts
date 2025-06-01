// frontend/src/utils/chartUtils.ts
import { ChartConfiguration, ChartData, ChartOptions, TooltipItem } from 'chart.js';
import { Facility } from '../services'; // Import the correct Facility interface
import {
  CanonicalStatus,
  getCanonicalStatus,
  getStatusLabel
} from './statusUtils';
import { getTechnologyCategory, getTechnologyCategoryColor } from './technologyUtils';
import { 
  createCapacityByTechnologyChartConfig,
  createYearlyTrendsChartConfig,
  createStatusDistributionChartConfig
} from './newChartConfigs';

/**
 * Utility functions for chart data processing and initialization
 */

// REMOVED internal Facility interface definition

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
  capacityByTechnology: StringCountMap;
  yearlyTrends: YearlyTrendsData;
  statusDistribution: StringCountMap;
}

interface YearlyTrendsData {
  years: string[];
  operatingCapacity: number[];
  constructionCapacity: number[];
  plannedCapacity: number[];
}

interface ChartColors {
  backgroundColor: string[];
  borderColor: string[];
}

// Type the function parameters and return values
/**
 * Parses a volume string or number (e.g., "20,000 tonnes per year", 18000, "Unknown", "40,000+") into a number.
 * Returns 0 for non-numeric or unparseable values.
 * @param volumeInput - The volume value (string or number or undefined/null)
 * @returns The parsed volume as a number, or 0 if invalid.
 */
// Export the function
export const parseVolume = (volumeInput: string | number | undefined | null): number => {
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
 * @param {Facility[]} facilitiesData - Array of facility objects matching the ChartUtilsFacility interface
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

  console.log('Processing facility data for charts:', facilitiesData);

  // Initialize with types
  const capacityByStatus: CapacityByStatus = {
    operating: 0,
    construction: 0,
    planned: 0
  };

  const technologies: StringCountMap = {};
  const regions: StringCountMap = {};
  const capacityByTechnology: StringCountMap = {};
  const statusDistribution: StringCountMap = {};
  
  // For yearly trends - simplified version using operational year if available
  const yearlyData: { [year: string]: { operating: number; construction: number; planned: number } } = {};

  // Use the imported Facility interface
  facilitiesData.forEach((facility: Facility) => {
    // Use correct DB column name "Operational Status"
    const canonicalStatus = getCanonicalStatus(facility["Operational Status"]);
    
    // Extract the numeric capacity for all facilities (regardless of status)
    const rawVolume = (facility as unknown as { capacity_tonnes_per_year?: number | string | null }).capacity_tonnes_per_year ??
                     (facility as any)["Annual Processing Capacity (tonnes/year)"]; // legacy CSV / mock field

    // Convert to number in a safe way (handles strings such as "20,000" or "Unknown")
    const volume: number = typeof rawVolume === 'number'
      ? rawVolume
      : parseVolume(rawVolume as unknown as string);

    // Only aggregate capacity for known, non-'unknown' statuses
    if (canonicalStatus !== 'unknown') {
      if (volume > 0) {
         capacityByStatus[canonicalStatus] += volume;
         // Add detailed log for aggregation step
         console.log(`[chartUtils] Aggregating: Status=${canonicalStatus}, Volume=${volume}. Current totals: operating=${capacityByStatus.operating}, construction=${capacityByStatus.construction}, planned=${capacityByStatus.planned}`);
      } else {
         // console.log(`Facility ${facility.ID} has zero or invalid volume: ${facility["Annual Processing Capacity (tonnes/year)"]}`);
      }
    } else {
       // console.log(`Facility ${facility.ID} has status '${facility["Operational Status"]}', mapped to 'unknown'. Skipping capacity aggregation.`);
    }

    // Process technology distribution using standardized categories instead of raw names
    // Use correct DB column name "Primary Recycling Technology"
    const technologyName = facility["Primary Recycling Technology"] || 'Unknown Technology';
    
    // Use the technology_category field if available, otherwise determine it from the technology name
    const technologyCategory = facility.technology_category || getTechnologyCategory(technologyName);
    
    // Count by category rather than individual technology names
    technologies[technologyCategory] = (technologies[technologyCategory] || 0) + 1;
    
    // Track capacity by technology
    if (volume > 0) {
      capacityByTechnology[technologyCategory] = (capacityByTechnology[technologyCategory] || 0) + volume;
    }
    
    // Track status distribution
    if (canonicalStatus !== 'unknown') {
      statusDistribution[getStatusLabel(canonicalStatus)] = (statusDistribution[getStatusLabel(canonicalStatus)] || 0) + 1;
    }
    
    // Track yearly trends (simplified - using current year as example)
    const currentYear = new Date().getFullYear().toString();
    if (!yearlyData[currentYear]) {
      yearlyData[currentYear] = { operating: 0, construction: 0, planned: 0 };
    }
    if (volume > 0 && canonicalStatus !== 'unknown') {
      yearlyData[currentYear][canonicalStatus] += volume;
    }

    // Process geographic distribution
    // Use correct DB column name "Location"
    // Basic region extraction (e.g., taking state/province if available) - adjust as needed
    let regionName = 'Unknown Region';
    if (facility.Location) {
        const parts = facility.Location.split(',').map(p => p.trim());
        // Attempt to get state/province (often the second to last part) or country (last part)
        if (parts.length >= 2) {
            regionName = parts[parts.length - 2]; // Assuming State/Province is second to last
            // Basic check if it looks like a country instead (e.g., USA, Canada)
            if (regionName.length <= 3 && regionName === regionName.toUpperCase()) {
                 regionName = parts[parts.length - 1]; // Fallback to country if state looks like country code
            }
        } else if (parts.length === 1) {
            regionName = parts[0]; // Use the whole location if only one part
        }
    }
    regions[regionName] = (regions[regionName] || 0) + 1;
  });

  // Process yearly trends data
  const years = Object.keys(yearlyData).sort();
  const yearlyTrends: YearlyTrendsData = {
    years,
    operatingCapacity: years.map(year => yearlyData[year].operating),
    constructionCapacity: years.map(year => yearlyData[year].construction),
    plannedCapacity: years.map(year => yearlyData[year].planned)
  };

  const result: ProcessedChartData = {
    capacityByStatus,
    technologies,
    regions,
    capacityByTechnology,
    yearlyTrends,
    statusDistribution
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

  // Define standard colors matching HomePage
  const standardColors = {
    operating: 'rgba(76, 175, 80, 0.7)', // Green
    construction: 'rgba(255, 193, 7, 0.7)', // Amber
    planned: 'rgba(33, 150, 243, 0.7)', // Blue
    unknown: 'rgba(108, 117, 125, 0.7)' // Grey - not used in this chart currently
  };
  const standardBorderColors = {
    operating: 'rgb(76, 175, 80)',
    construction: 'rgb(255, 193, 7)',
    planned: 'rgb(33, 150, 243)',
    unknown: 'rgb(108, 117, 125)'
  };

  // Get labels using utility function for consistency
  const chartLabels = [
      getStatusLabel('operating'),
      getStatusLabel('construction'), // Will be "Under construction"
      getStatusLabel('planned')
  ];

  return {
    type: 'bar',
    data: {
      labels: chartLabels, // Use standardized labels
      datasets: [{
        label: 'Processing Capacity (tonnes/year)',
        data: [operatingValue, constructionValue, plannedValue],
        // Use standard colors in the correct order
        backgroundColor: [
          standardColors.operating,
          standardColors.construction,
          standardColors.planned
        ],
        borderColor: [
          standardBorderColors.operating,
          standardBorderColors.construction,
          standardBorderColors.planned
        ],
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
          beginAtZero: true, // Restore linear scale starting at zero
          // type: 'logarithmic', // Revert from logarithmic
          title: {
            display: true,
            text: 'Tonnes per Year'
          }
        }
      }
    }
  };

  // Define the config object
  const config: ChartJsConfig = {
    type: 'bar' as const, // Use 'as const' to assert the literal type 'bar'
    data: {
      labels: chartLabels,
      datasets: [{
        label: 'Processing Capacity (tonnes/year)',
        data: [operatingValue, constructionValue, plannedValue],
        backgroundColor: [
          standardColors.operating,
          standardColors.construction,
          standardColors.planned
        ],
        borderColor: [
          standardBorderColors.operating,
          standardBorderColors.construction,
          standardBorderColors.planned
        ],
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
            label: function(context: TooltipItem<'bar'>): string {
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
  // REMOVED final console.log

  return config;
};

/**
 * Create a technologies chart configuration
 * @param {StringCountMap} technologies - Technology distribution data
 * @returns {ChartJsConfig} Chart configuration
 */
export const createTechnologiesChartConfig = (technologies: StringCountMap): ChartJsConfig => {
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
  
  // Generate background colors based on technology category
  const backgroundColors = labels.map(category => {
    const color = getTechnologyCategoryColor(category);
    return color.replace('rgb', 'rgba').replace(')', ', 0.7)');
  });
  
  // Generate border colors (solid version of background colors)
  const borderColors = labels.map(category => getTechnologyCategoryColor(category));

  return {
    type: 'pie', // Type remains 'pie'
    data: {
      labels: labels,
      datasets: [{
        data: dataValues,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
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

// Re-export the new chart configurations
export { createCapacityByTechnologyChartConfig, createYearlyTrendsChartConfig, createStatusDistributionChartConfig };
