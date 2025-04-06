import React from 'react';

function BasicInfoFormSection({ data, onChange, isSaving }) {
  // Ensure data is not null or undefined
  const formData = data || {};
  const statusOptions = [
    'Planning',
    'Under Construction',
    'Operational',
    'On Hold',
    'Cancelled',
    'Decommissioned',
  ];

  return (
    <fieldset disabled={isSaving}>
      <legend className="mb-3">Basic Information</legend>
      <div className="row mb-3">
        <div className="col-md-6">
          <label htmlFor="edit-company" className="form-label">Company Name:</label>
          <input
            type="text"
            className="form-control"
            id="edit-company"
            name="company" // Matches the key in facilityDataForForm/editFormData
            value={formData.company || ''}
            onChange={onChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="edit-location" className="form-label">Location (Address):</label>
          <input
            type="text"
            className="form-control"
            id="edit-location"
            name="location" // Matches the key in facilityDataForForm/editFormData
            value={formData.location || ''}
            onChange={onChange}
          />
        </div>
      </div>
      <div className="row mb-3">
        <div className="col-md-6">
           <label htmlFor="edit-status" className="form-label">Status:</label>
           <select
             className="form-select"
             id="edit-status"
             name="status" // Matches the key in facilityDataForForm/editFormData
             value={formData.status || 'Planning'}
             onChange={onChange}
           >
             {statusOptions.map(option => (
               <option key={option} value={option}>{option}</option>
             ))}
           </select>
        </div>
        {/* Add other basic info fields here if needed, e.g., Website was moved to Overview tab directly */}
      </div>
       {/* Description and Website are handled directly in FacilityDetailPage for now */}
    </fieldset>
  );
}

export default BasicInfoFormSection;