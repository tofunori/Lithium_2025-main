// frontend/src/components/forms/FormSection.tsx
import React from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  initiallyExpanded?: boolean;
  className?: string;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  icon,
  children,
  collapsible = false,
  initiallyExpanded = true,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = React.useState(initiallyExpanded);

  const toggleExpanded = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  const sectionId = `form-section-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`form-section mb-4 ${className}`}>
      <div 
        className={`form-section-header d-flex align-items-center ${collapsible ? 'cursor-pointer' : ''}`}
        onClick={toggleExpanded}
        style={{ cursor: collapsible ? 'pointer' : 'default' }}
      >
        {icon && (
          <i className={`${icon} me-2 text-primary`}></i>
        )}
        <h5 className="mb-0 flex-grow-1">{title}</h5>
        {collapsible && (
          <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-muted`}></i>
        )}
      </div>
      
      {description && (
        <p className="text-muted small mt-2 mb-3">{description}</p>
      )}
      
      {collapsible ? (
        <div className={`collapse ${isExpanded ? 'show' : ''}`} id={sectionId}>
          <div className="form-section-content">
            {children}
          </div>
        </div>
      ) : (
        <div className="form-section-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default FormSection;