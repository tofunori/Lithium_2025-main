import React from 'react';

function ContactFormSection({ data, onChange, isSaving }) {
  const formData = data || {};

  return (
    <fieldset disabled={isSaving}>
      <legend className="mb-3">Contact Information</legend>
      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="edit-contactPerson" className="form-label">Contact Person:</label>
          <input
            type="text"
            className="form-control"
            id="edit-contactPerson"
            name="contactPerson" // Matches key in editFormData
            value={formData.contactPerson || ''}
            onChange={onChange}
          />
        </div>
      </div>
      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="edit-contactEmail" className="form-label">Contact Email:</label>
          <input
            type="email" // Use email type for validation
            className="form-control"
            id="edit-contactEmail"
            name="contactEmail" // Matches key in editFormData
            value={formData.contactEmail || ''}
            onChange={onChange}
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="edit-contactPhone" className="form-label">Contact Phone:</label>
          <input
            type="tel" // Use tel type
            className="form-control"
            id="edit-contactPhone"
            name="contactPhone" // Matches key in editFormData
            value={formData.contactPhone || ''}
            onChange={onChange}
          />
        </div>
      </div>
    </fieldset>
  );
}

export default ContactFormSection;