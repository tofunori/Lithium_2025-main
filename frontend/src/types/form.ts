// frontend/src/types/form.ts
// Proper TypeScript interfaces for form components

export interface FormFieldProps {
  name: string;
  label: string;
  value: string | number | undefined | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helpText?: string;
}

export interface FormSelectProps extends Omit<FormFieldProps, 'value'> {
  value: string | undefined | null;
  options: { value: string; label: string }[];
}

export interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  initiallyExpanded?: boolean;
  icon?: string;
}

export interface TimelineItem {
  id?: string;
  date: string;
  event: string;
  description?: string;
}

export interface DocumentItem {
  id?: string;
  title: string;
  url: string;
}

export interface ContactInfo {
  person?: string;
  email?: string;
  phone?: string;
}

export interface InvestmentInfo {
  total?: string | number;
  currency?: string;
  date?: string;
}

export interface EnvironmentalImpactInfo {
  details?: string;
  certifications?: string[];
}

// Comprehensive form data interface that matches the actual form structure
export interface ComprehensiveFacilityFormData {
  // Core facility information
  id?: string;
  company_name?: string;
  facility_name_site?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  
  // Status and operational info
  status_name?: string;
  status_effective_date_text?: string;
  
  // Technical specifications
  processing_capacity_mt_year?: string | number;
  technology_name?: string;
  technology_description?: string;
  technology_category?: string;
  feedstock?: string;
  product?: string;
  
  // Location coordinates
  latitude?: string | number | null;
  longitude?: string | number | null;
  
  // Economic impact
  ev_equivalent_per_year?: string | number;
  jobs?: string | number;
  investment?: InvestmentInfo;
  
  // Contact information
  contact?: ContactInfo;
  website?: string;
  
  // Additional information
  notes?: string;
  environmental_impact?: EnvironmentalImpactInfo;
  
  // Related data arrays
  timeline?: TimelineItem[];
  documents?: DocumentItem[];
  images?: string[];
}

// Form validation result interface
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

// Form state management interface
export interface FormState<T = ComprehensiveFacilityFormData> {
  data: T;
  isDirty: boolean;
  isSubmitting: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}