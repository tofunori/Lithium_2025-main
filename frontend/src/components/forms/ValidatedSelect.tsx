// frontend/src/components/forms/ValidatedSelect.tsx
import React from 'react';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface ValidatedSelectProps {
  id?: string;
  name: string;
  label?: string;
  value: any;
  onChange: (name: string, value: any) => void;
  onBlur?: (name: string) => void;
  options: SelectOption[];
  error?: string;
  isValid?: boolean;
  isTouched?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  helpText?: string;
  placeholder?: string;
}

const ValidatedSelect: React.FC<ValidatedSelectProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  options,
  error,
  isValid = true,
  isTouched = false,
  required = false,
  disabled = false,
  className = '',
  helpText,
  placeholder = 'Select an option...'
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(name, e.target.value);
  };

  const handleBlur = () => {
    if (onBlur) {
      onBlur(name);
    }
  };

  // Determine input classes
  const getSelectClasses = () => {
    let classes = `form-select ${className}`;
    
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
  const selectId = id || `select-${name}`;

  return (
    <div className="mb-3">
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </label>
      )}
      
      <select
        id={selectId}
        name={name}
        value={value || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        className={getSelectClasses()}
        required={required}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
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

export default ValidatedSelect;