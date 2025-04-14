-- Simple migration to standardize operational status in facilities table

-- Option 1: If you want to keep the existing status column and add a new one
-- This is safer as it preserves your original data
ALTER TABLE facilities ADD COLUMN status_category TEXT;

UPDATE facilities 
SET status_category = 
  CASE 
    WHEN status ILIKE '%operating%' THEN 'Operating'
    WHEN status ILIKE '%construction%' OR status ILIKE '%building%' THEN 'Under Construction'
    WHEN status ILIKE '%pilot%' OR status ILIKE '%demonstration%' THEN 'Pilot'
    ELSE 'Planned' -- All other statuses default to Planned
  END;

-- Option 2: If you want to directly modify the existing status column
-- CAUTION: This will overwrite your existing status values
-- Uncomment to use, but be sure to backup your data first!

/*
UPDATE facilities 
SET status = 
  CASE 
    WHEN status ILIKE '%operating%' THEN 'Operating'
    WHEN status ILIKE '%construction%' OR status ILIKE '%building%' THEN 'Under Construction'
    WHEN status ILIKE '%pilot%' OR status ILIKE '%demonstration%' THEN 'Pilot'
    ELSE 'Planned' -- All other statuses default to Planned
  END;
*/