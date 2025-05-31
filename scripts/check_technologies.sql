-- Script to check all unique technology names and their categorizations
-- Run this to see what technology names exist and how they are categorized

SELECT 
    "Primary Recycling Technology" as technology_name,
    technology_category,
    COUNT(*) as facility_count
FROM facilities 
WHERE "Primary Recycling Technology" IS NOT NULL
GROUP BY "Primary Recycling Technology", technology_category
ORDER BY technology_category, facility_count DESC;

-- Also check for any NULL categories after migration
SELECT 
    "Primary Recycling Technology" as uncategorized_technology,
    COUNT(*) as facility_count
FROM facilities 
WHERE technology_category IS NULL 
  AND "Primary Recycling Technology" IS NOT NULL
GROUP BY "Primary Recycling Technology"
ORDER BY facility_count DESC; 