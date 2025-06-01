import React, { ChangeEvent } from 'react';
import { FacilityFormData } from '../../services/types';
import EnvironmentalFormSection from '../formSections/EnvironmentalFormSection';

interface FacilityEnvironmentalImpactProps {
  isEditing: boolean;
  isSaving: boolean;
  displayData: {
    facility_details?: {
      environmental_impact_details?: string | null;
    } | null;
  };
  formData?: FacilityFormData | null;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const FacilityEnvironmentalImpact: React.FC<FacilityEnvironmentalImpactProps> = ({
  isEditing,
  isSaving,
  displayData,
  formData,
  onChange
}) => {
  return (
    <div className="facility-section">
      <h3>Environmental Impact</h3>
      {isEditing && formData ? (
        <EnvironmentalFormSection
          value={formData.details?.environmental_impact_details}
          onChange={onChange}
          isSaving={isSaving}
        />
      ) : (
        <p>{displayData.facility_details?.environmental_impact_details || 'Details not available.'}</p>
      )}
    </div>
  );
};

export default FacilityEnvironmentalImpact;