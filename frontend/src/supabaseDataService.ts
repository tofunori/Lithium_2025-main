// frontend/src/supabaseDataService.ts
import { supabase } from './supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';
import { FileObject } from '@supabase/storage-js';
import { getCanonicalStatus } from './utils/statusUtils';

// --- NEW Interface Definition (Flat Structure) ---
// Matches the exact column names from the database log
export interface Facility {
  ID: string;
  Company: string | null;
  "Facility Name/Site": string | null;
  Location: string | null;
  "Operational Status": string | null;
  "Primary Recycling Technology": string | null;
  technology_category: string | null; // Added standardized technology category
  "Annual Processing Capacity (tonnes/year)": number | null; // Expect number after parsing
  Latitude: number | null; // Expect number after parsing
  Longitude: number | null; // Expect number after parsing
  "Key Sources/Notes": string | null;
  capacity_tonnes_per_year: number | null; // Added new numeric column
  created_at?: string;
  // Add other potential columns if they exist in your DB and are needed
  website?: string | null;
  feedstock?: string | null;
  product?: string | null;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  jobs?: number | null;
  investment_usd?: number | null;
  ev_equivalent_per_year?: number | null;
  timeline?: any;
  images?: any;
  documents?: any;
  environmentalImpact?: any;
}

// --- UPDATED FacilityStats Interface ---
export interface FacilityStats {
   totalFacilities: number;
   operatingFacilities: number;
   constructionFacilities: number;
   plannedFacilities: number;
}

// Keep FacilityTimelineEvent if used by FacilityFormData
export interface FacilityTimelineEvent {
  date: string | number;
  event: string;
  description?: string;
}

// --- UPDATED FacilityFormData Interface (Flat Structure for Forms) ---
// Maps form field names (often camelCase) to DB column names (often PascalCase or with spaces)
export interface FacilityFormData {
  id?: string; // Corresponds to DB 'ID'
  company_name?: string | null; // Corresponds to DB 'Company'
  facility_name_site?: string | null; // Corresponds to DB 'Facility Name/Site'
  address?: string | null; // Corresponds to DB 'Location'
  status_name?: string | null; // Corresponds to DB 'Operational Status'
  technology_name?: string | null; // Corresponds to DB 'Primary Recycling Technology'
  technology_category?: string | null; // Corresponds to DB 'technology_category'
  processing_capacity_mt_year?: number | string | null; // Corresponds to DB 'Annual Processing Capacity (tonnes/year)'
  latitude?: number | string | null; // Corresponds to DB 'Latitude'
  longitude?: number | string | null; // Corresponds to DB 'Longitude'
  notes?: string | null; // Corresponds to DB 'Key Sources/Notes'

  // Include other fields if they map to DB columns or are handled separately
  status_effective_date_text?: string | null;
  ev_equivalent_per_year?: number | string | null;
  jobs?: number | string | null;
  investment_usd?: number | string | null; // Often handled via nested 'investment' in forms
  technology_description?: string | null;

  timeline?: FacilityTimelineEvent[];
  images?: string[];
  documents?: any[];
  environmentalImpact?: { details?: string };
  investment?: { total?: number | string | null }; // Keep nested for form structure
  website?: string | null;
  feedstock?: string | null;
  product?: string | null;
  contactPerson?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

// --- UPDATED Storage Interfaces ---
// Represents either a file or a folder in storage
export interface StorageItem {
  name: string;
  path: string; // Full path from the bucket root
  type: 'file' | 'folder';
  url?: string | null; // Only files have URLs
  metadata?: FileObject['metadata']; // Only files have metadata in listFiles result
  created_at?: string;
  updated_at?: string;
  last_accessed_at?: string;
  id?: string | null; // Supabase FileObject ID (null for folders)
}

// Keep original StorageFile for compatibility if needed elsewhere, though StorageItem is preferred now
export interface StorageFile extends StorageItem {
  type: 'file';
  url: string | null; // Make non-optional for files? Revisit if needed.
}


// --- Helper Functions (Keep as is) ---
const handleSupabaseError = (error: PostgrestError | null, context: string): void => {
  if (error) {
    console.error(`Supabase error in ${context}:`, error.message, `(Code: ${error.code})`, error.details);
    throw new Error(`Supabase error in ${context}: ${error.message}`);
  }
};

const handleStorageError = (error: Error | null, context: string): void => {
    if (error) {
        console.error(`Supabase Storage error in ${context}:`, error.message);
        throw new Error(`Supabase Storage error in ${context}: ${error.message}`);
    }
};

const getPathFromSupabaseUrl = (url: string): string | null => {
    try {
        const urlObject = new URL(url);
        const pathSegments = urlObject.pathname.split('/');
        const bucketNameIndex = pathSegments.findIndex(segment => segment === 'public'); // Adjust if using different buckets
        if (bucketNameIndex !== -1 && pathSegments.length > bucketNameIndex + 2) {
            return pathSegments.slice(bucketNameIndex + 2).join('/');
        }
        console.warn(`Could not extract path from Supabase Storage URL structure: ${url}`);
        return null;
    } catch (e) {
        console.error(`Invalid URL provided to getPathFromSupabaseUrl: ${url}`, e);
        return null;
    }
};


// --- REWRITTEN Supabase Service Functions (Database) ---

// Function to get all facilities with the flat structure
export const getFacilities = async (): Promise<Facility[]> => {
    console.log("Attempting to fetch facilities from Supabase (flat structure)...");
    try {
        const { data, error } = await supabase
            .from('facilities')
            .select('*');

        handleSupabaseError(error, 'getFacilities');
        if (!data) {
            console.warn("Supabase returned null data for getFacilities query.");
            return [];
        }
        console.log(`Successfully fetched ${data.length} facilities (flat) from Supabase.`);

        // Explicitly parse potentially text columns to numbers using correct DB column names
        const parsedData = data.map(facility => {
            const capacityString = facility["Annual Processing Capacity (tonnes/year)"];
            const latitudeString = facility.Latitude;
            const longitudeString = facility.Longitude;

            const parsedFacility: Partial<Facility> = { // Use Partial<Facility> for intermediate object
                ...facility,
                Latitude: latitudeString !== null && typeof latitudeString === 'string'
                    ? parseFloat(latitudeString)
                    : typeof latitudeString === 'number' ? latitudeString : null,
                Longitude: longitudeString !== null && typeof longitudeString === 'string'
                    ? parseFloat(longitudeString)
                    : typeof longitudeString === 'number' ? longitudeString : null,
                "Annual Processing Capacity (tonnes/year)": capacityString !== null && typeof capacityString === 'string'
                    ? parseFloat(capacityString)
                    : typeof capacityString === 'number' ? capacityString : null,
            };

            // Handle potential NaN results from parseFloat
            parsedFacility.Latitude = isNaN(parsedFacility.Latitude as number) ? null : parsedFacility.Latitude;
            parsedFacility.Longitude = isNaN(parsedFacility.Longitude as number) ? null : parsedFacility.Longitude;
            parsedFacility["Annual Processing Capacity (tonnes/year)"] = isNaN(parsedFacility["Annual Processing Capacity (tonnes/year)"] as number) ? null : parsedFacility["Annual Processing Capacity (tonnes/year)"];

            return parsedFacility;
        });

        return parsedData as Facility[];
    } catch (error: unknown) {
        console.error("Caught error in getFacilities:", error instanceof Error ? error.message : error);
        throw error;
    }
};

// Function to get a single facility by ID with the flat structure
export const getFacilityById = async (facilityId: string): Promise<Facility | null> => {
  console.log(`Attempting to fetch facility with ID: ${facilityId} from Supabase (flat)...`);
  if (!facilityId) {
      console.error("getFacilityById error: facilityId is required.");
      return null;
  }
  try {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('ID', facilityId) // Use uppercase ID
      .maybeSingle();

    handleSupabaseError(error, `getFacilityById (ID: ${facilityId})`);
    if (!data) {
      console.log(`Facility with ID ${facilityId} not found.`);
      return null;
    }
    console.log(`Successfully fetched facility ${facilityId}.`);

    // Parse coordinate/capacity data similar to getFacilities
     const capacityString = data["Annual Processing Capacity (tonnes/year)"];
     const latitudeString = data.Latitude;
     const longitudeString = data.Longitude;

     const parsedData: Partial<Facility> = { // Use Partial<Facility>
         ...data,
         Latitude: latitudeString !== null && typeof latitudeString === 'string'
             ? parseFloat(latitudeString)
             : typeof latitudeString === 'number' ? latitudeString : null,
         Longitude: longitudeString !== null && typeof longitudeString === 'string'
             ? parseFloat(longitudeString)
             : typeof longitudeString === 'number' ? longitudeString : null,
         "Annual Processing Capacity (tonnes/year)": capacityString !== null && typeof capacityString === 'string'
             ? parseFloat(capacityString)
             : typeof capacityString === 'number' ? capacityString : null,
     };

     parsedData.Latitude = isNaN(parsedData.Latitude as number) ? null : parsedData.Latitude;
     parsedData.Longitude = isNaN(parsedData.Longitude as number) ? null : parsedData.Longitude;
     parsedData["Annual Processing Capacity (tonnes/year)"] = isNaN(parsedData["Annual Processing Capacity (tonnes/year)"] as number) ? null : parsedData["Annual Processing Capacity (tonnes/year)"];

    return parsedData as Facility;
  } catch (error: unknown) {
    console.error(`Caught error in getFacilityById (ID: ${facilityId}):`, error instanceof Error ? error.message : error);
    throw error;
  }
};

// Function to get facilities filtered by status_name (using the correct DB column name)
export const getFacilitiesByStatus = async (status: string): Promise<Facility[]> => {
  console.log(`Attempting to fetch facilities with status: ${status} from Supabase (flat)...`);
  if (!status) {
      console.error("getFacilitiesByStatus error: status is required.");
      return [];
  }
  try {
    // Filter by the "Operational Status" column
    const { data, error } = await supabase
      .from('facilities')
      .select('*') // Or specify columns
      .eq('"Operational Status"', status); // Use correct DB column name (quoted)

    handleSupabaseError(error, `getFacilitiesByStatus (Status: ${status})`);
    if (!data) {
      console.warn(`Supabase returned null data for getFacilitiesByStatus query (Status: ${status}).`);
      return [];
    }
    console.log(`Successfully fetched ${data.length} facilities with status ${status}.`);

    // Parse data similar to getFacilities
    const parsedData = data.map(facility => {
        const capacityString = facility["Annual Processing Capacity (tonnes/year)"];
        const latitudeString = facility.Latitude;
        const longitudeString = facility.Longitude;

        const parsedFacility: Partial<Facility> = { // Use Partial<Facility>
            ...facility,
            Latitude: latitudeString !== null && typeof latitudeString === 'string' ? parseFloat(latitudeString) : typeof latitudeString === 'number' ? latitudeString : null,
            Longitude: longitudeString !== null && typeof longitudeString === 'string' ? parseFloat(longitudeString) : typeof longitudeString === 'number' ? longitudeString : null,
            "Annual Processing Capacity (tonnes/year)": capacityString !== null && typeof capacityString === 'string' ? parseFloat(capacityString) : typeof capacityString === 'number' ? capacityString : null,
        };

        parsedFacility.Latitude = isNaN(parsedFacility.Latitude as number) ? null : parsedFacility.Latitude;
        parsedFacility.Longitude = isNaN(parsedFacility.Longitude as number) ? null : parsedFacility.Longitude;
        parsedFacility["Annual Processing Capacity (tonnes/year)"] = isNaN(parsedFacility["Annual Processing Capacity (tonnes/year)"] as number) ? null : parsedFacility["Annual Processing Capacity (tonnes/year)"];

        return parsedFacility;
    });

    return parsedData as Facility[];
  } catch (error: unknown) {
    console.error(`Caught error in getFacilitiesByStatus (Status: ${status}):`, error instanceof Error ? error.message : error);
    throw error;
  }
};

// Function to add a new facility with flat data structure
export const addFacility = async (facilityInput: FacilityFormData): Promise<{ id: string } | null> => {
  console.log(`Attempting to add facility with ID: ${facilityInput.id} to Supabase (flat)...`);
  if (!facilityInput || !facilityInput.id) {
      console.error("addFacility error: Invalid input data. Requires at least an id.", facilityInput);
      throw new Error("Invalid facility data provided for addFacility.");
  }

  // Prepare the flat object for insertion, mapping FacilityFormData to table columns
  const dataToInsert: { [key: string]: any } = {
      ID: facilityInput.id,
      Company: facilityInput.company_name ?? null,
      "Facility Name/Site": facilityInput.facility_name_site ?? null,
      Location: facilityInput.address ?? null,
      "Operational Status": facilityInput.status_name ?? null,
      "Primary Recycling Technology": facilityInput.technology_name ?? null,
      technology_category: facilityInput.technology_category ?? null, // Add the technology category field
      // Store capacity/coords as text if DB column is text, otherwise convert to number if DB is numeric
      // Store capacity/coords as text if DB column is text, otherwise convert to number if DB is numeric
      "Annual Processing Capacity (tonnes/year)": facilityInput.processing_capacity_mt_year !== null && facilityInput.processing_capacity_mt_year !== undefined
          ? String(facilityInput.processing_capacity_mt_year) // Keep updating the original text column for now
          : null,
      // Also populate the new numeric column
      capacity_tonnes_per_year: facilityInput.processing_capacity_mt_year !== null && facilityInput.processing_capacity_mt_year !== undefined && !isNaN(Number(facilityInput.processing_capacity_mt_year))
          ? Number(facilityInput.processing_capacity_mt_year)
          : null,
      Latitude: facilityInput.latitude !== null && facilityInput.latitude !== undefined
          ? String(facilityInput.latitude) // Assuming DB column is text
          : null,
      Longitude: facilityInput.longitude !== null && facilityInput.longitude !== undefined
          ? String(facilityInput.longitude) // Assuming DB column is text
          : null,
      "Key Sources/Notes": facilityInput.notes ?? null,
      // Add other direct mappings if columns exist in DB and are in FacilityFormData
      website: facilityInput.website ?? null,
      feedstock: facilityInput.feedstock ?? null,
      product: facilityInput.product ?? null,
      contactPerson: facilityInput.contactPerson ?? null,
      contactEmail: facilityInput.contactEmail ?? null,
      contactPhone: facilityInput.contactPhone ?? null,
      // investment_usd: facilityInput.investment?.total ? Number(facilityInput.investment.total) : null, // Assuming investment_usd column exists
      // jobs: facilityInput.jobs ? Number(facilityInput.jobs) : null, // Assuming jobs column exists
      // ev_equivalent_per_year: facilityInput.ev_equivalent_per_year ? Number(facilityInput.ev_equivalent_per_year) : null, // Assuming ev_equivalent_per_year column exists
  };

  // Remove undefined properties before insert
  Object.keys(dataToInsert).forEach(key => {
      if (dataToInsert[key] === undefined) {
          delete dataToInsert[key];
      }
  });

  try {
    // Use the flexible dataToInsert object directly
    const { data, error } = await supabase
      .from('facilities')
      .insert(dataToInsert)
      .select('ID') // Select uppercase ID
      .single();

    handleSupabaseError(error, `addFacility (ID: ${facilityInput.id})`);
    if (!data) {
        console.error(`Failed to add facility ${facilityInput.id}, Supabase returned null data.`);
        return null;
    }
    console.log(`Successfully added facility with ID: ${data.ID}.`);
    // Return lowercase 'id' as per the function's original Promise signature convention
    return { id: data.ID };
  } catch (error: unknown) {
    console.error(`Caught error in addFacility (ID: ${facilityInput.id}):`, error instanceof Error ? error.message : error);
    throw error;
  }
};

// Function to update an existing facility with flat data structure
export const updateFacility = async (facilityId: string, updatedData: FacilityFormData): Promise<void> => {
  console.log(`Attempting to update facility with ID: ${facilityId} in Supabase (flat)...`);
  if (!facilityId || !updatedData) {
      console.error("updateFacility error: facilityId and updatedData are required.");
      throw new Error("Invalid input for updateFacility.");
  }

  // Prepare the flat object for update, mapping FacilityFormData to table columns
  const dataToUpdate: { [key: string]: any } = {};

  // Map only the fields present in updatedData to their corresponding DB columns
  if (updatedData.company_name !== undefined) dataToUpdate['Company'] = updatedData.company_name ?? null;
  if (updatedData.facility_name_site !== undefined) dataToUpdate['Facility Name/Site'] = updatedData.facility_name_site ?? null;
  if (updatedData.address !== undefined) dataToUpdate['Location'] = updatedData.address ?? null;
  if (updatedData.status_name !== undefined) dataToUpdate['Operational Status'] = updatedData.status_name ?? null;
  // Update both capacity columns if the form data is provided
  if (updatedData.processing_capacity_mt_year !== undefined) {
      dataToUpdate['Annual Processing Capacity (tonnes/year)'] = updatedData.processing_capacity_mt_year ? String(updatedData.processing_capacity_mt_year) : null; // Keep updating text version
      dataToUpdate['capacity_tonnes_per_year'] = updatedData.processing_capacity_mt_year !== null && !isNaN(Number(updatedData.processing_capacity_mt_year))
          ? Number(updatedData.processing_capacity_mt_year)
          : null; // Update numeric version
  }
  if (updatedData.latitude !== undefined) dataToUpdate['Latitude'] = updatedData.latitude ? String(updatedData.latitude) : null; // Store as string if DB is text
  if (updatedData.longitude !== undefined) dataToUpdate['Longitude'] = updatedData.longitude ? String(updatedData.longitude) : null; // Store as string if DB is text
  if (updatedData.notes !== undefined) dataToUpdate['Key Sources/Notes'] = updatedData.notes ?? null;
  if (updatedData.technology_name !== undefined) dataToUpdate['Primary Recycling Technology'] = updatedData.technology_name ?? null;
  if (updatedData.technology_category !== undefined) dataToUpdate['technology_category'] = updatedData.technology_category ?? null; // Handle technology_category updates
  // if (updatedData.technology_description !== undefined) dataToUpdate['technology_description'] = updatedData.technology_description ?? null; // REVERTED - Column does not exist in DB

  // Add other mappings as needed - COMMENTED OUT potentially non-existent columns based on error feedback
  // if (updatedData.website !== undefined) dataToUpdate['website'] = updatedData.website ?? null;
  // if (updatedData.feedstock !== undefined) dataToUpdate['feedstock'] = updatedData.feedstock ?? null;
  // if (updatedData.product !== undefined) dataToUpdate['product'] = updatedData.product ?? null;
  // if (updatedData.contactPerson !== undefined) dataToUpdate['contactPerson'] = updatedData.contactPerson ?? null;
  // if (updatedData.contactEmail !== undefined) dataToUpdate['contactEmail'] = updatedData.contactEmail ?? null; // Error indicated this column doesn't exist
  // if (updatedData.contactPhone !== undefined) dataToUpdate['contactPhone'] = updatedData.contactPhone ?? null;
  // if (updatedData.investment?.total !== undefined) dataToUpdate['investment_usd'] = updatedData.investment.total ? Number(updatedData.investment.total) : null;
  // if (updatedData.jobs !== undefined) dataToUpdate['jobs'] = updatedData.jobs ? Number(updatedData.jobs) : null;
  // if (updatedData.ev_equivalent_per_year !== undefined) dataToUpdate['ev_equivalent_per_year'] = updatedData.ev_equivalent_per_year ? Number(updatedData.ev_equivalent_per_year) : null;


  // Check if there's anything to update
  if (Object.keys(dataToUpdate).length === 0) {
      console.log(`No changes detected for facility ${facilityId}. Skipping update.`);
      return;
  }
    // Log the full object being sent using JSON.stringify
    console.log(`[updateFacility] Data being sent for update (ID: ${facilityId}):`, JSON.stringify(dataToUpdate, null, 2));

  try {
    const { error: updateError } = await supabase
      .from('facilities')
      .update(dataToUpdate)
      .eq('ID', facilityId); // Use uppercase ID

    handleSupabaseError(updateError, `updateFacility (ID: ${facilityId})`);
    console.log(`Successfully updated facility ${facilityId}.`);
  } catch (error: unknown) {
    console.error(`Caught error in updateFacility (ID: ${facilityId}):`, error instanceof Error ? error.message : error);
    throw error;
  }
};

// Function to delete a facility
export const deleteFacility = async (facilityId: string): Promise<void> => {
  console.log(`Attempting to delete facility with ID: ${facilityId} from Supabase...`);
  if (!facilityId) {
      console.error("deleteFacility error: facilityId is required.");
      throw new Error("Invalid input for deleteFacility.");
  }
  try {
    console.warn(`Storage items associated with facility ${facilityId} are NOT being deleted automatically yet.`);

    const { error } = await supabase
      .from('facilities')
      .delete()
      .eq('ID', facilityId); // Use uppercase ID

    handleSupabaseError(error, `deleteFacility (ID: ${facilityId})`);
    console.log(`Successfully deleted facility ${facilityId}.`);
  } catch (error: unknown) {
    console.error(`Caught error in deleteFacility (ID: ${facilityId}):`, error instanceof Error ? error.message : error);
    throw error;
  }
};

// Function to get facility statistics based on the flat structure
export const getFacilityStats = async (): Promise<FacilityStats> => {
  console.log("Attempting to calculate facility stats from Supabase (flat)...");
  try {
    // Select the columns needed for stats, using correct DB names
    const { data: facilities, error } = await supabase
        .from('facilities')
        .select('ID, "Operational Status"'); // Use correct DB column names

    handleSupabaseError(error, 'getFacilityStats - fetch all');
    if (!facilities) {
        console.warn("Supabase returned null data for getFacilityStats query.");
        return { totalFacilities: 0, operatingFacilities: 0, constructionFacilities: 0, plannedFacilities: 0 };
    }

    const totalFacilities = facilities.length;
    let operatingFacilities = 0;
    let constructionFacilities = 0;
    let plannedFacilities = 0;

    facilities.forEach(facility => {
      // Use the correct DB column name "Operational Status"
      if (facility["Operational Status"]) {
        // Map the raw status name to canonical keys
        const canonicalStatus = getCanonicalStatus(facility["Operational Status"]);
        switch (canonicalStatus) {
          case 'operating': operatingFacilities++; break;
          case 'construction': constructionFacilities++; break; // Assumes 'construction' is a valid canonical key
          case 'planned': plannedFacilities++; break;
          // 'unknown' statuses are counted in total but not in specific categories
        }
      } else {
          // Log warning if status is missing, using ID if available
          console.warn(`Facility ${facility.ID || '(unknown ID)'} missing "Operational Status" for stats calculation.`); // Use uppercase ID
      }
    });

    console.log("Successfully calculated facility stats.");
    return { totalFacilities, operatingFacilities, constructionFacilities, plannedFacilities };
  } catch (error: unknown) {
    console.error("Caught error in getFacilityStats:", error instanceof Error ? error.message : error);
    return { totalFacilities: 0, operatingFacilities: 0, constructionFacilities: 0, plannedFacilities: 0 };
  }
 };


// --- NEW Function to get distinct operational statuses ---
export const getDistinctOperationalStatuses = async (): Promise<string[]> => {
    console.log("Attempting to fetch distinct operational statuses from Supabase...");
    try {
        // Use a PostgREST function or view if available for better performance,
        // otherwise, fetch all and process client-side (less efficient for large tables).
        // For simplicity, fetching all relevant data first:
        const { data, error } = await supabase
            .from('facilities')
            .select('"Operational Status"'); // Select only the status column

        handleSupabaseError(error, 'getDistinctOperationalStatuses');

        if (!data) {
            console.warn("Supabase returned null data for getDistinctOperationalStatuses query.");
            return [];
        }

        // Extract unique, non-null statuses
        const distinctStatuses = Array.from(
            new Set(data.map(item => item['Operational Status']).filter(status => status != null))
        ) as string[]; // Filter out nulls/undefined and assert as string[]

        console.log("Distinct operational statuses found:", distinctStatuses);
        // Optionally sort the statuses
        distinctStatuses.sort();
        return distinctStatuses;

    } catch (error: unknown) {
        console.error("Caught error in getDistinctOperationalStatuses:", error instanceof Error ? error.message : error);
        throw error; // Re-throw the error
    }
};


// --- Supabase Storage Service Functions (Keep as is) ---

/**
 * Uploads a file to a specified Supabase Storage bucket.
 * @param bucket The name of the storage bucket.
 * @param path The path (including filename) where the file will be stored in the bucket.
 * @param file The File object to upload.
 * @returns A promise resolving to an object containing the storage path of the uploaded file.
 */
export const uploadFile = async (bucket: string, path: string, file: File): Promise<{ path: string }> => {
    console.log(`Attempting to upload file '${file.name}' to Supabase Storage bucket '${bucket}' at path '${path}'...`);
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });

        handleStorageError(error, `uploadFile (Bucket: ${bucket}, Path: ${path})`);

        if (!data) {
            throw new Error("Supabase storage upload returned no data.");
        }

        console.log(`Successfully uploaded file to path: ${data.path}`);
        return { path: data.path };
    } catch (error: unknown) {
        console.error(`Caught error in uploadFile (Bucket: ${bucket}, Path: ${path}):`, error instanceof Error ? error.message : error);
        throw error;
    }
};

/**
 * Deletes a file from a specified Supabase Storage bucket.
 * @param bucket - The name of the storage bucket.
 * @param path - The path of the file to delete within the bucket.
 */
export const deleteFile = async (bucket: string, path: string): Promise<void> => {
    console.log(`Attempting to delete file from Supabase Storage bucket '${bucket}' at path '${path}'...`);
    // Ensure we don't try to delete a "folder" path directly if it ends with /
    const effectivePath = path.endsWith('/') ? path.slice(0, -1) : path;
    if (!effectivePath) {
        console.warn(`Attempted to delete an empty or root path in bucket ${bucket}. Aborting.`);
        return;
    }
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .remove([effectivePath]); // Use effectivePath

        handleStorageError(error, `deleteFile (Bucket: ${bucket}, Path: ${effectivePath})`);

        if (!data || data.length === 0) {
             console.warn(`File deletion call successful, but no data returned (Bucket: ${bucket}, Path: ${effectivePath}). File might not have existed.`);
        } else {
             console.log(`Successfully initiated deletion for file at path: ${effectivePath}. Supabase response:`, data);
        }

    } catch (error: unknown) {
        console.error(`Caught error in deleteFile (Bucket: ${bucket}, Path: ${effectivePath}):`, error instanceof Error ? error.message : error);
        throw error;
    }
};

/**
 * Creates a "folder" in Supabase Storage by uploading a placeholder file.
 * @param bucket - The name of the storage bucket.
 * @param folderPath - The desired path for the folder (e.g., 'my/new/folder/'). Must end with '/'.
 */
export const createFolder = async (bucket: string, folderPath: string): Promise<void> => {
    if (!folderPath.endsWith('/')) {
        throw new Error("Folder path must end with a '/'");
    }
    // Use a common placeholder filename
    const placeholderFilePath = `${folderPath}.keep`;
    console.log(`Attempting to create folder '${folderPath}' in Supabase Storage bucket '${bucket}' by creating placeholder '${placeholderFilePath}'...`);

    try {
        // Create an empty file blob
        const emptyBlob = new Blob([''], { type: 'text/plain' });
        const placeholderFile = new File([emptyBlob], '.keep', { type: 'text/plain' });

        // Upload the placeholder file. Use upsert: true in case it already exists.
        const { error } = await supabase.storage
            .from(bucket)
            .upload(placeholderFilePath, placeholderFile, {
                cacheControl: '3600',
                upsert: true // Allows re-running without error if folder "exists"
            });

        handleStorageError(error, `createFolder (Bucket: ${bucket}, Path: ${placeholderFilePath})`);

        console.log(`Successfully created/ensured folder '${folderPath}' by creating/updating placeholder file.`);
    } catch (error: unknown) {
        console.error(`Caught error in createFolder (Bucket: ${bucket}, Path: ${folderPath}):`, error instanceof Error ? error.message : error);
        throw error;
    }
};

/**
 * Gets the public URL for a file in a Supabase Storage bucket.
 * @param bucket - The name of the storage bucket.
 * @param path - The path of the file within the bucket.
 * @returns The public URL string, or null if an error occurs or the file doesn't exist.
 */
export const getFilePublicUrl = async (bucket: string, path: string): Promise<string | null> => {
    console.log(`Attempting to get public URL for file in Supabase Storage bucket '${bucket}' at path '${path}'...`);
    try {
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        if (!data || !data.publicUrl) {
            console.warn(`Could not get public URL for (Bucket: ${bucket}, Path: ${path}). Check if file exists and bucket is public.`);
            return null;
        }

        console.log(`Successfully retrieved public URL: ${data.publicUrl}`);
        return data.publicUrl;

    } catch (error: unknown) {
        console.error(`Caught error in getFilePublicUrl (Bucket: ${bucket}, Path: ${path}):`, error instanceof Error ? error.message : error);
        return null;
    }
};


/**
 * Lists files within a specified path in a Supabase Storage bucket.
 * @param bucket - The name of the storage bucket.
 * @param pathPrefix - Optional path prefix to filter files.
 * @param options - Optional listing options (limit, offset, sortBy).
 * @returns An array of Supabase FileObject.
 */
export const listFiles = async (
    bucket: string,
    pathPrefix?: string,
    options?: { limit?: number; offset?: number; sortBy?: { column: string; order: string } }
): Promise<FileObject[]> => {
    console.log(`Attempting to list files in Supabase Storage bucket '${bucket}'${pathPrefix ? ` with prefix '${pathPrefix}'` : ''}...`);
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .list(pathPrefix, options);

        handleStorageError(error, `listFiles (Bucket: ${bucket}, Prefix: ${pathPrefix})`);

        if (!data) {
            console.warn(`Supabase storage list returned no data for (Bucket: ${bucket}, Prefix: ${pathPrefix}).`);
            return [];
        }

        console.log(`Successfully listed ${data.length} files.`);
        return data;
    } catch (error: unknown) {
        console.error(`Caught error in listFiles (Bucket: ${bucket}, Prefix: ${pathPrefix}):`, error instanceof Error ? error.message : error);
        throw error;
    }
};


// --- Convenience Functions (Adapt or Keep as is) ---

// Example: Upload a facility image
export const uploadFacilityImage = async (facilityId: string, file: File): Promise<string> => {
    const bucket = 'facility_images';
    const filePath = `${facilityId}/${Date.now()}_${file.name}`;
    const { path } = await uploadFile(bucket, filePath, file);
    const publicUrl = await getFilePublicUrl(bucket, path);
    if (!publicUrl) {
        throw new Error(`Failed to get public URL for uploaded image at path: ${path}`);
    }
    return publicUrl;
};

// Example: Delete a facility image using its public URL
export const deleteFacilityImage = async (imageUrl: string): Promise<void> => {
    const bucket = 'facility_images';
    const path = getPathFromSupabaseUrl(imageUrl);
    if (!path) {
        console.error(`Could not extract storage path from image URL: ${imageUrl}`);
        throw new Error('Invalid image URL provided for deletion.');
    }
    await deleteFile(bucket, path);
};


/**
 * Retrieves a list of items (files and folders) from Supabase storage for a given path.
 * @param bucket - The name of the storage bucket.
 * @param pathPrefix - The path prefix to list items within (e.g., 'folder/subfolder/'). Use '' for root.
 * @returns A promise that resolves to an array of StorageItem objects.
 */
export const listStorageItems = async (bucket: string, pathPrefix: string = ''): Promise<StorageItem[]> => {
    console.log(`Listing items for bucket: ${bucket}, pathPrefix: '${pathPrefix}'`);
    try {
        // Ensure pathPrefix ends with '/' if it's not empty, for consistency with listFiles behavior
        const effectivePrefix = pathPrefix && !pathPrefix.endsWith('/') ? `${pathPrefix}/` : pathPrefix;

        // Fetch raw list from Supabase
        const { data: fileObjects, error: listError } = await supabase.storage
            .from(bucket)
            .list(effectivePrefix, {
                // limit: 100, // Consider pagination for large folders later
                // offset: 0,
                sortBy: { column: 'name', order: 'asc' },
            });

        handleStorageError(listError, `listStorageItems (Bucket: ${bucket}, Prefix: ${effectivePrefix})`);

        if (!fileObjects) {
            console.warn(`Supabase storage list returned no data for (Bucket: ${bucket}, Prefix: ${effectivePrefix}).`);
            return [];
        }

        // Process the raw list into StorageItem objects
        const storageItemsPromises = fileObjects.map(async (fileObject): Promise<StorageItem | null> => {
            // Determine if it's a file or folder. Folders lack an 'id' in the response.
            const isFolder = fileObject.id === null;
            const itemType = isFolder ? 'folder' : 'file';
            const itemName = fileObject.name;

            // Skip the placeholder file used for folder creation
            if (itemName === '.keep') {
                return null;
            }

            const itemPath = effectivePrefix ? `${effectivePrefix}${itemName}` : itemName;

            let publicUrl: string | null = null;
            if (!isFolder) {
                // Get URL only for files
                try {
                    publicUrl = await getFilePublicUrl(bucket, itemPath);
                } catch (urlError) {
                    console.error(`Failed to get public URL for file ${itemPath}:`, urlError);
                }
            }
            return {
                id: fileObject.id, // Keep the ID from Supabase
                name: itemName,
                path: itemPath, // Full path from bucket root
                type: itemType,
                url: publicUrl, // Null for folders
                metadata: fileObject.metadata, // Usually null for folders in list results
                created_at: fileObject.created_at,
                updated_at: fileObject.updated_at,
                last_accessed_at: fileObject.last_accessed_at,
            };
        });

        const storageItems = (await Promise.all(storageItemsPromises))
            .filter((item): item is StorageItem => item !== null); // Filter out nulls (like .keep files)

        console.log(`Successfully listed ${storageItems.length} items for path '${effectivePrefix}'.`);
        return storageItems;

    } catch (error) {
        console.error(`Error in listStorageItems (Bucket: ${bucket}, Prefix: ${pathPrefix}):`, error);
        throw error;
    }
};

// Keep getStorageFiles for potential backward compatibility, but maybe deprecate later?
// Or update it to use listStorageItems and filter for type 'file'.
// For now, let's leave it but note it doesn't handle folders.
export const getStorageFiles = async (bucket: string, pathPrefix?: string): Promise<StorageFile[]> => {
     console.warn("DEPRECATED WARNING: getStorageFiles is deprecated and does not handle folders. Use listStorageItems instead.");
     try {
         const items = await listStorageItems(bucket, pathPrefix);
         // Filter for files and cast (might need adjustment based on StorageFile definition)
         return items.filter(item => item.type === 'file') as StorageFile[];
     } catch (error) {
         console.error(`Error in deprecated getStorageFiles (Bucket: ${bucket}, Prefix: ${pathPrefix}):`, error);
         throw error;
     }
 };


// --- NEW Tree Structure Interfaces ---
export interface TreeNode {
    name: string;
    path: string; // Path of the folder itself (e.g., 'folderA/')
    children: TreeNode[];
    // Add other properties if needed, e.g., isExpanded
}

// --- NEW Storage Tree Functions ---

/**
 * Fetches ALL items (files and folders) from a bucket.
 * WARNING: This can be slow for buckets with many items.
 * Consider implementing pagination or depth limits if performance is an issue.
 * @param bucket - The name of the storage bucket.
 * @returns A promise resolving to a flat array of all StorageItem objects in the bucket.
 */
export const getAllStorageItems = async (bucket: string): Promise<StorageItem[]> => {
    console.log(`Fetching ALL items for bucket: ${bucket}...`);
    try {
        // Supabase list() without pathPrefix lists from the root.
        // It's NOT recursive by default. We fetch everything and build the structure client-side.
        // For true recursive fetching, you'd typically need a database function or multiple list calls.
        // Let's assume list() gets everything for now, but be aware of potential limitations.
        const { data: fileObjects, error: listError } = await supabase.storage
            .from(bucket)
            .list('', { // List from root
                 limit: 10000, // Set a high limit - adjust as needed! Consider pagination for >10k items.
                 // offset: 0,
                 // sortBy: { column: 'name', order: 'asc' }, // Sorting might be less critical here
            });

        handleStorageError(listError, `getAllStorageItems (Bucket: ${bucket})`);

        if (!fileObjects) {
            console.warn(`Supabase storage list returned no data for getAllStorageItems (Bucket: ${bucket}).`);
            return [];
        }

        // Process the raw list into StorageItem objects (similar to listStorageItems)
        // This part might be redundant if listStorageItems could be adapted, but let's keep it separate for clarity
        const storageItemsPromises = fileObjects.map(async (fileObject): Promise<StorageItem | null> => {
            const isFolder = fileObject.id === null; // Folders often lack an ID in the root list
            const itemType = isFolder ? 'folder' : 'file';
            const itemName = fileObject.name;

            // Skip placeholder files if they appear at the root (unlikely but possible)
            if (itemName === '.keep') return null;

            // Path is just the name when listing from root
            const itemPath = itemName;

            // We don't necessarily need URLs for the tree view itself
            // let publicUrl: string | null = null;
            // if (!isFolder) { ... }

            return {
                id: fileObject.id,
                name: itemName,
                path: itemPath, // Path relative to the bucket root
                type: itemType,
                url: null, // Not fetching URLs here for performance
                metadata: fileObject.metadata,
                created_at: fileObject.created_at,
                updated_at: fileObject.updated_at,
                last_accessed_at: fileObject.last_accessed_at,
            };
        });

        const storageItems = (await Promise.all(storageItemsPromises))
            .filter((item): item is StorageItem => item !== null);

        console.log(`Successfully fetched ${storageItems.length} total items for bucket '${bucket}'.`);
        // NOTE: This flat list doesn't represent the hierarchy yet.
        // We need to process items with '/' in their names if list() returns nested items directly,
        // OR make multiple list() calls if it only returns top-level items.
        // Assuming list('', { recursive: true }) or similar isn't available,
        // we'll rely on the paths containing slashes if Supabase provides them.
        // If list() ONLY returns top-level, this approach needs rethinking (multiple calls).
        // Let's proceed assuming paths like 'folderA/file.txt' or 'folderA/folderB/' might be returned.

        // --- Post-processing to identify folders based on paths ---
        const allItems: StorageItem[] = [];
        const folderPaths = new Set<string>();

        storageItems.forEach(item => {
            // If an item's path contains '/', it implies parent folders exist
            const pathSegments = item.path.split('/');
            let currentFolderPath = '';
            for (let i = 0; i < pathSegments.length - 1; i++) {
                currentFolderPath += `${pathSegments[i]}/`;
                folderPaths.add(currentFolderPath);
            }
            allItems.push(item); // Add the original file/folder item
        });

        // Add folder items explicitly based on detected paths
        folderPaths.forEach(folderPath => {
             // Avoid adding duplicates if list() already returned the folder object
             if (!allItems.some(item => item.path === folderPath && item.type === 'folder')) {
                 const folderName = folderPath.split('/').filter(Boolean).pop() || '';
                 allItems.push({
                     name: folderName,
                     path: folderPath,
                     type: 'folder',
                     id: null, // Explicit folders derived from paths won't have an ID from the initial list
                 });
             }
        });

        // Remove duplicates (e.g., if list() returned 'folderA/' and we also derived it)
        const uniqueItems = Array.from(new Map(allItems.map(item => [item.path, item])).values());

        console.log(`Processed into ${uniqueItems.length} unique items including derived folders.`);
        return uniqueItems;


    } catch (error) {
        console.error(`Error in getAllStorageItems (Bucket: ${bucket}):`, error);
        throw error;
    }
};


/**
 * Builds a hierarchical tree structure from a flat list of storage items.
 * @param items - A flat array of StorageItem objects.
 * @returns An array of TreeNode objects representing the root level.
 */
export const buildFolderTree = (items: StorageItem[]): TreeNode[] => {
    const tree: TreeNode[] = [];
    const map: { [key: string]: TreeNode } = {}; // Map paths to TreeNode objects

    // Filter for folders and sort by path depth first, then alphabetically
    const folders = items
        .filter(item => item.type === 'folder')
        .sort((a, b) => {
            const depthA = a.path.split('/').filter(Boolean).length;
            const depthB = b.path.split('/').filter(Boolean).length;
            if (depthA !== depthB) {
                return depthA - depthB; // Sort by depth first
            }
            return a.path.localeCompare(b.path); // Then alphabetically
        });

    // Create nodes for each folder
    folders.forEach(folder => {
        const node: TreeNode = {
            name: folder.name,
            path: folder.path, // Path includes trailing slash
            children: [],
        };
        map[folder.path] = node; // Add to map

        // Find parent and add to its children
        const parentPathSegments = folder.path.split('/').filter(Boolean);
        parentPathSegments.pop(); // Remove self
        const parentPath = parentPathSegments.length > 0 ? `${parentPathSegments.join('/')}/` : ''; // Reconstruct parent path

        if (parentPath === '') {
            // Root level folder
            tree.push(node);
        } else {
            const parentNode = map[parentPath];
            if (parentNode) {
                // Add check to prevent adding duplicates if processing order is weird
                if (!parentNode.children.some(child => child.path === node.path)) {
                     parentNode.children.push(node);
                     // Sort children alphabetically after adding
                     parentNode.children.sort((a, b) => a.name.localeCompare(b.name));
                }
            } else {
                // Should not happen if sorted correctly, but handle potential orphans
                console.warn(`Could not find parent node for path: ${folder.path} (parent path: ${parentPath})`);
                tree.push(node); // Add to root as fallback
            }
        }
    });

     // Sort root nodes alphabetically
     tree.sort((a, b) => a.name.localeCompare(b.name));

    return tree;
};

/**
 * Moves a file within a Supabase Storage bucket.
 * NOTE: Moving folders requires recursively moving contents, which is not implemented here.
 * @param bucket - The name of the storage bucket.
 * @param sourcePath - The current path of the file to move.
 * @param destinationPath - The new path for the file.
 */
export const moveFile = async (bucket: string, sourcePath: string, destinationPath: string): Promise<void> => {
    console.log(`Attempting to move file in Supabase Storage bucket '${bucket}' from '${sourcePath}' to '${destinationPath}'...`);
    if (sourcePath === destinationPath) {
        console.warn("Source and destination paths are the same. Skipping move.");
        return;
    }
    // Basic check to prevent moving a folder directly with this function
    if (sourcePath.endsWith('/')) {
        throw new Error("Moving folders directly is not supported by this function. Use a recursive approach.");
    }
     // Prevent moving into self or non-existent parent implicitly
     if (destinationPath.startsWith(sourcePath + '/')) {
         throw new Error("Cannot move a file into itself or a subdirectory of itself.");
     }

    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .move(sourcePath, destinationPath);

        // Note: Supabase move might return an error if the destination already exists,
        // depending on bucket settings/policies. Handle potential errors.
        handleStorageError(error, `moveFile (Bucket: ${bucket}, From: ${sourcePath}, To: ${destinationPath})`);

        if (!data) {
            // This might happen even on success depending on the API version/response
            console.warn(`Move operation for '${sourcePath}' completed, but Supabase returned no data.`);
        } else {
            console.log(`Successfully initiated move for file from '${sourcePath}' to '${destinationPath}'. Supabase response:`, data);
        }

    } catch (error: unknown) {
        console.error(`Caught error in moveFile (Bucket: ${bucket}, From: ${sourcePath}, To: ${destinationPath}):`, error instanceof Error ? error.message : error);
        throw error; // Re-throw the error to be handled by the caller
    }
};


/**
 * Renames/Moves a folder and its contents within a Supabase Storage bucket.
 * This involves moving all items (files/subfolders) recursively.
 * WARNING: This can be slow and resource-intensive for large folders.
 * @param bucket - The name of the storage bucket.
 * @param oldPathPrefix - The current path prefix of the folder to rename (e.g., 'folder/to/rename/').
 * @param newPathPrefix - The desired new path prefix for the folder (e.g., 'renamed/folder/').
 */
export const renameFolder = async (bucket: string, oldPathPrefix: string, newPathPrefix: string): Promise<void> => {
    console.log(`Attempting to rename folder in Supabase Storage bucket '${bucket}' from '${oldPathPrefix}' to '${newPathPrefix}'...`);

    // Ensure prefixes end with '/' for consistency
    const oldPrefix = oldPathPrefix.endsWith('/') ? oldPathPrefix : `${oldPathPrefix}/`;
    const newPrefix = newPathPrefix.endsWith('/') ? newPathPrefix : `${newPathPrefix}/`;

    if (oldPrefix === newPrefix) {
        console.warn("Old and new folder paths are the same. Skipping rename.");
        return;
    }
    if (!oldPrefix || oldPrefix === '/') {
        throw new Error("Cannot rename the root directory.");
    }
     if (newPrefix.startsWith(oldPrefix)) {
         throw new Error("Cannot move a folder into itself.");
     }

    let copiedCount = 0;
    const copyErrors: { path: string; error: string }[] = [];
    const sourcePathsToDelete: string[] = [];

    try {
        // 1. Get all items in the bucket
        console.log(`[Rename] Fetching all items in bucket '${bucket}' to identify items under '${oldPrefix}' and '${newPrefix}'...`);
        const allItems = await getAllStorageItems(bucket);

        // 1b. Check if destination folder exists and is NOT empty (file explorer logic)
        const itemsAtDestination = allItems.filter(item => item.path.startsWith(newPrefix));
        const filesAtDestination = itemsAtDestination.filter(item => item.type === 'file');
        const nonKeepFiles = filesAtDestination.filter(item => item.name !== '.keep');
        if (nonKeepFiles.length > 0) {
            // Destination folder is NOT empty, abort like a file explorer
            throw new Error(`A folder named "${newPrefix}" already exists and is not empty. Please choose a different name.`);
        }
        // If only a .keep file exists (empty folder), delete it so rename can proceed
        const keepFile = filesAtDestination.find(item => item.name === '.keep');
        if (keepFile) {
            console.log(`[Rename] Destination folder is empty (only .keep). Deleting .keep file at ${keepFile.path}`);
            const { error: delError } = await supabase.storage
                .from(bucket)
                .remove([keepFile.path]);
            if (delError) {
                console.error(`[Rename] Error deleting .keep file at destination:`, delError);
                throw new Error(`Failed to clear empty destination folder before rename: ${delError.message}`);
            }
        }

        // 2. Filter items that are within the old folder path
        const itemsToProcess = allItems.filter(item => item.path.startsWith(oldPrefix));
        console.log(`[Rename][DEBUG] After filtering, itemsToProcess for oldPrefix '${oldPrefix}':`, itemsToProcess);

        if (itemsToProcess.length === 0) {
            // Special case: only .keep file exists (empty folder)
            const keepPath = `${oldPrefix}.keep`;
            const { data: keepData, error: keepError } = await supabase.storage
                .from(bucket)
                .list(oldPrefix);
            const hasKeep = keepData && keepData.some((file: any) => file.name === '.keep');
            if (hasKeep) {
                // Move the .keep file to the new folder
                const newKeepPath = `${newPrefix}.keep`;
                try {
                    await supabase.storage.from(bucket).move(keepPath, newKeepPath);
                    // Optionally delete the old .keep file if move doesn't do it
                } catch (moveError: any) {
                    console.error(`[Rename] Failed to move .keep file for empty folder rename: ${moveError.message}`);
                    throw new Error(`Failed to rename empty folder: ${moveError.message}`);
                }
                return;
            }
            // If no .keep file, just create the new folder
            try {
                await createFolder(bucket, newPrefix); // Ensure target folder exists
            } catch (createError) {
                console.error(`[Rename] Failed to create target folder ${newPrefix} after finding empty source ${oldPrefix}`, createError);
            }
            return;
        }

        console.log(`[Rename] Found ${itemsToProcess.length} items/sub-folders under '${oldPrefix}' to process.`);
        console.log(`[Rename][DEBUG] itemsToProcess:`, itemsToProcess);
        console.log(`[Rename][DEBUG] sourcePathsToDelete (before filter):`, sourcePathsToDelete);

        // 3. Copy each FILE item to the new location
        for (const item of itemsToProcess) {
            // Collect all original paths for later deletion
            // Ensure we don't add duplicates if getAllStorageItems returns both folder and its .keep file
             if (!sourcePathsToDelete.includes(item.path)) {
                 sourcePathsToDelete.push(item.path);
             }
             // Also explicitly add the .keep file path for folders if it wasn't listed directly
             if (item.type === 'folder' && item.path.endsWith('/')) {
                 const keepPath = `${item.path}.keep`;
                 if (!sourcePathsToDelete.includes(keepPath)) {
                    // Check if this .keep file actually exists before adding? Maybe not necessary for bulk delete.
                    console.log(`[Rename] Adding potential placeholder ${keepPath} to delete list.`);
                    sourcePathsToDelete.push(keepPath);
                 }
             }


            if (item.type === 'file') {
                const relativePath = item.path.substring(oldPrefix.length);
                const destinationPath = `${newPrefix}${relativePath}`;
                console.log(`[Rename] Copying file: ${item.path} -> ${destinationPath}`);
                try {
                    const { error: copyError } = await supabase.storage
                        .from(bucket)
                        .copy(item.path, destinationPath);

                    if (copyError) {
                        // Check for 'Duplicate' error specifically - might mean file already exists (e.g., from partial previous attempt)
                        if (copyError.message.includes('Duplicate')) {
                             console.warn(`[Rename] Copy failed for ${item.path} (Duplicate), assuming already copied.`);
                             // Continue to next item, source will be deleted later
                        } else {
                            throw copyError; // Throw other errors to be caught below
                        }
                    } else {
                         copiedCount++;
                         console.log(`[Rename] Successfully copied ${item.path} to ${destinationPath}`);
                    }
                } catch (error: any) {
                    console.error(`[Rename] Failed to copy file ${item.path} to ${destinationPath}: ${error.message}`);
                    copyErrors.push({ path: item.path, error: error.message });
                    // Stop on first copy error to prevent inconsistent state
                    throw new Error(`Failed to copy ${item.path}: ${error.message}`);
                }
            } else if (item.type === 'folder') {
                 // Ensure corresponding destination folder structure exists (using .keep file)
                 const relativePath = item.path.substring(oldPrefix.length);
                 const destinationFolderPath = `${newPrefix}${relativePath}`;
                 console.log(`[Rename] Ensuring destination folder exists: ${destinationFolderPath}`);
                 try {
                     await createFolder(bucket, destinationFolderPath);
                 } catch (createError: any) {
                      console.warn(`[Rename] Failed to explicitly create destination folder ${destinationFolderPath} (might be ok): ${createError.message}`);
                 }
            }
        }

        console.log(`[Rename] Copy phase completed. Copied ${copiedCount} files.`);
        if (copyErrors.length > 0) {
             // This part might not be reached if we throw on first error
            const errorSummary = copyErrors.map(e => `${e.path}: ${e.error}`).join('; ');
            throw new Error(`Folder rename failed during copy phase. ${copyErrors.length} errors occurred: ${errorSummary}`);
        }

        // 4. Bulk delete all original source items (files and folders/placeholders)
        // Filter out any empty strings or root path just in case
        const validSourcePathsToDelete = sourcePathsToDelete.filter(p => p && p !== '/');
        console.log(`[Rename][DEBUG] validSourcePathsToDelete (after filter):`, validSourcePathsToDelete);

        if (validSourcePathsToDelete.length > 0) {
            console.log(`[Rename] Attempting to bulk delete ${validSourcePathsToDelete.length} source items...`);
            console.log("[Rename] Source paths to delete:", validSourcePathsToDelete);
            try {
                console.log(`[Rename][DEBUG] About to delete the following source paths:`, validSourcePathsToDelete);
                const { data: deleteData, error: deleteError } = await supabase.storage
                    .from(bucket)
                    .remove(validSourcePathsToDelete);

                console.log(`[Rename][DEBUG] Supabase delete response:`, { data: deleteData, error: deleteError });

                if (deleteError) {
                    // Log the specific Supabase error
                    console.error(`[Rename] Supabase error during bulk delete of source items from ${oldPrefix}:`, deleteError);
                    // Throw a more specific error indicating partial success (copy worked, delete failed)
                    throw new Error(`Folder renamed, but failed to delete original folder contents: ${deleteError.message}. Please check storage manually.`);
                }
                if (deleteData && Array.isArray(deleteData)) {
                    console.log(`[Rename][DEBUG] Supabase reported deleted:`, deleteData);
                }
                console.log(`[Rename] Bulk delete successful. Response:`, deleteData);
            } catch (deletePhaseError: any) {
                 // Catch errors specifically from the delete operation (including the one thrown above)
                 console.error(`[Rename] Error occurred specifically during the delete phase for ${oldPrefix}:`, deletePhaseError.message);
                 // Re-throw the specific error to be handled by the caller, ensuring it indicates partial failure
                 throw new Error(`Folder rename partially failed: Could not delete original files/folder '${oldPrefix}'. Reason: ${deletePhaseError.message}`);
            }
        } else {
             console.warn("[Rename] No valid source paths collected for deletion.");
        }

        console.log(`[Rename] Folder rename process completed successfully for ${oldPrefix} -> ${newPrefix}.`);

    } catch (error: unknown) {
        // This outer catch handles errors from the copy phase or other unexpected issues before deletion attempt
        console.error(`[Rename] Caught error during rename process for prefix ${oldPrefix} (potentially before delete phase):`, error instanceof Error ? error.message : error);
        // Re-throw the original error or a wrapped error
        throw new Error(`Folder rename failed for '${oldPrefix}'. Reason: ${error instanceof Error ? error.message : String(error)}`);
    }
};



/**
 * Deletes a folder and all its contents from a Supabase Storage bucket.
 * WARNING: This is a destructive operation and cannot be undone.
 * @param bucket - The name of the storage bucket.
 * @param folderPathPrefix - The path prefix of the folder to delete (e.g., 'folder/to/delete/').
 */
export const deleteFolder = async (bucket: string, folderPathPrefix: string): Promise<void> => {
    console.log(`[Delete Folder] Attempting to delete folder and contents for prefix: ${folderPathPrefix}`);

    // Ensure prefix ends with '/' for safety and consistency
    const prefix = folderPathPrefix.endsWith('/') ? folderPathPrefix : `${folderPathPrefix}/`;

    if (!prefix || prefix === '/') {
        throw new Error("Cannot delete the root directory.");
    }

    let deletedFilesCount = 0;
    const errors: { path: string; error: string }[] = [];

    try {
        // 1. List all items under the prefix
        // Use getAllStorageItems and filter, or implement a more direct recursive list if possible
        const allItems = await getAllStorageItems(bucket);
        const itemsToDelete = allItems.filter(item => item.path.startsWith(prefix));

        if (itemsToDelete.length === 0) {
            console.warn(`[Delete Folder] No items found under path '${prefix}'. Folder might be empty or already deleted.`);
            // Attempt to delete the placeholder file just in case it exists
             const placeholderPath = `${prefix}.keep`;
             try {
                 await deleteFile(bucket, placeholderPath);
                 console.log(`[Delete Folder] Deleted placeholder file for potentially empty folder: ${placeholderPath}`);
             } catch (e) {
                 // Ignore error if placeholder doesn't exist
             }
            return;
        }

        console.log(`[Delete Folder] Found ${itemsToDelete.length} items/sub-folders under '${prefix}' to delete.`);

        // 2. Create a list of file paths to delete
        const filePathsToDelete = itemsToDelete
            .filter(item => item.type === 'file') // Only explicitly delete files
            .map(item => item.path);

        // Include the placeholder file if it exists in the list
        const placeholderPath = `${prefix}.keep`;
        if (itemsToDelete.some(item => item.path === placeholderPath)) {
             if (!filePathsToDelete.includes(placeholderPath)) {
                 filePathsToDelete.push(placeholderPath);
             }
        }

        console.log(`[Delete Folder] File paths to delete:`, filePathsToDelete);

        if (filePathsToDelete.length > 0) {
            // 3. Use Supabase's bulk remove feature
            const { data: deleteData, error: deleteError } = await supabase.storage
                .from(bucket)
                .remove(filePathsToDelete);

            if (deleteError) {
                 console.error(`[Delete Folder] Error during bulk remove for prefix ${prefix}:`, deleteError);
                 // We might still throw an error here, or log it and continue
                 throw deleteError; // Throw the error to indicate failure
            }

            // Log success/partial success based on response
            if (deleteData) {
                deletedFilesCount = deleteData.length;
                console.log(`[Delete Folder] Successfully deleted ${deletedFilesCount} files under prefix ${prefix}. Response:`, deleteData);
                // Check if any files listed in deleteData have errors? (API might provide this)
            } else {
                 console.warn(`[Delete Folder] Bulk remove call for prefix ${prefix} completed, but Supabase returned no data.`);
            }
        } else {
             console.log(`[Delete Folder] No files found to delete under prefix ${prefix}. Only folder structure might have existed.`);
        }

        // Folders are implicitly deleted when all their contents (including placeholders) are gone.

        console.log(`[Delete Folder] Folder deletion process completed for prefix: ${prefix}.`);

    } catch (error: unknown) {
        console.error(`[Delete Folder] Caught error during deletion for prefix ${prefix}:`, error instanceof Error ? error.message : error);
        // Construct a meaningful error message?
        throw new Error(`Failed to completely delete folder ${prefix}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};



 // --- REMOVED getFacilitiesWithJoins ---
 /*
export const getFacilitiesWithJoins = async (): Promise<Facility[]> => {
    console.log("Attempting to fetch facilities from Supabase with joins...");
    // ... implementation needs review based on new flat structure and potential FKs ...
};
*/
