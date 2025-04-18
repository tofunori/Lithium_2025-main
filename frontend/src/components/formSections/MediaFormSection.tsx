import React, { FC, SyntheticEvent, useState, useEffect } from 'react';
import ImageUploader from '../ImageUploader'; // Adjust path if needed
// Import the helper function to get public URLs
import { getFilePublicUrl } from '../../supabaseDataService'; 

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
  // images here are paths from the database/form state
  const imagePaths: string[] = formData.images || []; 
  // State to hold the generated public URLs for display
  const [imagePublicUrls, setImagePublicUrls] = useState<Record<string, string>>({});

  // Effect to fetch public URLs for existing images when the component loads or data changes
  useEffect(() => {
    const fetchExistingUrls = async () => {
      const urlsToFetch: Record<string, Promise<string | null>> = {};
      const currentUrls: Record<string, string> = {}; // Store successfully fetched URLs

      for (const path of imagePaths) {
        // Only fetch if the path is valid and not already fetched
        if (path && !imagePublicUrls[path]) {
          // Use the correct bucket name 'facility-images'
          urlsToFetch[path] = getFilePublicUrl('facility-images', path);
        } else if (imagePublicUrls[path]) {
          // Keep already fetched URLs
          currentUrls[path] = imagePublicUrls[path];
        }
      }

      // Wait for all fetches to complete
      const paths = Object.keys(urlsToFetch);
      const results = await Promise.all(Object.values(urlsToFetch));

      // Populate the currentUrls object with newly fetched URLs
      results.forEach((url, index) => {
        const path = paths[index];
        if (url) {
          currentUrls[path] = url;
        } else {
          console.warn(`Could not get public URL for existing path: ${path}`);
          // Optionally handle missing URLs, e.g., set a placeholder or remove the path
        }
      });

      // Update the state with both existing and newly fetched URLs
      setImagePublicUrls(currentUrls);
    };

    if (imagePaths.length > 0) {
      fetchExistingUrls();
    } else {
      // Clear URLs if there are no image paths
      setImagePublicUrls({});
    }
    // Dependency array: Run effect when imagePaths array reference changes
  }, [imagePaths]); // Rerun when imagePaths change


  // Handles deleting an image path from the local state and calls parent handler
  const handleDeleteImage = (imagePathToDelete: string) => {
    const updatedImagePaths = imagePaths.filter(path => path !== imagePathToDelete);
    // Call the parent's handler with the updated array for the 'images' field.
    onFormDataChange({ images: updatedImagePaths });
    console.log("Deleted image path (in form state):", imagePathToDelete);
    // Note: Actual file deletion from storage needs separate handling on save/server-side.
  };

  // Handler for when the ImageUploader provides new image paths
  // Assuming onUploadComplete provides an array of strings (paths)
  const handleNewImages = async (newImagePaths: string[]) => { // Make async again
    const updatedImagePaths = [...imagePaths, ...newImagePaths];
    // Call the parent's handler to update the main formData state
    onFormDataChange({ images: updatedImagePaths });

    // Fetch public URLs for newly added images immediately and update local state
    const newUrls: Record<string, string> = {};
    for (const path of newImagePaths) {
      if (path) {
        try {
            const publicUrl = await getFilePublicUrl('facility-images', path); 
            if (publicUrl) {
                newUrls[path] = publicUrl;
            } else {
                console.warn(`Could not get public URL immediately after upload for path: ${path}`);
            }
        } catch (error) {
             console.error(`Error fetching public URL for ${path}:`, error);
        }
      }
    }
    // Merge new URLs with existing ones in the local state for immediate preview
    setImagePublicUrls(prevUrls => ({ ...prevUrls, ...newUrls }));
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
        {imagePaths.filter(path => path).length > 0 ? (
          <div className="d-flex flex-wrap align-items-start">
            {imagePaths.filter(path => path).map((imagePath, index) => {
              // Only render the image container if the public URL exists for this path
              const publicUrl = imagePublicUrls[imagePath];
              if (!publicUrl) {
                // Optionally render a loading indicator or nothing while URL is fetching
                return null; 
              }
              return (
                <div key={index} className="me-2 mb-2 position-relative">
                  <img
                    src={publicUrl} // Use the fetched public URL
                    alt={`Facility Image ${index + 1}`}
                    className="img-thumbnail"
                    style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'cover' }}
                    onError={handleImageError} // Use typed error handler
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                    style={{ lineHeight: '1', padding: '0.1rem 0.3rem' }}
                    onClick={() => handleDeleteImage(imagePath)} // Pass the path to delete
                    title="Remove Image"
                    disabled={isSaving}
                  >
                    &times; {/* Multiplication sign as 'X' */}
                  </button>
                </div>
              );
            })}
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
          // existingImages={imagePaths} // Pass existing image paths if ImageUploader supports it
        />
      </div>
    </fieldset>
  );
};

export default MediaFormSection;
