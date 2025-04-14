-- Migration to standardize facility operational status into four categories
-- Up Migration

-- First, create an enum type for the standardized status values
CREATE TYPE facility_status_type AS ENUM (
  'Operating', 
  'Under Construction', 
  'Planned', 
  'Pilot'
);

-- Add a new column for the standardized status
ALTER TABLE facilities
ADD COLUMN status_standardized facility_status_type;

-- Update the standardized status based on current status values
UPDATE facilities
SET status_standardized = 
  CASE 
    WHEN status ILIKE '%operating%' THEN 'Operating'::facility_status_type
    WHEN status ILIKE '%construction%' OR status ILIKE '%building%' THEN 'Under Construction'::facility_status_type
    WHEN status ILIKE '%pilot%' OR status ILIKE '%demonstration%' OR status ILIKE '%testing%' THEN 'Pilot'::facility_status_type
    WHEN status ILIKE '%planned%' OR status ILIKE '%proposed%' OR status ILIKE '%development%' OR status ILIKE '%announced%' THEN 'Planned'::facility_status_type
    ELSE 'Planned'::facility_status_type -- Default to Planned for any unrecognized status
  END;

-- Create a function to keep the standardized status in sync
CREATE OR REPLACE FUNCTION update_facility_status_standardized()
RETURNS TRIGGER AS $$
BEGIN
  NEW.status_standardized := 
    CASE 
      WHEN NEW.status ILIKE '%operating%' THEN 'Operating'::facility_status_type
      WHEN NEW.status ILIKE '%construction%' OR NEW.status ILIKE '%building%' THEN 'Under Construction'::facility_status_type
      WHEN NEW.status ILIKE '%pilot%' OR NEW.status ILIKE '%demonstration%' OR NEW.status ILIKE '%testing%' THEN 'Pilot'::facility_status_type
      WHEN NEW.status ILIKE '%planned%' OR NEW.status ILIKE '%proposed%' OR NEW.status ILIKE '%development%' OR NEW.status ILIKE '%announced%' THEN 'Planned'::facility_status_type
      ELSE 'Planned'::facility_status_type -- Default to Planned
    END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the standardized status
CREATE TRIGGER update_facility_status_standardized_trigger
BEFORE INSERT OR UPDATE ON facilities
FOR EACH ROW
EXECUTE FUNCTION update_facility_status_standardized();

-- Optional: If you want to completely replace the old status column with the standardized one, 
-- you can do this after verifying all data has been properly converted:

-- COMMENT THIS OUT UNTIL YOU'VE VERIFIED THE DATA CONVERSION:
-- ALTER TABLE facilities 
-- DROP COLUMN status,
-- RENAME COLUMN status_standardized TO status;

-- Down Migration (to revert if needed)
-- 
-- DROP TRIGGER IF EXISTS update_facility_status_standardized_trigger ON facilities;
-- DROP FUNCTION IF EXISTS update_facility_status_standardized();
-- ALTER TABLE facilities DROP COLUMN IF EXISTS status_standardized;
-- DROP TYPE IF EXISTS facility_status_type;