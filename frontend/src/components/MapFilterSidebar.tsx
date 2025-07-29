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

  // Get unique feedstock types and output products from facilities
  const uniqueFeedstockTypes = useMemo(() => {
    const feedstocks = new Set<string>();
    facilities.forEach(f => {
      // Assuming feedstock data might be in a field like 'feedstock_type' or similar
      if (f.feedstock_type) feedstocks.add(f.feedstock_type);
    });
    return Array.from(feedstocks).sort();
  }, [facilities]);

  const uniqueOutputProducts = useMemo(() => {
    const products = new Set<string>();
    facilities.forEach(f => {
      // Assuming output product data might be in a field like 'output_product' or similar
      if (f.output_product) products.add(f.output_product);
    });
    return Array.from(products).sort();
  }, [facilities]);


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

  // Handlers for additional filter types
  const handleCompanyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    const newCompanies = checked
      ? [...(filters.companies || []), value]
      : (filters.companies || []).filter(company => company !== value);
    const newFilters = { ...filters, companies: newCompanies };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleCapacityChange = (minCapacity: number, maxCapacity: number) => {
    const newFilters = { ...filters, capacityMin: minCapacity, capacityMax: maxCapacity };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleFeedstockChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    const newFeedstocks = checked
      ? [...(filters.feedstockTypes || []), value]
      : (filters.feedstockTypes || []).filter(feedstock => feedstock !== value);
    const newFilters = { ...filters, feedstockTypes: newFeedstocks };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleOutputProductChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    const newProducts = checked
      ? [...(filters.outputProducts || []), value]
      : (filters.outputProducts || []).filter(product => product !== value);
    const newFilters = { ...filters, outputProducts: newProducts };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

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
          {uniqueCompanies.map(company => (
             <div className="form-check" key={company}>
               <input 
                 className="form-check-input"
                 type="checkbox" 
                 value={company} 
                 id={`company-${company}`}
                 checked={filters.companies.includes(company)}
                 onChange={handleCompanyChange}
               />
               <label className="form-check-label" htmlFor={`company-${company}`}>{company}</label>
             </div>
          ))}
        </div>

        {/* Capacity Filter */}
        <div className="filter-section mb-3">
          <h6>Capacity (tonnes/year)</h6>
          <div className="d-flex">
             <input 
               type="number" 
               placeholder="Min" 
               className="form-control form-control-sm me-1"
               onChange={(e) => handleCapacityChange(Number(e.target.value), filters.capacityMax || 0)}
             />
             <input 
               type="number" 
               placeholder="Max" 
               className="form-control form-control-sm ms-1"
               onChange={(e) => handleCapacityChange(filters.capacityMin || 0, Number(e.target.value))}
             />
          </div>
        </div>

        {/* Feedstock Filter */}
        <div className="filter-section mb-3">
          <h6>Feedstock Type</h6>
           {uniqueFeedstockTypes.map(type => (
             <div className="form-check" key={type}>
               <input 
                 className="form-check-input"
                 type="checkbox" 
                 value={type} 
                 id={`feedstock-${type}`}
                 checked={filters.feedstockTypes.includes(type)}
                 onChange={handleFeedstockChange}
               />
               <label className="form-check-label" htmlFor={`feedstock-${type}`}>{type}</label>
             </div>
          ))}
        </div>

        {/* Output Products Filter */}
        <div className="filter-section">
          <h6>Output Products</h6>
           {uniqueOutputProducts.map(product => (
             <div className="form-check" key={product}>
               <input 
                 className="form-check-input"
                 type="checkbox" 
                 value={product} 
                 id={`product-${product}`}
                 checked={filters.outputProducts.includes(product)}
                 onChange={handleOutputProductChange}
               />
               <label className="form-check-label" htmlFor={`product-${product}`}>{product}</label>
             </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default MapFilterSidebar;