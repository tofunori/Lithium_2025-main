import { ChartConfiguration, ChartData, ChartOptions, TooltipItem } from 'chart.js';
import { Facility } from '../services';
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

interface CapacityByStatus {
  operating: number;
  construction: number;
  planned: number;
  [key: string]: number;
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

/**
 * Safely parse numeric volume strings with various units
 */
export function parseVolume(volumeStr: string | number | null | undefined): number {
  if (typeof volumeStr === 'number') {
    return volumeStr;
  }
  
  if (!volumeStr || typeof volumeStr !== 'string') {
    return 0;
  }

  const cleanStr = volumeStr.toLowerCase().trim();
  const numMatch = cleanStr.match(/[\d,]+\.?\d*/);
  if (!numMatch) return 0;

  const num = parseFloat(numMatch[0].replace(/,/g, ''));
  if (isNaN(num)) return 0;

  if (cleanStr.includes('k')) return num * 1000;
  if (cleanStr.includes('m')) return num * 1000000;
  if (cleanStr.includes('b')) return num * 1000000000;
  return num;
}


/**
 * Process facility data for charts
 */
export const processFacilityData = (facilitiesData: Facility[]): ProcessedChartData => {
  if (!facilitiesData || !Array.isArray(facilitiesData) || facilitiesData.length === 0) {
    console.warn('Invalid or empty facilities data provided to processFacilityData');
    return {
      capacityByStatus: { operating: 0, construction: 0, planned: 0 },
      technologies: {},
      regions: {},
      capacityByTechnology: {},
      yearlyTrends: { years: [], operatingCapacity: [], constructionCapacity: [], plannedCapacity: [] },
      statusDistribution: {}
    };
  }

  const capacityByStatus: CapacityByStatus = {
    operating: 0,
    construction: 0,
    planned: 0
  };

  const technologies: StringCountMap = {
    'Mechanical': 0,
    'Hydrometallurgy': 0,
    'Pyrometallurgy': 0,
    'Hybrid': 0
  };
  const regions: StringCountMap = {};
  const capacityByTechnology: StringCountMap = {
    'Mechanical': 0,
    'Hydrometallurgy': 0,
    'Pyrometallurgy': 0,
    'Hybrid': 0
  };
  const statusDistribution: StringCountMap = {};
  
  const yearlyData: { [year: string]: { operating: number; construction: number; planned: number } } = {};

  facilitiesData.forEach((facility: Facility) => {
    const canonicalStatus = getCanonicalStatus(facility["Operational Status"]);
    
    const rawVolume = (facility as unknown as { capacity_tonnes_per_year?: number | string | null }).capacity_tonnes_per_year ??
                     (facility as any)["Annual Processing Capacity (tonnes/year)"];

    const volume: number = typeof rawVolume === 'number'
      ? rawVolume
      : parseVolume(rawVolume as unknown as string);

    if (canonicalStatus !== 'unknown' && volume > 0) {
      capacityByStatus[canonicalStatus] += volume;
    }

    const technologyName = facility["Primary Recycling Technology"] || 'Unknown Technology';
    const technologyCategory = getTechnologyCategory(facility);
    
    if (technologyCategory && technologyCategory !== 'Unknown') {
      technologies[technologyCategory] = (technologies[technologyCategory] || 0) + 1;
      
      if (volume > 0) {
        capacityByTechnology[technologyCategory] = (capacityByTechnology[technologyCategory] || 0) + volume;
      }
    }

    const region = facility["State/Province"] || facility.Country || 'Unknown Region';
    regions[region] = (regions[region] || 0) + 1;

    statusDistribution[canonicalStatus] = (statusDistribution[canonicalStatus] || 0) + 1;

    const commissionYear = facility.commissioning_year || facility["Commissioning Year"];
    if (commissionYear && volume > 0) {
      const year = commissionYear.toString();
      if (!yearlyData[year]) {
        yearlyData[year] = { operating: 0, construction: 0, planned: 0 };
      }
      yearlyData[year][canonicalStatus] += volume;
    }
  });

  const sortedYears = Object.keys(yearlyData).sort();
  const yearlyTrends: YearlyTrendsData = {
    years: sortedYears,
    operatingCapacity: sortedYears.map(year => yearlyData[year].operating),
    constructionCapacity: sortedYears.map(year => yearlyData[year].construction),
    plannedCapacity: sortedYears.map(year => yearlyData[year].planned)
  };

  return {
    capacityByStatus,
    technologies,
    regions,
    capacityByTechnology,
    yearlyTrends,
    statusDistribution
  };
};

/**
 * Creates pie chart configuration for status distribution
 */
export const createStatusDistributionChart = (processedData: ProcessedChartData): ChartConfiguration<'pie'> => {
  const labels = Object.keys(processedData.statusDistribution);
  const data = Object.values(processedData.statusDistribution);
  
  const colors = labels.map((status: string) => {
    const canonicalStatus = getCanonicalStatus(status) as CanonicalStatus;
    switch (canonicalStatus) {
      case 'operating': return '#10b981';
      case 'construction': return '#f59e0b';
      case 'planned': return '#3b82f6';
      default: return '#6b7280';
    }
  });

  return {
    type: 'pie',
    data: {
      labels: labels.map((status: string) => getStatusLabel(getCanonicalStatus(status))),
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: colors.map(color => color),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'pie'>) => {
              const label = context.label || '';
              const value = context.parsed;
              const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  };
};

/**
 * Creates bar chart configuration for capacity by status
 */
export const createCapacityByStatusChart = (processedData: ProcessedChartData): ChartConfiguration<'bar'> => {
  const labels = Object.keys(processedData.capacityByStatus);
  const data = Object.values(processedData.capacityByStatus);
  
  const colors = labels.map((status: string) => {
    const canonicalStatus = status as CanonicalStatus;
    switch (canonicalStatus) {
      case 'operating': return '#10b981';
      case 'construction': return '#f59e0b';
      case 'planned': return '#3b82f6';
      default: return '#6b7280';
    }
  });

  return {
    type: 'bar',
    data: {
      labels: labels.map((status: string) => getStatusLabel(status as CanonicalStatus)),
      datasets: [{
        label: 'Capacity (tonnes/year)',
        data,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Capacity (tonnes/year)'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'bar'>) => {
              const value = context.parsed.y;
              return `Capacity: ${value.toLocaleString()} tonnes/year`;
            }
          }
        }
      }
    }
  };
};

/**
 * Creates technology distribution chart configuration
 */
export const createTechnologyDistributionChart = (processedData: ProcessedChartData): ChartConfiguration<'doughnut'> => {
  const nonZeroTechs = Object.entries(processedData.technologies)
    .filter(([, count]) => count > 0);
  
  const labels = nonZeroTechs.map(([tech]) => tech);
  const data = nonZeroTechs.map(([, count]) => count);
  
  const colors = labels.map(tech => getTechnologyCategoryColor(tech));

  return {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'doughnut'>) => {
              const label = context.label || '';
              const value = context.parsed;
              const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} facilities (${percentage}%)`;
            }
          }
        }
      }
    }
  };
};

/**
 * Creates regional distribution chart configuration
 */
export const createRegionalDistributionChart = (processedData: ProcessedChartData): ChartConfiguration<'bar'> => {
  const sortedRegions = Object.entries(processedData.regions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  
  const labels = sortedRegions.map(([region]) => region);
  const data = sortedRegions.map(([, count]) => count);

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Number of Facilities',
        data,
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      indexAxis: 'y' as const,
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Facilities'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  };
};

/**
 * Creates yearly trends chart configuration
 */
export const createYearlyTrendsChart = (processedData: ProcessedChartData): ChartConfiguration<'line'> => {
  const { yearlyTrends } = processedData;
  
  return {
    type: 'line',
    data: {
      labels: yearlyTrends.years,
      datasets: [
        {
          label: 'Operating',
          data: yearlyTrends.operatingCapacity,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.1
        },
        {
          label: 'Under Construction',
          data: yearlyTrends.constructionCapacity,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.1
        },
        {
          label: 'Planned',
          data: yearlyTrends.plannedCapacity,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Capacity (tonnes/year)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Year'
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  };
};

/**
 * Creates capacity by technology chart configuration
 */
export const createCapacityByTechnologyChart = (processedData: ProcessedChartData): ChartConfiguration<'bar'> => {
  const nonZeroCapacities = Object.entries(processedData.capacityByTechnology)
    .filter(([, capacity]) => capacity > 0);
  
  const labels = nonZeroCapacities.map(([tech]) => tech);
  const data = nonZeroCapacities.map(([, capacity]) => capacity);
  const colors = labels.map(tech => getTechnologyCategoryColor(tech));

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Capacity (tonnes/year)',
        data,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Capacity (tonnes/year)'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'bar'>) => {
              const value = context.parsed.y;
              return `Capacity: ${value.toLocaleString()} tonnes/year`;
            }
          }
        }
      }
    }
  };
};

export {
  createCapacityByTechnologyChartConfig,
  createYearlyTrendsChartConfig,
  createStatusDistributionChartConfig
};