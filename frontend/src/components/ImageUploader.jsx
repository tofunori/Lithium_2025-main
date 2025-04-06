import React, { useState, useCallback } from 'react';
import { uploadFacilityImage } from '../firebase'; // Import the upload function

function ImageUploader({ facilityId, onUploadComplete, disabled }) { // Added facilityId prop
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFiles(Array.from(event.target.files));
    // Clear the input value to allow selecting the same file again
    event.target.value = null;
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
    const uploadedUrls = [];

    for (const file of selectedFiles) {
      // Basic validation (optional)
      if (!file.type.startsWith('image/')) {
        console.warn(`Skipping non-image file: ${file.name}`);
        continue;
      }

      // Upload to Firebase Storage
      try {
        const downloadURL = await uploadFacilityImage(facilityId, file);
        uploadedUrls.push(downloadURL); // Store the actual Storage URL
      } catch (error) {
        // Error is logged within uploadFacilityImage, alert the user
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
  }, [selectedFiles, onUploadComplete, facilityId]); // Added facilityId dependency

  // Removed the readFileAsDataURL helper function as it's no longer needed

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
}

export default ImageUploader;