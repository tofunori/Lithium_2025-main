import React from 'react';

interface BusinessData {
  investment: string | null;
  jobs: number | null;
  evEquivalent: number | null;
  website: string | null;
  environmentalImpact: string | null;
}

interface FacilityBusinessVisualProps {
  data: BusinessData;
}

const FacilityBusinessVisual: React.FC<FacilityBusinessVisualProps> = ({ data }) => {
  const { investment, jobs, evEquivalent, website, environmentalImpact } = data;

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

  const formatNumber = (num: number | null) => {
    if (!num) return null;
    return num.toLocaleString();
  };

  const getInvestmentScale = (amount: string | null) => {
    if (!amount) return 0;
    const numValue = parseFloat(amount);
    if (isNaN(numValue)) return 0;
    // Scale relative to $1B max
    return Math.min((numValue / 1000000000) * 100, 100);
  };

  const getJobsScale = (jobCount: number | null) => {
    if (!jobCount) return 0;
    // Scale relative to 1000 jobs max
    return Math.min((jobCount / 1000) * 100, 100);
  };

  const getEvScale = (evCount: number | null) => {
    if (!evCount) return 0;
    // Scale relative to 100,000 EVs max
    return Math.min((evCount / 100000) * 100, 100);
  };

  const hasBusinessData = investment || jobs || evEquivalent || website;

  if (!hasBusinessData && !environmentalImpact) {
    return (
      <div className="facility-section">
        <div className="section-header">
          <div className="section-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <h3 className="section-title">Business Impact</h3>
        </div>
        <div className="section-content">
          <p className="text-muted">No business information available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="facility-section">
      <div className="section-header">
        <div className="section-icon">
          <i className="fas fa-chart-line"></i>
        </div>
        <h3 className="section-title">Business Impact</h3>
      </div>
      <div className="section-content">
        {/* Key Metrics Grid */}
        <div className="row mb-4">
          {investment && (
            <div className="col-md-4 mb-3">
              <div className="text-center p-3 bg-light rounded">
                <div className="h2 text-primary mb-1">{formatCurrency(investment)}</div>
                <div className="small text-muted">Total Investment</div>
                <div className="progress mt-2" style={{ height: '6px' }}>
                  <div
                    className="progress-bar bg-primary"
                    style={{ width: `${getInvestmentScale(investment)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {jobs && (
            <div className="col-md-4 mb-3">
              <div className="text-center p-3 bg-light rounded">
                <div className="h2 text-success mb-1">{formatNumber(jobs)}</div>
                <div className="small text-muted">Jobs Created</div>
                <div className="progress mt-2" style={{ height: '6px' }}>
                  <div
                    className="progress-bar bg-success"
                    style={{ width: `${getJobsScale(jobs)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {evEquivalent && (
            <div className="col-md-4 mb-3">
              <div className="text-center p-3 bg-light rounded">
                <div className="h2 text-info mb-1">{formatNumber(evEquivalent)}</div>
                <div className="small text-muted">EV Batteries/Year</div>
                <div className="progress mt-2" style={{ height: '6px' }}>
                  <div
                    className="progress-bar bg-info"
                    style={{ width: `${getEvScale(evEquivalent)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Website */}
        {website && (
          <div className="mb-4">
            <h6 className="fw-semibold text-primary mb-2">
              <i className="fas fa-globe me-2"></i>
              Website
            </h6>
            <a
              href={website.startsWith('http') ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary"
            >
              <i className="fas fa-external-link-alt me-2"></i>
              Visit Company Website
            </a>
          </div>
        )}

        {/* Environmental Impact */}
        {environmentalImpact && (
          <div>
            <h6 className="fw-semibold text-success mb-2">
              <i className="fas fa-leaf me-2"></i>
              Environmental Impact
            </h6>
            <div className="bg-light rounded p-3">
              <p className="mb-0">{environmentalImpact}</p>
            </div>
          </div>
        )}

        {/* Economic Impact Visualization */}
        {(investment || jobs) && (
          <div className="mt-4">
            <h6 className="fw-semibold mb-3">Economic Impact Overview</h6>
            <div className="row">
              {investment && (
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <div className="rounded-circle bg-primary bg-opacity-10 p-2">
                        <i className="fas fa-dollar-sign text-primary"></i>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-semibold">Capital Investment</div>
                      <div className="small text-muted">
                        Contributes to local economy development
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {jobs && (
                <div className="col-md-6 mb-3">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <div className="rounded-circle bg-success bg-opacity-10 p-2">
                        <i className="fas fa-users text-success"></i>
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-semibold">Employment</div>
                      <div className="small text-muted">
                        Direct job creation in green technology
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilityBusinessVisual;