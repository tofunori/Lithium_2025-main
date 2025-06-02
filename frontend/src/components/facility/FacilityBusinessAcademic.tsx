import React from 'react';

interface BusinessData {
  investment: string | null;
  jobs: number | null;
  evEquivalent: number | null;
  website: string | null;
  environmentalImpact: string | null;
}

interface FacilityBusinessAcademicProps {
  data: BusinessData;
}

const FacilityBusinessAcademic: React.FC<FacilityBusinessAcademicProps> = ({ data }) => {
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

  const hasBusinessData = investment || jobs || evEquivalent || website || environmentalImpact;

  if (!hasBusinessData) {
    return (
      <div className="section-minimal">
        <div className="section-header-minimal">
          <div className="section-icon-minimal">
            <i className="fas fa-chart-line"></i>
          </div>
          <h3 className="section-title-minimal">Business Information</h3>
        </div>
        <div className="section-content-minimal">
          <p className="text-muted">No business information available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-minimal">
      <div className="section-header-minimal">
        <div className="section-icon-minimal">
          <i className="fas fa-chart-line"></i>
        </div>
        <h3 className="section-title-minimal">Business Information</h3>
      </div>
      <div className="section-content-minimal">
        {investment && (
          <div className="data-row">
            <div className="data-label">Investment</div>
            <div className="data-value data-value-large">{formatCurrency(investment)}</div>
          </div>
        )}

        {jobs && (
          <div className="data-row">
            <div className="data-label">Jobs Created</div>
            <div className="data-value data-value-large">{formatNumber(jobs)}</div>
          </div>
        )}

        {evEquivalent && (
          <div className="data-row">
            <div className="data-label">EV Batteries/Year</div>
            <div className="data-value data-value-large">{formatNumber(evEquivalent)}</div>
          </div>
        )}

        {website && (
          <div className="data-row">
            <div className="data-label">Website</div>
            <div className="data-value">
              <a
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-academic btn-academic-secondary"
                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
              >
                <i className="fas fa-external-link-alt me-1"></i>
                Visit Website
              </a>
            </div>
          </div>
        )}

        {environmentalImpact && (
          <div className="mt-3">
            <h6 className="data-label mb-2">Environmental Impact</h6>
            <div className="p-3 bg-light border rounded">
              <p className="mb-0 text-muted">{environmentalImpact}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilityBusinessAcademic;