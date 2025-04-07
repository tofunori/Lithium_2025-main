import React, { ChangeEvent, FC } from 'react';

// Define the structure for the technical data this section handles
interface TechnicalData {
  capacity?: string | number; // Matches FacilityFormData.capacity
  technology?: string;
  feedstock?: string;
  product?: string;
  technicalSpecs?: string;
}

// Define the props for the component
interface TechnicalFormSectionProps {
  data?: TechnicalData;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  isSaving?: boolean;
}

const TechnicalFormSection: FC<TechnicalFormSectionProps> = ({ data, onChange, isSaving }) => {
  const formData = data || {};

  return (
    <fieldset disabled={isSaving}>
      <legend className="mb-3">Technical Details</legend>
      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="edit-capacity" className="form-label">Volume (tons/year):</label>
          <input
            type="text" // Kept as text to allow flexible input, parent might parse to number
            className="form-control"
            id="edit-capacity"
            name="capacity" // Matches key in FacilityFormData
            // Ensure value is treated as string for input
            value={formData.capacity !== undefined ? String(formData.capacity) : ''}
            onChange={onChange}
            disabled={isSaving} // Add disabled attribute
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="edit-technology" className="form-label">Method/Technology:</label>
          <input
            type="text"
            className="form-control"
            id="edit-technology"
            name="technology" // Matches key in editFormData (assuming it exists)
            value={formData.technology || ''}
            onChange={onChange}
            disabled={isSaving} // Add disabled attribute
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
            name="feedstock" // Matches key in editFormData (assuming it exists)
            value={formData.feedstock || ''}
            onChange={onChange}
            disabled={isSaving} // Add disabled attribute
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="edit-product" className="form-label">Product:</label>
          <input
            type="text"
            className="form-control"
            id="edit-product"
            name="product" // Matches key in editFormData (assuming it exists)
            value={formData.product || ''}
            onChange={onChange}
            disabled={isSaving} // Add disabled attribute
          />
        </div>
      </div>
      <div className="mb-3">
        <label htmlFor="edit-technicalSpecs" className="form-label">Technical Specifications:</label>
        <textarea
          className="form-control"
          id="edit-technicalSpecs"
          name="technicalSpecs" // Matches key in editFormData (assuming it exists)
          value={formData.technicalSpecs || ''}
          onChange={onChange}
          rows={5} // Adjust rows as needed
          disabled={isSaving} // Add disabled attribute
        ></textarea>
      </div>
    </fieldset>
  );
};

export default TechnicalFormSection;