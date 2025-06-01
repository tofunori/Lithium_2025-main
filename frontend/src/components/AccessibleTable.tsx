// frontend/src/components/AccessibleTable.tsx
import React, { useCallback, useState, useRef, useEffect } from 'react';
import './AccessibleTable.css';

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T, index: number) => React.ReactNode;
  headerRender?: () => React.ReactNode;
  ariaLabel?: (row: T) => string;
}

export interface AccessibleTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  onRowClick?: (row: T, index: number) => void;
  onSort?: (column: keyof T | string, direction: 'asc' | 'desc') => void;
  sortConfig?: { key: keyof T | string; direction: 'asc' | 'desc' };
  loading?: boolean;
  emptyMessage?: string;
  caption?: string;
  stickyHeader?: boolean;
  selectable?: boolean;
  selectedRows?: Set<string | number>;
  onSelectionChange?: (selectedRows: Set<string | number>) => void;
  ariaLabel?: string;
  ariaDescription?: string;
  enableKeyboardNavigation?: boolean;
  rowHeight?: number;
}

function AccessibleTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  onSort,
  sortConfig,
  loading = false,
  emptyMessage = 'No data available',
  caption,
  stickyHeader = false,
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
  ariaLabel = 'Data table',
  ariaDescription,
  enableKeyboardNavigation = true,
  rowHeight
}: AccessibleTableProps<T>) {
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const [announceMessage, setAnnounceMessage] = useState('');
  const tableRef = useRef<HTMLTableElement>(null);
  const cellRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!enableKeyboardNavigation || !focusedCell) return;

    const { row, col } = focusedCell;
    let newRow = row;
    let newCol = col;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newRow = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newRow = Math.min(data.length - 1, row + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newCol = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newCol = Math.min(columns.length - 1, col + 1);
        break;
      case 'Home':
        e.preventDefault();
        if (e.ctrlKey) {
          newRow = 0;
          newCol = 0;
        } else {
          newCol = 0;
        }
        break;
      case 'End':
        e.preventDefault();
        if (e.ctrlKey) {
          newRow = data.length - 1;
          newCol = columns.length - 1;
        } else {
          newCol = columns.length - 1;
        }
        break;
      case 'PageUp':
        e.preventDefault();
        newRow = Math.max(0, row - 10);
        break;
      case 'PageDown':
        e.preventDefault();
        newRow = Math.min(data.length - 1, row + 10);
        break;
      case 'Enter':
      case ' ':
        if (row >= 0 && onRowClick) {
          e.preventDefault();
          onRowClick(data[row], row);
        }
        break;
      default:
        return;
    }

    if (newRow !== row || newCol !== col) {
      setFocusedCell({ row: newRow, col: newCol });
      const cellKey = `${newRow}-${newCol}`;
      const cell = cellRefs.current.get(cellKey);
      if (cell) {
        cell.focus();
        // Announce cell content for screen readers
        const column = columns[newCol];
        const rowData = data[newRow];
        const value = column.render ? column.render(rowData, newRow) : rowData[column.key];
        setAnnounceMessage(`Row ${newRow + 1}, ${column.label}: ${value}`);
      }
    }
  }, [focusedCell, data, columns, onRowClick, enableKeyboardNavigation]);

  // Handle cell focus
  const handleCellFocus = useCallback((row: number, col: number) => {
    setFocusedCell({ row, col });
  }, []);

  // Handle row selection
  const handleRowSelection = useCallback((rowKey: string | number, checked: boolean) => {
    if (!onSelectionChange) return;
    
    const newSelection = new Set(selectedRows);
    if (checked) {
      newSelection.add(rowKey);
    } else {
      newSelection.delete(rowKey);
    }
    onSelectionChange(newSelection);
    
    setAnnounceMessage(`Row ${checked ? 'selected' : 'deselected'}`);
  }, [selectedRows, onSelectionChange]);

  // Handle select all
  const handleSelectAll = useCallback((checked: boolean) => {
    if (!onSelectionChange) return;
    
    if (checked) {
      const allKeys = data.map((row, index) => keyExtractor(row, index));
      onSelectionChange(new Set(allKeys));
      setAnnounceMessage('All rows selected');
    } else {
      onSelectionChange(new Set());
      setAnnounceMessage('All rows deselected');
    }
  }, [data, keyExtractor, onSelectionChange]);

  // Sort handler
  const handleSort = useCallback((column: TableColumn<T>) => {
    if (!column.sortable || !onSort) return;
    
    const newDirection = 
      sortConfig?.key === column.key && sortConfig.direction === 'asc' 
        ? 'desc' 
        : 'asc';
    
    onSort(column.key, newDirection);
    setAnnounceMessage(`Sorted by ${column.label} ${newDirection === 'asc' ? 'ascending' : 'descending'}`);
  }, [sortConfig, onSort]);

  // Register cell refs
  const registerCellRef = useCallback((key: string, element: HTMLElement | null) => {
    if (element) {
      cellRefs.current.set(key, element);
    } else {
      cellRefs.current.delete(key);
    }
  }, []);

  // Clean up refs when data changes
  useEffect(() => {
    return () => {
      cellRefs.current.clear();
    };
  }, [data]);

  const isAllSelected = data.length > 0 && data.every((row, index) => 
    selectedRows.has(keyExtractor(row, index))
  );
  const isPartiallySelected = !isAllSelected && data.some((row, index) => 
    selectedRows.has(keyExtractor(row, index))
  );

  return (
    <div className="accessible-table-container">
      {/* Screen reader announcements */}
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {announceMessage}
      </div>

      <table
        ref={tableRef}
        className={`accessible-table ${stickyHeader ? 'sticky-header' : ''}`}
        role="table"
        aria-label={ariaLabel}
        aria-description={ariaDescription}
        aria-rowcount={data.length + 1}
        onKeyDown={handleKeyDown}
      >
        {caption && (
          <caption className="table-caption">{caption}</caption>
        )}
        
        <thead role="rowgroup">
          <tr role="row" aria-rowindex={1}>
            {selectable && (
              <th 
                role="columnheader" 
                scope="col"
                className="select-column"
                aria-label="Select all rows"
              >
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  indeterminate={isPartiallySelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  aria-label="Select all rows"
                />
              </th>
            )}
            {columns.map((column, colIndex) => (
              <th
                key={column.key as string}
                role="columnheader"
                scope="col"
                className={`
                  ${column.sortable ? 'sortable' : ''}
                  ${column.align ? `text-${column.align}` : ''}
                  ${sortConfig?.key === column.key ? 'sorted' : ''}
                `}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column)}
                onKeyDown={(e) => {
                  if (column.sortable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleSort(column);
                  }
                }}
                tabIndex={column.sortable ? 0 : -1}
                aria-sort={
                  sortConfig?.key === column.key
                    ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                    : 'none'
                }
              >
                <div className="th-content">
                  {column.headerRender ? column.headerRender() : column.label}
                  {column.sortable && (
                    <span className="sort-indicator" aria-hidden="true">
                      {sortConfig?.key === column.key ? (
                        sortConfig.direction === 'asc' ? '↑' : '↓'
                      ) : '↕'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody role="rowgroup">
          {loading ? (
            <tr role="row" aria-rowindex={2}>
              <td 
                role="cell" 
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="loading-cell"
              >
                <div className="loading-content">
                  <span className="spinner" aria-hidden="true"></span>
                  <span>Loading...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr role="row" aria-rowindex={2}>
              <td 
                role="cell" 
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="empty-cell"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => {
              const rowKey = keyExtractor(row, rowIndex);
              const isSelected = selectedRows.has(rowKey);
              
              return (
                <tr
                  key={rowKey}
                  role="row"
                  aria-rowindex={rowIndex + 2}
                  className={`
                    ${onRowClick ? 'clickable' : ''}
                    ${isSelected ? 'selected' : ''}
                  `}
                  onClick={() => onRowClick?.(row, rowIndex)}
                  style={{ height: rowHeight }}
                  aria-selected={selectable ? isSelected : undefined}
                >
                  {selectable && (
                    <td role="cell" className="select-column">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleRowSelection(rowKey, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select row ${rowIndex + 1}`}
                      />
                    </td>
                  )}
                  {columns.map((column, colIndex) => {
                    const cellKey = `${rowIndex}-${colIndex}`;
                    const cellValue = column.render 
                      ? column.render(row, rowIndex)
                      : row[column.key];
                    
                    return (
                      <td
                        key={column.key as string}
                        role="cell"
                        className={column.align ? `text-${column.align}` : ''}
                        ref={(el) => registerCellRef(cellKey, el)}
                        tabIndex={enableKeyboardNavigation ? -1 : undefined}
                        onFocus={() => handleCellFocus(rowIndex, colIndex)}
                        aria-label={column.ariaLabel?.(row)}
                      >
                        {cellValue}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AccessibleTable;