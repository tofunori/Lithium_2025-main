import React from 'react';

interface TimelineEvent {
  id?: string;
  event_date: string | null;
  event_name: string | null;
  description?: string | null;
}

interface FacilityTimelineVisualProps {
  timeline: TimelineEvent[];
  title?: string;
}

const FacilityTimelineVisual: React.FC<FacilityTimelineVisualProps> = ({
  timeline,
  title = 'Project Timeline'
}) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBD';
    
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const sortedTimeline = timeline
    .filter(event => event.event_name)
    .sort((a, b) => {
      if (!a.event_date || !b.event_date) return 0;
      return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
    });

  if (sortedTimeline.length === 0) {
    return (
      <div className="facility-section">
        <div className="section-header">
          <div className="section-icon">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <h3 className="section-title">{title}</h3>
        </div>
        <div className="section-content">
          <p className="text-muted">No timeline events available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="facility-section">
      <div className="section-header">
        <div className="section-icon">
          <i className="fas fa-calendar-alt"></i>
        </div>
        <h3 className="section-title">{title}</h3>
      </div>
      <div className="section-content">
        <div className="timeline-visual">
          <div className="timeline-line"></div>
          {sortedTimeline.map((event, index) => (
            <div key={event.id || index} className="timeline-item-visual">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="timeline-date">
                  {formatDate(event.event_date)}
                </div>
                <div className="timeline-event">
                  {event.event_name}
                </div>
                {event.description && (
                  <div className="timeline-description">
                    {event.description}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FacilityTimelineVisual;