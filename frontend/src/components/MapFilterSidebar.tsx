import React, { useState, useEffect, useMemo } from 'react';
import { Facility } from '../services'; // Assuming Facility type is exported
import './MapFilterSidebar.css';

// Define the structure for filter values
export interface MapFilters {
  statuses: string[];
  companies: string[];
  capacityMin: number | null;
  capacityMax: number | null;
  feedstockTypes: string[];
  outputProducts: string[];
}

interface MapFilterSidebarProps {
  facilities: Facility[];
  onFilterChange: (filters: MapFilters) => void;
}

const MapFilterSidebar: React.FC<MapFilterSidebarProps> = ({ facilities, onFilterChange }) => {
  const [filters, setFilters] = useState<MapFilters>({
    statuses: [],
    companies: [],
    capacityMin: null,
    capacityMax: null,
    feedstockTypes: [],
    outputProducts: [],
  });

  // --- Derive filter options from facilities data ---
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set<string>();
    facilities.forEach(f => {
      // Use the correct DB column name, handle null/undefined
      const status = f["Operational Status"];
      if (status) statuses.add(status);
    });
    return Array.from(statuses).sort();
  }, [facilities]);

  const uniqueCompanies = useMemo(() => {
    const companies = new Set<string>();
    facilities.forEach(f => {
      if (f.Company) companies.add(f.Company);
    });
    return Array.from(companies).sort();
  }, [facilities]);

  // TODO: Add memos for Feedstock Types and Output Products when data model is known
  const uniqueFeedstockTypes = useMemo(() => ['Feedstock A', 'Feedstock B'], []); // Placeholder
  const uniqueOutputProducts = useMemo(() => ['Product X', 'Product Y'], []); // Placeholder


  // --- Handlers for filter changes ---
  // Example for checkboxes (Status)
  const handleStatusChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    const newStatuses = checked
      ? [...filters.statuses, value]
      : filters.statuses.filter(status => status !== value);
    const newFilters = { ...filters, statuses: newStatuses };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // TODO: Add handlers for Company, Capacity, Feedstock, Output Products

  // --- Render filter sections ---
  return (
    <div className="map-filter-sidebar card shadow-sm">
      <div className="card-body">
        <h5 className="card-title mb-3">Filter Facilities</h5>

        {/* Status Filter */}
        <div className="filter-section mb-3">
          <h6>Status</h6>
          {uniqueStatuses.map(status => (
            <div className="form-check" key={status}>
              <input
                className="form-check-input"
                type="checkbox"
                value={status}
                id={`status-${status}`}
                checked={filters.statuses.includes(status)}
                onChange={handleStatusChange}
              />
              <label className="form-check-label" htmlFor={`status-${status}`}>
                {status}
              </label>
            </div>
          ))}
        </div>

        {/* Company Filter */}
        <div className="filter-section mb-3">
          <h6>Company</h6>
          {/* TODO: Implement Company filter UI (e.g., checkboxes or multi-select) */}
          {uniqueCompanies.map(company => (
             <div className="form-check" key={company}>
               {/* Placeholder - needs handler */}
               <input type="checkbox" value={company} id={`company-${company}`} />
               <label htmlFor={`company-${company}`}>{company}</label>
             </div>
          ))}
        </div>

        {/* Capacity Filter */}
        <div className="filter-section mb-3">
          <h6>Capacity (tonnes/year)</h6>
          {/* TODO: Implement Capacity filter UI (e.g., range slider or min/max inputs) */}
          <div className="d-flex">
             <input type="number" placeholder="Min" className="form-control form-control-sm me-1" />
             <input type="number" placeholder="Max" className="form-control form-control-sm ms-1" />
          </div>
        </div>

        {/* Feedstock Filter */}
        <div className="filter-section mb-3">
          <h6>Feedstock Type</h6>
          {/* TODO: Implement Feedstock filter UI */}
           {uniqueFeedstockTypes.map(type => (
             <div className="form-check" key={type}>
               <input type="checkbox" value={type} id={`feedstock-${type}`} />
               <label htmlFor={`feedstock-${type}`}>{type}</label>
             </div>
          ))}
        </div>

        {/* Output Products Filter */}
        <div className="filter-section">
          <h6>Output Products</h6>
          {/* TODO: Implement Output Products filter UI */}
           {uniqueOutputProducts.map(product => (
             <div className="form-check" key={product}>
               <input type="checkbox" value={product} id={`product-${product}`} />
               <label htmlFor={`product-${product}`}>{product}</label>
             </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default MapFilterSidebar;
