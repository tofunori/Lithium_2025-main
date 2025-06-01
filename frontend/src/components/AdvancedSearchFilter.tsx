import React, { useState, useEffect, useCallback } from 'react';
import { FacilitySearchFilters, getFilterOptions } from '../services';
import LoadingSpinner from './LoadingSpinner';
import './AdvancedSearchFilter.css';

interface AdvancedSearchFilterProps {
  onSearch: (filters: FacilitySearchFilters) => void;
  isSearching?: boolean;
  resultCount?: number;
}

interface FilterOptions {
  statuses: string[];
  technologies: string[];
  technologyCategories: string[];
  companies: string[];
  feedstockTypes: string[];
  outputProducts: string[];
}

const AdvancedSearchFilter: React.FC<AdvancedSearchFilterProps> = ({ 
  onSearch, 
  isSearching = false,
  resultCount 
}) => {
  const [filters, setFilters] = useState<FacilitySearchFilters>({
    searchTerm: '',
    statuses: [],
    technologies: [],
    technologyCategories: [],
    capacityMin: undefined,
    capacityMax: undefined,
    companies: [],
    locations: [],
    hasCoordinates: undefined,
    feedstockTypes: [],
    outputProducts: []
  });

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    statuses: [],
    technologies: [],
    technologyCategories: [],
    companies: [],
    feedstockTypes: [],
    outputProducts: []
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Load filter options on mount
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setLoadingOptions(true);
        const options = await getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      } finally {
        setLoadingOptions(false);
      }
    };
    loadFilterOptions();
  }, []);

  // Handle search term change with debounce
  const handleSearchTermChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, searchTerm: value }));
  }, []);

  // Handle multi-select changes
  const handleMultiSelectChange = useCallback((
    filterKey: keyof FacilitySearchFilters,
    value: string,
    checked: boolean
  ) => {
    setFilters(prev => {
      const currentValues = (prev[filterKey] as string[]) || [];
      const newValues = checked 
        ? [...currentValues, value]
        : currentValues.filter(v => v !== value);
      return { ...prev, [filterKey]: newValues };
    });
  }, []);

  // Handle capacity range changes
  const handleCapacityChange = useCallback((type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : Number(value);
    setFilters(prev => ({
      ...prev,
      [type === 'min' ? 'capacityMin' : 'capacityMax']: numValue
    }));
  }, []);

  // Handle coordinate filter change
  const handleCoordinateFilterChange = useCallback((value: string) => {
    const hasCoordinates = value === 'all' ? undefined : value === 'yes';
    setFilters(prev => ({ ...prev, hasCoordinates }));
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setFilters({
      searchTerm: '',
      statuses: [],
      technologies: [],
      technologyCategories: [],
      capacityMin: undefined,
      capacityMax: undefined,
      companies: [],
      locations: [],
      hasCoordinates: undefined,
      feedstockTypes: [],
      outputProducts: []
    });
  }, []);

  // Submit search
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  }, [filters, onSearch]);

  // Check if any filters are active
  const hasActiveFilters = 
    filters.searchTerm !== '' ||
    (filters.statuses?.length ?? 0) > 0 ||
    (filters.technologies?.length ?? 0) > 0 ||
    (filters.technologyCategories?.length ?? 0) > 0 ||
    filters.capacityMin !== undefined ||
    filters.capacityMax !== undefined ||
    (filters.companies?.length ?? 0) > 0 ||
    (filters.locations?.length ?? 0) > 0 ||
    filters.hasCoordinates !== undefined ||
    (filters.feedstockTypes?.length ?? 0) > 0 ||
    (filters.outputProducts?.length ?? 0) > 0;

  return (
    <div className="advanced-search-filter card shadow-sm mb-4">
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          {/* Search Bar */}
          <div className="search-bar-section mb-3">
            <div className="input-group">
              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="Search facilities by name, company, location, technology..."
                value={filters.searchTerm}
                onChange={(e) => handleSearchTermChange(e.target.value)}
              />
              <button 
                className="btn btn-primary" 
                type="submit"
                disabled={isSearching}
              >
                {isSearching ? (
                  <>
                    <LoadingSpinner size="sm" className="me-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <i className="fas fa-search me-2"></i>
                    Search
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Toggle Advanced Filters */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <button
              type="button"
              className="btn btn-link p-0 text-decoration-none"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} me-2`}></i>
              Advanced Filters
              {hasActiveFilters && (
                <span className="badge bg-primary ms-2">
                  {Object.values(filters).filter(v => 
                    v !== undefined && v !== '' && (Array.isArray(v) ? v.length > 0 : true)
                  ).length} active
                </span>
              )}
            </button>
            
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={handleClearFilters}
              >
                <i className="fas fa-times me-1"></i>
                Clear Filters
              </button>
            )}
          </div>

          {/* Advanced Filters Section */}
          {isExpanded && (
            <div className="advanced-filters-section">
              {loadingOptions ? (
                <div className="text-center p-4">
                  <LoadingSpinner />
                  <p className="mt-2">Loading filter options...</p>
                </div>
              ) : (
                <div className="row g-3">
                  {/* Status Filter */}
                  <div className="col-md-6 col-lg-4">
                    <div className="filter-group">
                      <label className="form-label fw-bold">
                        <i className="fas fa-flag me-1"></i>
                        Operational Status
                      </label>
                      <div className="filter-options">
                        {filterOptions.statuses.map(status => (
                          <div key={status} className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`status-${status}`}
                              checked={filters.statuses?.includes(status) || false}
                              onChange={(e) => handleMultiSelectChange('statuses', status, e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor={`status-${status}`}>
                              {status}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Technology Category Filter */}
                  <div className="col-md-6 col-lg-4">
                    <div className="filter-group">
                      <label className="form-label fw-bold">
                        <i className="fas fa-cogs me-1"></i>
                        Technology Category
                      </label>
                      <div className="filter-options">
                        {filterOptions.technologyCategories.map(category => (
                          <div key={category} className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`tech-cat-${category}`}
                              checked={filters.technologyCategories?.includes(category) || false}
                              onChange={(e) => handleMultiSelectChange('technologyCategories', category, e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor={`tech-cat-${category}`}>
                              {category}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Capacity Range Filter */}
                  <div className="col-md-6 col-lg-4">
                    <div className="filter-group">
                      <label className="form-label fw-bold">
                        <i className="fas fa-weight me-1"></i>
                        Capacity Range (tonnes/year)
                      </label>
                      <div className="d-flex gap-2">
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="Min"
                          value={filters.capacityMin || ''}
                          onChange={(e) => handleCapacityChange('min', e.target.value)}
                          min="0"
                        />
                        <span className="align-self-center">-</span>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          placeholder="Max"
                          value={filters.capacityMax || ''}
                          onChange={(e) => handleCapacityChange('max', e.target.value)}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Company Filter */}
                  <div className="col-md-6 col-lg-4">
                    <div className="filter-group">
                      <label className="form-label fw-bold">
                        <i className="fas fa-building me-1"></i>
                        Company
                      </label>
                      <div className="filter-options scrollable">
                        {filterOptions.companies.map(company => (
                          <div key={company} className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`company-${company}`}
                              checked={filters.companies?.includes(company) || false}
                              onChange={(e) => handleMultiSelectChange('companies', company, e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor={`company-${company}`}>
                              {company}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Feedstock Types Filter */}
                  <div className="col-md-6 col-lg-4">
                    <div className="filter-group">
                      <label className="form-label fw-bold">
                        <i className="fas fa-inbox me-1"></i>
                        Feedstock Types
                      </label>
                      <div className="filter-options scrollable">
                        {filterOptions.feedstockTypes.map(type => (
                          <div key={type} className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`feedstock-${type}`}
                              checked={filters.feedstockTypes?.includes(type) || false}
                              onChange={(e) => handleMultiSelectChange('feedstockTypes', type, e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor={`feedstock-${type}`}>
                              {type}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Output Products Filter */}
                  <div className="col-md-6 col-lg-4">
                    <div className="filter-group">
                      <label className="form-label fw-bold">
                        <i className="fas fa-box me-1"></i>
                        Output Products
                      </label>
                      <div className="filter-options scrollable">
                        {filterOptions.outputProducts.map(product => (
                          <div key={product} className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`product-${product}`}
                              checked={filters.outputProducts?.includes(product) || false}
                              onChange={(e) => handleMultiSelectChange('outputProducts', product, e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor={`product-${product}`}>
                              {product}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Coordinates Filter */}
                  <div className="col-md-6 col-lg-4">
                    <div className="filter-group">
                      <label className="form-label fw-bold">
                        <i className="fas fa-map-marker-alt me-1"></i>
                        Has Coordinates
                      </label>
                      <select 
                        className="form-select"
                        value={filters.hasCoordinates === undefined ? 'all' : filters.hasCoordinates ? 'yes' : 'no'}
                        onChange={(e) => handleCoordinateFilterChange(e.target.value)}
                      >
                        <option value="all">All Facilities</option>
                        <option value="yes">With Coordinates</option>
                        <option value="no">Without Coordinates</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Results Summary */}
        {resultCount !== undefined && (
          <div className="results-summary mt-3 pt-3 border-top">
            <small className="text-muted">
              Found <strong>{resultCount}</strong> facilities
              {hasActiveFilters && ' matching your criteria'}
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearchFilter;