import React, { ChangeEvent, FC } from 'react';

// Define the structure for the environmental data this section handles
interface EnvironmentalData {
  details?: string;
}

// Define the props for the component
interface EnvironmentalFormSectionProps {
  data?: {
    environmentalImpact?: EnvironmentalData;
  };
  // The parent form currently uses an inline handler for this nested field.
  // Passing the generic handleChange might not work as expected without adjustments
  // in the parent or a more specific handler passed down.
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  isSaving?: boolean;
}

const EnvironmentalFormSection: FC<EnvironmentalFormSectionProps> = ({ data, onChange, isSaving }) => {
  // Access nested data safely
  const formData = data || {};
  const environmentalImpact = formData.environmentalImpact || {};

  // Note: The 'name' attribute "environmentalImpact.details" relies on the parent's
  // handler logic being able to update nested state correctly (e.g., the inline handler
  // currently used in EditFacilityForm.tsx).

  return (
    <fieldset disabled={isSaving}>
      <legend className="mb-3">Environmental Impact</legend>
      <div className="mb-3">
        <label htmlFor="edit-environmental-details" className="form-label">Details:</label>
        <textarea
          className="form-control"
          id="edit-environmental-details"
          // Use dot notation for nested state update in the parent component
          name="environmentalImpact.details" // Relies on parent handler logic
          value={environmentalImpact.details || ''}
          onChange={onChange} // Pass the handler from props
          rows={6} // Adjust rows as needed
          disabled={isSaving} // Add disabled attribute
        ></textarea>
        <div className="form-text">
          Describe the environmental impact, mitigation measures, permits obtained, etc.
        </div>
      </div>
      {/* Add more fields related to environmental impact if needed in the future */}
    </fieldset>
  );
};

export default EnvironmentalFormSection;