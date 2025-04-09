// frontend/src/utils/statusUtils.ts

// Define the canonical status keys used internally
export type CanonicalStatus = 'operating' | 'construction' | 'planned' | 'unknown';

// Define the display labels corresponding to the canonical keys
export const STATUS_LABELS: { [key in CanonicalStatus]: string } = {
  operating: 'Operating',
  construction: 'Under construction', // Use the required display label
  planned: 'Planned',
  unknown: 'Unknown',
};

// Define the CSS classes corresponding to the canonical keys
export const STATUS_CLASSES: { [key in CanonicalStatus]: string } = {
  operating: 'status-operating',
  construction: 'status-construction',
  planned: 'status-planned',
  unknown: 'status-unknown', // Add a class for unknown
};

/**
 * Converts a raw status string (from DB, e.g., status_name) into a canonical status key.
 * Handles variations like 'Operational', 'Under Construction', 'Planned'.
 * Defaults to 'unknown' for null, undefined, empty, or unrecognized statuses.
 * @param statusName The status name string (e.g., from facility.status_name).
 * @returns The corresponding CanonicalStatus key.
 */
export const getCanonicalStatus = (statusName: string | undefined | null): CanonicalStatus => {
  const lowerCaseStatus = statusName?.trim().toLowerCase();

  switch (lowerCaseStatus) {
    case 'operational': // Match 'Operational' from CSV/DB
      return 'operating';
    case 'under construction': // Match 'Under Construction' from CSV/DB
      return 'construction';
    case 'planned': // Match 'Planned' from CSV/DB
    // Add other potential mappings if needed (e.g., 'pilot' -> 'planned')
    // case 'planning':
    // case 'pilot':
      return 'planned';
    // Add cases for 'On Hold', 'Cancelled', 'Decommissioned' if they map to specific canonical keys
    // case 'on hold': return 'unknown'; // Or a specific key if defined
    // case 'cancelled': return 'unknown';
    // case 'decommissioned': return 'unknown';
    default:
      return 'unknown'; // Default for null, undefined, empty, or others
  }
};

/**
 * Gets the display label for a given canonical status.
 * @param status The CanonicalStatus key.
 * @returns The display label string.
 */
export const getStatusLabel = (status: CanonicalStatus): string => {
  return STATUS_LABELS[status] || STATUS_LABELS.unknown;
};

/**
 * Gets the CSS class for a given canonical status.
 * @param status The CanonicalStatus key.
 * @returns The CSS class string.
 */
export const getStatusClass = (status: CanonicalStatus): string => {
  return STATUS_CLASSES[status] || STATUS_CLASSES.unknown;
};

/**
 * Converts a display label string (case-insensitive) back into a canonical status key.
 * Handles variations like 'Under Construction' vs 'Under construction'.
 * @param label The display label string.
 * @returns The corresponding CanonicalStatus key, or 'unknown' if no match.
 */
export const getCanonicalKeyFromLabel = (label: string | undefined | null): CanonicalStatus => {
  const lowerCaseLabel = label?.trim().toLowerCase();
  if (!lowerCaseLabel) {
    return 'unknown';
  }

  // Iterate through the STATUS_LABELS to find a matching value
  for (const key in STATUS_LABELS) {
    if (Object.prototype.hasOwnProperty.call(STATUS_LABELS, key)) {
      // Compare lowercased label with lowercased value from STATUS_LABELS
      if (STATUS_LABELS[key as CanonicalStatus].toLowerCase() === lowerCaseLabel) {
        return key as CanonicalStatus;
      }
    }
  }

  // Handle form-specific variations if necessary (add more cases as needed)
  // This provides flexibility if form values differ slightly from STATUS_LABELS
  switch (lowerCaseLabel) {
    case 'operational': // Map form value 'Operational'
      return 'operating';
    case 'under construction': // Map form value 'Under Construction'
      return 'construction';
    case 'planning': // Map form value 'Planning'
      return 'planned';
    // Add mappings for 'On Hold', 'Cancelled', 'Decommissioned' if they need canonical keys
    // case 'on hold': return 'onHold'; // Example if 'onHold' was a CanonicalStatus
    // case 'cancelled': return 'cancelled';
    // case 'decommissioned': return 'decommissioned';
  }

  return 'unknown'; // Default if no match found
};

// Array of canonical statuses for iteration (e.g., filters), excluding 'unknown' if needed
export const VALID_CANONICAL_STATUSES: CanonicalStatus[] = ['operating', 'construction', 'planned'];

// Array including 'unknown' if needed elsewhere
export const ALL_CANONICAL_STATUSES: CanonicalStatus[] = ['operating', 'construction', 'planned', 'unknown'];