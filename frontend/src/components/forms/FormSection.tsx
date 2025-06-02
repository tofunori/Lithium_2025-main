// frontend/src/components/forms/FormSection.tsx
import React, { useRef, useEffect } from 'react';

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
  const collapseRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const sectionId = `form-section-${title.toLowerCase().replace(/\s+/g, '-')}`;

  // Bootstrap collapse animation handler
  useEffect(() => {
    if (!collapsible || !collapseRef.current) return;

    const collapseElement = collapseRef.current;
    
    // Use Bootstrap's collapse API for smooth animations
    if (typeof window !== 'undefined' && window.bootstrap) {
      const bsCollapse = new window.bootstrap.Collapse(collapseElement, {
        toggle: false
      });

      if (isExpanded) {
        bsCollapse.show();
      } else {
        bsCollapse.hide();
      }

      return () => {
        bsCollapse.dispose();
      };
    }
  }, [isExpanded, collapsible]);

  const toggleExpanded = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  if (collapsible) {
    // Bootstrap Accordion Structure
    return (
      <div className={`accordion-item border-0 mb-4 ${className}`}>
        <h2 className="accordion-header" id={`heading-${sectionId}`}>
          <button
            className={`accordion-button ${!isExpanded ? 'collapsed' : ''} bg-light`}
            type="button"
            onClick={toggleExpanded}
            aria-expanded={isExpanded}
            aria-controls={sectionId}
          >
            {icon && (
              <i className={`${icon} me-2 text-primary`}></i>
            )}
            <span className="fw-semibold">{title}</span>
            {description && (
              <span className="text-muted small ms-3 d-none d-md-inline">{description}</span>
            )}
          </button>
        </h2>
        <div
          id={sectionId}
          ref={collapseRef}
          className={`accordion-collapse collapse ${isExpanded ? 'show' : ''}`}
          aria-labelledby={`heading-${sectionId}`}
        >
          <div className="accordion-body" ref={contentRef}>
            {description && (
              <p className="text-muted small mb-3 d-md-none">{description}</p>
            )}
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Non-collapsible section with enhanced styling
  return (
    <div className={`form-section card border-0 shadow-sm mb-4 ${className}`}>
      <div className="card-header bg-white border-0 pb-0">
        <div className="d-flex align-items-center">
          {icon && (
            <i className={`${icon} me-2 text-primary fs-5`}></i>
          )}
          <h5 className="mb-0 fw-semibold">{title}</h5>
        </div>
        {description && (
          <p className="text-muted small mt-2 mb-0">{description}</p>
        )}
      </div>
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};

export default FormSection;