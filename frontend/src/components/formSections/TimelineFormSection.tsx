import React from 'react';

// Define the structure for a single timeline event
interface TimelineEvent {
  date: string;
  event: string;
}

// Define the props for the TimelineFormSection component
interface TimelineFormSectionProps {
  data?: {
    timeline?: TimelineEvent[];
  };
  // Using standard event handler type based on current usage,
  // acknowledge TODOs about needing a more specific handler for array updates.
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
  isSaving: boolean;
  // TODO: Define and use props like onAddItem, onRemoveItem, onTimelineChange
  // when the corresponding functionality is fully implemented.
  // onAddItem?: (newItem: TimelineEvent) => void;
  // onRemoveItem?: (index: number) => void;
  // onTimelineChange?: (updatedTimeline: TimelineEvent[]) => void;
}

const TimelineFormSection: React.FC<TimelineFormSectionProps> = ({ data, onChange, isSaving }) => {
  // Provide default empty object for data and empty array for timeline
  const formData = data || {};
  const timeline: TimelineEvent[] = formData.timeline || [];

  // TODO: Implement more robust change handling for array items
  // This basic handler won't work correctly for updating specific items in the array.
  // It needs to know the index and field (date/event) being changed.
  const handleItemChange = (index: number, field: 'date' | 'event', value: string): void => {
    const updatedTimeline = [...timeline];
    // Ensure the item exists before trying to update it
    if (updatedTimeline[index]) {
        updatedTimeline[index] = { ...updatedTimeline[index], [field]: value };
    } else {
        // Handle potential edge case where index might be out of bounds, though unlikely with map
        console.error("Attempted to update non-existent timeline item at index:", index);
        return;
    }
    // Need a way to pass this structured update back to the parent via a dedicated prop
    // For now, logging it. The parent `handleFormChange` needs enhancement.
    console.log("Timeline item change (needs proper handler):", updatedTimeline);
    // Example of how a dedicated handler might be called:
    // if (onTimelineChange) {
    //   onTimelineChange(updatedTimeline);
    // } else {
    //   // Fallback or error if the required handler isn't provided
    // }
  };

  // TODO: Implement Add Item functionality using a dedicated prop like onAddItem
  const handleAddItem = (): void => {
    console.log("Add Timeline Item clicked (handler needed)");
    // const newItem: TimelineEvent = { date: '', event: '' };
    // if (onAddItem) {
    //   onAddItem(newItem); // Or pass the whole updated array: onTimelineChange([...timeline, newItem]);
    // }
  };

  // TODO: Implement Remove Item functionality using a dedicated prop like onRemoveItem
  const handleRemoveItem = (index: number): void => {
    console.log("Remove Timeline Item clicked (handler needed):", index);
    // const updatedTimeline = timeline.filter((_, i) => i !== index);
    // if (onRemoveItem) {
    //    onRemoveItem(index); // Or pass the whole updated array: onTimelineChange(updatedTimeline);
    // }
  };


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
                // Using a generic name; specific handling would require the custom handler
                name={`timeline_date_${index}`}
                value={item.date || ''}
                // onChange={(e) => handleItemChange(index, 'date', e.target.value)} // Requires proper handler setup
                onChange={onChange} // Using basic parent handler for now (will likely overwrite entire timeline object or fail)
                placeholder="Date"
                disabled={isSaving} // Ensure inputs are disabled when saving
              />
            </div>
            <div className="col-md-6">
              <label htmlFor={`timeline-event-${index}`} className="form-label visually-hidden">Event/Milestone</label>
              <input
                type="text"
                className="form-control"
                id={`timeline-event-${index}`}
                // Using a generic name; specific handling would require the custom handler
                name={`timeline_event_${index}`}
                value={item.event || ''}
                // onChange={(e) => handleItemChange(index, 'event', e.target.value)} // Requires proper handler setup
                onChange={onChange} // Using basic parent handler for now
                placeholder="Event/Milestone Description"
                disabled={isSaving} // Ensure inputs are disabled when saving
              />
            </div>
            <div className="col-md-2 text-end">
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleRemoveItem(index)} // Needs proper handler wired to parent
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
        onClick={handleAddItem} // Needs proper handler wired to parent
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