// frontend/src/components/ImageUploader.tsx
import React, { useState, useCallback, ChangeEvent } from 'react';
// UPDATED: Import from supabaseDataService
import { uploadFacilityImage } from '../services';

// Define the interface for the component props
interface ImageUploaderProps {
  facilityId: string | null | undefined; // Facility ID can be string, null, or undefined
  onUploadComplete: (urls: string[]) => void; // Callback function accepting an array of strings
  disabled?: boolean; // Optional disabled prop
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ facilityId, onUploadComplete, disabled = false }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // State for selected files, typed as File array
  const [isProcessing, setIsProcessing] = useState<boolean>(false); // State for processing status, typed as boolean

  // Type the event parameter for the file change handler
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
    // Clear the input value to allow selecting the same file again
    event.target.value = ''; // Use empty string instead of null for input value
  };

  const handleUpload = useCallback(async () => {
    if (!facilityId) {
      alert('Error: Facility ID is missing. Cannot upload images.');
      return;
    }
    if (selectedFiles.length === 0) {
      alert('Please select files to upload.');
      return;
    }

    setIsProcessing(true);
    const uploadedUrls: string[] = []; // Type the array for uploaded URLs

    for (const file of selectedFiles) { // 'file' is implicitly of type File here
      // Basic validation (optional)
      if (!file.type.startsWith('image/')) {
        console.warn(`Skipping non-image file: ${file.name}`);
        continue;
      }

      // Upload using the imported Supabase version of uploadFacilityImage
      try {
        // Assuming uploadFacilityImage returns a Promise<string> (the public URL)
        const downloadURL: string = await uploadFacilityImage(facilityId, file);
        uploadedUrls.push(downloadURL); // Store the actual Storage URL
      } catch (error) {
        // Error handling remains largely the same
        console.error(`Failed to upload file: ${file.name}. Error:`, error); // Log the actual error
        alert(`Failed to upload file: ${file.name}. See console for details.`);
        // Optionally decide if you want to stop processing remaining files
        // setIsProcessing(false); // Uncomment if you want to stop on first error
        // return; // Uncomment if you want to stop on first error
      }
    }

    if (uploadedUrls.length > 0) {
      onUploadComplete(uploadedUrls); // Pass the array of new URLs
    }

    setSelectedFiles([]); // Clear selection after processing
    setIsProcessing(false);
  }, [selectedFiles, onUploadComplete, facilityId]); // Dependencies remain the same

  return (
    <div className="image-uploader">
      <div className="input-group mb-2">
        <input
          type="file"
          className="form-control"
          id="image-upload-input"
          multiple
          onChange={handleFileChange}
          disabled={disabled || isProcessing}
          accept="image/*" // Accept only image files
        />
        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={handleUpload}
          disabled={disabled || isProcessing || selectedFiles.length === 0}
        >
          {isProcessing ? 'Processing...' : `Upload ${selectedFiles.length} File(s)`}
        </button>
      </div>
      {/* Optional: Preview selected files */}
      {selectedFiles.length > 0 && (
        <div className="mb-2">
          <small>Selected:</small>
          <ul className="list-unstyled small">
            {selectedFiles.map((file, index) => (
              <li key={index}>{file.name} ({Math.round(file.size / 1024)} KB)</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;