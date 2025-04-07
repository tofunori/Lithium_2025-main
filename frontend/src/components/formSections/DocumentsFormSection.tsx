import React, { ChangeEvent, FC } from 'react';

// Define the structure of a single document item
interface DocumentItem {
  name?: string;
  type?: string;
  url?: string; // Assuming URL is part of the data
}

// Define the props for the component
interface DocumentsFormSectionProps {
  data?: {
    documents?: DocumentItem[];
  };
  // Using the generic handler for now, acknowledging limitations
  // The parent component (EditFacilityForm) needs to be updated to pass
  // specific handlers for adding, removing, and editing document items.
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  // TODO: Define and use more specific handlers when implemented in parent
  // onItemChange?: (index: number, field: keyof DocumentItem, value: string) => void;
  // onRemoveItem?: (index: number) => void;
  // onAddItem?: (newItem: DocumentItem) => void; // Or trigger upload
  isSaving?: boolean;
}

const DocumentsFormSection: FC<DocumentsFormSectionProps> = ({ data, onChange, isSaving }) => {
  const formData = data || {};
  const documents: DocumentItem[] = formData.documents || [];

  // TODO: Implement change handling for document properties (name, type)
  // This needs to call a prop function like onItemChange passed from the parent
  const handleItemChange = (index: number, field: keyof DocumentItem, value: string) => {
    // This local update is temporary; the parent should manage the state via props.
    const updatedDocs = [...documents];
    // Ensure the object exists before trying to spread it
    updatedDocs[index] = { ...(updatedDocs[index] || {}), [field]: value };
    console.log("Document item change (needs proper parent handler):", updatedDocs);
    // Call parent handler if available:
    // if (onItemChange) {
    //   onItemChange(index, field, value);
    // } else {
       console.warn("Specific onItemChange handler not provided from parent. Changes may not persist.");
    // }
  };

  // TODO: Implement Remove Document functionality
  // This needs to call a prop function like onRemoveItem passed from the parent
  const handleRemoveItem = (index: number) => {
    console.log("Remove Document clicked (needs proper parent handler):", index);
    // Call parent handler if available:
    // if (onRemoveItem) {
    //   onRemoveItem(index);
    // } else {
       console.warn("Specific onRemoveItem handler not provided from parent.");
    // }
    // Note: Actual file deletion from storage needs separate handling.
  };

  // TODO: Implement Add Document functionality (likely tied to upload)
  // This might call an onAddItem prop or trigger an uploader component
  const handleAddDocument = () => {
     console.log("Add Document clicked (needs proper parent handler - likely involves upload)");
     // if (onAddItem) {
     //   onAddItem({ name: '', type: '', url: '' }); // Or trigger upload flow
     // } else {
        console.warn("Specific onAddItem handler not provided from parent.");
     // }
  };

  // Type the event in the inline onChange handlers
  const handleNameChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    handleItemChange(index, 'name', e.target.value);
  };

  const handleTypeChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    handleItemChange(index, 'type', e.target.value);
  };

  return (
    <fieldset disabled={isSaving}>
      <legend className="mb-3">Documents & Permits</legend>

      {documents.length > 0 ? (
        documents.map((doc, index) => (
          <div key={index} className="row mb-3 align-items-center document-item">
            <div className="col-md-5">
              <label htmlFor={`doc-name-${index}`} className="form-label visually-hidden">Document Name</label>
              <input
                type="text"
                className="form-control"
                id={`doc-name-${index}`}
                name={`documents[${index}].name`} // Name might not be used if using specific handlers
                value={doc.name || ''}
                onChange={(e) => handleNameChange(e, index)} // Use typed handler
                placeholder="Document Name"
                disabled={isSaving} // Ensure inputs are disabled when saving
              />
            </div>
            <div className="col-md-3">
              <label htmlFor={`doc-type-${index}`} className="form-label visually-hidden">Document Type</label>
              <input
                type="text"
                className="form-control"
                id={`doc-type-${index}`}
                name={`documents[${index}].type`} // Name might not be used if using specific handlers
                value={doc.type || ''}
                onChange={(e) => handleTypeChange(e, index)} // Use typed handler
                placeholder="Type (e.g., Permit)"
                disabled={isSaving} // Ensure inputs are disabled when saving
              />
            </div>
            <div className="col-md-3">
              {/* Displaying the URL, but not making it editable directly */}
              {doc.url ? (
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary" title="View Document">
                  <i className="fas fa-external-link-alt me-1"></i> View
                </a>
              ) : (
                <span className="text-muted">No URL</span>
              )}
            </div>
            <div className="col-md-1 text-end">
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleRemoveItem(index)} // Needs proper handler from props
                disabled={isSaving}
                title="Remove Document"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
        ))
      ) : (
        <p>No documents added yet.</p>
      )}

      {/* Placeholder for Document Uploader */}
      <div className="mt-3">
         <label className="form-label">Upload New Document:</label>
         {/* Replace with actual uploader component */}
         {/* <DocumentUploader onUploadComplete={onUploadComplete} disabled={isSaving} /> */}
         <p><em>(Document uploader component integration needed here)</em></p>
         {/* Basic file input as placeholder */}
         <input type="file" className="form-control" disabled={isSaving} />
         {/* The Add button might be part of the uploader or separate */}
         {/* <button type="button" className="btn btn-sm btn-outline-success mt-2" onClick={handleAddDocument} disabled={isSaving}>
           <i className="fas fa-plus me-1"></i> Add Document (Upload)
         </button> */}
      </div>
       <p className="form-text text-muted mt-2">
         Note: Adding, removing, uploading, and editing individual documents requires further implementation via parent component handlers. Current changes might not save correctly without them.
       </p>
    </fieldset>
  );
};

export default DocumentsFormSection;