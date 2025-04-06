import React, { useState, useEffect, useCallback } from 'react';
import { storage } from '../firebase'; // Assuming firebase.js exports storage
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import './ImageUploader.css'; // We'll create this CSS file next

const ImageUploader = ({ existingImages = [], onUploadComplete, maxFiles = 5, maxFileSizeMB = 5, allowedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] }) => {
  const [selectedFiles, setSelectedFiles] = useState([]); // Files selected via input
  const [previewUrls, setPreviewUrls] = useState([]); // URLs for previewing selected files
  const [uploadedImageUrls, setUploadedImageUrls] = useState(existingImages); // URLs from Firebase
  const [uploadProgress, setUploadProgress] = useState({}); // Progress per file { fileName: percentage }
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Sync uploaded URLs with existingImages prop
  useEffect(() => {
    setUploadedImageUrls(existingImages);
  }, [existingImages]);

  // Generate preview URLs when files are selected
  useEffect(() => {
    const urls = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);

    // Cleanup function to revoke object URLs
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [selectedFiles]);

  const handleFileChange = (event) => {
    setError('');
    const files = Array.from(event.target.files);
    const currentTotalFiles = selectedFiles.length + uploadedImageUrls.length;

    if (files.length + currentTotalFiles > maxFiles) {
      setError(`You can select a maximum of ${maxFiles} images (including existing).`);
      return;
    }

    const validFiles = [];
    const errors = [];

    files.forEach(file => {
      if (!allowedFileTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type.`);
      } else if (file.size > maxFileSizeMB * 1024 * 1024) {
        errors.push(`${file.name}: File size exceeds ${maxFileSizeMB}MB.`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors.join(' '));
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeUploadedFile = async (imageUrlToRemove) => {
      if (!imageUrlToRemove) {
          console.error("Attempted to remove an undefined or null image URL.");
          setError("Could not remove image: Invalid URL provided.");
          return;
      }
      console.log("Attempting to remove uploaded image:", imageUrlToRemove);
      try {
          const imageRef = ref(storage, imageUrlToRemove); // Get ref directly from URL
          await deleteObject(imageRef);
          const updatedUrls = uploadedImageUrls.filter(url => url !== imageUrlToRemove);
          setUploadedImageUrls(updatedUrls);
          onUploadComplete(updatedUrls); // Notify parent of the change
          console.log("Successfully removed image from storage and state:", imageUrlToRemove);
      } catch (error) {
          console.error("Error removing image from Firebase Storage:", error);
          setError(`Failed to remove image: ${error.message}. It might have already been deleted or permissions are insufficient.`);
          // Optionally, still remove from local state if desired, even if Firebase deletion fails
          // const updatedUrls = uploadedImageUrls.filter(url => url !== imageUrlToRemove);
          // setUploadedImageUrls(updatedUrls);
          // onUploadComplete(updatedUrls);
      }
  };


  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError("No new files selected for upload.");
      return;
    }
    if (selectedFiles.length + uploadedImageUrls.length > maxFiles) {
        setError(`Cannot upload. Total images would exceed the limit of ${maxFiles}.`);
        return;
    }


    setIsUploading(true);
    setError('');
    setUploadProgress({});

    const uploadPromises = selectedFiles.map(file => {
      // Consider adding facilityId or unique identifier to the path
      const storageRef = ref(storage, `facility_images/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
          },
          (uploadError) => {
            console.error(`Upload failed for ${file.name}:`, uploadError);
            setError(prev => `${prev} Upload failed for ${file.name}.`);
            reject(uploadError); // Reject promise on error
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('File available at', downloadURL);
              resolve(downloadURL); // Resolve promise with download URL
            } catch (getUrlError) {
              console.error(`Failed to get download URL for ${file.name}:`, getUrlError);
              setError(prev => `${prev} Failed to get URL for ${file.name}.`);
              reject(getUrlError); // Reject if getting URL fails
            }
          }
        );
      });
    });

    try {
      const newUrls = await Promise.all(uploadPromises);
      const allUrls = [...uploadedImageUrls, ...newUrls];
      setUploadedImageUrls(allUrls);
      setSelectedFiles([]); // Clear selected files after successful upload
      setPreviewUrls([]);
      setUploadProgress({});
      onUploadComplete(allUrls); // Pass all URLs (existing + new) to parent
    } catch (error) {
      // Errors are handled individually in the promises, but catch any Promise.all error
      console.error("An error occurred during one or more uploads:", error);
      // Keep files that failed in the selected list? Or clear all? Decide based on UX.
      // For now, we clear all as successful ones are already processed.
      // setSelectedFiles([]);
      // setPreviewUrls([]);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="image-uploader">
      {error && <p className="error-message">{error}</p>}

      {/* Display Existing/Uploaded Images */}
      <h4>Uploaded Images ({uploadedImageUrls.length}/{maxFiles})</h4>
      <div className="image-preview-container">
        {uploadedImageUrls.map((url, index) => (
          <div key={index} className="image-preview-item">
            <img src={url} alt={`Uploaded ${index + 1}`} />
            <button
              type="button"
              className="remove-button"
              onClick={() => removeUploadedFile(url)}
              disabled={isUploading}
              title="Remove this image permanently"
            >
              &times;
            </button>
          </div>
        ))}
         {uploadedImageUrls.length === 0 && <p>No images uploaded yet.</p>}
      </div>

      <hr />

      {/* Display Selected Files for Upload */}
      <h4>Select New Images ({selectedFiles.length + uploadedImageUrls.length}/{maxFiles})</h4>
       <div className="image-preview-container">
        {previewUrls.map((url, index) => (
          <div key={index} className="image-preview-item">
            <img src={url} alt={`Preview ${index + 1}`} />
            {uploadProgress[selectedFiles[index]?.name] !== undefined && (
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${uploadProgress[selectedFiles[index].name]}%` }}
                >
                  {Math.round(uploadProgress[selectedFiles[index].name])}%
                </div>
              </div>
            )}
            <button
              type="button"
              className="remove-button"
              onClick={() => removeSelectedFile(index)}
              disabled={isUploading}
              title="Remove selection"
            >
              &times;
            </button>
          </div>
        ))}
        {selectedFiles.length === 0 && <p>No new images selected.</p>}
      </div>


      {/* File Input */}
       {(selectedFiles.length + uploadedImageUrls.length) < maxFiles && (
        <div className="file-input-container">
            <label htmlFor="file-upload" className="file-input-label">
                Choose Images
            </label>
            <input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileChange}
                accept={allowedFileTypes.join(',')}
                disabled={isUploading || (selectedFiles.length + uploadedImageUrls.length >= maxFiles)}
            />
            <span className="file-input-info">
                (Max {maxFiles} total, {maxFileSizeMB}MB per file)
            </span>
        </div>
       )}


      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <button
          type="button"
          className="upload-button"
          onClick={handleUpload}
          disabled={isUploading || selectedFiles.length === 0}
        >
          {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} New Image(s)`}
        </button>
      )}
    </div>
  );
};

export default ImageUploader;