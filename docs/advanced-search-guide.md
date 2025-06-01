# Advanced Search and Filtering Guide

## Overview

The Lithium application now includes a powerful advanced search and filtering system that allows users to find facilities based on multiple criteria.

## Features

### 1. Full-Text Search
- Search across multiple fields simultaneously:
  - Company name
  - Facility name
  - Location
  - Technology
  - Technology category
  - Notes and descriptions (via database function)

### 2. Multi-Select Filters

#### Operational Status
- Filter by one or more operational statuses
- Options include: Operating, Under Construction, Planned, etc.

#### Technology Category
- Filter by recycling technology categories
- Multiple categories can be selected

#### Company
- Filter by specific companies
- Supports multiple company selection

#### Feedstock Types
- Filter by input materials processed
- Automatically extracted from facility details

#### Output Products
- Filter by products produced
- Automatically extracted from facility details

### 3. Range Filters

#### Capacity Range
- Set minimum and maximum processing capacity (tonnes/year)
- Leave either field empty for open-ended ranges

### 4. Location Filters

#### Has Coordinates
- All Facilities: Show all
- With Coordinates: Only facilities with lat/lng data
- Without Coordinates: Only facilities missing coordinates

## Implementation Details

### Frontend Components

1. **AdvancedSearchFilter.tsx**
   - Main search interface component
   - Handles all filter state management
   - Debounced search input
   - Collapsible advanced filters section
   - Real-time result count

2. **Updated FacilitiesPage.tsx**
   - Integrated advanced search component
   - Removed old simple search
   - Maintains sorting functionality
   - Column visibility toggles remain

### Backend Services

1. **searchFacilities Function**
   - Comprehensive Supabase query builder
   - Handles all filter combinations
   - Optimized for performance

2. **getFilterOptions Function**
   - Dynamically loads available filter options
   - Extracts unique values from database
   - Parses feedstock and product lists

### Database Enhancements

1. **Full-Text Search**
   - Added `search_vector` column with GIN index
   - PostgreSQL full-text search capabilities
   - Searches across facility and detail fields

2. **Performance Indexes**
   - Indexed commonly filtered columns
   - Composite index on coordinates
   - GIN indexes for text search on feedstock/products

## Usage Examples

### Basic Search
Simply type in the search box to search across all text fields:
- "Tesla" - finds all Tesla facilities
- "Nevada" - finds facilities in Nevada
- "Hydrometallurgical" - finds facilities using this technology

### Combined Filters
1. Search for "battery" + filter by "Operating" status
2. Filter by capacity range 10,000-50,000 tonnes/year + "Pyrometallurgical" technology
3. Select multiple companies + filter by specific output products

### Advanced Queries
- Find all facilities producing "Lithium carbonate" with capacity > 20,000 tonnes/year
- Search for facilities in "California" with coordinates available
- Filter by multiple feedstock types and operational statuses

## Performance Considerations

1. **Debounced Search**: Search input is debounced to prevent excessive API calls
2. **Indexed Columns**: All filterable columns have database indexes
3. **Lazy Loading**: Filter options are loaded once on component mount
4. **Efficient Queries**: Supabase queries use proper joins and filters

## Future Enhancements

1. **Saved Searches**: Allow users to save and share filter combinations
2. **Export Results**: Export filtered results to CSV/Excel
3. **Map Integration**: Apply filters to map view
4. **Real-time Updates**: Maintain filters during real-time data updates
5. **Search Suggestions**: Auto-complete for search terms
6. **Filter Templates**: Pre-defined filter sets for common queries

## Migration Requirements

To enable full-text search, run the migration:
```sql
-- See migrations/06_add_fulltext_search.sql
```

This migration:
- Adds full-text search column and indexes
- Creates search functions
- Adds performance indexes

## API Usage

```typescript
// Search with multiple filters
const results = await searchFacilities({
  searchTerm: 'lithium',
  statuses: ['Operating', 'Under Construction'],
  technologyCategories: ['Hydrometallurgical'],
  capacityMin: 10000,
  capacityMax: 50000,
  companies: ['Li-Cycle', 'Redwood Materials'],
  hasCoordinates: true
});

// Get available filter options
const options = await getFilterOptions();
// Returns: { statuses, technologies, technologyCategories, companies, feedstockTypes, outputProducts }
```