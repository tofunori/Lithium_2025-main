import React, { ChangeEvent } from 'react';
import { FacilityFormData, FacilityTimelineEvent } from '../../services/types';
import TimelineFormSection from '../formSections/TimelineFormSection';

interface FacilityTimelineProps {
  isEditing: boolean;
  isSaving: boolean;
  displayData: {
    facility_timeline_events?: FacilityTimelineEvent[];
  };
  formData?: FacilityFormData | null;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
}

const FacilityTimeline: React.FC<FacilityTimelineProps> = ({
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
      <h3>Timeline</h3>
      {isEditing && formData ? (
        <TimelineFormSection
          data={{
            timeline: formData.timeline?.map(item => ({
              id: item.id,
              date: String(item.event_date || ''),
              event: item.event_name || '',
              description: item.description || ''
            }))
          }}
          onChange={onChange}
          onAddItem={onAddItem}
          onRemoveItem={onRemoveItem}
          isSaving={isSaving}
        />
      ) : (
        <ul className="list-group list-group-flush">
          {Array.isArray(displayData.facility_timeline_events) && 
           displayData.facility_timeline_events.length > 0 && 
           displayData.facility_timeline_events[0]?.event_name ? (
            displayData.facility_timeline_events.map((item, index) => (
              <li key={item.id || index} className="list-group-item bg-transparent px-0">
                <strong>{item.event_date}:</strong> {item.event_name} 
                {item.description ? ` - ${item.description}` : ''}
              </li>
            ))
          ) : (
            <li className="list-group-item bg-transparent px-0">No timeline events available.</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default FacilityTimeline;