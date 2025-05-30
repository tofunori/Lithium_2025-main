import React, { ChangeEvent, FC } from 'react';

// Define the structure of a single document item expected by this component
interface DocumentItem {
  id?: string; // Keep id if needed for keys
  title?: string;
  url?: string;
}

// Define the props for the component
interface DocumentsFormSectionProps {
  data?: {
    documents?: DocumentItem[];
  };
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void; // Expect general handler
  isSaving?: boolean;
  // Add props for adding/removing items
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
}

const DocumentsFormSection: FC<DocumentsFormSectionProps> = ({
  data,
  onChange,
  isSaving,
  onAddItem,
  onRemoveItem
}) => {
  const formData = data || {};
  const documents: DocumentItem[] = formData.documents || [];

  // Internal handlers removed - using props from parent

  return (
    <fieldset disabled={isSaving}>
      <legend className="mb-3">Documents & Permits</legend>

      {documents.length > 0 ? (
        documents.map((doc, index) => (
          <div key={doc.id || index} className="row mb-3 align-items-center document-item">
            {/* Title Input */}
            <div className="col-md-5">
              <label htmlFor={`doc-title-${index}`} className="form-label visually-hidden">Document Title</label>
              <input
                type="text"
                className="form-control"
                id={`doc-title-${index}`}
                name={`documents[${index}].title`} // Use correct naming convention
                value={doc.title || ''}
                onChange={onChange} // Use parent's handler
                placeholder="Document Title"
                disabled={isSaving}
              />
            </div>
            {/* URL Input */}
            <div className="col-md-5">
               <label htmlFor={`doc-url-${index}`} className="form-label visually-hidden">Document URL/Path</label>
                <input
                  type="text"
                  className="form-control"
                  id={`doc-url-${index}`}
                  name={`documents[${index}].url`} // Use correct naming convention
                  value={doc.url || ''}
                  onChange={onChange} // Use parent's handler
                  placeholder="URL or Storage Path"
                  disabled={isSaving}
                />
            </div>
            {/* View Link (conditional) - Consider removing if URL input is sufficient */}
            <div className="col-md-1">
              {doc.url ? (
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary" title="View Document (if valid URL)">
                  <i className="fas fa-external-link-alt"></i>
                </a>
              ) : (
                <span className="text-muted small"></span> // Empty span if no URL
              )}
            </div>
            {/* Remove Button */}
            <div className="col-md-1 text-end">
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => onRemoveItem(index)} // Call parent's remove handler
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

      {/* Add Document Button */}
      <div className="mt-3">
          <button type="button" className="btn btn-sm btn-outline-success mt-2" onClick={onAddItem} disabled={isSaving}>
            <i className="fas fa-plus me-1"></i> Add Document Row
          </button>
          {/* Note: Actual file upload needs a separate mechanism/component */}
          <p className="form-text text-muted mt-1">Add a row to enter document title and URL/path. File upload requires separate integration.</p>
      </div>
    </fieldset>
  );
};

export default DocumentsFormSection;