import React, { ChangeEvent, FC } from 'react';

// Define the structure for the investment data this section handles
interface InvestmentData {
  total?: string | number | null | undefined; // UPDATED: Allow null to match SupabaseFacilityFormData
}

// Define the props for the component
interface InvestmentFormSectionProps {
  data?: {
    investment?: InvestmentData;
  };
  // The parent form currently uses an inline handler for this nested field.
  // Passing the generic handleChange might not work as expected without adjustments
  // in the parent or a more specific handler passed down.
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  isSaving?: boolean;
}

const InvestmentFormSection: FC<InvestmentFormSectionProps> = ({ data, onChange, isSaving }) => {
  // Access nested data safely
  const formData = data || {};
  const investment = formData.investment || {};

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
          // Use dot notation for nested state update in the parent component
          name="investment.total" // Relies on parent handler logic
          // Ensure value is treated as string for textarea
          value={investment.total !== undefined ? String(investment.total) : ''}
          onChange={onChange} // Pass the handler from props
          rows={4} // Adjust rows as needed
          disabled={isSaving} // Ensure textarea is disabled when saving
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