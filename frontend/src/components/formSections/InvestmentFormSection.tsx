import React, { ChangeEvent, FC, ClipboardEvent } from 'react'; // Import ClipboardEvent

// Define the props for the component
interface InvestmentFormSectionProps {
  // Accept value directly instead of nested data object
  value?: string | number | null | undefined;
  // The parent form currently uses an inline handler for this nested field.
  // Passing the generic handleChange might not work as expected without adjustments
  // in the parent or a more specific handler passed down.
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  isSaving?: boolean;
}

// Destructure the new 'value' prop directly
const InvestmentFormSection: FC<InvestmentFormSectionProps> = ({ value, onChange, isSaving }) => {

  // Explicitly allow paste event and stop propagation
  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    // Stop the event from bubbling up to parent elements
    e.stopPropagation();
    // Do nothing else, just let the default paste happen.
    console.log("Paste event allowed and stopped propagation for investment details.");
  };

  // Note: The 'name' attribute "investment.total" relies on the parent's
  // handleChange function being able to handle dot notation or the parent
  // using a specific inline handler as seen in EditFacilityForm.tsx.
  // If passing the generic handleChange, it might need modification to handle nested paths.

  return (
    <fieldset disabled={isSaving}> {/* RESTORED disabled attribute */}
      <legend className="mb-3">Investment & Funding</legend>
      <div className="mb-3">
        <label htmlFor="edit-investment-total" className="form-label">Total Investment / Funding Details:</label>
        <textarea
          className="form-control"
          id="edit-investment-total"
          // Use dot notation matching the state structure in FacilityDetailPage
          name="details.investment_usd" // Keep name consistent with state path
          // Ensure value is treated as string for textarea
          // Bind value directly to the passed 'value' prop
          value={value !== undefined && value !== null ? String(value) : ''}
          onChange={onChange} // Pass the handler from props
          onPaste={handlePaste} // Add explicit paste handler
          rows={4} // Adjust rows as needed
          // disabled={isSaving} // Remove redundant disabled prop (fieldset handles it)
        ></textarea>
        <div className="form-text">
          Provide details about the total investment, funding sources, rounds, key investors, etc. (Note: Currently expects text, parent maps to number on change).
        </div>
      </div>
      {/* Add more specific fields like 'Funding Stage', 'Key Investors' if needed later */}
    </fieldset>
  );
};

export default InvestmentFormSection;
