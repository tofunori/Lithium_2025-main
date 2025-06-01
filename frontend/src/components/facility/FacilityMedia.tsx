import React, { SyntheticEvent } from 'react';
import { FacilityFormData, FacilityImage } from '../../services/types';
import MediaFormSection from '../formSections/MediaFormSection';

interface FacilityMediaProps {
  facilityId: string;
  isEditing: boolean;
  isSaving: boolean;
  displayData: {
    facility_images?: FacilityImage[];
  };
  formData?: FacilityFormData | null;
  imagePublicUrls: Record<string, string>;
  onFormDataChange: (update: Partial<{ images: string[] }>) => void;
}

const FacilityMedia: React.FC<FacilityMediaProps> = ({
  facilityId,
  isEditing,
  isSaving,
  displayData,
  formData,
  imagePublicUrls,
  onFormDataChange
}) => {
  return (
    <div className="facility-section">
      <h3>Media</h3>
      {isEditing && formData ? (
        <MediaFormSection
          facilityId={facilityId}
          data={{ images: formData.images?.map(img => img.image_url || '') }}
          onFormDataChange={onFormDataChange}
          isSaving={isSaving}
        />
      ) : (
        <div className="image-gallery-placeholder">
          {Array.isArray(displayData.facility_images) && 
           displayData.facility_images.length > 0 && 
           displayData.facility_images[0]?.image_url ? (
            <div className="image-gallery-container d-flex flex-wrap">
              {displayData.facility_images.map((img, index) => (
                img.image_url && imagePublicUrls[img.image_url] && (
                  <img
                    key={img.id || index}
                    src={imagePublicUrls[img.image_url]}
                    alt={img.alt_text || `Facility ${index + 1}`}
                    className="img-thumbnail me-2 mb-2 facility-gallery-image"
                    style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover', cursor: 'pointer' }}
                    onError={(e: SyntheticEvent<HTMLImageElement, Event>) => { 
                      (e.target as HTMLImageElement).style.display = 'none'; 
                    }}
                    onClick={() => window.open(imagePublicUrls[img.image_url!], '_blank')}
                  />
                )
              ))}
            </div>
          ) : (
            <p>No images available.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FacilityMedia;