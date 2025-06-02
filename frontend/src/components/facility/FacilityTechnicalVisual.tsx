import React from 'react';

interface TechnicalData {
  technology: string | null;
  technologyCategory: string | null;
  capacity: number | null;
  description: string | null;
  feedstock: string | null;
  product: string | null;
}

interface FacilityTechnicalVisualProps {
  data: TechnicalData;
}

const FacilityTechnicalVisual: React.FC<FacilityTechnicalVisualProps> = ({ data }) => {
  const {
    technology,
    technologyCategory,
    capacity,
    description,
    feedstock,
    product
  } = data;

  const getTechnologyIcon = (category: string | null) => {
    if (!category) return 'fas fa-cog';
    
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('mechanical')) return 'fas fa-tools';
    if (categoryLower.includes('hydro')) return 'fas fa-tint';
    if (categoryLower.includes('pyro')) return 'fas fa-fire';
    if (categoryLower.includes('hybrid')) return 'fas fa-layer-group';
    return 'fas fa-cog';
  };

  const formatCapacity = (cap: number | null) => {
    if (!cap) return 'N/A';
    return cap.toLocaleString() + ' MT/year';
  };

  const getCapacityPercentage = (cap: number | null) => {
    if (!cap) return 0;
    // Assume max capacity of 100,000 MT/year for visualization
    const maxCapacity = 100000;
    return Math.min((cap / maxCapacity) * 100, 100);
  };

  return (
    <div className="facility-section">
      <div className="section-header">
        <div className="section-icon">
          <i className={getTechnologyIcon(technologyCategory)}></i>
        </div>
        <h3 className="section-title">Technical Specifications</h3>
      </div>
      <div className="section-content">
        {/* Technology Overview Card */}
        <div className="tech-visual-card">
          {technologyCategory && (
            <div className="tech-category-badge">
              <i className={getTechnologyIcon(technologyCategory)}></i>
              {technologyCategory}
            </div>
          )}
          
          {technology && (
            <h4 className="mb-3" style={{ position: 'relative', zIndex: 1 }}>
              {technology}
            </h4>
          )}
          
          {description && (
            <p className="mb-0" style={{ position: 'relative', zIndex: 1 }}>
              {description}
            </p>
          )}
        </div>

        {/* Capacity Visualization */}
        {capacity && (
          <div className="capacity-meter">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-semibold">Processing Capacity</span>
              <span className="text-primary fw-bold">{formatCapacity(capacity)}</span>
            </div>
            <div className="capacity-bar">
              <div 
                className="capacity-fill"
                style={{ width: `${getCapacityPercentage(capacity)}%` }}
              >
                <span className="capacity-text">
                  {getCapacityPercentage(capacity).toFixed(0)}%
                </span>
              </div>
            </div>
            <small className="text-muted">Relative to industry scale (100,000 MT/year)</small>
          </div>
        )}

        {/* Process Flow */}
        <div className="row">
          {feedstock && (
            <div className="col-md-6 mb-3">
              <div className="d-flex align-items-start">
                <div className="me-3">
                  <div className="section-icon" style={{ width: 30, height: 30, fontSize: '0.9rem' }}>
                    <i className="fas fa-arrow-right"></i>
                  </div>
                </div>
                <div>
                  <h6 className="fw-semibold text-primary mb-1">Input Materials</h6>
                  <p className="mb-0 small text-muted">{feedstock}</p>
                </div>
              </div>
            </div>
          )}
          
          {product && (
            <div className="col-md-6 mb-3">
              <div className="d-flex align-items-start">
                <div className="me-3">
                  <div className="section-icon" style={{ width: 30, height: 30, fontSize: '0.9rem' }}>
                    <i className="fas fa-arrow-left"></i>
                  </div>
                </div>
                <div>
                  <h6 className="fw-semibold text-success mb-1">Output Products</h6>
                  <p className="mb-0 small text-muted">{product}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacilityTechnicalVisual;