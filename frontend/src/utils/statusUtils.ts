export type CanonicalStatus = 'operating' | 'construction' | 'planned' | 'closed' | 'unknown';

export const STATUS_LABELS: { [key in CanonicalStatus]: string } = {
  operating: 'Operating',
  construction: 'Construction',
  planned: 'Planned',
  closed: 'Closed',
  unknown: 'On hold',
};

export const STATUS_CLASSES: { [key in CanonicalStatus]: string } = {
  operating: 'status-operating',
  construction: 'status-construction',
  planned: 'status-planned',
  closed: 'status-closed',
  unknown: 'status-unknown',
};

/**
 * Converts a raw status string into a canonical status key.
 * Defaults to 'unknown' for null, undefined, empty, or unrecognized statuses.
 */
export const getCanonicalStatus = (statusName: string | undefined | null): CanonicalStatus => {
  const lowerCaseStatus = statusName?.trim().toLowerCase();

  switch (lowerCaseStatus) {
    case 'operating':
      return 'operating';
    case 'construction':
      return 'construction';
     case 'under construction':
       return 'construction';
    case 'planned':
      return 'planned';
    case 'closed':
      return 'closed';
    default:
      return 'unknown';
  }
};

/**
 * Gets the display label for a canonical status.
 */
export const getStatusLabel = (canonicalStatus: CanonicalStatus): string => {
  return STATUS_LABELS[canonicalStatus];
};

/**
 * Gets the CSS class for a canonical status.
 */
export const getStatusClass = (canonicalStatus: CanonicalStatus): string => {
  return STATUS_CLASSES[canonicalStatus];
};

export const VALID_CANONICAL_STATUSES: CanonicalStatus[] = [
  'operating',
  'construction', 
  'planned',
  'closed',
  'unknown'
];

export const ALL_CANONICAL_STATUSES: CanonicalStatus[] = VALID_CANONICAL_STATUSES;

export const getStatusColor = (canonicalStatus: CanonicalStatus): string => {
  switch (canonicalStatus) {
    case 'operating':
      return '#10b981';
    case 'construction':
      return '#f59e0b';
    case 'planned':
      return '#3b82f6';
    case 'closed':
      return '#ef4444';
    case 'unknown':
      return '#6b7280';
    default:
      return '#6b7280';
  }
};
