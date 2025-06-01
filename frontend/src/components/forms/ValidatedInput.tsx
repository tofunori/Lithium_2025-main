// frontend/src/components/forms/ValidatedInput.tsx
import React, { useState, useCallback } from 'react';
import { formatters } from '../../utils/validation';

interface ValidatedInputProps {
  id?: string;
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'url' | 'tel' | 'number' | 'password';
  value: any;
  onChange: (name: string, value: any) => void;
  onBlur?: (name: string) => void;
  error?: string;
  isValid?: boolean;
  isTouched?: boolean;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  helpText?: string;
  autoFormat?: 'phone' | 'url' | 'number' | 'coordinate';
  step?: string;
  min?: string | number;
  max?: string | number;
  rows?: number; // For textarea
  as?: 'input' | 'textarea';
}

const ValidatedInput: React.FC<ValidatedInputProps> = ({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  isValid = true,
  isTouched = false,
  required = false,
  placeholder,
  disabled = false,
  className = '',
  helpText,
  autoFormat,
  step,
  min,
  max,
  rows = 3,
  as = 'input'
}) => {
  const [internalValue, setInternalValue] = useState(value || '');

  // Sync internal value with prop value
  React.useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let newValue = e.target.value;
    setInternalValue(newValue);
    
    // Apply auto-formatting on change for some types
    if (autoFormat && newValue) {
      switch (autoFormat) {
        case 'phone':
          newValue = formatters.phone(newValue);
          break;
        case 'coordinate':
          // Don't format while typing, only on blur
          break;
        default:
          break;
      }
    }

    onChange(name, newValue);
  }, [name, onChange, autoFormat]);

  const handleBlur = useCallback(() => {
    let finalValue = internalValue;

    // Apply formatting on blur
    if (autoFormat && finalValue) {
      switch (autoFormat) {
        case 'url':
          finalValue = formatters.url(finalValue);
          break;
        case 'coordinate':
          finalValue = formatters.coordinate(finalValue);
          break;
        case 'number':
          if (type === 'number') {
            finalValue = formatters.number(finalValue);
          }
          break;
        default:
          break;
      }
      
      if (finalValue !== internalValue) {
        setInternalValue(finalValue);
        onChange(name, finalValue);
      }
    }

    if (onBlur) {
      onBlur(name);
    }
  }, [name, internalValue, autoFormat, type, onChange, onBlur]);

  // Determine input classes
  const getInputClasses = () => {
    let classes = `form-control ${className}`;
    
    if (isTouched) {
      if (isValid) {
        classes += ' is-valid';
      } else {
        classes += ' is-invalid';
      }
    }
    
    return classes;
  };

  // Generate unique ID if not provided
  const inputId = id || `input-${name}`;

  const commonProps = {
    id: inputId,
    name,
    value: internalValue,
    onChange: handleChange,
    onBlur: handleBlur,
    disabled,
    className: getInputClasses(),
    placeholder,
    required,
  };

  const InputComponent = as === 'textarea' ? (
    <textarea
      {...commonProps}
      rows={rows}
    />
  ) : (
    <input
      {...commonProps}
      type={type}
      step={step}
      min={min}
      max={max}
    />
  );

  return (
    <div className="mb-3">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </label>
      )}
      
      {InputComponent}
      
      {/* Validation feedback */}
      {isTouched && error && (
        <div className="invalid-feedback d-block">
          <i className="fas fa-exclamation-circle me-1"></i>
          {error}
        </div>
      )}
      
      {isTouched && isValid && !error && (
        <div className="valid-feedback d-block">
          <i className="fas fa-check-circle me-1"></i>
          Looks good!
        </div>
      )}
      
      {/* Help text */}
      {helpText && (
        <div className="form-text">
          <i className="fas fa-info-circle me-1"></i>
          {helpText}
        </div>
      )}
    </div>
  );
};

export default ValidatedInput;