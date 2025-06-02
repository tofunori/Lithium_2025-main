// frontend/src/utils/facilityValidation.ts
import { validationRules, ValidationRule } from './validation';

// Facility form validation schema
export const facilityValidationSchema: { [key: string]: ValidationRule[] } = {
  // Basic Information
  'company_name': [
    validationRules.required('Company name is required'),
    validationRules.minLength(2, 'Company name must be at least 2 characters'),
    validationRules.maxLength(100, 'Company name must be less than 100 characters')
  ],
  
  'facility_name_site': [
    validationRules.maxLength(100, 'Facility name must be less than 100 characters')
  ],
  
  'address': [
    validationRules.maxLength(200, 'Address must be less than 200 characters')
  ],
  
  'status_name': [
    validationRules.required('Operational status is required')
  ],
  
  'technology_name': [
    validationRules.maxLength(500, 'Technology name must be less than 500 characters')
  ],
  
  'technology_category': [
    // Optional field
  ],
  
  // Technical Information
  'processing_capacity_mt_year': [
    validationRules.positiveNumber('Processing capacity must be a positive number')
  ],
  
  'latitude': [
    validationRules.latitude()
  ],
  
  'longitude': [
    validationRules.longitude()
  ],
  
  // Details Section
  'details.website': [
    validationRules.url()
  ],
  
  'details.technology_description': [
    validationRules.maxLength(1000, 'Technology description must be less than 1000 characters')
  ],
  
  'details.notes': [
    validationRules.maxLength(2000, 'Notes must be less than 2000 characters')
  ],
  
  'details.feedstock': [
    validationRules.maxLength(200, 'Feedstock description must be less than 200 characters')
  ],
  
  'details.product': [
    validationRules.maxLength(200, 'Product description must be less than 200 characters')
  ],
  
  'details.investment_usd': [
    validationRules.positiveNumber('Investment amount must be a positive number')
  ],
  
  'details.jobs': [
    validationRules.positiveNumber('Number of jobs must be a positive number'),
    validationRules.custom(
      (value) => !value || (Number.isInteger(Number(value)) && Number(value) >= 0),
      'Number of jobs must be a whole number'
    )
  ],
  
  'details.ev_equivalent_per_year': [
    validationRules.positiveNumber('EV equivalent per year must be a positive number'),
    validationRules.custom(
      (value) => !value || (Number.isInteger(Number(value)) && Number(value) >= 0),
      'EV equivalent per year must be a whole number'
    )
  ],
  
  'details.environmental_impact_details': [
    validationRules.maxLength(1000, 'Environmental impact details must be less than 1000 characters')
  ],
  
  'details.status_effective_date_text': [
    validationRules.maxLength(100, 'Status effective date must be less than 100 characters')
  ]
};

// Predefined options for select fields
export const facilityFormOptions = {
  operationalStatus: [
    { value: 'Operational', label: 'Operational' },
    { value: 'Under Construction', label: 'Under Construction' },
    { value: 'Planned', label: 'Planned' },
    { value: 'Pilot', label: 'Pilot' },
    { value: 'Discontinued', label: 'Discontinued' }
  ],
  
  technologyCategory: [
    { value: 'Mechanical', label: 'Mechanical' },
    { value: 'Hydrometallurgy', label: 'Hydrometallurgy' },
    { value: 'Pyrometallurgy', label: 'Pyrometallurgy' },
    { value: 'Hybrid', label: 'Hybrid' },
    { value: 'Other', label: 'Other' }
  ],
  
  commonTechnologies: [
    { value: 'Mechanical processing (shredding and physical separation)', label: 'Mechanical Processing (Shredding)' },
    { value: 'Hydrometallurgical', label: 'Hydrometallurgical' },
    { value: 'Pyrometallurgical', label: 'Pyrometallurgical' },
    { value: 'Spoke & Hub', label: 'Spoke & Hub' },
    { value: 'Hydro-to-Cathode™', label: 'Hydro-to-Cathode™' },
    { value: 'Strategic de-manufacturing', label: 'Strategic De-manufacturing' },
    { value: 'Multi-chemistry processing line', label: 'Multi-chemistry Processing' },
    { value: 'Other', label: 'Other' }
  ]
};

// Helper function to get initial form data with proper structure
export const getInitialFacilityFormData = () => ({
  company_name: '',
  facility_name_site: '',
  address: '',
  status_name: '',
  technology_name: '',
  technology_category: '',
  processing_capacity_mt_year: '',
  latitude: '',
  longitude: '',
  details: {
    website: '',
    technology_description: '',
    notes: '',
    feedstock: '',
    product: '',
    investment_usd: '',
    jobs: '',
    ev_equivalent_per_year: '',
    environmental_impact_details: '',
    status_effective_date_text: ''
  },
  timeline: [],
  documents: [],
  images: []
});

// Helper function to validate timeline events
export const validateTimelineEvent = (event: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!event.event_name || event.event_name.trim() === '') {
    errors.push('Event name is required');
  }
  
  if (event.event_name && event.event_name.length > 100) {
    errors.push('Event name must be less than 100 characters');
  }
  
  if (event.description && event.description.length > 500) {
    errors.push('Event description must be less than 500 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper function to validate document entries
export const validateDocument = (doc: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!doc.title || doc.title.trim() === '') {
    errors.push('Document title is required');
  }
  
  if (doc.title && doc.title.length > 200) {
    errors.push('Document title must be less than 200 characters');
  }
  
  if (!doc.url || doc.url.trim() === '') {
    errors.push('Document URL is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};