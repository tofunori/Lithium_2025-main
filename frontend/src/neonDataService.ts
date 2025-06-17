// frontend/src/neonDataService.ts
import { createNeonClient } from './neonClient';

// --- Base Facility Interface (Core Data) ---
export interface Facility {
  ID: string;
  Company: string | null;
  "Facility Name/Site": string | null;
  Location: string | null;
  "Operational Status": string | null;
  "Primary Recycling Technology": string | null;
  technology_category: string | null;
  capacity_tonnes_per_year: number | null;
  Latitude: number | null;
  Longitude: number | null;
  created_at?: string;
}

// --- Facility Details Interface (One-to-One) ---
export interface FacilityDetails {
  facility_id: string;
  technology_description?: string | null;
  notes?: string | null;
  website?: string | null;
  feedstock?: string | null;
  product?: string | null;
  investment_usd?: string | null;
  jobs?: number | null;
  ev_equivalent_per_year?: number | null;
  environmental_impact_details?: string | null;
  status_effective_date_text?: string | null;
}

// --- Facility Timeline Event Interface (One-to-Many) ---
export interface FacilityTimelineEvent {
  id?: string;
  facility_id?: string;
  event_date: string | null;
  event_name: string | null;
  description?: string | null;
}

// --- Facility Document Interface (One-to-Many) ---
export interface FacilityDocument {
  id?: string;
  facility_id?: string;
  title?: string | null;
  url?: string | null;
}

// --- Facility Image Interface (One-to-Many) ---
export interface FacilityImage {
  id?: string;
  facility_id?: string;
  image_url?: string | null;
  alt_text?: string | null;
  order?: number | null;
}

// --- Combined Facility Data Interface ---
export interface FullFacilityData extends Facility {
  facility_details: FacilityDetails | null;
  facility_timeline_events: FacilityTimelineEvent[];
  facility_documents: FacilityDocument[];
  facility_images: FacilityImage[];
}

// --- FacilityStats Interface ---
export interface FacilityStats {
  totalFacilities: number;
  operatingFacilities: number;
  constructionFacilities: number;
  plannedFacilities: number;
}

// --- Helper Functions ---
const handleNeonError = (error: any, context: string): void => {
  if (error) {
    console.error(`Neon error in ${context}:`, error.message);
    throw new Error(`Neon error in ${context}: ${error.message}`);
  }
};

// Function to get all facilities (CORE DATA ONLY for list view)
export const getFacilities = async (): Promise<Facility[]> => {
  console.log("Attempting to fetch facilities core data from Neon...");
  const client = createNeonClient();
  
  try {
    await client.connect();
    
    const query = `
      SELECT 
        "ID",
        "Company",
        "Facility Name/Site",
        "Location",
        "Operational Status",
        "Primary Recycling Technology",
        "technology_category",
        "capacity_tonnes_per_year",
        "Latitude",
        "Longitude"
      FROM facilities
    `;
    
    const result = await client.query(query);
    console.log(`Successfully fetched ${result.rows.length} facilities from Neon.`);
    
    return result.rows.map(row => ({
      ID: row.ID,
      Company: row.Company,
      "Facility Name/Site": row["Facility Name/Site"],
      Location: row.Location,
      "Operational Status": row["Operational Status"],
      "Primary Recycling Technology": row["Primary Recycling Technology"],
      technology_category: row.technology_category,
      capacity_tonnes_per_year: row.capacity_tonnes_per_year ? Number(row.capacity_tonnes_per_year) : null,
      Latitude: row.Latitude ? Number(row.Latitude) : null,
      Longitude: row.Longitude ? Number(row.Longitude) : null,
    }));
    
  } catch (error: any) {
    console.error("Error in getFacilities:", error.message);
    throw error;
  } finally {
    await client.end();
  }
};

// Function to get a single facility by ID with ALL related details
export const getFacilityById = async (facilityId: string): Promise<FullFacilityData | null> => {
  console.log(`Attempting to fetch facility with ID: ${facilityId} and related details...`);
  if (!facilityId) {
    console.error("getFacilityById error: facilityId is required.");
    return null;
  }
  
  const client = createNeonClient();
  
  try {
    await client.connect();
    
    // Get facility core data
    const facilityQuery = `SELECT * FROM facilities WHERE "ID" = $1`;
    const facilityResult = await client.query(facilityQuery, [facilityId]);
    
    if (facilityResult.rows.length === 0) {
      console.log(`Facility with ID ${facilityId} not found.`);
      return null;
    }
    
    const facility = facilityResult.rows[0];
    
    // Get related data
    const [detailsResult, timelineResult, documentsResult, imagesResult] = await Promise.all([
      client.query(`SELECT * FROM facility_details WHERE facility_id = $1`, [facilityId]),
      client.query(`SELECT * FROM facility_timeline_events WHERE facility_id = $1`, [facilityId]),
      client.query(`SELECT * FROM facility_documents WHERE facility_id = $1`, [facilityId]),
      client.query(`SELECT * FROM facility_images WHERE facility_id = $1`, [facilityId])
    ]);
    
    const fullData: FullFacilityData = {
      ID: facility.ID,
      Company: facility.Company,
      "Facility Name/Site": facility["Facility Name/Site"],
      Location: facility.Location,
      "Operational Status": facility["Operational Status"],
      "Primary Recycling Technology": facility["Primary Recycling Technology"],
      technology_category: facility.technology_category,
      capacity_tonnes_per_year: facility.capacity_tonnes_per_year ? Number(facility.capacity_tonnes_per_year) : null,
      Latitude: facility.Latitude ? Number(facility.Latitude) : null,
      Longitude: facility.Longitude ? Number(facility.Longitude) : null,
      created_at: facility.created_at,
      facility_details: detailsResult.rows.length > 0 ? detailsResult.rows[0] : null,
      facility_timeline_events: timelineResult.rows,
      facility_documents: documentsResult.rows,
      facility_images: imagesResult.rows,
    };
    
    console.log(`Successfully fetched facility ${facilityId} with related data.`);
    return fullData;
    
  } catch (error: any) {
    console.error(`Error in getFacilityById (ID: ${facilityId}):`, error.message);
    throw error;
  } finally {
    await client.end();
  }
};

// Function to get facilities filtered by status
export const getFacilitiesByStatus = async (status: string): Promise<Facility[]> => {
  console.log(`Attempting to fetch facilities with status: ${status}...`);
  if (!status) {
    console.error("getFacilitiesByStatus error: status is required.");
    return [];
  }
  
  const client = createNeonClient();
  
  try {
    await client.connect();
    
    const query = `
      SELECT 
        "ID",
        "Company",
        "Facility Name/Site",
        "Location",
        "Operational Status",
        "Primary Recycling Technology",
        "technology_category",
        "capacity_tonnes_per_year",
        "Latitude",
        "Longitude"
      FROM facilities 
      WHERE "Operational Status" = $1
    `;
    
    const result = await client.query(query, [status]);
    console.log(`Successfully fetched ${result.rows.length} facilities with status ${status}.`);
    
    return result.rows.map(row => ({
      ID: row.ID,
      Company: row.Company,
      "Facility Name/Site": row["Facility Name/Site"],
      Location: row.Location,
      "Operational Status": row["Operational Status"],
      "Primary Recycling Technology": row["Primary Recycling Technology"],
      technology_category: row.technology_category,
      capacity_tonnes_per_year: row.capacity_tonnes_per_year ? Number(row.capacity_tonnes_per_year) : null,
      Latitude: row.Latitude ? Number(row.Latitude) : null,
      Longitude: row.Longitude ? Number(row.Longitude) : null,
    }));
    
  } catch (error: any) {
    console.error(`Error in getFacilitiesByStatus (Status: ${status}):`, error.message);
    throw error;
  } finally {
    await client.end();
  }
};

// Function to get facility statistics
export const getFacilityStats = async (): Promise<FacilityStats> => {
  console.log("Attempting to calculate facility stats from Neon...");
  const client = createNeonClient();
  
  try {
    await client.connect();
    
    const query = `SELECT "ID", "Operational Status" FROM facilities`;
    const result = await client.query(query);
    
    const totalFacilities = result.rows.length;
    let operatingFacilities = 0;
    let constructionFacilities = 0;
    let plannedFacilities = 0;
    
    result.rows.forEach(facility => {
      const status = facility["Operational Status"];
      if (status && status.toLowerCase().includes('operating')) {
        operatingFacilities++;
      } else if (status && status.toLowerCase().includes('construction')) {
        constructionFacilities++;
      } else if (status && status.toLowerCase().includes('planned')) {
        plannedFacilities++;
      }
    });
    
    console.log("Successfully calculated facility stats.");
    return { totalFacilities, operatingFacilities, constructionFacilities, plannedFacilities };
    
  } catch (error: any) {
    console.error("Error in getFacilityStats:", error.message);
    return { totalFacilities: 0, operatingFacilities: 0, constructionFacilities: 0, plannedFacilities: 0 };
  } finally {
    await client.end();
  }
};