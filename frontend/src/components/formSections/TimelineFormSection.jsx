import React from 'react';

function TimelineFormSection({ data, onChange, isSaving /*, onAddItem, onRemoveItem */ }) {
  const formData = data || {};
  const timeline = formData.timeline || [];

  // TODO: Implement more robust change handling for array items
  // This basic handler won't work correctly for updating specific items in the array.
  // It needs to know the index and field (date/event) being changed.
  const handleItemChange = (index, field, value) => {
    const updatedTimeline = [...timeline];
    updatedTimeline[index] = { ...updatedTimeline[index], [field]: value };
    // Need a way to pass this structured update back to the parent
    // For now, logging it. The parent `handleFormChange` needs enhancement.
    console.log("Timeline item change (needs proper handler):", updatedTimeline);
    // onChange({ target: { name: `timeline[${index}].${field}`, value } }); // This won't work with the current simple parent handler
  };

  // TODO: Implement Add Item functionality
  const handleAddItem = () => {
    console.log("Add Timeline Item clicked (handler needed)");
    // const newItem = { date: '', event: '' };
    // onAddItem([...timeline, newItem]); // Pass updated array to parent
  };

  // TODO: Implement Remove Item functionality
  const handleRemoveItem = (index) => {
    console.log("Remove Timeline Item clicked (handler needed):", index);
    // const updatedTimeline = timeline.filter((_, i) => i !== index);
    // onRemoveItem(updatedTimeline); // Pass updated array to parent
  };


  return (
    <fieldset disabled={isSaving}>
      <legend className="mb-3">Project Timeline & Milestones</legend>

      {timeline.length > 0 ? (
        timeline.map((item, index) => (
          <div key={index} className="row mb-3 align-items-center timeline-item">
            <div className="col-md-4">
              <label htmlFor={`timeline-date-${index}`} className="form-label visually-hidden">Date</label>
              <input
                type="date" // Use date input type
                className="form-control"
                id={`timeline-date-${index}`}
                name={`timeline[${index}].date`} // Naming convention for potential future handling
                value={item.date || ''}
                // onChange={(e) => handleItemChange(index, 'date', e.target.value)} // Needs proper handler
                onChange={onChange} // Using basic handler for now (will likely overwrite entire timeline object)
                placeholder="Date"
              />
            </div>
            <div className="col-md-6">
              <label htmlFor={`timeline-event-${index}`} className="form-label visually-hidden">Event/Milestone</label>
              <input
                type="text"
                className="form-control"
                id={`timeline-event-${index}`}
                name={`timeline[${index}].event`} // Naming convention
                value={item.event || ''}
                // onChange={(e) => handleItemChange(index, 'event', e.target.value)} // Needs proper handler
                onChange={onChange} // Using basic handler for now
                placeholder="Event/Milestone Description"
              />
            </div>
            <div className="col-md-2 text-end">
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleRemoveItem(index)} // Needs proper handler
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
        onClick={handleAddItem} // Needs proper handler
        disabled={isSaving}
      >
        <i className="fas fa-plus me-1"></i> Add Timeline Item
      </button>
       <p className="form-text text-muted mt-2">
         Note: Adding, removing, and editing individual timeline items requires further implementation. Current changes might not save correctly.
       </p>
    </fieldset>
  );
}

export default TimelineFormSection;