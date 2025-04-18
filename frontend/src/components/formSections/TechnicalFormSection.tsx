import React, { ChangeEvent, FC } from 'react';

// Define the structure for the technical data this section handles
// UPDATED: Keys match SupabaseFacilityFormData for direct compatibility
interface TechnicalData {
  processing_capacity_mt_year?: string | number | null;
  technology_name?: string | null;
  feedstock?: string | null;
  product?: string | null;
  technology_description?: string | null;
}

// Define the props for the component
interface TechnicalFormSectionProps {
  data?: TechnicalData; // Expects data structure matching SupabaseFacilityFormData subset
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  isSaving?: boolean;
}

const TechnicalFormSection: FC<TechnicalFormSectionProps> = ({ data, onChange, isSaving }) => {
  // Use provided data directly, default to empty object if undefined
  const formData = data || {};

  return (
    <fieldset disabled={isSaving}>
      <legend className="mb-3">Technical Details</legend>
      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="edit-processing_capacity_mt_year" className="form-label">Volume (tons/year):</label>
          <input
            type="text" // Keep as text, parent handles parsing
            className="form-control"
            id="edit-processing_capacity_mt_year"
            name="processing_capacity_mt_year" // UPDATED: Matches SupabaseFacilityFormData key
            // Ensure value is treated as string for input, handle null/undefined
            value={formData.processing_capacity_mt_year != null ? String(formData.processing_capacity_mt_year) : ''}
            onChange={onChange}
            disabled={isSaving}
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="edit-technology_name" className="form-label">Method/Technology:</label>
          <input
            type="text"
            className="form-control"
            id="edit-technology_name"
            name="technology_name" // UPDATED: Matches SupabaseFacilityFormData key
            value={formData.technology_name || ''}
            onChange={onChange}
            disabled={isSaving}
          />
        </div>
      </div>
      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="edit-feedstock" className="form-label">Feedstock:</label>
          <input
            type="text"
            className="form-control"
            id="edit-feedstock"
            name="details.feedstock" // Matches nested details key
            value={formData.feedstock || ''}
            onChange={onChange}
            disabled={isSaving}
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="edit-product" className="form-label">Product:</label>
          <input
            type="text"
            className="form-control"
            id="edit-product"
            name="details.product" // Matches nested details key
            value={formData.product || ''}
            onChange={onChange}
            disabled={isSaving}
          />
        </div>
      </div>
      <div className="mb-3">
        <label htmlFor="edit-technology_description" className="form-label">Technical Specifications:</label>
        <textarea
          className="form-control"
          id="edit-technology_description"
        name="details.technology_description" // UPDATED: Matches nested details key
          value={formData.technology_description || ''}
          onChange={onChange}
          rows={5}
          disabled={isSaving}
        ></textarea>
      </div>
    </fieldset>
  );
};

export default TechnicalFormSection;
