// frontend/src/components/VirtualizedFacilityList.tsx
import React, { useCallback, useMemo, useRef, memo } from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { Facility } from '../services/types';
import { getCanonicalStatus, getStatusLabel, getStatusClass } from '../utils/statusUtils';
import './VirtualizedFacilityList.css';

interface VirtualizedFacilityListProps {
  facilities: Facility[];
  onFacilityClick?: (facility: Facility) => void;
  onEditClick?: (facility: Facility) => void;
  onDeleteClick?: (facility: Facility) => void;
  isAuthenticated?: boolean;
  isLoading?: boolean;
  hasMore?: boolean;
  loadMore?: () => Promise<void>;
  height?: number;
  itemHeight?: number;
}

// Memoized row component for better performance
const FacilityRow = memo(({ 
  index, 
  style, 
  data 
}: ListChildComponentProps<{
  facilities: Facility[];
  onFacilityClick?: (facility: Facility) => void;
  onEditClick?: (facility: Facility) => void;
  onDeleteClick?: (facility: Facility) => void;
  isAuthenticated?: boolean;
}>) => {
  const { facilities, onFacilityClick, onEditClick, onDeleteClick, isAuthenticated } = data;
  const facility = facilities[index];
  
  if (!facility) {
    return (
      <div style={style} className="facility-row-loading">
        <div className="facility-row-skeleton">
          <div className="skeleton-text skeleton-company"></div>
          <div className="skeleton-text skeleton-location"></div>
          <div className="skeleton-badge"></div>
        </div>
      </div>
    );
  }

  const canonicalStatus = getCanonicalStatus(facility['Operational Status']);
  const statusLabel = getStatusLabel(canonicalStatus);
  const statusClass = getStatusClass(canonicalStatus);

  const handleRowClick = (e: React.MouseEvent) => {
    // Don't trigger row click if clicking on action buttons
    if ((e.target as HTMLElement).closest('.facility-actions')) {
      return;
    }
    onFacilityClick?.(facility);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditClick?.(facility);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteClick?.(facility);
  };

  return (
    <div 
      style={style} 
      className="facility-row"
      onClick={handleRowClick}
      role="row"
      aria-rowindex={index + 1}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleRowClick(e as any);
        }
      }}
    >
      <div className="facility-row-content">
        <div className="facility-info">
          <h3 className="facility-company">{facility.Company || 'Unknown Company'}</h3>
          <p className="facility-location">
            <i className="fas fa-map-marker-alt me-1"></i>
            {facility.Location || 'Location not specified'}
          </p>
          {facility['Primary Recycling Technology'] && (
            <p className="facility-technology">
              <i className="fas fa-cogs me-1"></i>
              {facility['Primary Recycling Technology']}
            </p>
          )}
          {facility.capacity_tonnes_per_year && (
            <p className="facility-capacity">
              <i className="fas fa-weight me-1"></i>
              {facility.capacity_tonnes_per_year.toLocaleString()} tonnes/year
            </p>
          )}
        </div>
        
        <div className="facility-meta">
          <span className={`status-badge ${statusClass}`}>
            {statusLabel}
          </span>
          
          {isAuthenticated && (
            <div className="facility-actions" role="group" aria-label="Facility actions">
              <button
                className="btn btn-sm btn-outline-primary me-1"
                onClick={handleEditClick}
                aria-label={`Edit ${facility.Company}`}
                title="Edit facility"
              >
                <i className="fas fa-edit"></i>
              </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={handleDeleteClick}
                aria-label={`Delete ${facility.Company}`}
                title="Delete facility"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

FacilityRow.displayName = 'FacilityRow';

const VirtualizedFacilityList: React.FC<VirtualizedFacilityListProps> = ({
  facilities,
  onFacilityClick,
  onEditClick,
  onDeleteClick,
  isAuthenticated = false,
  isLoading = false,
  hasMore = false,
  loadMore,
  height = 600,
  itemHeight = 120
}) => {
  const listRef = useRef<List>(null);
  
  // Calculate item count including potential loading items
  const itemCount = hasMore ? facilities.length + 1 : facilities.length;
  
  // Check if an item is loaded
  const isItemLoaded = useCallback((index: number) => {
    return !hasMore || index < facilities.length;
  }, [hasMore, facilities.length]);
  
  // Load more items
  const loadMoreItems = useCallback(async () => {
    if (loadMore && !isLoading) {
      await loadMore();
    }
  }, [loadMore, isLoading]);
  
  // Memoize the item data to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    facilities,
    onFacilityClick,
    onEditClick,
    onDeleteClick,
    isAuthenticated
  }), [facilities, onFacilityClick, onEditClick, onDeleteClick, isAuthenticated]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!listRef.current) return;
    
    const currentIndex = Math.floor(listRef.current.state.scrollOffset / itemHeight);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        listRef.current.scrollToItem(Math.min(currentIndex + 1, facilities.length - 1), 'start');
        break;
      case 'ArrowUp':
        e.preventDefault();
        listRef.current.scrollToItem(Math.max(currentIndex - 1, 0), 'start');
        break;
      case 'Home':
        e.preventDefault();
        listRef.current.scrollToItem(0, 'start');
        break;
      case 'End':
        e.preventDefault();
        listRef.current.scrollToItem(facilities.length - 1, 'start');
        break;
    }
  }, [itemHeight, facilities.length]);
  
  if (facilities.length === 0 && !isLoading) {
    return (
      <div className="empty-state" role="status" aria-live="polite">
        <i className="fas fa-battery-empty fa-3x text-muted mb-3"></i>
        <h4>No facilities found</h4>
        <p className="text-muted">Try adjusting your search criteria or filters.</p>
      </div>
    );
  }
  
  return (
    <div 
      className="virtualized-facility-list"
      onKeyDown={handleKeyDown}
      role="grid"
      aria-label="Facility list"
      aria-rowcount={facilities.length}
      aria-busy={isLoading}
    >
      {loadMore ? (
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMoreItems}
        >
          {({ onItemsRendered, ref }) => (
            <List
              ref={(list) => {
                ref(list);
                listRef.current = list;
              }}
              height={height}
              itemCount={itemCount}
              itemSize={itemHeight}
              width="100%"
              onItemsRendered={onItemsRendered}
              itemData={itemData}
              overscanCount={5}
              className="facility-list-container"
            >
              {FacilityRow}
            </List>
          )}
        </InfiniteLoader>
      ) : (
        <List
          ref={listRef}
          height={height}
          itemCount={facilities.length}
          itemSize={itemHeight}
          width="100%"
          itemData={itemData}
          overscanCount={5}
          className="facility-list-container"
        >
          {FacilityRow}
        </List>
      )}
      
      {isLoading && (
        <div className="loading-overlay" role="status" aria-live="polite">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading more facilities...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualizedFacilityList;