import React, { ChangeEvent, FC, ClipboardEvent } from 'react'; // Import ClipboardEvent

// Define the props for the component
interface EnvironmentalFormSectionProps {
  // Accept value directly instead of nested data object
  value?: string | null | undefined;
  // The parent form currently uses an inline handler for this nested field.
  // Passing the generic handleChange might not work as expected without adjustments
  // in the parent or a more specific handler passed down.
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  isSaving?: boolean;
}

// Destructure the new 'value' prop directly
const EnvironmentalFormSection: FC<EnvironmentalFormSectionProps> = ({ value, onChange, isSaving }) => {

  // Explicitly allow paste event and stop propagation
  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    // Stop the event from bubbling up to parent elements
    e.stopPropagation();
    // Do nothing else, just let the default paste happen.
    console.log("Paste event allowed and stopped propagation for environmental details.");
  };

  // Note: The 'name' attribute "environmentalImpact.details" relies on the parent's
  // handler logic being able to update nested state correctly (e.g., the inline handler
  // currently used in EditFacilityForm.tsx).

  return (
    <fieldset disabled={isSaving}>
      <legend className="mb-3">Environmental Impact</legend>
      <div className="mb-3">
        <label htmlFor="edit-environmental-details" className="form-label">Details:</label>
        <textarea
          className="form-control"
          id="edit-environmental-details"
          // Use dot notation matching the state structure in FacilityDetailPage
          name="details.environmental_impact_details" // Keep name consistent with state path
          // Bind value directly to the passed 'value' prop
          value={value !== undefined && value !== null ? String(value) : ''}
          onChange={onChange} // Pass the handler from props
          onPaste={handlePaste} // Add explicit paste handler
          rows={6} // Adjust rows as needed
          // disabled={isSaving} // Remove redundant disabled prop (fieldset handles it)
        ></textarea>
        <div className="form-text">
          Describe the environmental impact, mitigation measures, permits obtained, etc.
        </div>
      </div>
      {/* Add more fields related to environmental impact if needed in the future */}
    </fieldset>
  );
};

export default EnvironmentalFormSection;
