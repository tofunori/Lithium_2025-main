import React from 'react';

interface TimelineEvent {
  id?: string;
  event_date: string | null;
  event_name: string | null;
  description?: string | null;
}

interface FacilityTimelineAcademicProps {
  timeline: TimelineEvent[];
  title?: string;
}

const FacilityTimelineAcademic: React.FC<FacilityTimelineAcademicProps> = ({
  timeline,
  title = 'Timeline'
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
      <div className="section-minimal">
        <div className="section-header-minimal">
          <div className="section-icon-minimal">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <h3 className="section-title-minimal">{title}</h3>
        </div>
        <div className="section-content-minimal">
          <p className="text-muted">No timeline events available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-minimal">
      <div className="section-header-minimal">
        <div className="section-icon-minimal">
          <i className="fas fa-calendar-alt"></i>
        </div>
        <h3 className="section-title-minimal">{title}</h3>
      </div>
      <div className="section-content-minimal">
        <div className="timeline-academic">
          {sortedTimeline.map((event, index) => (
            <div key={event.id || index} className="timeline-item-academic">
              <div className="timeline-date-academic">
                {formatDate(event.event_date)}
              </div>
              <div className="timeline-event-academic">
                {event.event_name}
              </div>
              {event.description && (
                <div className="timeline-description-academic">
                  {event.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FacilityTimelineAcademic;