// frontend/src/utils/validation.ts

export interface ValidationRule {
  test: (value: any) => boolean;
  message: string;
}

export interface FieldValidation {
  value: any;
  rules: ValidationRule[];
  isValid: boolean;
  errors: string[];
  touched: boolean;
}

export interface FormValidation {
  [fieldName: string]: FieldValidation;
}

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    test: (value) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim().length > 0;
      return value !== null && value !== undefined && value !== '';
    },
    message
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    test: (value) => {
      if (!value) return true; // Let required rule handle empty values
      return String(value).length >= min;
    },
    message: message || `Must be at least ${min} characters`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    test: (value) => {
      if (!value) return true;
      return String(value).length <= max;
    },
    message: message || `Must be no more than ${max} characters`
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    test: (value) => {
      if (!value) return true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(String(value));
    },
    message
  }),

  url: (message = 'Please enter a valid URL (e.g., https://example.com)'): ValidationRule => ({
    test: (value) => {
      if (!value) return true;
      try {
        const url = new URL(String(value));
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    },
    message
  }),

  number: (message = 'Please enter a valid number'): ValidationRule => ({
    test: (value) => {
      if (!value && value !== 0) return true;
      const num = Number(value);
      return !isNaN(num) && isFinite(num);
    },
    message
  }),

  positiveNumber: (message = 'Please enter a positive number'): ValidationRule => ({
    test: (value) => {
      if (!value && value !== 0) return true;
      const num = Number(value);
      return !isNaN(num) && isFinite(num) && num > 0;
    },
    message
  }),

  range: (min: number, max: number, message?: string): ValidationRule => ({
    test: (value) => {
      if (!value && value !== 0) return true;
      const num = Number(value);
      if (isNaN(num)) return false;
      return num >= min && num <= max;
    },
    message: message || `Must be between ${min} and ${max}`
  }),

  latitude: (message = 'Latitude must be between -90 and 90'): ValidationRule => ({
    test: (value) => {
      if (!value && value !== 0) return true;
      const num = Number(value);
      return !isNaN(num) && num >= -90 && num <= 90;
    },
    message
  }),

  longitude: (message = 'Longitude must be between -180 and 180'): ValidationRule => ({
    test: (value) => {
      if (!value && value !== 0) return true;
      const num = Number(value);
      return !isNaN(num) && num >= -180 && num <= 180;
    },
    message
  }),

  phone: (message = 'Please enter a valid phone number'): ValidationRule => ({
    test: (value) => {
      if (!value) return true;
      // Remove all non-digits
      const digits = String(value).replace(/\D/g, '');
      // Should be 10 or 11 digits (with or without country code)
      return digits.length >= 10 && digits.length <= 11;
    },
    message
  }),

  custom: (testFn: (value: any) => boolean, message: string): ValidationRule => ({
    test: testFn,
    message
  })
};

// Validation utilities
export const validateField = (value: any, rules: ValidationRule[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  for (const rule of rules) {
    if (!rule.test(value)) {
      errors.push(rule.message);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateForm = (formData: any, validationSchema: { [key: string]: ValidationRule[] }): FormValidation => {
  const validation: FormValidation = {};
  
  Object.keys(validationSchema).forEach(fieldName => {
    const value = getNestedValue(formData, fieldName);
    const rules = validationSchema[fieldName];
    const { isValid, errors } = validateField(value, rules);
    
    validation[fieldName] = {
      value,
      rules,
      isValid,
      errors,
      touched: false
    };
  });
  
  return validation;
};

// Helper to get nested object values (e.g., "details.website")
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Helper to format values
export const formatters = {
  phone: (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return value;
  },

  url: (value: string): string => {
    if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
      return `https://${value}`;
    }
    return value;
  },

  number: (value: string, decimals = 2): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toFixed(decimals);
  },

  coordinate: (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toFixed(6); // 6 decimal places for coordinates
  }
};

// Check if entire form is valid
export const isFormValid = (validation: FormValidation): boolean => {
  return Object.values(validation).every(field => field.isValid);
};

// Get all form errors
export const getFormErrors = (validation: FormValidation): string[] => {
  const errors: string[] = [];
  Object.values(validation).forEach(field => {
    if (!field.isValid && field.touched) {
      errors.push(...field.errors);
    }
  });
  return errors;
};