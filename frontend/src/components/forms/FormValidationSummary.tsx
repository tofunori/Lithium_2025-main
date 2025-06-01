// frontend/src/components/forms/FormValidationSummary.tsx
import React from 'react';

interface FormValidationSummaryProps {
  errors: string[];
  isVisible?: boolean;
  className?: string;
}

const FormValidationSummary: React.FC<FormValidationSummaryProps> = ({
  errors,
  isVisible = true,
  className = ''
}) => {
  if (!isVisible || errors.length === 0) {
    return null;
  }

  return (
    <div className={`alert alert-danger ${className}`} role="alert">
      <h6 className="alert-heading">
        <i className="fas fa-exclamation-triangle me-2"></i>
        Please fix the following issues:
      </h6>
      <ul className="mb-0 ps-3">
        {errors.map((error, index) => (
          <li key={index}>{error}</li>
        ))}
      </ul>
    </div>
  );
};

export default FormValidationSummary;