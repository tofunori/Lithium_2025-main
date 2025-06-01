// frontend/src/hooks/useComprehensiveFormValidation.ts
import { useState, useCallback, useMemo } from 'react';
import { FormState, FormValidationResult, ComprehensiveFacilityFormData } from '../types/form';
import { validationRules, ValidationRule } from '../utils/validation';

// Enhanced validation schema that covers all form fields
const facilityFormValidationSchema: Record<string, ValidationRule[]> = {
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
  'processing_capacity_mt_year': [
    validationRules.positiveNumber('Processing capacity must be a positive number')
  ],
  'latitude': [
    validationRules.latitude()
  ],
  'longitude': [
    validationRules.longitude()
  ],
  'website': [
    validationRules.url()
  ],
  'technology_description': [
    validationRules.maxLength(1000, 'Technology description must be less than 1000 characters')
  ],
  'notes': [
    validationRules.maxLength(2000, 'Notes must be less than 2000 characters')
  ],
  'feedstock': [
    validationRules.maxLength(200, 'Feedstock description must be less than 200 characters')
  ],
  'product': [
    validationRules.maxLength(200, 'Product description must be less than 200 characters')
  ],
  'investment.total': [
    validationRules.positiveNumber('Investment amount must be a positive number')
  ],
  'jobs': [
    validationRules.positiveNumber('Number of jobs must be a positive number'),
    validationRules.custom(
      (value) => !value || (Number.isInteger(Number(value)) && Number(value) >= 0),
      'Number of jobs must be a whole number'
    )
  ],
  'ev_equivalent_per_year': [
    validationRules.positiveNumber('EV equivalent per year must be a positive number'),
    validationRules.custom(
      (value) => !value || (Number.isInteger(Number(value)) && Number(value) >= 0),
      'EV equivalent per year must be a whole number'
    )
  ],
  'contact.email': [
    validationRules.email()
  ],
  'contact.phone': [
    validationRules.phone()
  ]
};

export const useComprehensiveFormValidation = (initialData: Partial<ComprehensiveFacilityFormData> = {}) => {
  const [formState, setFormState] = useState<FormState>({
    data: initialData as ComprehensiveFacilityFormData,
    isDirty: false,
    isSubmitting: false,
    errors: {},
    touched: {}
  });

  // Get nested value from object using dot notation
  const getNestedValue = useCallback((obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }, []);

  // Set nested value in object using dot notation
  const setNestedValue = useCallback((obj: any, path: string, value: any): any => {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
    return obj;
  }, []);

  // Validate a single field
  const validateField = useCallback((fieldName: string, value: any): string | null => {
    const rules = facilityFormValidationSchema[fieldName];
    if (!rules) return null;

    for (const rule of rules) {
      if (!rule.test(value)) {
        return rule.message;
      }
    }
    return null;
  }, []);

  // Validate entire form
  const validateForm = useCallback((): FormValidationResult => {
    const errors: Record<string, string> = {};
    
    Object.keys(facilityFormValidationSchema).forEach(fieldName => {
      const value = getNestedValue(formState.data, fieldName);
      const error = validateField(fieldName, value);
      if (error) {
        errors[fieldName] = error;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }, [formState.data, getNestedValue, validateField]);

  // Update field value
  const updateField = useCallback((fieldName: string, value: any) => {
    setFormState(prev => {
      const newData = { ...prev.data };
      setNestedValue(newData, fieldName, value);
      
      const fieldError = validateField(fieldName, value);
      const newErrors = { ...prev.errors };
      
      if (fieldError) {
        newErrors[fieldName] = fieldError;
      } else {
        delete newErrors[fieldName];
      }

      return {
        ...prev,
        data: newData,
        isDirty: true,
        errors: newErrors,
        touched: { ...prev.touched, [fieldName]: true }
      };
    });
  }, [validateField, setNestedValue]);

  // Handle form submission
  const handleSubmit = useCallback(async (submitFn: (data: ComprehensiveFacilityFormData) => Promise<void>) => {
    const validation = validateForm();
    
    if (!validation.isValid) {
      setFormState(prev => ({ ...prev, errors: validation.errors }));
      return { success: false, errors: validation.errors };
    }

    setFormState(prev => ({ ...prev, isSubmitting: true, errors: {} }));
    
    try {
      await submitFn(formState.data);
      setFormState(prev => ({ ...prev, isSubmitting: false, isDirty: false }));
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false,
        errors: { submit: errorMessage }
      }));
      return { success: false, errors: { submit: errorMessage } };
    }
  }, [validateForm, formState.data]);

  // Reset form
  const resetForm = useCallback((newData?: Partial<ComprehensiveFacilityFormData>) => {
    setFormState({
      data: (newData || initialData) as ComprehensiveFacilityFormData,
      isDirty: false,
      isSubmitting: false,
      errors: {},
      touched: {}
    });
  }, [initialData]);

  // Array field helpers
  const addArrayItem = useCallback((fieldName: keyof ComprehensiveFacilityFormData, item: any) => {
    setFormState(prev => {
      const currentArray = prev.data[fieldName] as any[] || [];
      return {
        ...prev,
        data: {
          ...prev.data,
          [fieldName]: [...currentArray, item]
        },
        isDirty: true
      };
    });
  }, []);

  const removeArrayItem = useCallback((fieldName: keyof ComprehensiveFacilityFormData, index: number) => {
    setFormState(prev => {
      const currentArray = prev.data[fieldName] as any[] || [];
      return {
        ...prev,
        data: {
          ...prev.data,
          [fieldName]: currentArray.filter((_, i) => i !== index)
        },
        isDirty: true
      };
    });
  }, []);

  const updateArrayItem = useCallback((fieldName: keyof ComprehensiveFacilityFormData, index: number, item: any) => {
    setFormState(prev => {
      const currentArray = [...(prev.data[fieldName] as any[] || [])];
      currentArray[index] = item;
      return {
        ...prev,
        data: {
          ...prev.data,
          [fieldName]: currentArray
        },
        isDirty: true
      };
    });
  }, []);

  // Computed values
  const isValid = useMemo(() => {
    return Object.keys(formState.errors).length === 0;
  }, [formState.errors]);

  const getFieldError = useCallback((fieldName: string): string | undefined => {
    return formState.errors[fieldName];
  }, [formState.errors]);

  const isFieldTouched = useCallback((fieldName: string): boolean => {
    return !!formState.touched[fieldName];
  }, [formState.touched]);

  const getFieldValue = useCallback((fieldName: string): any => {
    return getNestedValue(formState.data, fieldName);
  }, [formState.data, getNestedValue]);

  return {
    // Form state
    formData: formState.data,
    isDirty: formState.isDirty,
    isSubmitting: formState.isSubmitting,
    errors: formState.errors,
    isValid,

    // Field operations
    updateField,
    getFieldError,
    isFieldTouched,
    getFieldValue,

    // Array operations
    addArrayItem,
    removeArrayItem,
    updateArrayItem,

    // Form operations
    validateForm,
    handleSubmit,
    resetForm,

    // Raw state access (for advanced use cases)
    formState
  };
};