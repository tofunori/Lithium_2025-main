// frontend/src/components/EditFacilityForm.tsx
import React, { useState, useEffect, FC, ChangeEvent, FormEvent } from 'react';
// UPDATED: Import from supabaseDataService
import {
    Facility, // Use the new flat Facility interface
    FacilityTimelineEvent,
    updateFacility,
    FacilityFormData // Import the canonical form data type
} from '../services';
import './EditFacilityForm.css';
import ImageUploader from './ImageUploader'; // Assuming ImageUploader is JS for now
import BasicInfoFormSection from './formSections/BasicInfoFormSection'; // Import the section component
import TimelineFormSection from './formSections/TimelineFormSection'; // Import the timeline section component
// Import other sections if they are used and need props passed
import TechnicalFormSection from './formSections/TechnicalFormSection';
import EnvironmentalFormSection from './formSections/EnvironmentalFormSection';
import InvestmentFormSection from './formSections/InvestmentFormSection';
import ContactFormSection from './formSections/ContactFormSection';
import DocumentsFormSection from './formSections/DocumentsFormSection';


// --- Define Component Props ---
interface EditFacilityFormProps {
  facility: Facility | null; // UPDATED: Expect Facility type
  onSaveSuccess: (updatedFacilityData: Facility) => void; // Pass back the full updated data (Facility)
  onCancel: () => void;
  show: boolean; // Prop to control modal visibility (assuming parent handles modal logic)
}

// --- Component Implementation ---
const EditFacilityForm: FC<EditFacilityFormProps> = ({ facility, onSaveSuccess, onCancel, show }) => {
  // State for form data, using the imported FacilityFormData type
  const [formData, setFormData] = useState<Partial<FacilityFormData>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when facility data changes or component mounts
  useEffect(() => {
    if (facility) {
      // Map from flat Facility (DB structure) to FacilityFormData (form structure)
      setFormData({
        id: facility.id,
        // Map flat properties to form fields
        company_name: facility.company_name ?? '',
        address: facility.address ?? '', // Use address directly
        city: facility.city ?? '', // Add city if needed in form
        status_name: facility.status_name ?? 'Planned', // Default if undefined
        status_effective_date_text: facility.status_effective_date_text ?? '',
        processing_capacity_mt_year: facility.processing_capacity_mt_year ?? '',
        ev_equivalent_per_year: facility.ev_equivalent_per_year ?? '',
        jobs: facility.jobs ?? '',
        technology_name: facility.technology_name ?? '', // Add if needed in form
        technology_description: facility.technology_description ?? '', // Use technology_description
        notes: facility.notes ?? '', // Use notes
        latitude: facility.latitude ?? null,
        longitude: facility.longitude ?? null,
        website: facility.website ?? '', // Assuming website is a direct column now or handled in form data
        feedstock: facility.feedstock ?? '', // Assuming feedstock is direct or handled
        product: facility.product ?? '', // Assuming product is direct or handled
        contactPerson: facility.contactPerson ?? '', // Assuming contactPerson is direct or handled
        contactEmail: facility.contactEmail ?? '', // Assuming contactEmail is direct or handled
        contactPhone: facility.contactPhone ?? '', // Assuming contactPhone is direct or handled

        // Map investment_usd (DB) to investment.total (Form)
        investment: { total: facility.investment_usd ?? '' },

        // Keep structures for fields managed within the form state (if not flattened in DB)
        // These might need fetching from related tables if they were normalized
        // Assuming these fields might not be directly on the Facility object anymore
        timeline: (facility as any).timeline || [{ date: '', event: '' }], // Use 'as any' or fetch separately
        images: (facility as any).images || [''], // Use 'as any' or fetch separately
        documents: (facility as any).documents || [{ title: '', url: '' }], // Use 'as any' or fetch separately
        environmentalImpact: { details: (facility as any).environmentalImpact?.details || '' }, // Use 'as any' or fetch separately
      });
    } else {
      setFormData({}); // Reset form if facility becomes null
    }
  }, [facility]);

  // Handles changes in standard input fields, textareas, and selects
  // UPDATED: Matches FacilityFormData structure
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked; // For checkboxes
    const inputValue = type === 'checkbox' ? checked : value;

    // Handle nested properties directly if needed (e.g., environmentalImpact.details, investment.total)
     if (name.includes('.')) {
        const [outerKey, innerKey] = name.split('.') as [keyof FacilityFormData, string];

        setFormData(prevData => {
            if (!prevData) return {};

            // Deep copy the part of the state we are changing
            let newData = { ...prevData };
            let currentLevel: any = newData;

            // Ensure outer key exists and is an object
            if (!currentLevel[outerKey] || typeof currentLevel[outerKey] !== 'object') {
                currentLevel[outerKey] = {};
            } else {
                // Create a copy of the nested object
                currentLevel[outerKey] = { ...currentLevel[outerKey] };
            }
            currentLevel = currentLevel[outerKey]; // Move down one level

            // Set the final value
            currentLevel[innerKey] = inputValue;
            return newData;
        });
    } else {
        // Handle top-level properties
        setFormData(prevData => ({
          ...prevData,
          [name]: inputValue,
        }));
    }
  };

  // Handlers for Timeline array changes - Keep add/remove separate
   const addTimelineItem = (): void => {
       setFormData(prevData => {
           const newTimeline = [...(prevData?.timeline || []), { date: '', event: '' }];
           return { ...prevData, timeline: newTimeline };
       });
   };

   const removeTimelineItem = (index: number): void => {
       setFormData(prevData => {
           if (!prevData || !prevData.timeline) return prevData;
           const updatedTimeline = prevData.timeline.filter((_, i) => i !== index);
           // Ensure at least one item remains if needed by the component, otherwise allow empty
           return { ...prevData, timeline: updatedTimeline.length > 0 ? updatedTimeline : [{ date: '', event: '' }] };
           // return { ...prevData, timeline: updatedTimeline };
       });
   };

   // Handlers for Documents array changes - Keep add/remove separate
   const addDocumentItem = (): void => {
       setFormData(prevData => {
           const newDocuments = [...(prevData?.documents || []), { title: '', url: '' }];
           return { ...prevData, documents: newDocuments };
       });
   };

    const removeDocumentItem = (index: number): void => {
       setFormData(prevData => {
           if (!prevData || !prevData.documents) return prevData;
           const updatedDocuments = prevData.documents.filter((_, i) => i !== index);
            // Ensure at least one item remains if needed by the component, otherwise allow empty
           return { ...prevData, documents: updatedDocuments.length > 0 ? updatedDocuments : [{ title: '', url: '' }] };
           // return { ...prevData, documents: updatedDocuments };
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
  // UPDATED: Uses FacilityFormData
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Ensure formData and facility ID exist
    if (!formData || !formData.id) {
      setError('Facility data or ID is missing. Cannot save.');
      setIsLoading(false);
      return;
    }

    // Basic Validation (using formData state)
    if (!formData.company_name?.trim() || !formData.address?.trim()) { // Check company_name and address
      setError('Facility name (Company) and location (address) are required.');
      setIsLoading(false);
      return;
    }

    try {
      // Call the imported Supabase updateFacility function
      // Pass the ID and the current formData state (which matches FacilityFormData)
      // Ensure formData is not just Partial before passing
      if (Object.keys(formData).length > 1) { // Check if more than just ID is present
          await updateFacility(formData.id, formData as FacilityFormData); // Cast Partial to full type
      } else {
          throw new Error("Form data is incomplete.");
      }


      // Construct the updated FacilityData to pass back (optional, depends on parent needs)
      // This requires mapping formData back to Facility structure
      // This mapping might be complex if form data structure differs significantly
      // For simplicity, assuming a direct mapping for now, but might need refinement
      const updatedFacilityData: Facility = {
          id: formData.id,
          company_name: formData.company_name ?? null,
          address: formData.address ?? null,
          city: formData.city ?? null,
          status_name: formData.status_name ?? null,
          status_effective_date_text: formData.status_effective_date_text ?? null,
          processing_capacity_mt_year: formData.processing_capacity_mt_year ? Number(formData.processing_capacity_mt_year) : null,
          ev_equivalent_per_year: formData.ev_equivalent_per_year ? Number(formData.ev_equivalent_per_year) : null,
          jobs: formData.jobs ? Number(formData.jobs) : null,
          investment_usd: formData.investment?.total ? Number(formData.investment.total) : null, // Map from nested form structure
          technology_name: formData.technology_name ?? null,
          technology_description: formData.technology_description ?? null,
          notes: formData.notes ?? null,
          latitude: formData.latitude ? Number(formData.latitude) : null,
          longitude: formData.longitude ? Number(formData.longitude) : null,
          website: formData.website ?? null,
          feedstock: formData.feedstock ?? null,
          product: formData.product ?? null,
          contactPerson: formData.contactPerson ?? null,
          contactEmail: formData.contactEmail ?? null,
          contactPhone: formData.contactPhone ?? null,
          // Add other fields from Facility interface, potentially null or default values
          region_name: null, // Example: Assuming not edited in this form
          country_name: null, // Example: Assuming not edited in this form
          created_at: facility?.created_at, // Preserve original created_at if available
          // Map back potentially complex fields if needed
          timeline: formData.timeline,
          images: formData.images,
          documents: formData.documents,
          environmentalImpact: formData.environmentalImpact,
      };


      alert('Facility updated successfully!');
      onSaveSuccess(updatedFacilityData); // Pass back the reconstructed data

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

  // Prepare timeline data for the child component, ensuring date is a string
  const timelineForForm = formData?.timeline?.map(item => ({
      ...item,
      date: String(item.date) // Convert date to string
  }));


  // Render the form using formData state (FacilityFormData structure)
  // Pass relevant parts of formData to section components
  return (
    <div className="modal-backdrop"> {/* Assuming parent handles modal display */}
      <div className="modal-content edit-facility-form"> {/* Add specific class */}
        <h2>Edit Facility Details</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="error-message alert alert-danger">{error}</p>}

          {/* Pass relevant slices of formData to section components */}
          {/* UPDATED: Pass correct props with nullish coalescing */}
          <BasicInfoFormSection
            data={{
              company: formData?.company_name ?? undefined,
              location: formData?.address ?? undefined,
              status: formData?.status_name ?? undefined,
            }}
            onChange={handleChange}
            isSaving={isLoading}
          />
           {/* Add Website and Coordinates fields manually if needed here */}
           <fieldset>
                <legend>Details</legend>
                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label w-100"> {/* Added form-label and w-100 */}
                            Website URL:
                            <input type="url" name="website" value={formData?.website || ''} onChange={handleChange} className="form-control" /> {/* Added form-control */}
                        </label>
                    </div>
                 </div>
                 <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label w-100">
                            Latitude:
                            <input type="number" step="any" name="latitude" value={formData?.latitude ?? ''} onChange={handleChange} className="form-control" />
                        </label>
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label w-100">
                            Longitude:
                            <input type="number" step="any" name="longitude" value={formData?.longitude ?? ''} onChange={handleChange} className="form-control" />
                        </label>
                    </div>
                </div>
           </fieldset>

          {/* UPDATED: Pass correct props with nullish coalescing */}
          <TechnicalFormSection
             data={{
                capacity: formData?.processing_capacity_mt_year ?? undefined,
                technology: formData?.technology_name ?? undefined,
                feedstock: formData?.feedstock ?? undefined,
                product: formData?.product ?? undefined,
                technicalSpecs: formData?.technology_description ?? undefined
             }}
             onChange={handleChange}
             isSaving={isLoading}
          />

           <EnvironmentalFormSection
             data={{ environmentalImpact: formData?.environmentalImpact }} // Assuming component handles nested structure
             onChange={handleChange} // Assumes handleChange handles nested 'environmentalImpact.details'
             isSaving={isLoading}
           />

           <InvestmentFormSection
             data={{ investment: { total: formData?.investment?.total ?? undefined } }} // Pass nested structure with coalescing
             onChange={handleChange} // Assumes handleChange handles nested 'investment.total'
             isSaving={isLoading}
           />

           {/* UPDATED: Pass correct props with nullish coalescing */}
           <ContactFormSection
             data={{
                contactPerson: formData?.contactPerson ?? undefined,
                contactEmail: formData?.contactEmail ?? undefined,
                contactPhone: formData?.contactPhone ?? undefined
             }}
             onChange={handleChange}
             isSaving={isLoading}
           />

          <TimelineFormSection
            data={{ timeline: timelineForForm }} // Pass the converted timeline data
            // Pass generic handleChange for item changes, assuming TimelineFormSection uses names like "timeline[0].date"
            onChange={handleChange}
            // REMOVED: onAddItem, onRemoveItem props
            isSaving={isLoading}
          />

          <DocumentsFormSection
             data={{ documents: formData?.documents }}
             // Pass generic handleChange, assuming DocumentsFormSection uses names like "documents[0].title"
             onChange={handleChange}
             // REMOVED: onAddItem, onRemoveItem props
             isSaving={isLoading}
          />

          {/* Image Upload - Keep separate or integrate into a Media section */}
          <fieldset>
            <legend>Images</legend>
            <ImageUploader
              facilityId={facility?.id} // Pass facility ID
              onUploadComplete={handleImageUploadComplete}
              disabled={isLoading} // Disable when loading
              // REMOVED: existingImageUrls prop
            />
          </fieldset>

          <div className="form-actions">
            <button type="submit" disabled={isLoading} className="btn btn-primary me-2">
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={onCancel} disabled={isLoading} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFacilityForm;