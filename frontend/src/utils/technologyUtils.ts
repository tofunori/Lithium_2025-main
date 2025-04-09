// frontend/src/utils/technologyUtils.ts
/**
 * Utility functions for technology categorization and standardization
 */

/**
 * Standard technology categories
 */
export const TECHNOLOGY_CATEGORIES = {
  HYDROMETALLURGICAL: 'Hydrometallurgical',
  PYROMETALLURGICAL: 'Pyrometallurgical', 
  MECHANICAL: 'Mechanical',
  HYBRID: 'Hybrid',
  PROPRIETARY: 'Proprietary',
  OTHER: 'Other'
};

/**
 * Maps a technology name to a standardized category
 * @param technologyName - The raw technology name from the database
 * @returns Standardized technology category
 */
export const getTechnologyCategory = (technologyName: string | null | undefined): string => {
  if (!technologyName) return TECHNOLOGY_CATEGORIES.OTHER;

  const name = technologyName.toLowerCase();

  // Hydrometallurgical processes
  if (name.includes('hydrometallurgical') || 
      name.includes('chemical leaching') || 
      name.includes('hydro-to-cathode')) {
    return TECHNOLOGY_CATEGORIES.HYDROMETALLURGICAL;
  }

  // Pyrometallurgical processes
  if (name.includes('pyrometallurgical') || 
      name.includes('smelting') || 
      name.includes('furnace') ||
      name.includes('high-temperature')) {
    return TECHNOLOGY_CATEGORIES.PYROMETALLURGICAL;
  }

  // Mechanical processes
  if (name.includes('mechanical processing') || 
      name.includes('shredding') || 
      name.includes('physical separation') ||
      name.includes('de-manufacturing')) {
    return TECHNOLOGY_CATEGORIES.MECHANICAL;
  }

  // Hybrid processes
  if (name.includes('spoke & hub') || 
      name.includes('spoke and hub') ||
      name.includes('integrated') ||
      (name.includes('mechanical') && name.includes('hydro'))) {
    return TECHNOLOGY_CATEGORIES.HYBRID;
  }

  // Proprietary/unique processes
  if (name.includes('proprietary') ||
      name.includes('generation 3') ||
      name.includes('multi-chemistry')) {
    return TECHNOLOGY_CATEGORIES.PROPRIETARY;
  }

  // Default category if no match
  return TECHNOLOGY_CATEGORIES.OTHER;
};

/**
 * Gets all technology categories as an array
 * @returns Array of technology category strings
 */
export const getAllTechnologyCategories = (): string[] => {
  return Object.values(TECHNOLOGY_CATEGORIES);
};

/**
 * Gets a readable display label for a technology category
 * @param category - The technology category
 * @returns User-friendly display label
 */
export const getTechnologyCategoryLabel = (category: string): string => {
  // For now, just return the category as is - we can expand this later if needed
  return category;
};

/**
 * Gets color for a technology category (for consistent chart colors)
 * @param category - The technology category
 * @returns CSS color string
 */
export const getTechnologyCategoryColor = (category: string): string => {
  switch (category) {
    case TECHNOLOGY_CATEGORIES.HYDROMETALLURGICAL:
      return '#4CAF50'; // Green
    case TECHNOLOGY_CATEGORIES.PYROMETALLURGICAL:
      return '#FF5722'; // Orange
    case TECHNOLOGY_CATEGORIES.MECHANICAL:
      return '#2196F3'; // Blue
    case TECHNOLOGY_CATEGORIES.HYBRID:
      return '#9C27B0'; // Purple
    case TECHNOLOGY_CATEGORIES.PROPRIETARY:
      return '#FFC107'; // Amber
    case TECHNOLOGY_CATEGORIES.OTHER:
    default:
      return '#607D8B'; // Gray
  }
};