import React, { ChangeEvent, FC } from 'react';

// Define the structure for the data prop, relevant fields from FacilityFormData
interface BasicInfoData {
  company?: string;
  location?: string;
  status?: 'Planning' | 'Under Construction' | 'Operational' | 'On Hold' | 'Cancelled' | 'Decommissioned' | string;
}

// Define the props for the component
interface BasicInfoFormSectionProps {
  data: Partial<BasicInfoData>; // Use Partial as parent state is Partial
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; // Input and Select used
  isSaving: boolean;
}

const BasicInfoFormSection: FC<BasicInfoFormSectionProps> = ({ data, onChange, isSaving }) => {
  // Status options remain the same
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
            name="location" // Matches key in FacilityFormData
            value={data?.location || ''} // Use optional chaining
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
             name="status" // Matches key in FacilityFormData
             value={data?.status || 'Planning'} // Use optional chaining, default if undefined
             onChange={onChange}
           >
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