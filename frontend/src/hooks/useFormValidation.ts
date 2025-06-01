// frontend/src/hooks/useFormValidation.ts
import { useState, useCallback, useRef } from 'react';
import { ValidationRule, FormValidation, validateField, validateForm, isFormValid } from '../utils/validation';

interface UseFormValidationOptions {
  validationSchema: { [key: string]: ValidationRule[] };
  initialData?: any;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

interface UseFormValidationReturn {
  formData: any;
  validation: FormValidation;
  isValid: boolean;
  errors: string[];
  setFormData: (data: any) => void;
  updateField: (fieldName: string, value: any) => void;
  validateSingleField: (fieldName: string) => void;
  validateAllFields: () => boolean;
  markFieldTouched: (fieldName: string) => void;
  markAllFieldsTouched: () => void;
  resetValidation: () => void;
  getFieldError: (fieldName: string) => string | undefined;
  isFieldValid: (fieldName: string) => boolean;
  isFieldTouched: (fieldName: string) => boolean;
}

export const useFormValidation = ({
  validationSchema,
  initialData = {},
  validateOnChange = true,
  validateOnBlur = true
}: UseFormValidationOptions): UseFormValidationReturn => {
  const [formData, setFormDataState] = useState(initialData);
  const [validation, setValidation] = useState<FormValidation>(() => 
    validateForm(initialData, validationSchema)
  );
  
  // Track which fields have been touched
  const touchedFields = useRef<Set<string>>(new Set());

  // Helper to get nested value from object
  const getNestedValue = useCallback((obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }, []);

  // Helper to set nested value in object
  const setNestedValue = useCallback((obj: any, path: string, value: any): any => {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
    return { ...obj };
  }, []);

  // Update form data
  const setFormData = useCallback((newData: any) => {
    setFormDataState(newData);
    if (validateOnChange) {
      const newValidation = validateForm(newData, validationSchema);
      // Preserve touched state
      touchedFields.current.forEach(fieldName => {
        if (newValidation[fieldName]) {
          newValidation[fieldName].touched = true;
        }
      });
      setValidation(newValidation);
    }
  }, [validationSchema, validateOnChange]);

  // Update single field
  const updateField = useCallback((fieldName: string, value: any) => {
    const newFormData = setNestedValue({ ...formData }, fieldName, value);
    setFormDataState(newFormData);

    if (validateOnChange) {
      const fieldValue = getNestedValue(newFormData, fieldName);
      const rules = validationSchema[fieldName] || [];
      const { isValid, errors } = validateField(fieldValue, rules);
      
      setValidation(prev => ({
        ...prev,
        [fieldName]: {
          value: fieldValue,
          rules,
          isValid,
          errors,
          touched: touchedFields.current.has(fieldName)
        }
      }));
    }
  }, [formData, validationSchema, validateOnChange, getNestedValue, setNestedValue]);

  // Validate single field
  const validateSingleField = useCallback((fieldName: string) => {
    const fieldValue = getNestedValue(formData, fieldName);
    const rules = validationSchema[fieldName] || [];
    const { isValid, errors } = validateField(fieldValue, rules);
    
    setValidation(prev => ({
      ...prev,
      [fieldName]: {
        value: fieldValue,
        rules,
        isValid,
        errors,
        touched: true
      }
    }));

    touchedFields.current.add(fieldName);
  }, [formData, validationSchema, getNestedValue]);

  // Validate all fields
  const validateAllFields = useCallback((): boolean => {
    const newValidation = validateForm(formData, validationSchema);
    
    // Mark all fields as touched
    Object.keys(newValidation).forEach(fieldName => {
      newValidation[fieldName].touched = true;
      touchedFields.current.add(fieldName);
    });
    
    setValidation(newValidation);
    return isFormValid(newValidation);
  }, [formData, validationSchema]);

  // Mark field as touched
  const markFieldTouched = useCallback((fieldName: string) => {
    touchedFields.current.add(fieldName);
    setValidation(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        touched: true
      }
    }));
  }, []);

  // Mark all fields as touched
  const markAllFieldsTouched = useCallback(() => {
    Object.keys(validation).forEach(fieldName => {
      touchedFields.current.add(fieldName);
    });
    
    setValidation(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(fieldName => {
        updated[fieldName] = { ...updated[fieldName], touched: true };
      });
      return updated;
    });
  }, [validation]);

  // Reset validation
  const resetValidation = useCallback(() => {
    touchedFields.current.clear();
    const newValidation = validateForm(formData, validationSchema);
    setValidation(newValidation);
  }, [formData, validationSchema]);

  // Get field error (only if touched)
  const getFieldError = useCallback((fieldName: string): string | undefined => {
    const field = validation[fieldName];
    if (!field || !field.touched || field.isValid) return undefined;
    return field.errors[0]; // Return first error
  }, [validation]);

  // Check if field is valid
  const isFieldValid = useCallback((fieldName: string): boolean => {
    const field = validation[fieldName];
    return field ? field.isValid : true;
  }, [validation]);

  // Check if field is touched
  const isFieldTouched = useCallback((fieldName: string): boolean => {
    const field = validation[fieldName];
    return field ? field.touched : false;
  }, [validation]);

  // Calculate overall form validity and errors
  const isValid = isFormValid(validation);
  const errors = Object.values(validation)
    .filter(field => !field.isValid && field.touched)
    .flatMap(field => field.errors);

  return {
    formData,
    validation,
    isValid,
    errors,
    setFormData,
    updateField,
    validateSingleField,
    validateAllFields,
    markFieldTouched,
    markAllFieldsTouched,
    resetValidation,
    getFieldError,
    isFieldValid,
    isFieldTouched
  };
};