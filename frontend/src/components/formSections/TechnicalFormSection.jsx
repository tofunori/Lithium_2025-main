import React from 'react';

function TechnicalFormSection({ data, onChange, isSaving }) {
  const formData = data || {};

  return (
    <fieldset disabled={isSaving}>
      <legend className="mb-3">Technical Details</legend>
      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="edit-capacity" className="form-label">Volume (tons/year):</label>
          <input
            type="text" // Changed from number to text to allow non-numeric characters (e.g., commas, units)
            className="form-control"
            id="edit-capacity"
            name="capacity" // Matches key in editFormData
            value={formData.capacity || ''}
            onChange={onChange}
            min="0" // Optional: prevent negative numbers
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="edit-technology" className="form-label">Method/Technology:</label>
          <input
            type="text"
            className="form-control"
            id="edit-technology"
            name="technology" // Matches key in editFormData
            value={formData.technology || ''}
            onChange={onChange}
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
            name="feedstock" // Matches key in editFormData
            value={formData.feedstock || ''}
            onChange={onChange}
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="edit-product" className="form-label">Product:</label>
          <input
            type="text"
            className="form-control"
            id="edit-product"
            name="product" // Matches key in editFormData
            value={formData.product || ''}
            onChange={onChange}
          />
        </div>
      </div>
      <div className="mb-3">
        <label htmlFor="edit-technicalSpecs" className="form-label">Technical Specifications:</label>
        <textarea
          className="form-control"
          id="edit-technicalSpecs"
          name="technicalSpecs" // Matches key in editFormData
          value={formData.technicalSpecs || ''}
          onChange={onChange}
          rows="5" // Adjust rows as needed
        ></textarea>
      </div>
    </fieldset>
  );
}

export default TechnicalFormSection;