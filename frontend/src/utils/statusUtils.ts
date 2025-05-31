// frontend/src/utils/statusUtils.ts

// Define the canonical status keys used internally
export type CanonicalStatus = 'operating' | 'construction' | 'planned' | 'closed' | 'unknown'; // Added 'closed'

// Define the display labels corresponding to the canonical keys
export const STATUS_LABELS: { [key in CanonicalStatus]: string } = {
  operating: 'Operating',
  construction: 'Construction', // Standardized label
  planned: 'Planned',
  closed: 'Closed', // Added label for closed
  unknown: 'On hold',
};

// Define the CSS classes corresponding to the canonical keys
export const STATUS_CLASSES: { [key in CanonicalStatus]: string } = {
  operating: 'status-operating',
  construction: 'status-construction',
  planned: 'status-planned',
  closed: 'status-closed', // Added class for closed
  unknown: 'status-unknown', // Add a class for unknown
};

/**
 * Converts a raw status string (from DB, e.g., status_name) into a canonical status key.
 * Handles variations like 'Operational', 'Under Construction', 'Planned', 'Closed'.
 * Defaults to 'unknown' for null, undefined, empty, or unrecognized statuses.
 * @param statusName The status name string (e.g., from facility.status_name).
 * @returns The corresponding CanonicalStatus key.
 */
export const getCanonicalStatus = (statusName: string | undefined | null): CanonicalStatus => {
  const lowerCaseStatus = statusName?.trim().toLowerCase();

  switch (lowerCaseStatus) {
    case 'operating': // Match 'Operating' from DB
      return 'operating';
    case 'construction': // Match 'Construction' from DB
      return 'construction';
     case 'under construction': // Also map old value if needed during transition
       return 'construction';
    case 'planned': // Match 'Planned' from DB
      return 'planned';
    case 'closed': // Match 'Closed' from DB
      return 'closed';
    default:
      // Any other value, including null/undefined/empty or specific ones like 'On Hold', maps to 'unknown'
      return 'unknown';
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

   // Handle potential variations if needed (e.g., if form uses different text)
   switch (lowerCaseLabel) {
     case 'operational': return 'operating';
     case 'under construction': return 'construction'; // Handle old label if necessary
     // Add other mappings if form values might differ
   }


  return 'unknown'; // Default if no match found
};

// Array of canonical statuses for iteration (e.g., filters), including 'unknown'
// This list should now match the simplified categories in the database.
export const VALID_CANONICAL_STATUSES: CanonicalStatus[] = ['operating', 'construction', 'planned', 'closed', 'unknown']; // Added 'closed'

// Array including 'unknown' if needed elsewhere (now same as VALID_CANONICAL_STATUSES)
export const ALL_CANONICAL_STATUSES: CanonicalStatus[] = ['operating', 'construction', 'planned', 'closed', 'unknown']; // Added 'closed'
