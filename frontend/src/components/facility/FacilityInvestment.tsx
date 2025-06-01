import React, { ChangeEvent } from 'react';
import { FacilityFormData } from '../../services/types';
import InvestmentFormSection from '../formSections/InvestmentFormSection';

interface FacilityInvestmentProps {
  isEditing: boolean;
  isSaving: boolean;
  displayData: {
    facility_details?: {
      investment_usd?: string | null;
    } | null;
  };
  formData?: FacilityFormData | null;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const FacilityInvestment: React.FC<FacilityInvestmentProps> = ({
  isEditing,
  isSaving,
  displayData,
  formData,
  onChange
}) => {
  return (
    <div className="facility-section">
      <h3>Investment & Funding</h3>
      {isEditing && formData ? (
        <InvestmentFormSection
          value={formData.details?.investment_usd}
          onChange={onChange}
          isSaving={isSaving}
        />
      ) : (
        <p>Total Investment (USD): {displayData.facility_details?.investment_usd || ''}</p>
      )}
    </div>
  );
};

export default FacilityInvestment;