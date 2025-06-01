import React from 'react';
import { Link } from 'react-router-dom';

interface FacilityHeaderProps {
  facilityId: string;
  companyName?: string | null;
  operationalStatus?: string | null;
  isAuthenticated: boolean;
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  renderStatusBadge: (status: string | undefined | null) => React.ReactNode;
}

const FacilityHeader: React.FC<FacilityHeaderProps> = ({
  facilityId,
  companyName,
  operationalStatus,
  isAuthenticated,
  isEditing,
  isSaving,
  onEdit,
  onSave,
  onCancel,
  renderStatusBadge
}) => {
  return (
    <div className="card-header facility-header d-flex justify-content-between align-items-center flex-wrap">
      <div>
        <h1 className="h3 mb-0">{companyName || 'Facility Details'}</h1>
        {renderStatusBadge(operationalStatus)}
      </div>
      <div>
        {isAuthenticated && !isEditing && (
          <Link to={`/facilities/edit/${facilityId}`} className="btn btn-outline-primary btn-sm me-2">
            <i className="fas fa-edit me-1"></i> Edit
          </Link>
        )}
        {isEditing && (
          <>
            <button className="btn btn-success btn-sm me-2" onClick={onSave} disabled={isSaving}>
              <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-save'} me-1`}></i> 
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={onCancel} disabled={isSaving}>
              <i className="fas fa-times me-1"></i> Cancel
            </button>
          </>
        )}
        <Link to="/facilities" className="btn btn-outline-secondary btn-sm ms-2">
          <i className="fas fa-arrow-left me-1"></i> Back to List
        </Link>
      </div>
    </div>
  );
};

export default FacilityHeader;