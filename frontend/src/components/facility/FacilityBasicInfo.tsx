import React, { ChangeEvent } from 'react';
import { FacilityFormData } from '../../services/types';
import BasicInfoFormSection from '../formSections/BasicInfoFormSection';

interface FacilityBasicInfoProps {
  isEditing: boolean;
  isSaving: boolean;
  displayData: {
    Location?: string | null;
    'Operational Status'?: string | null;
    facility_details?: {
      website?: string | null;
    } | null;
    Latitude?: number | null;
    Longitude?: number | null;
  };
  formData?: FacilityFormData | null;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  renderStatusBadge: (status: string | undefined | null) => React.ReactNode;
}

const FacilityBasicInfo: React.FC<FacilityBasicInfoProps> = ({
  isEditing,
  isSaving,
  displayData,
  formData,
  onChange,
  renderStatusBadge
}) => {
  return (
    <div className="facility-section">
      <h3>Basic Information</h3>
      {isEditing && formData ? (
        <>
          <BasicInfoFormSection
            data={{ 
              company: formData.company_name ?? '', 
              location: formData.address ?? '', 
              status: formData.status_name ?? '' 
            }}
            onChange={onChange}
            isSaving={isSaving}
          />
          {/* Website Input */}
          <div className="mb-3">
            <label htmlFor="edit-details.website" className="form-label">Website:</label>
            <input 
              type="url" 
              className="form-control" 
              id="edit-details.website" 
              name="details.website" 
              value={formData.details?.website || ''} 
              onChange={onChange} 
              disabled={isSaving} 
            />
          </div>
          {/* Coordinates Input */}
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="edit-latitude" className="form-label">Latitude:</label>
              <input 
                type="number" 
                step="any" 
                className="form-control" 
                id="edit-latitude" 
                name="latitude" 
                value={formData.latitude ?? ''} 
                onChange={onChange} 
                disabled={isSaving} 
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="edit-longitude" className="form-label">Longitude:</label>
              <input 
                type="number" 
                step="any" 
                className="form-control" 
                id="edit-longitude" 
                name="longitude" 
                value={formData.longitude ?? ''} 
                onChange={onChange} 
                disabled={isSaving} 
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="row mb-3">
            <div className="col-md-6">
              <strong>Location:</strong>
              <p>{displayData.Location || 'N/A'}</p>
            </div>
            <div className="col-md-6">
              <strong>Status:</strong>
              <p>{renderStatusBadge(displayData['Operational Status'])}</p>
            </div>
          </div>
          <div className="row mb-3">
            <div className="col-md-6">
              <strong>Website:</strong>
              <p>
                {displayData.facility_details?.website ? (
                  <a href={displayData.facility_details.website} target="_blank" rel="noopener noreferrer">
                    {displayData.facility_details.website}
                  </a>
                ) : 'N/A'}
              </p>
            </div>
            {typeof displayData.Latitude === 'number' && typeof displayData.Longitude === 'number' && (
              <div className="col-md-6">
                <strong>Coordinates:</strong>
                <p>{displayData.Latitude.toFixed(5)}, {displayData.Longitude.toFixed(5)}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FacilityBasicInfo;