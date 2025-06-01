// frontend/src/types/enhanced-facility.ts
// Enhanced TypeScript interfaces that address the missing type issues found in analysis

import { 
  FacilityTimelineEvent, 
  FacilityDocument, 
  FacilityImage,
  FacilityDetails 
} from '../services/types';

// Enhanced facility interface with all required fields properly typed
export interface EnhancedFacility {
  // Core identification
  ID: string;
  Company: string | null;
  'Facility Name/Site': string | null;
  Location: string | null;
  
  // Operational details
  'Operational Status': string | null;
  'Primary Recycling Technology': string | null;
  technology_category: string | null;
  
  // Capacity and coordinates
  capacity_tonnes_per_year: number | null;
  Latitude: number | null;
  Longitude: number | null;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

// Enhanced full facility data with proper relationships
export interface EnhancedFullFacilityData extends EnhancedFacility {
  facility_details: FacilityDetails | null;
  facility_timeline_events: FacilityTimelineEvent[];
  facility_documents: FacilityDocument[];
  facility_images: FacilityImage[];
}

// Comprehensive form interfaces that fix the type assertion issues
export interface FacilityFormDetails {
  technology_description?: string | null;
  notes?: string | null;
  website?: string | null;
  feedstock?: string | null;
  product?: string | null;
  investment_usd?: string | number | null;
  jobs?: string | number | null;
  ev_equivalent_per_year?: string | number | null;
  environmental_impact_details?: string | null;
  status_effective_date_text?: string | null;
}

export interface FacilityFormTimeline {
  id?: string;
  event_date: string | null;
  event_name: string | null;
  description?: string | null;
}

export interface FacilityFormDocument {
  id?: string;
  title?: string | null;
  url?: string | null;
}

export interface FacilityFormImage {
  id?: string;
  image_url?: string | null;
  alt_text?: string | null;
  order?: number | null;
}

// Enhanced form data interface that replaces dangerous type assertions
export interface EnhancedFacilityFormData {
  // Core fields
  id?: string;
  company_name?: string | null;
  facility_name_site?: string | null;
  address?: string | null;
  status_name?: string | null;
  technology_name?: string | null;
  technology_category?: string | null;
  processing_capacity_mt_year?: string | number | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  
  // Nested details - properly typed instead of using 'any'
  details?: FacilityFormDetails;
  
  // Related arrays - properly typed instead of using 'any'
  timeline?: FacilityFormTimeline[];
  documents?: FacilityFormDocument[];
  images?: FacilityFormImage[];
}

// Form state management interfaces
export interface FormFieldState {
  value: any;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export interface FormValidationState {
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// Component prop interfaces for better type safety
export interface FacilityComponentProps {
  facilityId: string;
  isEditing: boolean;
  isSaving: boolean;
  onSave?: () => void;
  onCancel?: () => void;
  onEdit?: () => void;
}

export interface FacilityDisplayProps extends FacilityComponentProps {
  facility: EnhancedFullFacilityData;
}

export interface FacilityEditProps extends FacilityComponentProps {
  formData: EnhancedFacilityFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  errors?: Record<string, string>;
}

// Form section specific interfaces
export interface BasicInfoFormData {
  company: string;
  location: string;
  status: string;
  website?: string;
  latitude?: string | number;
  longitude?: string | number;
}

export interface TechnicalFormData {
  processing_capacity_mt_year?: string | number;
  technology_name?: string;
  technology_category?: string;
  feedstock?: string;
  product?: string;
  technology_description?: string;
}

export interface TimelineFormData {
  timeline?: {
    id?: string;
    date: string;
    event: string;
    description?: string;
  }[];
}

export interface DocumentsFormData {
  documents?: {
    id?: string;
    title: string;
    url: string;
  }[];
}

export interface MediaFormData {
  images?: string[];
}

// Error handling interfaces
export interface FacilityServiceError {
  code: string;
  message: string;
  context?: string;
  details?: any;
}

export interface FormSubmissionResult {
  success: boolean;
  data?: EnhancedFullFacilityData;
  errors?: Record<string, string>;
}

// Utility type helpers
export type FacilityFormField = keyof EnhancedFacilityFormData;
export type FacilityStatus = 'Operational' | 'Under Construction' | 'Planned' | 'Pilot' | 'Discontinued';
export type TechnologyCategory = 'Mechanical' | 'Hydrometallurgy' | 'Pyrometallurgy' | 'Hybrid' | 'Other';

// Constants for form validation and dropdowns
export const FACILITY_STATUSES: { value: FacilityStatus; label: string }[] = [
  { value: 'Operational', label: 'Operational' },
  { value: 'Under Construction', label: 'Under Construction' },
  { value: 'Planned', label: 'Planned' },
  { value: 'Pilot', label: 'Pilot' },
  { value: 'Discontinued', label: 'Discontinued' }
];

export const TECHNOLOGY_CATEGORIES: { value: TechnologyCategory; label: string }[] = [
  { value: 'Mechanical', label: 'Mechanical' },
  { value: 'Hydrometallurgy', label: 'Hydrometallurgy' },
  { value: 'Pyrometallurgy', label: 'Pyrometallurgy' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'Other', label: 'Other' }
];