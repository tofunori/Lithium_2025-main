// frontend/src/utils/facilityDataMapper.ts
// Safe data mapping utilities to replace dangerous type assertions

import { 
  FullFacilityData, 
  FacilityFormData,
  FacilityTimelineEvent,
  FacilityDocument,
  FacilityImage 
} from '../services/types';
import { 
  EnhancedFullFacilityData, 
  EnhancedFacilityFormData,
  FacilityFormTimeline,
  FacilityFormDocument,
  FacilityFormImage 
} from '../types/enhanced-facility';

// Safely convert FullFacilityData to EnhancedFacilityFormData
export const mapFacilityToFormData = (facility: FullFacilityData): EnhancedFacilityFormData => {
  return {
    // Core fields
    id: facility.ID,
    company_name: facility.Company || '',
    facility_name_site: facility['Facility Name/Site'] || '',
    address: facility.Location || '',
    status_name: facility['Operational Status'] || 'Planned',
    technology_name: facility['Primary Recycling Technology'] || '',
    technology_category: facility.technology_category || '',
    processing_capacity_mt_year: facility.capacity_tonnes_per_year || '',
    latitude: facility.Latitude || '',
    longitude: facility.Longitude || '',
    
    // Details section
    details: {
      technology_description: facility.facility_details?.technology_description || '',
      notes: facility.facility_details?.notes || '',
      website: facility.facility_details?.website || '',
      feedstock: facility.facility_details?.feedstock || '',
      product: facility.facility_details?.product || '',
      investment_usd: facility.facility_details?.investment_usd || '',
      jobs: facility.facility_details?.jobs || '',
      ev_equivalent_per_year: facility.facility_details?.ev_equivalent_per_year || '',
      environmental_impact_details: facility.facility_details?.environmental_impact_details || '',
      status_effective_date_text: facility.facility_details?.status_effective_date_text || ''
    },
    
    // Timeline - safely map with proper types
    timeline: mapTimelineEvents(facility.facility_timeline_events),
    
    // Documents - safely map with proper types
    documents: mapDocuments(facility.facility_documents),
    
    // Images - safely map with proper types
    images: mapImages(facility.facility_images)
  };
};

// Safely map timeline events
export const mapTimelineEvents = (events: FacilityTimelineEvent[]): FacilityFormTimeline[] => {
  if (!Array.isArray(events) || events.length === 0) {
    return [{ event_date: '', event_name: '', description: '' }];
  }
  
  return events.map(event => ({
    id: event.id,
    event_date: event.event_date || '',
    event_name: event.event_name || '',
    description: event.description || ''
  }));
};

// Safely map documents
export const mapDocuments = (documents: FacilityDocument[]): FacilityFormDocument[] => {
  if (!Array.isArray(documents) || documents.length === 0) {
    return [{ title: '', url: '' }];
  }
  
  return documents.map(doc => ({
    id: doc.id,
    title: doc.title || '',
    url: doc.url || ''
  }));
};

// Safely map images
export const mapImages = (images: FacilityImage[]): FacilityFormImage[] => {
  if (!Array.isArray(images) || images.length === 0) {
    return [{ image_url: '', alt_text: '', order: 0 }];
  }
  
  return images.map((img, index) => ({
    id: img.id,
    image_url: img.image_url || '',
    alt_text: img.alt_text || `Facility Image ${index + 1}`,
    order: img.order ?? index
  }));
};

// Convert form data back to service format for updates
export const mapFormDataToServiceFormat = (formData: EnhancedFacilityFormData): FacilityFormData => {
  return {
    // Core fields
    id: formData.id,
    company_name: formData.company_name,
    facility_name_site: formData.facility_name_site,
    address: formData.address,
    status_name: formData.status_name,
    technology_name: formData.technology_name,
    technology_category: formData.technology_category,
    processing_capacity_mt_year: formData.processing_capacity_mt_year,
    latitude: formData.latitude,
    longitude: formData.longitude,
    
    // Details section
    details: formData.details ? {
      technology_description: formData.details.technology_description,
      notes: formData.details.notes,
      website: formData.details.website,
      feedstock: formData.details.feedstock,
      product: formData.details.product,
      investment_usd: typeof formData.details.investment_usd === 'string' 
        ? formData.details.investment_usd 
        : String(formData.details.investment_usd || ''),
      jobs: formData.details.jobs,
      ev_equivalent_per_year: formData.details.ev_equivalent_per_year,
      environmental_impact_details: formData.details.environmental_impact_details,
      status_effective_date_text: formData.details.status_effective_date_text
    } : undefined,
    
    // Timeline events
    timeline: formData.timeline?.map(item => ({
      event_date: item.event_date,
      event_name: item.event_name,
      description: item.description
    })),
    
    // Documents
    documents: formData.documents?.map(doc => ({
      title: doc.title,
      url: doc.url
    })),
    
    // Images
    images: formData.images?.map((img, index) => ({
      image_url: typeof img === 'string' ? img : img.image_url,
      alt_text: typeof img === 'string' ? `Facility Image ${index + 1}` : img.alt_text,
      order: typeof img === 'string' ? index : (img.order ?? index)
    }))
  };
};

// Validate form data structure
export const validateFormDataStructure = (data: any): data is EnhancedFacilityFormData => {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  // Check that core fields are present and properly typed
  const hasValidCoreFields = (
    typeof data.id === 'string' &&
    (typeof data.company_name === 'string' || data.company_name === null || data.company_name === undefined)
  );
  
  if (!hasValidCoreFields) {
    return false;
  }
  
  // Check that array fields are arrays if present
  if (data.timeline && !Array.isArray(data.timeline)) {
    return false;
  }
  
  if (data.documents && !Array.isArray(data.documents)) {
    return false;
  }
  
  if (data.images && !Array.isArray(data.images)) {
    return false;
  }
  
  return true;
};

// Safe getter functions to avoid runtime errors
export const getTimelineItem = (timeline: FacilityFormTimeline[] | undefined, index: number): FacilityFormTimeline | null => {
  if (!Array.isArray(timeline) || index < 0 || index >= timeline.length) {
    return null;
  }
  return timeline[index];
};

export const getDocumentItem = (documents: FacilityFormDocument[] | undefined, index: number): FacilityFormDocument | null => {
  if (!Array.isArray(documents) || index < 0 || index >= documents.length) {
    return null;
  }
  return documents[index];
};

export const getImageItem = (images: FacilityFormImage[] | undefined, index: number): FacilityFormImage | null => {
  if (!Array.isArray(images) || index < 0 || index >= images.length) {
    return null;
  }
  return images[index];
};

// Default data creators
export const createDefaultFormData = (): EnhancedFacilityFormData => ({
  company_name: '',
  facility_name_site: '',
  address: '',
  status_name: 'Planned',
  technology_name: '',
  technology_category: '',
  processing_capacity_mt_year: '',
  latitude: '',
  longitude: '',
  details: {
    technology_description: '',
    notes: '',
    website: '',
    feedstock: '',
    product: '',
    investment_usd: '',
    jobs: '',
    ev_equivalent_per_year: '',
    environmental_impact_details: '',
    status_effective_date_text: ''
  },
  timeline: [{ event_date: '', event_name: '', description: '' }],
  documents: [{ title: '', url: '' }],
  images: [{ image_url: '', alt_text: '', order: 0 }]
});

export const createDefaultTimelineItem = (): FacilityFormTimeline => ({
  event_date: '',
  event_name: '',
  description: ''
});

export const createDefaultDocumentItem = (): FacilityFormDocument => ({
  title: '',
  url: ''
});

export const createDefaultImageItem = (order: number = 0): FacilityFormImage => ({
  image_url: '',
  alt_text: `Facility Image ${order + 1}`,
  order
});