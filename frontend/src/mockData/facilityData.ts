// Mock data for facilities based on the project's sample data

// Interface for the facility statistics
interface MockFacilityStats {
  totalFacilities: number;
  operatingFacilities: number;
  constructionFacilities: number;
  plannedFacilities: number;
}

// Interface for individual facility data
interface MockFacility {
  id: string;
  name: string;
  company: string;
  status: 'operating' | 'construction' | 'planned'; // Use a union type for status
  volume: number;
  method: string;
  region: string;
}

export const mockFacilityStats: MockFacilityStats = {
  totalFacilities: 9,
  operatingFacilities: 5,
  constructionFacilities: 2,
  plannedFacilities: 2
};

export const mockFacilities: MockFacility[] = [
  {
    id: "licycle-arizona",
    name: "Li-Cycle Arizona Spoke",
    company: "Li-Cycle",
    status: "operating",
    volume: 10000,
    method: "Submerged Shredding",
    region: "Southwest"
  },
  {
    id: "licycle-alabama",
    name: "Li-Cycle Alabama Spoke",
    company: "Li-Cycle",
    status: "operating",
    volume: 5000,
    method: "Submerged Shredding",
    region: "Southeast"
  },
  {
    id: "licycle-ontario",
    name: "Li-Cycle Ontario Spoke",
    company: "Li-Cycle",
    status: "operating",
    volume: 5000,
    method: "Mechanical Processing",
    region: "Canada"
  },
  {
    id: "licycle-rochester",
    name: "Li-Cycle North American Hub",
    company: "Li-Cycle",
    status: "planned",
    volume: 35000,
    method: "Hydrometallurgical",
    region: "Northeast"
  },
  {
    id: "licycle-ohio",
    name: "Li-Cycle Ohio Spoke",
    company: "Li-Cycle",
    status: "construction",
    volume: 15000,
    method: "Mechanical Processing",
    region: "Midwest"
  },
  {
    id: "redwood-nevada",
    name: "Redwood Materials Nevada Campus",
    company: "Redwood Materials",
    status: "operating",
    volume: 40000,
    method: "Hydrometallurgical",
    region: "West"
  },
  {
    id: "redwood-carolina",
    name: "Redwood Materials South Carolina Campus",
    company: "Redwood Materials",
    status: "construction",
    volume: 30000,
    method: "Hydrometallurgical",
    region: "Southeast"
  },
  {
    id: "cirba-ohio",
    name: "Cirba Solutions Ohio Facility",
    company: "Cirba Solutions",
    status: "operating",
    volume: 20000,
    method: "Black Mass Production",
    region: "Midwest"
  },
  {
    id: "cirba-southcarolina",
    name: "Cirba Solutions South Carolina Facility",
    company: "Cirba Solutions",
    status: "planned",
    volume: 60000,
    method: "Battery Recycling",
    region: "Southeast"
  }
];