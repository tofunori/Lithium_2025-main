// frontend/src/utils/technologyUtils.ts
/**
 * Utility functions for technology categorization and standardization
 */

/**
 * Standard technology categories - ONLY 4 MAIN CATEGORIES
 */
export const TECHNOLOGY_CATEGORIES = {
  HYDROMETALLURGICAL: 'Hydrometallurgy',
  PYROMETALLURGICAL: 'Pyrometallurgy',
  MECHANICAL: 'Mechanical',
  HYBRID: 'Hybrid'
};

/**
 * Maps a technology name to a standardized category
 * @param technologyName - The raw technology name from the database
 * @returns Standardized technology category (one of the 4 main categories)
 */
export const getTechnologyCategory = (technologyName: string | null | undefined): string => {
  if (!technologyName) return TECHNOLOGY_CATEGORIES.MECHANICAL; // Default to Mechanical

  const name = technologyName.toLowerCase();

  // Hydrometallurgical processes
  if (name.includes('hydrometallurgical') || 
      name.includes('chemical leaching') || 
      name.includes('hydro-to-cathode') ||
      name.includes('leaching') ||
      name.includes('chemical') ||
      name.includes('aqueous') ||
      name.includes('solvent') ||
      name.includes('extraction')) {
    return TECHNOLOGY_CATEGORIES.HYDROMETALLURGICAL;
  }

  // Pyrometallurgical processes
  if (name.includes('pyrometallurgical') || 
      name.includes('smelting') || 
      name.includes('furnace') ||
      name.includes('high-temperature') ||
      name.includes('thermal') ||
      name.includes('pyrolysis') ||
      name.includes('incineration') ||
      name.includes('calcination')) {
    return TECHNOLOGY_CATEGORIES.PYROMETALLURGICAL;
  }

  // Hybrid processes (check before mechanical since it might contain mechanical keywords)
  if (name.includes('spoke') || 
      name.includes('hub') ||
      name.includes('integrated') ||
      name.includes('combined') ||
      (name.includes('mechanical') && name.includes('hydro')) ||
      (name.includes('physical') && name.includes('chemical'))) {
    return TECHNOLOGY_CATEGORIES.HYBRID;
  }

  // Mechanical processes (includes proprietary mechanical and everything else)
  // This is now the catch-all category
  return TECHNOLOGY_CATEGORIES.MECHANICAL;
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
  if (!category) {
    return '#2196F3'; // Default to Mechanical blue for empty/null
  }

  // Normalize the category name for flexible matching
  const normalized = category.toLowerCase().trim();

  // Handle Hydrometallurgical variants
  if (normalized === 'hydrometallurgical' || normalized === 'hydrometallurgy') {
    return '#4CAF50'; // Green
  }
  
  // Handle Pyrometallurgical variants  
  if (normalized === 'pyrometallurgical' || normalized === 'pyrometallurgy') {
    return '#FF5722'; // Orange
  }
  
  // Handle Hybrid
  if (normalized === 'hybrid') {
    return '#9C27B0'; // Purple
  }
  
  // Handle Mechanical (default for everything else)
  return '#2196F3'; // Blue
};