import React from 'react';

function InvestmentFormSection({ data, onChange, isSaving }) {
  // Access nested data safely
  const formData = data || {};
  const investment = formData.investment || {};

  return (
    <fieldset disabled={isSaving}>
      <legend className="mb-3">Investment & Funding</legend>
      <div className="mb-3">
        <label htmlFor="edit-investment-total" className="form-label">Total Investment / Funding Details:</label>
        <textarea
          className="form-control"
          id="edit-investment-total"
          // Use dot notation for nested state update in the parent component
          name="investment.total"
          value={investment.total || ''}
          onChange={onChange}
          rows="4" // Adjust rows as needed
        ></textarea>
        <div className="form-text">
          Provide details about the total investment, funding sources, rounds, key investors, etc.
        </div>
      </div>
      {/* Add more specific fields like 'Funding Stage', 'Key Investors' if needed later */}
    </fieldset>
  );
}

export default InvestmentFormSection;