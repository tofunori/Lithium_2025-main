import React, { ChangeEvent } from 'react';
import { FacilityFormData } from '../../services/types';

interface FacilityNotesProps {
  isEditing: boolean;
  isSaving: boolean;
  displayData: {
    facility_details?: {
      notes?: string | null;
    } | null;
  };
  formData?: FacilityFormData | null;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const FacilityNotes: React.FC<FacilityNotesProps> = ({
  isEditing,
  isSaving,
  displayData,
  formData,
  onChange
}) => {
  return (
    <div className="facility-section">
      <h3>Notes</h3>
      {isEditing && formData ? (
        <textarea
          className="form-control"
          id="edit-details.notes"
          name="details.notes"
          value={formData.details?.notes || ''}
          onChange={onChange}
          rows={5}
          disabled={isSaving}
        />
      ) : (
        <p>{displayData.facility_details?.notes || 'No notes available.'}</p>
      )}
    </div>
  );
};

export default FacilityNotes;