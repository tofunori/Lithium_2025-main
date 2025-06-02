import React from 'react';
import './FormSkeletonLoader.css';

const FormSkeletonLoader: React.FC = () => {
  return (
    <div className="form-skeleton-loader">
      {/* Header Skeleton */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="skeleton-title skeleton"></div>
          <div className="skeleton-subtitle skeleton mt-2"></div>
        </div>
        <div className="skeleton-button skeleton"></div>
      </div>

      {/* Form Sections Skeleton */}
      {/* Basic Information Section */}
      <div className="skeleton-section mb-4">
        <div className="skeleton-section-header skeleton mb-3"></div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <div className="skeleton-label skeleton mb-2"></div>
            <div className="skeleton-input skeleton"></div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="skeleton-label skeleton mb-2"></div>
            <div className="skeleton-input skeleton"></div>
          </div>
        </div>
        <div className="mb-3">
          <div className="skeleton-label skeleton mb-2"></div>
          <div className="skeleton-input skeleton"></div>
        </div>
      </div>

      {/* Technical Information Section */}
      <div className="skeleton-section mb-4">
        <div className="skeleton-section-header skeleton mb-3"></div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <div className="skeleton-label skeleton mb-2"></div>
            <div className="skeleton-input skeleton"></div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="skeleton-label skeleton mb-2"></div>
            <div className="skeleton-input skeleton"></div>
          </div>
        </div>
        <div className="mb-3">
          <div className="skeleton-label skeleton mb-2"></div>
          <div className="skeleton-textarea skeleton"></div>
        </div>
      </div>

      {/* Location Information Section */}
      <div className="skeleton-section mb-4">
        <div className="skeleton-section-header skeleton mb-3"></div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <div className="skeleton-label skeleton mb-2"></div>
            <div className="skeleton-input skeleton"></div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="skeleton-label skeleton mb-2"></div>
            <div className="skeleton-input skeleton"></div>
          </div>
        </div>
      </div>

      {/* Collapsible Sections */}
      {[1, 2, 3].map(index => (
        <div key={index} className="skeleton-accordion mb-3">
          <div className="skeleton-accordion-header skeleton"></div>
        </div>
      ))}

      {/* Action Buttons */}
      <div className="d-flex justify-content-between align-items-center mt-4 pt-4 border-top">
        <div className="skeleton-button skeleton"></div>
        <div className="skeleton-button skeleton"></div>
      </div>
    </div>
  );
};

export default FormSkeletonLoader;