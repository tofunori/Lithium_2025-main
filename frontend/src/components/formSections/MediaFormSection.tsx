import React, { FC, SyntheticEvent } from 'react';
// Import the actual ImageUploader component - Assuming it might be JS or needs types
// If ImageUploader is TSX and exports types, import them. Otherwise, use 'any' or define basic types.
import ImageUploader from '../ImageUploader'; // Adjust path if needed

// Define the structure for the media data this section handles
interface MediaData {
  images?: string[];
}

// Define the props for the component
interface MediaFormSectionProps {
  facilityId?: string; // Facility ID needed for ImageUploader
  data?: MediaData;
  // Specific handler expected by this component to update parent state for images
  onFormDataChange: (update: Partial<MediaData>) => void;
  isSaving?: boolean;
}

const MediaFormSection: FC<MediaFormSectionProps> = ({ facilityId, data, onFormDataChange, isSaving }) => {
  const formData = data || {};
  const images: string[] = formData.images || [];

  // Handles deleting an image URL from the local state and calls parent handler
  const handleDeleteImage = (imageUrlToDelete: string) => {
    const updatedImages = images.filter(url => url !== imageUrlToDelete);
    // Call the parent's handler with the updated array for the 'images' field.
    onFormDataChange({ images: updatedImages });
    console.log("Deleted image (in form state):", imageUrlToDelete);
    // Note: Actual file deletion from storage needs separate handling on save/server-side.
  };

  // Handler for when the ImageUploader provides new image URLs
  // Assuming onUploadComplete provides an array of strings (URLs)
  const handleNewImages = (newImageUrls: string[]) => {
    const updatedImages = [...images, ...newImageUrls];
    // Call the parent's handler to update the main formData state
    onFormDataChange({ images: updatedImages });
  };

  // Type the event for the image error handler
  const handleImageError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = '/placeholder-image.png'; // Provide a path to a placeholder
    target.style.opacity = '0.5';
  };

  return (
    <fieldset disabled={isSaving}>
      <legend className="mb-3">Media (Images)</legend>

      {/* Display existing images */}
      <div className="mb-3">
        <label className="form-label">Current Images:</label>
        {images.length > 0 ? (
          <div className="d-flex flex-wrap align-items-start">
            {images.map((imageUrl, index) => (
              <div key={index} className="me-2 mb-2 position-relative">
                <img
                  src={imageUrl}
                  alt={`Facility Image ${index + 1}`}
                  className="img-thumbnail"
                  style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover' }}
                  onError={handleImageError} // Use typed error handler
                />
                <button
                  type="button"
                  className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                  style={{ lineHeight: '1', padding: '0.1rem 0.3rem' }}
                  onClick={() => handleDeleteImage(imageUrl)}
                  title="Remove Image"
                  disabled={isSaving}
                >
                  &times; {/* Multiplication sign as 'X' */}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p>No images uploaded yet.</p>
        )}
      </div>

      {/* Use the ImageUploader component */}
      <div className="mb-3">
        <label className="form-label">Upload New Images:</label>
        {/* Pass required props to ImageUploader. Add types if available. */}
        <ImageUploader
          facilityId={facilityId}
          onUploadComplete={handleNewImages} // This matches the expected prop
          disabled={isSaving}
          // existingImages={images} // Pass existing images if ImageUploader supports it
        />
      </div>
    </fieldset>
  );
};

export default MediaFormSection;