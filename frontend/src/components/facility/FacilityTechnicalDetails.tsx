import React, { ChangeEvent } from 'react';
import { FacilityFormData } from '../../services/types';
import TechnicalFormSection from '../formSections/TechnicalFormSection';

interface FacilityTechnicalDetailsProps {
  isEditing: boolean;
  isSaving: boolean;
  displayData: {
    capacity_tonnes_per_year?: number | null;
    'Primary Recycling Technology'?: string | null;
    facility_details?: {
      feedstock?: string | null;
      product?: string | null;
      technology_description?: string | null;
    } | null;
  };
  formData?: FacilityFormData | null;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const FacilityTechnicalDetails: React.FC<FacilityTechnicalDetailsProps> = ({
  isEditing,
  isSaving,
  displayData,
  formData,
  onChange
}) => {
  return (
    <div className="facility-section">
      <h3>Technical Details</h3>
      {isEditing && formData ? (
        <TechnicalFormSection
          data={{
            processing_capacity_mt_year: formData.processing_capacity_mt_year,
            technology_name: formData.technology_name,
            feedstock: formData.details?.feedstock,
            product: formData.details?.product,
            technology_description: formData.details?.technology_description
          }}
          onChange={onChange}
          isSaving={isSaving}
        />
      ) : (
        <>
          <div className="row mb-3">
            <div className="col-md-6">
              <strong>Volume (tons/year):</strong>
              <p>{displayData.capacity_tonnes_per_year || 'N/A'}</p>
            </div>
            <div className="col-md-6">
              <strong>Method/Technology:</strong>
              <p>{displayData['Primary Recycling Technology'] || 'N/A'}</p>
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-md-6">
              <strong>Feedstock:</strong>
              <p>{displayData.facility_details?.feedstock || 'N/A'}</p>
            </div>
            <div className="col-md-6">
              <strong>Product:</strong>
              <p>{displayData.facility_details?.product || 'N/A'}</p>
            </div>
          </div>
          <div className="row mb-0">
            <div className="col-12">
              <strong>Technology Description:</strong>
              <p>{displayData.facility_details?.technology_description || 'Description not available.'}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FacilityTechnicalDetails;