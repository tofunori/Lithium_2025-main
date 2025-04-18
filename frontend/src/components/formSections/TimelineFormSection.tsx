import React from 'react';

// Define the structure for a single timeline event
interface TimelineEvent {
  date: string;
  event: string;
}

// Define the props for the TimelineFormSection component
interface TimelineFormSectionProps {
  data?: {
    // Expects items matching { date: string; event: string; description?: string }
    timeline?: Array<{ id?: string; date: string; event: string; description?: string }>;
  };
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
  isSaving: boolean;
  // Add props for adding/removing items
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
}

const TimelineFormSection: React.FC<TimelineFormSectionProps> = ({
  data,
  onChange,
  isSaving,
  onAddItem,
  onRemoveItem
}) => {
  // Provide default empty object for data and empty array for timeline
  const formData = data || {};
  const timeline = formData.timeline || [];

  // Internal handlers removed as logic is now in parent via props

  return (
    <fieldset disabled={isSaving}>
      <legend className="mb-3">Project Timeline & Milestones</legend>

      {timeline.length > 0 ? (
        timeline.map((item: TimelineEvent, index: number) => (
          <div key={index} className="row mb-3 align-items-center timeline-item">
            <div className="col-md-4">
              <label htmlFor={`timeline-date-${index}`} className="form-label visually-hidden">Date</label>
              <input
                type="date" // Use date input type
                className="form-control"
                id={`timeline-date-${index}`}
                // Use naming convention expected by parent's handleFormChange
                name={`timeline[${index}].event_date`}
                value={item.date || ''}
                onChange={onChange} // Pass parent's general handler
                placeholder="Date (YYYY-MM-DD)"
                disabled={isSaving}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor={`timeline-event-${index}`} className="form-label visually-hidden">Event/Milestone</label>
              <input
                type="text"
                className="form-control"
                id={`timeline-event-${index}`}
                // Use naming convention expected by parent's handleFormChange
                name={`timeline[${index}].event_name`}
                value={item.event || ''}
                onChange={onChange} // Pass parent's general handler
                placeholder="Event/Milestone Description"
                disabled={isSaving}
              />
            </div>
            <div className="col-md-2 text-end">
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => onRemoveItem(index)} // Call parent's remove handler
                disabled={isSaving}
                title="Remove Item"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
        ))
      ) : (
        <p>No timeline items added yet.</p>
      )}

      <button
        type="button"
        className="btn btn-sm btn-outline-success mt-2"
        onClick={onAddItem} // Call parent's add handler
        disabled={isSaving}
      >
        <i className="fas fa-plus me-1"></i> Add Timeline Item
      </button>
       <p className="form-text text-muted mt-2">
         Note: Adding, removing, and editing individual timeline items requires further implementation via dedicated handlers. Current changes might not save correctly using the generic 'onChange'.
       </p>
    </fieldset>
  );
}

export default TimelineFormSection;