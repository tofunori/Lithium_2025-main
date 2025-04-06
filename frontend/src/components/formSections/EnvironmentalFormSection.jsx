import React from 'react';

function EnvironmentalFormSection({ data, onChange, isSaving }) {
  // Access nested data safely
  const formData = data || {};
  const environmentalImpact = formData.environmentalImpact || {};

  return (
    <fieldset disabled={isSaving}>
      <legend className="mb-3">Environmental Impact</legend>
      <div className="mb-3">
        <label htmlFor="edit-environmental-details" className="form-label">Details:</label>
        <textarea
          className="form-control"
          id="edit-environmental-details"
          // Use dot notation for nested state update in the parent component
          name="environmentalImpact.details"
          value={environmentalImpact.details || ''}
          onChange={onChange}
          rows="6" // Adjust rows as needed
        ></textarea>
        <div className="form-text">
          Describe the environmental impact, mitigation measures, permits obtained, etc.
        </div>
      </div>
      {/* Add more fields related to environmental impact if needed in the future */}
    </fieldset>
  );
}

export default EnvironmentalFormSection;