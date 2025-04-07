import React from 'react';
// Import the actual ImageUploader component
import ImageUploader from '../ImageUploader';

function MediaFormSection({ facilityId, data, onFormDataChange, isSaving }) { // Added facilityId prop
  const formData = data || {};
  const images = formData.images || [];

  // Placeholder for handling image deletion within the form state
  const handleDeleteImage = (imageUrlToDelete) => {
    const updatedImages = images.filter(url => url !== imageUrlToDelete);
    // Call the onUploadComplete handler to update the parent's editFormData
    // Call the parent's handler with the updated array for the 'images' field.
    onFormDataChange({ images: updatedImages });
    console.log("Deleted image (in form state):", imageUrlToDelete);
    // Note: Actual file deletion from storage needs separate handling on save/server-side.
  };
  // Handler for when the ImageUploader provides new image URLs (data URLs in this case)
  const handleNewImages = (newImageUrls) => {
    const updatedImages = [...images, ...newImageUrls];
    // Call the parent's handler to update the main editFormData state
    onFormDataChange({ images: updatedImages });
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
                  onError={(e) => { e.target.src = '/placeholder-image.png'; e.target.style.opacity = '0.5'; }}
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
        <ImageUploader facilityId={facilityId} onUploadComplete={handleNewImages} disabled={isSaving} />
      </div>
    </fieldset>
  );
}

export default MediaFormSection;