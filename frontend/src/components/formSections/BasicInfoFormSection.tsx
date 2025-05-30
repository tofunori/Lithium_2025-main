import React, { ChangeEvent, FC } from 'react';

// Define the structure for the data prop, relevant fields from FacilityFormData
interface BasicInfoData {
  company?: string;
  location?: string;
  // Allow any string for status, including our specific options + Unknown
  status?: string;
}

// Define the props for the component
interface BasicInfoFormSectionProps {
  data: Partial<BasicInfoData>; // Use Partial as parent state is Partial
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; // Input and Select used
  isSaving: boolean;
}

const BasicInfoFormSection: FC<BasicInfoFormSectionProps> = ({ data, onChange, isSaving }) => {
  // Status options - Change 'Planning' to 'Planned' for consistency
  const statusOptions = [
    'Planned', // Changed from 'Planning'
    'Under Construction',
    'Operational',
    'On Hold',
    'Cancelled',
    'Decommissioned',
    'Unknown', // Add Unknown as a valid option
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
            name="company" // Matches key in FacilityFormData
            value={data?.company || ''} // Use optional chaining for Partial data
            onChange={onChange}
            required // Keep required if needed, though parent form handles overall validation
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="edit-location" className="form-label">Location (Address):</label>
          <input
            type="text"
            className="form-control"
            id="edit-location"
            name="address" // Correct name to match FacilityFormData
            value={data?.location || ''} // Value comes from the 'location' prop mapped in parent
            onChange={onChange}
            required // Keep required if needed
          />
        </div>
      </div>
      <div className="row mb-3">
        <div className="col-md-6">
           <label htmlFor="edit-status" className="form-label">Status:</label>
           <select
             className="form-select"
             id="edit-status"
             name="status_name" // Use the correct field name for the state update
             value={data?.status || ''} // Value comes from the 'status' prop mapped in parent
             onChange={onChange}
           >
             {/* Optional: Add a default disabled option if '' is the value */}
             {/* <option value="" disabled>Select status...</option> */}
             {statusOptions.map(option => (
               <option key={option} value={option}>{option}</option>
             ))}
           </select>
        </div>
        {/* Add other basic info fields here if needed */}
      </div>
       {/* Description and Website are handled elsewhere */}
    </fieldset>
  );
}

export default BasicInfoFormSection;
