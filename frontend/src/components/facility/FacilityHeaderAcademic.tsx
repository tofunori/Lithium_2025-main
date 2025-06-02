import React from 'react';
import { Link } from 'react-router-dom';

interface FacilityHeaderAcademicProps {
  facilityId: string;
  companyName: string | null;
  facilityName: string | null;
  location: string | null;
  operationalStatus: string | null;
  capacity: number | null;
  investment: string | null;
  jobs: number | null;
  evEquivalent: number | null;
  isAuthenticated: boolean;
  onEdit: () => void;
}

const FacilityHeaderAcademic: React.FC<FacilityHeaderAcademicProps> = ({
  facilityId,
  companyName,
  facilityName,
  location,
  operationalStatus,
  capacity,
  investment,
  jobs,
  evEquivalent,
  isAuthenticated,
  onEdit
}) => {
  const getStatusClass = (status: string | null) => {
    if (!status) return 'status-badge-academic status-unknown';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('operating') || statusLower.includes('operational')) {
      return 'status-badge-academic status-operating';
    } else if (statusLower.includes('construction') || statusLower.includes('under construction')) {
      return 'status-badge-academic status-construction';
    } else if (statusLower.includes('planned')) {
      return 'status-badge-academic status-planned';
    }
    return 'status-badge-academic status-unknown';
  };

  const formatNumber = (num: number | null | string) => {
    if (!num) return null;
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(numValue)) return null;
    return numValue.toLocaleString();
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return null;
    const numValue = parseFloat(amount);
    if (isNaN(numValue)) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(numValue);
  };

  const hasStats = capacity || investment || jobs || evEquivalent;

  return (
    <div className="facility-header-minimal">
      <div className="container">
        <div className="row align-items-start">
          <div className="col-lg-8">
            {companyName && (
              <div className="facility-subtitle">
                {companyName}
              </div>
            )}
            
            <h1 className="facility-title">
              {facilityName || 'Facility Details'}
            </h1>
            
            {location && (
              <div className="facility-location-header">
                <i className="fas fa-map-marker-alt me-2"></i>
                {location}
              </div>
            )}
            
            <div className="mb-3">
              <span className={getStatusClass(operationalStatus)}>
                {operationalStatus || 'Status Unknown'}
              </span>
            </div>
          </div>
          
          <div className="col-lg-4">
            <div className="action-bar-academic">
              {isAuthenticated && (
                <button
                  onClick={onEdit}
                  className="btn-academic btn-academic-primary"
                >
                  <i className="fas fa-edit"></i>
                  Edit
                </button>
              )}
              
              <Link to="/facilities" className="btn-academic btn-academic-secondary">
                <i className="fas fa-arrow-left"></i>
                Back to List
              </Link>
            </div>
          </div>
        </div>
        
        {/* Key Statistics - Only show if we have data */}
        {hasStats && (
          <div className="stats-grid-academic">
            {capacity && (
              <div className="stat-card-academic">
                <span className="stat-value-academic">{formatNumber(capacity)}</span>
                <span className="stat-label-academic">MT/Year</span>
              </div>
            )}
            
            {jobs && (
              <div className="stat-card-academic">
                <span className="stat-value-academic">{formatNumber(jobs)}</span>
                <span className="stat-label-academic">Jobs</span>
              </div>
            )}
            
            {investment && (
              <div className="stat-card-academic">
                <span className="stat-value-academic">{formatCurrency(investment)}</span>
                <span className="stat-label-academic">Investment</span>
              </div>
            )}
            
            {evEquivalent && (
              <div className="stat-card-academic">
                <span className="stat-value-academic">{formatNumber(evEquivalent)}</span>
                <span className="stat-label-academic">EV Batteries/Year</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilityHeaderAcademic;