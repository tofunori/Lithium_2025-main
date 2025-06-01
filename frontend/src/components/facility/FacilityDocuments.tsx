import React, { ChangeEvent } from 'react';
import { FacilityFormData, FacilityDocument } from '../../services/types';
import DocumentsFormSection from '../formSections/DocumentsFormSection';

interface FacilityDocumentsProps {
  isEditing: boolean;
  isSaving: boolean;
  displayData: {
    facility_documents?: FacilityDocument[];
  };
  formData?: FacilityFormData | null;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
}

const FacilityDocuments: React.FC<FacilityDocumentsProps> = ({
  isEditing,
  isSaving,
  displayData,
  formData,
  onChange,
  onAddItem,
  onRemoveItem
}) => {
  return (
    <div className="facility-section">
      <h3>Documents</h3>
      {isEditing && formData ? (
        <DocumentsFormSection
          data={{
            documents: formData.documents?.map(doc => ({
              id: doc.id,
              title: doc.title || '',
              url: doc.url || ''
            }))
          }}
          onChange={onChange}
          onAddItem={onAddItem}
          onRemoveItem={onRemoveItem}
          isSaving={isSaving}
        />
      ) : (
        <ul className="list-group list-group-flush">
          {Array.isArray(displayData.facility_documents) && 
           displayData.facility_documents.length > 0 && 
           (displayData.facility_documents[0]?.title || displayData.facility_documents[0]?.url) ? (
            displayData.facility_documents.map((doc, index) => (
              <li key={doc.id || index} className="list-group-item bg-transparent px-0">
                {doc.url ? (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    {doc.title || 'View Document'}
                  </a>
                ) : (
                  doc.title || 'N/A'
                )}
              </li>
            ))
          ) : (
            <li className="list-group-item bg-transparent px-0">No documents available.</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default FacilityDocuments;