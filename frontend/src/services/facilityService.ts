// frontend/src/services/facilityService.ts
import { supabase } from '../supabaseClient';
import { handleSupabaseError } from './errorHandling';
import { getCanonicalStatus } from '../utils/statusUtils';
import {
  Facility,
  FacilityDetails,
  FacilityFormData,
  FullFacilityData,
  FacilityStats,
  FacilityTimelineEvent
} from './types';

// Function to get all facilities (CORE DATA ONLY for list view)
export const getFacilities = async (): Promise<Facility[]> => {
  console.log("Attempting to fetch facilities core data from Supabase...");
  try {
    const selectString = `
      ID,
      Company,
      "Facility Name/Site",
      Location,
      "Operational Status",
      "Primary Recycling Technology",
      technology_category,
      capacity_tonnes_per_year,
      Latitude,
      Longitude
    `;
    const { data, error } = await supabase
      .from('facilities')
      .select(selectString);

    handleSupabaseError(error, 'getFacilities');
    if (!data) {
      console.warn("Supabase returned null data for getFacilities query.");
      return [];
    }
    console.log(`Successfully fetched ${data.length} facilities (core) from Supabase.`);

    const parsedData = data.map(facility => {
      const parsedFacility: Partial<Facility> = { ...facility };
      if (typeof parsedFacility.Latitude === 'string') parsedFacility.Latitude = parseFloat(parsedFacility.Latitude);
      if (typeof parsedFacility.Longitude === 'string') parsedFacility.Longitude = parseFloat(parsedFacility.Longitude);
      if (typeof parsedFacility.capacity_tonnes_per_year === 'string') parsedFacility.capacity_tonnes_per_year = parseFloat(parsedFacility.capacity_tonnes_per_year);

      parsedFacility.Latitude = isNaN(parsedFacility.Latitude as number) ? null : parsedFacility.Latitude;
      parsedFacility.Longitude = isNaN(parsedFacility.Longitude as number) ? null : parsedFacility.Longitude;
      parsedFacility.capacity_tonnes_per_year = isNaN(parsedFacility.capacity_tonnes_per_year as number) ? null : parsedFacility.capacity_tonnes_per_year;

      return parsedFacility;
    });

    return parsedData as Facility[];
  } catch (error: unknown) {
    console.error("Caught error in getFacilities:", error instanceof Error ? error.message : error);
    throw error;
  }
};

// Function to get a single facility by ID with ALL related details
export const getFacilityById = async (facilityId: string): Promise<FullFacilityData | null> => {
  console.log(`Attempting to fetch facility with ID: ${facilityId} and related details...`);
  if (!facilityId) {
    console.error("getFacilityById error: facilityId is required.");
    return null;
  }
  try {
    const selectString = `
      *,
      facility_details ( * ),
      facility_timeline_events ( * ),
      facility_documents ( * ),
      facility_images ( * )
    `;

    const { data, error } = await supabase
      .from('facilities')
      .select(selectString)
      .eq('ID', facilityId)
      .maybeSingle();

    handleSupabaseError(error, `getFacilityById (ID: ${facilityId})`);
    if (!data) {
      console.log(`Facility with ID ${facilityId} not found.`);
      return null;
    }
    console.log(`Successfully fetched facility ${facilityId} with related data.`);

    const timeline = data.facility_timeline_events?.map((event: any) => ({
      ...event,
      event_date: event.event_date ? String(event.event_date) : null
    })) || [];

    const fullData: FullFacilityData = {
      ID: data.ID,
      Company: data.Company,
      "Facility Name/Site": data["Facility Name/Site"],
      Location: data.Location,
      "Operational Status": data["Operational Status"],
      "Primary Recycling Technology": data["Primary Recycling Technology"],
      technology_category: data.technology_category,
      capacity_tonnes_per_year: data.capacity_tonnes_per_year ? Number(data.capacity_tonnes_per_year) : null,
      Latitude: data.Latitude ? Number(data.Latitude) : null,
      Longitude: data.Longitude ? Number(data.Longitude) : null,
      created_at: data.created_at,
      facility_details: data.facility_details ? {
        facility_id: data.facility_details.facility_id,
        technology_description: data.facility_details.technology_description ?? null,
        notes: data.facility_details.notes ?? null,
        website: data.facility_details.website ?? null,
        feedstock: data.facility_details.feedstock ?? null,
        product: data.facility_details.product ?? null,
        investment_usd: data.facility_details.investment_usd ?? null,
        jobs: data.facility_details.jobs ? Number(data.facility_details.jobs) : null,
        ev_equivalent_per_year: data.facility_details.ev_equivalent_per_year ? Number(data.facility_details.ev_equivalent_per_year) : null,
        environmental_impact_details: data.facility_details.environmental_impact_details ?? null,
        status_effective_date_text: data.facility_details.status_effective_date_text ?? null,
      } : null,
      facility_timeline_events: timeline as FacilityTimelineEvent[],
      facility_documents: data.facility_documents || [],
      facility_images: data.facility_images || [],
    };

    if (isNaN(fullData.capacity_tonnes_per_year as number)) fullData.capacity_tonnes_per_year = null;
    if (isNaN(fullData.Latitude as number)) fullData.Latitude = null;
    if (isNaN(fullData.Longitude as number)) fullData.Longitude = null;

    return fullData;
  } catch (error: unknown) {
    console.error(`Caught error in getFacilityById (ID: ${facilityId}):`, error instanceof Error ? error.message : error);
    throw error;
  }
};

// Function to get facilities filtered by status_name (CORE DATA ONLY)
export const getFacilitiesByStatus = async (status: string): Promise<Facility[]> => {
  console.log(`Attempting to fetch facilities core data with status: ${status}...`);
  if (!status) {
    console.error("getFacilitiesByStatus error: status is required.");
    return [];
  }
  try {
    const selectString = `
      ID,
      Company,
      "Facility Name/Site",
      Location,
      "Operational Status",
      "Primary Recycling Technology",
      technology_category,
      capacity_tonnes_per_year,
      Latitude,
      Longitude
    `;
    const { data, error } = await supabase
      .from('facilities')
      .select(selectString)
      .eq('"Operational Status"', status);

    handleSupabaseError(error, `getFacilitiesByStatus (Status: ${status})`);
    if (!data) {
      console.warn(`Supabase returned null data for getFacilitiesByStatus query (Status: ${status}).`);
      return [];
    }
    console.log(`Successfully fetched ${data.length} facilities (core) with status ${status}.`);

    const parsedData = data.map(facility => {
      const parsedFacility: Partial<Facility> = { ...facility };
      if (typeof parsedFacility.Latitude === 'string') parsedFacility.Latitude = parseFloat(parsedFacility.Latitude);
      if (typeof parsedFacility.Longitude === 'string') parsedFacility.Longitude = parseFloat(parsedFacility.Longitude);
      if (typeof parsedFacility.capacity_tonnes_per_year === 'string') parsedFacility.capacity_tonnes_per_year = parseFloat(parsedFacility.capacity_tonnes_per_year);
      parsedFacility.Latitude = isNaN(parsedFacility.Latitude as number) ? null : parsedFacility.Latitude;
      parsedFacility.Longitude = isNaN(parsedFacility.Longitude as number) ? null : parsedFacility.Longitude;
      parsedFacility.capacity_tonnes_per_year = isNaN(parsedFacility.capacity_tonnes_per_year as number) ? null : parsedFacility.capacity_tonnes_per_year;
      return parsedFacility;
    });

    return parsedData as Facility[];
  } catch (error: unknown) {
    console.error(`Caught error in getFacilitiesByStatus (Status: ${status}):`, error instanceof Error ? error.message : error);
    throw error;
  }
};

// Function to add a new facility and its related details
export const addFacility = async (facilityInput: FacilityFormData): Promise<{ id: string } | null> => {
  console.log(`Attempting to add facility and details to Supabase...`);
  if (!facilityInput) {
    console.error("addFacility error: Invalid input data.");
    throw new Error("Invalid facility data provided for addFacility.");
  }

  const coreDataToInsert: Omit<Facility, 'created_at'> = {
    ID: facilityInput.id || crypto.randomUUID(),
    Company: facilityInput.company_name ?? null,
    "Facility Name/Site": facilityInput.facility_name_site ?? null,
    Location: facilityInput.address ?? null,
    "Operational Status": facilityInput.status_name ?? null,
    "Primary Recycling Technology": facilityInput.technology_name ?? null,
    technology_category: facilityInput.technology_category ?? null,
    capacity_tonnes_per_year: facilityInput.processing_capacity_mt_year !== null && facilityInput.processing_capacity_mt_year !== undefined && !isNaN(Number(facilityInput.processing_capacity_mt_year))
      ? Number(facilityInput.processing_capacity_mt_year) : null,
    Latitude: facilityInput.latitude !== null && facilityInput.latitude !== undefined && !isNaN(Number(facilityInput.latitude))
      ? Number(facilityInput.latitude) : null,
    Longitude: facilityInput.longitude !== null && facilityInput.longitude !== undefined && !isNaN(Number(facilityInput.longitude))
      ? Number(facilityInput.longitude) : null,
  };

  try {
    const { data: facilityData, error: facilityError } = await supabase
      .from('facilities')
      .insert(coreDataToInsert)
      .select('ID')
      .single();

    handleSupabaseError(facilityError, `addFacility - insert core`);
    if (!facilityData) {
      console.error(`Failed to add core facility data, Supabase returned null.`);
      return null;
    }
    const facilityId = facilityData.ID;
    console.log(`Successfully added core facility with ID: ${facilityId}.`);

    if (facilityInput.details) {
      const detailsDataToInsert: Omit<FacilityDetails, 'facility_id'> & { facility_id: string } = {
        facility_id: facilityId,
        technology_description: facilityInput.details.technology_description ?? null,
        notes: facilityInput.details.notes ?? null,
        website: facilityInput.details.website ?? null,
        feedstock: facilityInput.details.feedstock ?? null,
        product: facilityInput.details.product ?? null,
        investment_usd: facilityInput.details.investment_usd !== null && facilityInput.details.investment_usd !== undefined ? String(facilityInput.details.investment_usd) : null,
        jobs: facilityInput.details.jobs !== null && facilityInput.details.jobs !== undefined && !isNaN(Number(facilityInput.details.jobs))
          ? Number(facilityInput.details.jobs) : null,
        ev_equivalent_per_year: facilityInput.details.ev_equivalent_per_year !== null && facilityInput.details.ev_equivalent_per_year !== undefined && !isNaN(Number(facilityInput.details.ev_equivalent_per_year))
          ? Number(facilityInput.details.ev_equivalent_per_year) : null,
        environmental_impact_details: facilityInput.details.environmental_impact_details ?? null,
        status_effective_date_text: facilityInput.details.status_effective_date_text ?? null,
      };
      const { error: detailsError } = await supabase
        .from('facility_details')
        .insert(detailsDataToInsert);
      handleSupabaseError(detailsError, `addFacility - insert details (ID: ${facilityId})`);
      console.log(`Successfully added details for facility ID: ${facilityId}.`);
    }

    if (facilityInput.timeline && facilityInput.timeline.length > 0) {
      const timelineDataToInsert = facilityInput.timeline
        .filter(item => item.event_name)
        .map(item => ({
          facility_id: facilityId,
          event_date: item.event_date || null,
          event_name: item.event_name,
          description: item.description ?? null,
        }));

      if (timelineDataToInsert.length > 0) {
        const { error: timelineError } = await supabase
          .from('facility_timeline_events')
          .insert(timelineDataToInsert);
        handleSupabaseError(timelineError, `addFacility - insert timeline (ID: ${facilityId})`);
        console.log(`Successfully added ${timelineDataToInsert.length} timeline events for facility ID: ${facilityId}.`);
      }
    }

    if (facilityInput.documents && facilityInput.documents.length > 0) {
      const documentDataToInsert = facilityInput.documents
        .filter(doc => doc.title || doc.url)
        .map(doc => ({
          facility_id: facilityId,
          title: doc.title ?? null,
          url: doc.url ?? null,
        }));

      if (documentDataToInsert.length > 0) {
        const { error: documentError } = await supabase
          .from('facility_documents')
          .insert(documentDataToInsert);
        handleSupabaseError(documentError, `addFacility - insert documents (ID: ${facilityId})`);
        console.log(`Successfully added ${documentDataToInsert.length} documents for facility ID: ${facilityId}.`);
      }
    }

    if (facilityInput.images && facilityInput.images.length > 0) {
      const imageDataToInsert = facilityInput.images
        .filter(img => img.image_url)
        .map((img, index) => ({
          facility_id: facilityId,
          image_url: img.image_url,
          alt_text: img.alt_text ?? null,
          order: img.order ?? index,
        }));

      if (imageDataToInsert.length > 0) {
        const { error: imageError } = await supabase
          .from('facility_images')
          .insert(imageDataToInsert);
        handleSupabaseError(imageError, `addFacility - insert images (ID: ${facilityId})`);
        console.log(`Successfully added ${imageDataToInsert.length} images for facility ID: ${facilityId}.`);
      }
    }

    return { id: facilityId };
  } catch (error: unknown) {
    console.error(`Caught error in addFacility:`, error instanceof Error ? error.message : error);
    throw error;
  }
};

// Function to update an existing facility and its related details
export const updateFacility = async (facilityId: string, updatedData: FacilityFormData): Promise<void> => {
  console.log(`Attempting to update facility ID: ${facilityId} and details in Supabase...`);
  if (!facilityId || !updatedData) {
    console.error("updateFacility error: facilityId and updatedData are required.");
    throw new Error("Invalid input for updateFacility.");
  }

  const coreDataToUpdate: Partial<Omit<Facility, 'ID' | 'created_at'>> = {};
  if (updatedData.company_name !== undefined) coreDataToUpdate['Company'] = updatedData.company_name ?? null;
  if (updatedData.facility_name_site !== undefined) coreDataToUpdate['Facility Name/Site'] = updatedData.facility_name_site ?? null;
  if (updatedData.address !== undefined) coreDataToUpdate['Location'] = updatedData.address ?? null;
  if (updatedData.status_name !== undefined) coreDataToUpdate['Operational Status'] = updatedData.status_name ?? null;
  if (updatedData.technology_name !== undefined) coreDataToUpdate['Primary Recycling Technology'] = updatedData.technology_name ?? null;
  if (updatedData.technology_category !== undefined) coreDataToUpdate['technology_category'] = updatedData.technology_category ?? null;
  if (updatedData.processing_capacity_mt_year !== undefined) {
    coreDataToUpdate['capacity_tonnes_per_year'] = updatedData.processing_capacity_mt_year !== null && !isNaN(Number(updatedData.processing_capacity_mt_year))
      ? Number(updatedData.processing_capacity_mt_year) : null;
  }
  if (updatedData.latitude !== undefined) {
    coreDataToUpdate['Latitude'] = updatedData.latitude !== null && !isNaN(Number(updatedData.latitude))
      ? Number(updatedData.latitude) : null;
  }
  if (updatedData.longitude !== undefined) {
    coreDataToUpdate['Longitude'] = updatedData.longitude !== null && !isNaN(Number(updatedData.longitude))
      ? Number(updatedData.longitude) : null;
  }

  try {
    if (Object.keys(coreDataToUpdate).length > 0) {
      console.log(`[updateFacility] Updating core data for ${facilityId}:`, JSON.stringify(coreDataToUpdate, null, 2));
      const { error: coreUpdateError } = await supabase
        .from('facilities')
        .update(coreDataToUpdate)
        .eq('ID', facilityId);
      handleSupabaseError(coreUpdateError, `updateFacility - core update (ID: ${facilityId})`);
      console.log(`Successfully updated core data for facility ${facilityId}.`);
    } else {
      console.log(`No core data changes detected for facility ${facilityId}.`);
    }

    if (updatedData.details) {
      const detailsData: FacilityDetails = {
        facility_id: facilityId,
        technology_description: updatedData.details.technology_description ?? null,
        notes: updatedData.details.notes ?? null,
        website: updatedData.details.website ?? null,
        feedstock: updatedData.details.feedstock ?? null,
        product: updatedData.details.product ?? null,
        investment_usd: updatedData.details.investment_usd !== null && updatedData.details.investment_usd !== undefined ? String(updatedData.details.investment_usd) : null,
        jobs: updatedData.details.jobs !== null && !isNaN(Number(updatedData.details.jobs))
          ? Number(updatedData.details.jobs) : null,
        ev_equivalent_per_year: updatedData.details.ev_equivalent_per_year !== null && !isNaN(Number(updatedData.details.ev_equivalent_per_year))
          ? Number(updatedData.details.ev_equivalent_per_year) : null,
        environmental_impact_details: updatedData.details.environmental_impact_details ?? null,
        status_effective_date_text: updatedData.details.status_effective_date_text ?? null,
      };
      console.log(`[updateFacility] Upserting details for ${facilityId}:`, JSON.stringify(detailsData, null, 2));
      const { error: detailsUpsertError } = await supabase
        .from('facility_details')
        .upsert(detailsData, { onConflict: 'facility_id' });
      handleSupabaseError(detailsUpsertError, `updateFacility - details upsert (ID: ${facilityId})`);
      console.log(`Successfully upserted details for facility ${facilityId}.`);
    }

    // Timeline Events
    if (updatedData.timeline !== undefined) {
      console.log(`[updateFacility] Updating timeline for ${facilityId}...`);
      const { error: deleteTimelineError } = await supabase
        .from('facility_timeline_events')
        .delete()
        .eq('facility_id', facilityId);
      handleSupabaseError(deleteTimelineError, `updateFacility - delete timeline (ID: ${facilityId})`);

      if (updatedData.timeline.length > 0) {
        const timelineDataToInsert = updatedData.timeline
          .filter(item => item.event_name)
          .map(item => ({
            facility_id: facilityId,
            event_date: item.event_date || null,
            event_name: item.event_name,
            description: item.description ?? null,
          }));
        if (timelineDataToInsert.length > 0) {
          const { error: insertTimelineError } = await supabase
            .from('facility_timeline_events')
            .insert(timelineDataToInsert);
          handleSupabaseError(insertTimelineError, `updateFacility - insert timeline (ID: ${facilityId})`);
          console.log(`Successfully inserted ${timelineDataToInsert.length} timeline events for ${facilityId}.`);
        }
      } else {
        console.log(`No new timeline events to insert for ${facilityId}.`);
      }
    }

    // Documents
    if (updatedData.documents !== undefined) {
      console.log(`[updateFacility] Updating documents for ${facilityId}...`);
      const { error: deleteDocumentsError } = await supabase
        .from('facility_documents')
        .delete()
        .eq('facility_id', facilityId);
      handleSupabaseError(deleteDocumentsError, `updateFacility - delete documents (ID: ${facilityId})`);

      if (updatedData.documents.length > 0) {
        const documentDataToInsert = updatedData.documents
          .filter(doc => doc.title || doc.url)
          .map(doc => ({
            facility_id: facilityId,
            title: doc.title ?? null,
            url: doc.url ?? null,
          }));
        if (documentDataToInsert.length > 0) {
          const { error: insertDocumentsError } = await supabase
            .from('facility_documents')
            .insert(documentDataToInsert);
          handleSupabaseError(insertDocumentsError, `updateFacility - insert documents (ID: ${facilityId})`);
          console.log(`Successfully inserted ${documentDataToInsert.length} documents for ${facilityId}.`);
        }
      } else {
        console.log(`No new documents to insert for ${facilityId}.`);
      }
    }

    // Images
    if (updatedData.images !== undefined) {
      console.log(`[updateFacility] Updating images for ${facilityId}...`);
      const { error: deleteImagesError } = await supabase
        .from('facility_images')
        .delete()
        .eq('facility_id', facilityId);
      handleSupabaseError(deleteImagesError, `updateFacility - delete images (ID: ${facilityId})`);

      if (updatedData.images.length > 0) {
        const imageDataToInsert = updatedData.images
          .filter(img => typeof img === 'string' ? img : img.image_url)
          .map((img, index) => ({
            facility_id: facilityId,
            image_url: typeof img === 'string' ? img : img.image_url,
            alt_text: typeof img === 'string' ? null : (img.alt_text ?? null),
            order: typeof img === 'string' ? index : (img.order ?? index),
          }));
        if (imageDataToInsert.length > 0) {
          const { error: insertImagesError } = await supabase
            .from('facility_images')
            .insert(imageDataToInsert);
          handleSupabaseError(insertImagesError, `updateFacility - insert images (ID: ${facilityId})`);
          console.log(`Successfully inserted ${imageDataToInsert.length} images for ${facilityId}.`);
        }
      } else {
        console.log(`No new images to insert for ${facilityId}.`);
      }
    }

    console.log(`Successfully finished update process for facility ${facilityId}.`);
  } catch (error: unknown) {
    console.error(`Caught error in updateFacility (ID: ${facilityId}):`, error instanceof Error ? error.message : error);
    throw error;
  }
};

// Function to delete a facility and potentially related data (if CASCADE is set up)
export const deleteFacility = async (facilityId: string): Promise<void> => {
  console.log(`Attempting to delete facility with ID: ${facilityId} from Supabase...`);
  if (!facilityId) {
    console.error("deleteFacility error: facilityId is required.");
    throw new Error("Invalid input for deleteFacility.");
  }
  try {
    console.warn(`Deleting facility ${facilityId}. Ensure foreign keys have ON DELETE CASCADE set for related tables (details, timeline, documents, images) to be deleted automatically.`);

    const { error } = await supabase
      .from('facilities')
      .delete()
      .eq('ID', facilityId);

    handleSupabaseError(error, `deleteFacility (ID: ${facilityId})`);
    console.log(`Successfully deleted facility ${facilityId} (and potentially related data via cascade).`);
  } catch (error: unknown) {
    console.error(`Caught error in deleteFacility (ID: ${facilityId}):`, error instanceof Error ? error.message : error);
    throw error;
  }
};

// Function to get facility statistics (likely unchanged, uses core data)
export const getFacilityStats = async (): Promise<FacilityStats> => {
  console.log("Attempting to calculate facility stats from Supabase (core data)...");
  try {
    const { data: facilities, error } = await supabase
      .from('facilities')
      .select('ID, "Operational Status"');

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
      if (facility["Operational Status"]) {
        const canonicalStatus = getCanonicalStatus(facility["Operational Status"]);
        switch (canonicalStatus) {
          case 'operating': operatingFacilities++; break;
          case 'construction': constructionFacilities++; break;
          case 'planned': plannedFacilities++; break;
        }
      } else {
        console.warn(`Facility ${facility.ID || '(unknown ID)'} missing "Operational Status" for stats calculation.`);
      }
    });

    console.log("Successfully calculated facility stats.");
    return { totalFacilities, operatingFacilities, constructionFacilities, plannedFacilities };
  } catch (error: unknown) {
    console.error("Caught error in getFacilityStats:", error instanceof Error ? error.message : error);
    return { totalFacilities: 0, operatingFacilities: 0, constructionFacilities: 0, plannedFacilities: 0 };
  }
};

// Function to get distinct operational statuses
export const getDistinctOperationalStatuses = async (): Promise<string[]> => {
  console.log("Attempting to fetch distinct operational statuses from Supabase...");
  try {
    const { data, error } = await supabase
      .rpc('get_distinct_operational_statuses');

    handleSupabaseError(error, 'getDistinctOperationalStatuses');

    if (!data || !Array.isArray(data)) {
      console.warn("Supabase returned null or non-array data for getDistinctOperationalStatuses RPC.");
      return [];
    }

    const statuses = data.map(item => String(item));
    console.log("Successfully fetched distinct operational statuses:", statuses);
    return statuses;
  } catch (error: unknown) {
    console.error("Caught error in getDistinctOperationalStatuses:", error instanceof Error ? error.message : error);
    return [];
  }
};

// Search and filter options interface
export interface FacilitySearchFilters {
  searchTerm?: string;
  statuses?: string[];
  technologies?: string[];
  technologyCategories?: string[];
  capacityMin?: number;
  capacityMax?: number;
  companies?: string[];
  locations?: string[];
  hasCoordinates?: boolean;
  feedstockTypes?: string[];
  outputProducts?: string[];
}

// Function to search and filter facilities with advanced options
export const searchFacilities = async (filters: FacilitySearchFilters): Promise<Facility[]> => {
  console.log("Attempting to search facilities with filters:", filters);
  try {
    const selectString = `
      ID,
      Company,
      "Facility Name/Site",
      Location,
      "Operational Status",
      "Primary Recycling Technology",
      technology_category,
      capacity_tonnes_per_year,
      Latitude,
      Longitude,
      facility_details!left(
        feedstock,
        product,
        technology_description,
        notes
      )
    `;

    let query = supabase
      .from('facilities')
      .select(selectString);

    // Apply search term across multiple fields if provided
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const searchPattern = `%${filters.searchTerm.trim()}%`;
      
      // Use OR logic for text search across multiple fields
      query = query.or(`Company.ilike.${searchPattern},` +
                      `"Facility Name/Site".ilike.${searchPattern},` +
                      `Location.ilike.${searchPattern},` +
                      `"Primary Recycling Technology".ilike.${searchPattern},` +
                      `technology_category.ilike.${searchPattern}`);
    }

    // Apply status filters
    if (filters.statuses && filters.statuses.length > 0) {
      query = query.in('"Operational Status"', filters.statuses);
    }

    // Apply technology filters
    if (filters.technologies && filters.technologies.length > 0) {
      query = query.in('"Primary Recycling Technology"', filters.technologies);
    }

    // Apply technology category filters
    if (filters.technologyCategories && filters.technologyCategories.length > 0) {
      query = query.in('technology_category', filters.technologyCategories);
    }

    // Apply capacity range filters
    if (filters.capacityMin !== undefined && filters.capacityMin !== null) {
      query = query.gte('capacity_tonnes_per_year', filters.capacityMin);
    }
    if (filters.capacityMax !== undefined && filters.capacityMax !== null) {
      query = query.lte('capacity_tonnes_per_year', filters.capacityMax);
    }

    // Apply company filters
    if (filters.companies && filters.companies.length > 0) {
      query = query.in('Company', filters.companies);
    }

    // Apply location filters (partial match)
    if (filters.locations && filters.locations.length > 0) {
      const locationConditions = filters.locations.map(loc => `Location.ilike.%${loc}%`).join(',');
      query = query.or(locationConditions);
    }

    // Apply coordinate filter
    if (filters.hasCoordinates === true) {
      query = query.not('Latitude', 'is', null).not('Longitude', 'is', null);
    } else if (filters.hasCoordinates === false) {
      query = query.or('Latitude.is.null,Longitude.is.null');
    }

    const { data, error } = await query;

    handleSupabaseError(error, 'searchFacilities');
    if (!data) {
      console.warn("Supabase returned null data for searchFacilities query.");
      return [];
    }
    console.log(`Successfully found ${data.length} facilities matching search criteria.`);

    // Parse numeric fields and filter by feedstock/product if needed
    const parsedData = data.map(facility => {
      const parsedFacility: Partial<Facility> = { ...facility };
      if (typeof parsedFacility.Latitude === 'string') parsedFacility.Latitude = parseFloat(parsedFacility.Latitude);
      if (typeof parsedFacility.Longitude === 'string') parsedFacility.Longitude = parseFloat(parsedFacility.Longitude);
      if (typeof parsedFacility.capacity_tonnes_per_year === 'string') parsedFacility.capacity_tonnes_per_year = parseFloat(parsedFacility.capacity_tonnes_per_year);

      parsedFacility.Latitude = isNaN(parsedFacility.Latitude as number) ? null : parsedFacility.Latitude;
      parsedFacility.Longitude = isNaN(parsedFacility.Longitude as number) ? null : parsedFacility.Longitude;
      parsedFacility.capacity_tonnes_per_year = isNaN(parsedFacility.capacity_tonnes_per_year as number) ? null : parsedFacility.capacity_tonnes_per_year;

      return parsedFacility;
    });

    // Post-process for feedstock and product filters if facility_details were included
    let filteredData = parsedData as Facility[];
    
    if (filters.feedstockTypes && filters.feedstockTypes.length > 0 && data[0]?.facility_details) {
      filteredData = filteredData.filter(facility => {
        const details = (facility as any).facility_details;
        if (!details?.feedstock) return false;
        return filters.feedstockTypes!.some(type => 
          details.feedstock.toLowerCase().includes(type.toLowerCase())
        );
      });
    }

    if (filters.outputProducts && filters.outputProducts.length > 0 && data[0]?.facility_details) {
      filteredData = filteredData.filter(facility => {
        const details = (facility as any).facility_details;
        if (!details?.product) return false;
        return filters.outputProducts!.some(product => 
          details.product.toLowerCase().includes(product.toLowerCase())
        );
      });
    }

    return filteredData;
  } catch (error: unknown) {
    console.error("Caught error in searchFacilities:", error instanceof Error ? error.message : error);
    throw error;
  }
};

// Function to get distinct values for filter options
export const getFilterOptions = async (): Promise<{
  statuses: string[];
  technologies: string[];
  technologyCategories: string[];
  companies: string[];
  feedstockTypes: string[];
  outputProducts: string[];
}> => {
  console.log("Attempting to fetch filter options from Supabase...");
  try {
    // Fetch all facilities with minimal data to extract unique values
    const { data: facilities, error: facilitiesError } = await supabase
      .from('facilities')
      .select(`
        "Operational Status",
        "Primary Recycling Technology",
        technology_category,
        Company
      `);

    handleSupabaseError(facilitiesError, 'getFilterOptions - facilities');

    // Fetch unique feedstock and products from details table
    const { data: details, error: detailsError } = await supabase
      .from('facility_details')
      .select('feedstock, product');

    handleSupabaseError(detailsError, 'getFilterOptions - details');

    // Extract unique values
    const statuses = new Set<string>();
    const technologies = new Set<string>();
    const technologyCategories = new Set<string>();
    const companies = new Set<string>();
    const feedstockTypes = new Set<string>();
    const outputProducts = new Set<string>();

    // Process facilities data
    facilities?.forEach(facility => {
      if (facility["Operational Status"]) statuses.add(facility["Operational Status"]);
      if (facility["Primary Recycling Technology"]) technologies.add(facility["Primary Recycling Technology"]);
      if (facility.technology_category) technologyCategories.add(facility.technology_category);
      if (facility.Company) companies.add(facility.Company);
    });

    // Process details data for feedstock and products
    details?.forEach(detail => {
      if (detail.feedstock) {
        // Split by common delimiters and add each type
        detail.feedstock.split(/[,;\/]/).forEach((type: string) => {
          const trimmed = type.trim();
          if (trimmed) feedstockTypes.add(trimmed);
        });
      }
      if (detail.product) {
        // Split by common delimiters and add each product
        detail.product.split(/[,;\/]/).forEach((product: string) => {
          const trimmed = product.trim();
          if (trimmed) outputProducts.add(trimmed);
        });
      }
    });

    return {
      statuses: Array.from(statuses).sort(),
      technologies: Array.from(technologies).sort(),
      technologyCategories: Array.from(technologyCategories).sort(),
      companies: Array.from(companies).sort(),
      feedstockTypes: Array.from(feedstockTypes).sort(),
      outputProducts: Array.from(outputProducts).sort()
    };
  } catch (error: unknown) {
    console.error("Caught error in getFilterOptions:", error instanceof Error ? error.message : error);
    return {
      statuses: [],
      technologies: [],
      technologyCategories: [],
      companies: [],
      feedstockTypes: [],
      outputProducts: []
    };
  }
};