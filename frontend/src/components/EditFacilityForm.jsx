import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
// import { doc, updateDoc } from 'firebase/firestore'; // Will uncomment when using Firestore directly
// import { db } from '../firebase'; // Will uncomment when using Firestore directly
import './EditFacilityForm.css'; // We'll create this CSS file next
import ImageUploader from './ImageUploader';

const EditFacilityForm = ({ facility, onSaveSuccess, onCancel, show }) => {
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Populate form when facility data changes or component mounts
  useEffect(() => {
    if (facility) {
      setFormData({ ...facility });
    }
  }, [facility]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Placeholder for handling nested array changes (e.g., timeline, contacts)
  const handleArrayChange = (e, index, arrayName, fieldName) => {
    const { value } = e.target;
    setFormData(prevData => {
      const updatedArray = [...prevData[arrayName]];
      updatedArray[index] = { ...updatedArray[index], [fieldName]: value };
      return { ...prevData, [arrayName]: updatedArray };
    });
  };

  // Placeholder for adding new items to arrays
  const addArrayItem = (arrayName, newItemTemplate) => {
    setFormData(prevData => ({
      ...prevData,
      [arrayName]: [...(prevData[arrayName] || []), newItemTemplate],
    }));
  };

  // Placeholder for removing items from arrays
  const removeArrayItem = (arrayName, index) => {
     setFormData(prevData => ({
      ...prevData,
      [arrayName]: prevData[arrayName].filter((_, i) => i !== index),
    }));
  };


  const handleImageUploadComplete = (updatedImageUrls) => {
    setFormData(prevData => ({
      ...prevData,
      images: updatedImageUrls, // Assuming 'images' is the correct field name
    }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic validation (can be expanded)
    if (!formData.name || !formData.location) {
      setError('Facility name and location are required.');
      setIsLoading(false);
      return;
    }

    try {
      // TODO: Replace with actual Firestore update logic using MCP tool
      console.log('Saving data (placeholder):', formData);
      // const facilityRef = doc(db, 'facilities', facility.id);
      // await updateDoc(facilityRef, formData);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert('Facility updated successfully! (Placeholder)'); // Placeholder notification
      onSaveSuccess(formData); // Pass updated data back to parent
    } catch (err) {
      console.error("Error updating facility:", err);
      setError(`Failed to update facility: ${err.message}. Please try again.`);
      alert(`Error: ${error}`); // Placeholder error notification
    } finally {
      setIsLoading(false);
    }
  };

  if (!show) {
    return null;
  }

  // Simplified form structure - needs expansion for all fields
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Edit Facility Details</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}

          {/* Basic Information */}
          <fieldset>
            <legend>Basic Information</legend>
            <label>
              Name:
              <input type="text" name="name" value={formData.name || ''} onChange={handleChange} required />
            </label>
            <label>
              Company:
              <input type="text" name="company" value={formData.company || ''} onChange={handleChange} />
            </label>
            <label>
              Location:
              <input type="text" name="location" value={formData.location || ''} onChange={handleChange} required />
            </label>
             <label>
              Status:
              <select name="status" value={formData.status || 'Planning'} onChange={handleChange}>
                <option value="Planning">Planning</option>
                <option value="Under Construction">Under Construction</option>
                <option value="Operational">Operational</option>
                <option value="On Hold">On Hold</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Decommissioned">Decommissioned</option>
              </select>
            </label>
          </fieldset>

          {/* Technical Specifications - Placeholder */}
          <fieldset>
            <legend>Technical Specifications</legend>
            <label>
              Capacity (MW):
              <input type="text" name="capacity" value={formData.capacity || ''} onChange={handleChange} />
            </label>
             {/* Add more fields as needed */}
          </fieldset>

          {/* Description */}
           <fieldset>
             <legend>Description</legend>
             <label>
               Description:
               <textarea name="description" value={formData.description || ''} onChange={handleChange} rows="4"></textarea>
             </label>
           </fieldset>

          {/* Timeline Events - Placeholder for dynamic array handling */}
          <fieldset>
            <legend>Timeline</legend>
            {/* Map through formData.timeline and render inputs */}
            {/* Add button to add new timeline events */}
            <p>Timeline editing UI to be implemented.</p>
          </fieldset>

          {/* Contact Information - Placeholder */}
          <fieldset>
            <legend>Contact Information</legend>
             {/* Map through formData.contacts and render inputs */}
             {/* Add button to add new contacts */}
            <p>Contact editing UI to be implemented.</p>
          </fieldset>

           {/* Related Documents - Placeholder */}
           <fieldset>
             <legend>Related Documents</legend>
             {/* Map through formData.documents and render inputs/links */}
             {/* Add button to add new documents */}
             <p>Document editing UI to be implemented.</p>
           </fieldset>

           {/* Environmental Impact - Placeholder */}
           <fieldset>
             <legend>Environmental Impact</legend>
             <label>
               Details:
               <textarea name="environmentalImpact" value={formData.environmentalImpact?.details || ''} onChange={(e) => setFormData(prev => ({...prev, environmentalImpact: {...prev.environmentalImpact, details: e.target.value}}))} rows="3"></textarea>
             </label>
             {/* Add more fields */}
             <p>More environmental impact fields to be implemented.</p>
           </fieldset>

           {/* Investment/Funding - Placeholder */}
           <fieldset>
             <legend>Investment/Funding</legend>
             <label>
               Total Investment ($M):
               <input type="number" name="totalInvestment" value={formData.investment?.total || ''} onChange={(e) => setFormData(prev => ({...prev, investment: {...prev.investment, total: e.target.value}}))} />
             </label>
             {/* Add more fields */}
             <p>More investment fields to be implemented.</p>
          {/* Image Upload */}
          <fieldset>
            <legend>Images</legend>
            <ImageUploader
              existingImages={formData.images || []}
              onUploadComplete={handleImageUploadComplete}
              // Optional: Add props like maxFiles, maxFileSizeMB if needed
            />
          </fieldset>

           </fieldset>


          <div className="form-actions">
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={onCancel} disabled={isLoading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

EditFacilityForm.propTypes = {
  facility: PropTypes.object, // Can be null initially
  onSaveSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
};

export default EditFacilityForm;