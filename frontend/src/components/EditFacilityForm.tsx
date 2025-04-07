import React, { useState, useEffect, FC, ChangeEvent, FormEvent } from 'react';
// Import the Firestore data structure type if needed for props, but not for form state
import { FacilityData, FacilityTimelineEvent, FacilityEnvironmentalImpact } from '../firebase';
import './EditFacilityForm.css';
import ImageUploader from './ImageUploader'; // Assuming ImageUploader is JS for now
import BasicInfoFormSection from './formSections/BasicInfoFormSection'; // Import the section component
import TimelineFormSection from './formSections/TimelineFormSection'; // Import the timeline section component

// --- Define Form Data Structure ---
// This interface matches the structure used within the form's state
interface FacilityFormData {
  id?: string; // Include ID if needed for saving/updates
  name?: string; // Assuming 'name' is used in the form, map from facility.id or a specific property if needed
  company?: string;
  location?: string; // Form uses 'location', Firestore uses 'address'
  status?: 'Planning' | 'Under Construction' | 'Operational' | 'On Hold' | 'Cancelled' | 'Decommissioned' | string; // Align with select options
  capacity?: string | number; // Use string if input type="text", number if type="number"
  description?: string;
  timeline?: FacilityTimelineEvent[]; // Assuming same structure
  images?: string[]; // Array of image URLs
  // Add other direct form fields based on inputs below
  // Nested structures as they appear in the form state:
  environmentalImpact?: { details?: string };
  investment?: { total?: string | number }; // Form uses 'investment.total', Firestore uses 'fundingDetails'
  // Add any other fields the form directly manages
}

// --- Define Component Props ---
interface EditFacilityFormProps {
  facility: FacilityData | null; // Data from Firestore (nested structure)
  // Adjusted to expect form data structure for now, until save logic maps it
  onSaveSuccess: (updatedFormData: Partial<FacilityFormData>) => void;
  onCancel: () => void;
  show: boolean;
}

// --- Component Implementation ---
const EditFacilityForm: FC<EditFacilityFormProps> = ({ facility, onSaveSuccess, onCancel, show }) => {
  // State for form data, using the form-specific interface
  const [formData, setFormData] = useState<Partial<FacilityFormData>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when facility data (from Firestore) changes or component mounts
  useEffect(() => {
    if (facility) {
      // Map from nested FacilityData (Firestore structure) to flat FacilityFormData (form structure)
      setFormData({
        id: facility.id,
        name: facility.id, // Assuming name maps from id for now, adjust if needed
        company: facility.properties.company,
        location: facility.properties.address, // Map address -> location
        status: facility.properties.status,
        capacity: facility.properties.capacity,
        description: facility.properties.description,
        timeline: facility.properties.timeline,
        images: facility.properties.images,
        environmentalImpact: { details: facility.properties.environmentalImpact?.details },
        investment: { total: facility.properties.fundingDetails }, // Map fundingDetails -> investment.total
        // Map other properties as needed
      });
    } else {
      setFormData({}); // Reset form if facility becomes null
    }
  }, [facility]);

  // Handles changes in standard input fields, textareas, and selects
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const inputValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prevData => ({
      ...prevData,
      [name]: inputValue, // name corresponds to keys in FacilityFormData
    }));
  };

  // Placeholder for handling nested array changes (e.g., timeline)
  const handleArrayChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number,
    arrayName: keyof FacilityFormData, // Use keyof form data type
    fieldName: string // Ideally keyof ArrayItemType
  ) => {
    const { value } = e.target;
    setFormData(prevData => {
      const currentArray = prevData[arrayName] as any[] | undefined;
      if (!currentArray) return prevData;

      const updatedArray = [...currentArray];
      if (updatedArray[index] && typeof updatedArray[index] === 'object') {
        updatedArray[index] = { ...updatedArray[index], [fieldName]: value };
      }
      return { ...prevData, [arrayName]: updatedArray };
    });
  };

  // Placeholder for adding new items to arrays
  const addArrayItem = (arrayName: keyof FacilityFormData, newItemTemplate: any) => {
    setFormData(prevData => ({
      ...prevData,
      [arrayName]: [...((prevData[arrayName] as any[] | undefined) || []), newItemTemplate],
    }));
  };

  // Placeholder for removing items from arrays
  const removeArrayItem = (arrayName: keyof FacilityFormData, index: number) => {
     setFormData(prevData => {
       const currentArray = prevData[arrayName] as any[] | undefined;
       if (!currentArray) return prevData;
       return {
         ...prevData,
         [arrayName]: currentArray.filter((_, i) => i !== index),
       }
     });
  };

  // Handles the completion of image uploads from the ImageUploader component
  const handleImageUploadComplete = (updatedImageUrls: string[]) => {
    setFormData(prevData => ({
      ...prevData,
      images: updatedImageUrls, // Update images in form data
    }));
  };

  // Handles the form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Basic validation using form data state (optional chaining needed for Partial)
    if (!formData?.name || !formData?.location) {
      setError('Facility name and location are required.');
      setIsLoading(false);
      return;
    }

    try {
      // TODO: Implement actual save logic.
      // This logic should:
      // 1. Map `formData` (FacilityFormData) back to the nested structure expected by `updateFacility` in firebase.ts.
      // 2. Call the imported `updateFacility` function.
      // 3. Handle potential errors from the update.

      console.log('Saving data (placeholder - form structure):', formData);
      // Example: import { updateFacility } from '../firebase';
      // const dataToSave = mapFormDataToFirestore(formData); // Need to implement this mapping function
      // await updateFacility(formData.id!, dataToSave, facility?.properties.images || []); // Pass original images for deletion logic

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      alert('Facility updated successfully! (Placeholder)');
      // Pass the current form data back (as per adjusted prop type)
      onSaveSuccess(formData);
    } catch (err: any) {
      console.error("Error updating facility:", err);
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to update facility: ${message}. Please try again.`);
      alert(`Error: Failed to update facility: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Do not render the modal if the show prop is false
  if (!show) {
    return null;
  }

  // Render the form using formData state (FacilityFormData structure)
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>Edit Facility Details</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message">{error}</p>}

          {/* Basic Information - Name field remains here, others moved to section */}
          <fieldset>
            <legend>Basic Information</legend>
            <label>
              Name:
              {/* Use optional chaining ?. for Partial */}
              <input type="text" name="name" value={formData?.name || ''} onChange={handleChange} required />
            </label>
          </fieldset>

          {/* Use the BasicInfoFormSection component */}
          <BasicInfoFormSection
            data={{
              company: formData?.company,
              location: formData?.location,
              status: formData?.status,
            }}
            onChange={handleChange}
            isSaving={isLoading}
          />

          {/* Technical Specifications */}
          <fieldset>
            <legend>Technical Specifications</legend>
            <label>
              Capacity (MW):
              <input type="text" name="capacity" value={formData?.capacity || ''} onChange={handleChange} />
            </label>
             {/* Add more fields */}
          </fieldset>

          {/* Description */}
           <fieldset>
             <legend>Description</legend>
             <label>
               Description:
               <textarea name="description" value={formData?.description || ''} onChange={handleChange} rows={4}></textarea>
             </label>
           </fieldset>

          {/* Timeline Events - Use the TimelineFormSection component */}
          <TimelineFormSection
            data={{ timeline: formData?.timeline }}
            onChange={handleChange} // Pass the generic handler (acknowledging limitations)
            isSaving={isLoading}
            // TODO: Implement and pass dedicated handlers (onAddItem, onRemoveItem, onTimelineChange)
            // once the array manipulation logic is refined in both parent and child.
          />

          {/* Contact Information - Placeholder (Add fields to FacilityFormData if needed) */}
          <fieldset>
            <legend>Contact Information</legend>
            <p>Contact editing UI to be implemented.</p>
          </fieldset>

           {/* Related Documents - Placeholder (Add fields to FacilityFormData if needed) */}
           <fieldset>
             <legend>Related Documents</legend>
             <p>Document editing UI to be implemented.</p>
           </fieldset>

           {/* Environmental Impact */}
           <fieldset>
             <legend>Environmental Impact</legend>
             <label>
               Details:
               <textarea
                 name="environmentalImpact.details" // This name won't work directly with handleChange
                 value={formData?.environmentalImpact?.details || ''}
                 // Inline handler needed for nested state update
                 onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({
                   ...prev,
                   environmentalImpact: { ...(prev?.environmentalImpact || {}), details: e.target.value }
                 }))}
                 rows={3}
               ></textarea>
             </label>
             <p>More environmental impact fields to be implemented.</p>
           </fieldset>

           {/* Investment/Funding */}
           <fieldset>
             <legend>Investment/Funding</legend>
             <label>
               Total Investment ($M):
               <input
                 type="number"
                 name="investment.total" // This name won't work directly with handleChange
                 value={formData?.investment?.total || ''}
                 // Inline handler needed for nested state update
                 onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData(prev => ({
                   ...prev,
                   investment: { ...(prev?.investment || {}), total: e.target.value ? parseFloat(e.target.value) : undefined }
                 }))}
               />
             </label>
             <p>More investment fields to be implemented.</p>
           </fieldset>

          {/* Image Upload */}
          <fieldset>
            <legend>Images</legend>
            {/* Pass props expected by ImageUploader */}
            <ImageUploader
              facilityId={facility?.id} // Pass facility ID
              onUploadComplete={handleImageUploadComplete}
              disabled={isLoading} // Disable when loading
              // Pass existing images from form state if ImageUploader supports it
              // existingImages={formData?.images || []} // Uncomment if ImageUploader accepts this prop
            />
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

export default EditFacilityForm;