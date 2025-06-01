// Additional chart configurations for enhanced charts page
import { ChartConfiguration, TooltipItem } from 'chart.js';
import { getTechnologyCategoryColor } from './technologyUtils';

interface StringCountMap {
  [key: string]: number;
}

interface YearlyTrendsData {
  years: string[];
  operatingCapacity: number[];
  constructionCapacity: number[];
  plannedCapacity: number[];
}

type ChartJsConfig = ChartConfiguration;

/**
 * Create a capacity by technology chart configuration (horizontal bar chart)
 */
export const createCapacityByTechnologyChartConfig = (capacityByTechnology: StringCountMap): ChartJsConfig => {
  const labels = Object.keys(capacityByTechnology);
  const dataValues = Object.values(capacityByTechnology);
  
  if (labels.length === 0) {
    return {
      type: 'bar',
      data: {
        labels: ['No Data'],
        datasets: [{
          label: 'Capacity (tonnes/year)',
          data: [0],
          backgroundColor: ['rgba(200, 200, 200, 0.7)'],
          borderColor: ['rgb(200, 200, 200)'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y' as const,
        plugins: {
          legend: { display: false }
        }
      }
    };
  }

  const backgroundColors = labels.map(category => {
    const color = getTechnologyCategoryColor(category);
    return color.replace('rgb', 'rgba').replace(')', ', 0.7)');
  });
  
  const borderColors = labels.map(category => getTechnologyCategoryColor(category));

  return {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Capacity (tonnes/year)',
        data: dataValues,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y' as const,
      plugins: {
        legend: { display: false },
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
        x: {
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
 * Create a yearly trends line chart configuration
 */
export const createYearlyTrendsChartConfig = (yearlyTrends: YearlyTrendsData): ChartJsConfig => {
  const { years, operatingCapacity, constructionCapacity, plannedCapacity } = yearlyTrends;
  
  if (years.length === 0) {
    return {
      type: 'line',
      data: {
        labels: ['No Data'],
        datasets: [{
          label: 'No Data',
          data: [0],
          borderColor: 'rgb(200, 200, 200)',
          backgroundColor: 'rgba(200, 200, 200, 0.2)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true }
        }
      }
    };
  }

  return {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        {
          label: 'Operating',
          data: operatingCapacity,
          borderColor: 'rgb(76, 175, 80)',
          backgroundColor: 'rgba(76, 175, 80, 0.2)',
          tension: 0.1,
          fill: false
        },
        {
          label: 'Under Construction',
          data: constructionCapacity,
          borderColor: 'rgb(255, 193, 7)',
          backgroundColor: 'rgba(255, 193, 7, 0.2)',
          tension: 0.1,
          fill: false
        },
        {
          label: 'Planned',
          data: plannedCapacity,
          borderColor: 'rgb(33, 150, 243)',
          backgroundColor: 'rgba(33, 150, 243, 0.2)',
          tension: 0.1,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: true,
          position: 'top' as const
        },
        tooltip: {
          callbacks: {
            label: function(context: TooltipItem<'line'>): string {
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
      interaction: {
        intersect: false,
        mode: 'index' as const
      }
    }
  };
};

/**
 * Create a stacked bar chart for status distribution
 */
export const createStatusDistributionChartConfig = (statusDistribution: StringCountMap): ChartJsConfig => {
  const labels = Object.keys(statusDistribution);
  const dataValues = Object.values(statusDistribution);
  
  if (labels.length === 0) {
    return {
      type: 'bar',
      data: {
        labels: ['No Data'],
        datasets: [{
          label: 'Facilities',
          data: [0],
          backgroundColor: ['rgba(200, 200, 200, 0.7)'],
          borderColor: ['rgb(200, 200, 200)'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        }
      }
    };
  }

  const colors = {
    'Operating': 'rgba(16, 185, 129, 0.7)',        // #10b981 (matches map markers)
    'Construction': 'rgba(245, 158, 11, 0.7)',     // #f59e0b (matches map markers)
    'Planned': 'rgba(59, 130, 246, 0.7)'          // #3b82f6 (matches map markers)
  };

  const borderColors = {
    'Operating': 'rgb(16, 185, 129)',              // #10b981
    'Construction': 'rgb(245, 158, 11)',           // #f59e0b
    'Planned': 'rgb(59, 130, 246)'                // #3b82f6
  };

  return {
    type: 'bar',
    data: {
      labels: ['Facility Status Distribution'],
      datasets: labels.map((label, index) => ({
        label,
        data: [dataValues[index]],
        backgroundColor: colors[label as keyof typeof colors] || 'rgba(200, 200, 200, 0.7)',
        borderColor: borderColors[label as keyof typeof borderColors] || 'rgb(200, 200, 200)',
        borderWidth: 1
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: true,
          position: 'top' as const
        },
        tooltip: {
          callbacks: {
            label: function(context: TooltipItem<'bar'>): string {
              const value = typeof context.raw === 'number' ? context.raw : 0;
              const total = dataValues.reduce((sum, val) => sum + val, 0);
              const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
              return `${context.dataset.label}: ${value} facilities (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        x: {
          stacked: true
        },
        y: {
          stacked: true,
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Facilities'
          }
        }
      }
    }
  };
};