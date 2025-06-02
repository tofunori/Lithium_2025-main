import React from 'react';
import { Link } from 'react-router-dom';

interface FacilityHeroProps {
  facilityId: string;
  companyName: string | null;
  facilityName: string | null;
  location: string | null;
  operationalStatus: string | null;
  technology: string | null;
  capacity: number | null;
  investment: string | null;
  jobs: number | null;
  evEquivalent: number | null;
  isAuthenticated: boolean;
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const FacilityHero: React.FC<FacilityHeroProps> = ({
  facilityId,
  companyName,
  facilityName,
  location,
  operationalStatus,
  technology,
  capacity,
  investment,
  jobs,
  evEquivalent,
  isAuthenticated,
  isEditing,
  isSaving,
  onEdit,
  onSave,
  onCancel
}) => {
  const getStatusBadgeClass = (status: string | null) => {
    if (!status) return 'status-badge-large';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('operating') || statusLower.includes('operational')) {
      return 'status-badge-large status-operating';
    } else if (statusLower.includes('construction') || statusLower.includes('under construction')) {
      return 'status-badge-large status-construction';
    } else if (statusLower.includes('planned')) {
      return 'status-badge-large status-planned';
    }
    return 'status-badge-large';
  };

  const formatNumber = (num: number | null | string) => {
    if (!num) return 'N/A';
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(numValue)) return 'N/A';
    return numValue.toLocaleString();
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return 'N/A';
    const numValue = parseFloat(amount);
    if (isNaN(numValue)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(numValue);
  };

  return (
    <div className="facility-hero">
      <div className="container">
        <div className="facility-hero-content">
          <div className="row align-items-center">
            <div className="col-lg-8">
              {companyName && (
                <div className="facility-company-name">
                  <i className="fas fa-building me-2"></i>
                  {companyName}
                </div>
              )}
              
              <h1 className="facility-name">
                {facilityName || 'Facility Details'}
              </h1>
              
              {location && (
                <div className="facility-location">
                  <i className="fas fa-map-marker-alt"></i>
                  {location}
                </div>
              )}
              
              <div className="mt-3">
                <span className={getStatusBadgeClass(operationalStatus)}>
                  <i className="fas fa-circle me-2"></i>
                  {operationalStatus || 'Unknown Status'}
                </span>
              </div>
            </div>
            
            <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
              <div className="action-buttons">
                {isAuthenticated && !isEditing && (
                  <button
                    onClick={onEdit}
                    className="btn-hero btn-hero-primary"
                    disabled={isSaving}
                  >
                    <i className="fas fa-edit"></i>
                    Edit Facility
                  </button>
                )}
                
                {isEditing && (
                  <>
                    <button
                      onClick={onSave}
                      className="btn-hero btn-hero-primary"
                      disabled={isSaving}
                    >
                      <i className="fas fa-save"></i>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={onCancel}
                      className="btn-hero btn-hero-secondary"
                      disabled={isSaving}
                    >
                      <i className="fas fa-times"></i>
                      Cancel
                    </button>
                  </>
                )}
                
                <Link to="/facilities" className="btn-hero btn-hero-secondary">
                  <i className="fas fa-arrow-left"></i>
                  Back to List
                </Link>
              </div>
            </div>
          </div>
          
          {/* Key Stats */}
          <div className="key-stats">
            {capacity && (
              <div className="stat-card">
                <span className="stat-value">{formatNumber(capacity)}</span>
                <span className="stat-label">MT/Year Capacity</span>
              </div>
            )}
            
            {jobs && (
              <div className="stat-card">
                <span className="stat-value">{formatNumber(jobs)}</span>
                <span className="stat-label">Jobs Created</span>
              </div>
            )}
            
            {investment && (
              <div className="stat-card">
                <span className="stat-value">{formatCurrency(investment)}</span>
                <span className="stat-label">Investment</span>
              </div>
            )}
            
            {evEquivalent && (
              <div className="stat-card">
                <span className="stat-value">{formatNumber(evEquivalent)}</span>
                <span className="stat-label">EV Batteries/Year</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityHero;