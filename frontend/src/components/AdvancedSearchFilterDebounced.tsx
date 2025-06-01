// frontend/src/components/AdvancedSearchFilterDebounced.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { FacilitySearchFilters, getFilterOptions } from '../services';
import { useDebouncedCallback } from '../hooks/useDebounce';
import LoadingSpinner from './LoadingSpinner';
import './AdvancedSearchFilter.css';

interface AdvancedSearchFilterProps {
  facilities?: any[];
  onSearch: (filters: FacilitySearchFilters) => void;
  isSearching?: boolean;
  resultCount?: number;
  debounceDelay?: number;
}

interface FilterOptions {
  statuses: string[];
  technologies: string[];
  technologyCategories: string[];
  companies: string[];
  feedstockTypes: string[];
  outputProducts: string[];
}

const AdvancedSearchFilterDebounced: React.FC<AdvancedSearchFilterProps> = ({ 
  onSearch, 
  isSearching = false,
  resultCount,
  debounceDelay = 300
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
  const [localSearchTerm, setLocalSearchTerm] = useState('');

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

  // Debounced search function
  const debouncedSearch = useDebouncedCallback((searchFilters: FacilitySearchFilters) => {
    onSearch(searchFilters);
  }, debounceDelay);

  // Trigger search when filters change
  useEffect(() => {
    debouncedSearch(filters);
  }, [filters, debouncedSearch]);

  // Handle search term change with local state for immediate UI feedback
  const handleSearchTermChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
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
  const clearFilters = useCallback(() => {
    setLocalSearchTerm('');
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

  // Count active filters
  const activeFilterCount = Object.values(filters).reduce((count, value) => {
    if (Array.isArray(value) && value.length > 0) return count + 1;
    if (value !== undefined && value !== '') return count + 1;
    return count;
  }, 0);

  return (
    <div className="advanced-search-filter card">
      <div className="card-body">
        {/* Search Bar */}
        <div className="search-bar mb-3">
          <div className="input-group">
            <span className="input-group-text">
              <i className="fas fa-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search facilities by name, location, or technology..."
              value={localSearchTerm}
              onChange={handleSearchTermChange}
              aria-label="Search facilities"
              autoComplete="off"
            />
            {localSearchTerm && (
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => {
                  setLocalSearchTerm('');
                  setFilters(prev => ({ ...prev, searchTerm: '' }));
                }}
                aria-label="Clear search"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          {isSearching && (
            <div className="search-loading mt-2">
              <small className="text-muted">
                <i className="fas fa-spinner fa-spin me-1"></i>
                Searching...
              </small>
            </div>
          )}
        </div>

        {/* Filter Toggle */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-controls="advanced-filters"
          >
            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} me-1`}></i>
            {isExpanded ? 'Hide' : 'Show'} Advanced Filters
            {activeFilterCount > 0 && (
              <span className="badge bg-primary ms-1">{activeFilterCount}</span>
            )}
          </button>
          
          {(activeFilterCount > 0 || localSearchTerm) && (
            <button
              className="btn btn-sm btn-link text-danger"
              onClick={clearFilters}
            >
              <i className="fas fa-times me-1"></i>
              Clear All
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div id="advanced-filters" className="advanced-filters">
            {loadingOptions ? (
              <LoadingSpinner text="Loading filter options..." />
            ) : (
              <div className="row g-3">
                {/* Operational Status */}
                <div className="col-md-6 col-lg-4">
                  <h6 className="filter-heading">
                    <i className="fas fa-flag me-1"></i>
                    Operational Status
                  </h6>
                  <div className="filter-options" role="group" aria-label="Operational status filters">
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

                {/* Technology Categories */}
                <div className="col-md-6 col-lg-4">
                  <h6 className="filter-heading">
                    <i className="fas fa-microchip me-1"></i>
                    Technology Category
                  </h6>
                  <div className="filter-options" role="group" aria-label="Technology category filters">
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

                {/* Capacity Range */}
                <div className="col-md-6 col-lg-4">
                  <h6 className="filter-heading">
                    <i className="fas fa-weight me-1"></i>
                    Capacity Range (tonnes/year)
                  </h6>
                  <div className="capacity-inputs">
                    <div className="input-group input-group-sm mb-2">
                      <span className="input-group-text">Min</span>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0"
                        value={filters.capacityMin || ''}
                        onChange={(e) => handleCapacityChange('min', e.target.value)}
                        min="0"
                        aria-label="Minimum capacity"
                      />
                    </div>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text">Max</span>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="100000"
                        value={filters.capacityMax || ''}
                        onChange={(e) => handleCapacityChange('max', e.target.value)}
                        min="0"
                        aria-label="Maximum capacity"
                      />
                    </div>
                  </div>
                </div>

                {/* Coordinates Filter */}
                <div className="col-md-6 col-lg-4">
                  <h6 className="filter-heading">
                    <i className="fas fa-map-marker-alt me-1"></i>
                    Location Data
                  </h6>
                  <div className="filter-options" role="radiogroup" aria-label="Location data filter">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="coordinates"
                        id="coords-all"
                        value="all"
                        checked={filters.hasCoordinates === undefined}
                        onChange={(e) => handleCoordinateFilterChange(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="coords-all">
                        All facilities
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="coordinates"
                        id="coords-yes"
                        value="yes"
                        checked={filters.hasCoordinates === true}
                        onChange={(e) => handleCoordinateFilterChange(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="coords-yes">
                        With coordinates
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="coordinates"
                        id="coords-no"
                        value="no"
                        checked={filters.hasCoordinates === false}
                        onChange={(e) => handleCoordinateFilterChange(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="coords-no">
                        Without coordinates
                      </label>
                    </div>
                  </div>
                </div>

                {/* Companies */}
                <div className="col-md-6 col-lg-4">
                  <h6 className="filter-heading">
                    <i className="fas fa-building me-1"></i>
                    Companies
                  </h6>
                  <div className="filter-options scrollable" role="group" aria-label="Company filters">
                    {filterOptions.companies.slice(0, 10).map(company => (
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
                    {filterOptions.companies.length > 10 && (
                      <small className="text-muted">
                        +{filterOptions.companies.length - 10} more...
                      </small>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Summary */}
        {resultCount !== undefined && (
          <div className="results-summary mt-3 text-center">
            <small className="text-muted">
              Found <strong className="text-primary">{resultCount}</strong> facilities
              {activeFilterCount > 0 && ' matching your criteria'}
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearchFilterDebounced;