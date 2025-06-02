import React from 'react';

interface TechnicalData {
  technology: string | null;
  technologyCategory: string | null;
  capacity: number | null;
  description: string | null;
  feedstock: string | null;
  product: string | null;
}

interface FacilityTechnicalAcademicProps {
  data: TechnicalData;
}

const FacilityTechnicalAcademic: React.FC<FacilityTechnicalAcademicProps> = ({ data }) => {
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
    if (!cap) return null;
    return cap.toLocaleString() + ' MT/year';
  };

  const hasData = technology || technologyCategory || capacity || description || feedstock || product;

  if (!hasData) {
    return (
      <div className="section-minimal">
        <div className="section-header-minimal">
          <div className="section-icon-minimal">
            <i className="fas fa-cog"></i>
          </div>
          <h3 className="section-title-minimal">Technical Specifications</h3>
        </div>
        <div className="section-content-minimal">
          <p className="text-muted">No technical information available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-minimal">
      <div className="section-header-minimal">
        <div className="section-icon-minimal">
          <i className={getTechnologyIcon(technologyCategory)}></i>
        </div>
        <h3 className="section-title-minimal">Technical Specifications</h3>
      </div>
      <div className="section-content-minimal">
        {/* Technology Category */}
        {technologyCategory && (
          <div className="mb-3">
            <div className="tech-category-academic">
              <i className={getTechnologyIcon(technologyCategory)}></i>
              {technologyCategory}
            </div>
          </div>
        )}

        {/* Data Rows */}
        {technology && (
          <div className="data-row">
            <div className="data-label">Technology</div>
            <div className="data-value">{technology}</div>
          </div>
        )}

        {capacity && (
          <div className="data-row">
            <div className="data-label">Processing Capacity</div>
            <div className="data-value data-value-large">{formatCapacity(capacity)}</div>
          </div>
        )}

        {description && (
          <div className="data-row">
            <div className="data-label">Description</div>
            <div className="data-value">{description}</div>
          </div>
        )}

        {/* Process Flow */}
        {(feedstock || product) && (
          <div className="process-flow-academic">
            <div className="process-item-academic">
              <div className="process-label-academic">Input</div>
              <div className="process-value-academic">
                {feedstock || 'Not specified'}
              </div>
            </div>
            <div className="process-arrow-academic">
              <i className="fas fa-arrow-right"></i>
            </div>
            <div className="process-item-academic">
              <div className="process-label-academic">Output</div>
              <div className="process-value-academic">
                {product || 'Not specified'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilityTechnicalAcademic;