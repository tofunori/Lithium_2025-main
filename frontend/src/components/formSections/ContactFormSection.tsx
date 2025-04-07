import React, { ChangeEvent, FC } from 'react';

// Define the structure for the contact data this section handles
interface ContactData {
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
}

// Define the props for the component
interface ContactFormSectionProps {
  data?: ContactData;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  isSaving?: boolean;
}

const ContactFormSection: FC<ContactFormSectionProps> = ({ data, onChange, isSaving }) => {
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
            name="contactPerson" // Matches key in FacilityFormData (assuming it exists)
            value={formData.contactPerson || ''}
            onChange={onChange}
            disabled={isSaving} // Add disabled attribute
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
            name="contactEmail" // Matches key in FacilityFormData (assuming it exists)
            value={formData.contactEmail || ''}
            onChange={onChange}
            disabled={isSaving} // Add disabled attribute
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="edit-contactPhone" className="form-label">Contact Phone:</label>
          <input
            type="tel" // Use tel type
            className="form-control"
            id="edit-contactPhone"
            name="contactPhone" // Matches key in FacilityFormData (assuming it exists)
            value={formData.contactPhone || ''}
            onChange={onChange}
            disabled={isSaving} // Add disabled attribute
          />
        </div>
      </div>
      {/* Add more contact fields if needed */}
    </fieldset>
  );
};

export default ContactFormSection;