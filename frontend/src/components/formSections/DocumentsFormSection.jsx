import React from 'react';

// TODO: Import a DocumentUploader component if available

function DocumentsFormSection({ data, onChange, isSaving /*, onAddDocument, onRemoveDocument, onUploadComplete */ }) {
  const formData = data || {};
  const documents = formData.documents || [];

  // TODO: Implement change handling for document properties (name, type)
  const handleItemChange = (index, field, value) => {
    const updatedDocs = [...documents];
    updatedDocs[index] = { ...updatedDocs[index], [field]: value };
    console.log("Document item change (needs proper handler):", updatedDocs);
    // Need enhanced parent handler or specific callback
  };

  // TODO: Implement Remove Document functionality
  const handleRemoveItem = (index) => {
    console.log("Remove Document clicked (handler needed):", index);
    // const updatedDocs = documents.filter((_, i) => i !== index);
    // onRemoveDocument(updatedDocs); // Pass updated array to parent
    // Note: Actual file deletion from storage needs separate handling.
  };

  // TODO: Implement Add Document functionality (likely tied to upload)
  const handleAddDocument = () => {
     console.log("Add Document clicked (handler needed - likely involves upload)");
     // This would likely trigger an upload process, and onUploadComplete would update the state.
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
                name={`documents[${index}].name`}
                value={doc.name || ''}
                onChange={(e) => handleItemChange(index, 'name', e.target.value)} // Needs proper handler
                placeholder="Document Name"
              />
            </div>
            <div className="col-md-3">
              <label htmlFor={`doc-type-${index}`} className="form-label visually-hidden">Document Type</label>
              <input
                type="text"
                className="form-control"
                id={`doc-type-${index}`}
                name={`documents[${index}].type`}
                value={doc.type || ''}
                onChange={(e) => handleItemChange(index, 'type', e.target.value)} // Needs proper handler
                placeholder="Type (e.g., Permit)"
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
                onClick={() => handleRemoveItem(index)} // Needs proper handler
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
         <input type="file" className="form-control" disabled={isSaving} />
         {/* The Add button might be part of the uploader or separate */}
         {/* <button type="button" className="btn btn-sm btn-outline-success mt-2" onClick={handleAddDocument} disabled={isSaving}>
           <i className="fas fa-plus me-1"></i> Add Document (Upload)
         </button> */}
      </div>
       <p className="form-text text-muted mt-2">
         Note: Adding, removing, uploading, and editing individual documents requires further implementation. Current changes might not save correctly.
       </p>
    </fieldset>
  );
}

export default DocumentsFormSection;