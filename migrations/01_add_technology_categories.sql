-- First, check if the column already exists to avoid errors
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'facilities' 
        AND column_name = 'technology_category'
    ) THEN
        -- Add technology_category column if it doesn't exist
        ALTER TABLE facilities ADD COLUMN technology_category TEXT;
    END IF;
END $$;

-- Now update the technology_category values

-- Hydrometallurgical processes
UPDATE facilities 
SET technology_category = 'Hydrometallurgical'
WHERE "Primary Recycling Technology" ILIKE '%hydrometallurgical%' 
   OR "Primary Recycling Technology" ILIKE '%chemical leaching%'
   OR "Primary Recycling Technology" ILIKE '%hydro-%'
   OR "Primary Recycling Technology" ILIKE '%leaching%'
   OR "Primary Recycling Technology" ILIKE '%chemical%extract%'
   OR "Primary Recycling Technology" ILIKE '%aqueous%'
   OR "Primary Recycling Technology" ILIKE '%solvent%';

-- Pyrometallurgical processes
UPDATE facilities 
SET technology_category = 'Pyrometallurgical'
WHERE "Primary Recycling Technology" ILIKE '%pyrometallurgical%' 
   OR "Primary Recycling Technology" ILIKE '%smelting%' 
   OR "Primary Recycling Technology" ILIKE '%furnace%'
   OR "Primary Recycling Technology" ILIKE '%high-temperature%'
   OR "Primary Recycling Technology" ILIKE '%thermal%'
   OR "Primary Recycling Technology" ILIKE '%pyrolysis%'
   OR "Primary Recycling Technology" ILIKE '%incineration%'
   OR "Primary Recycling Technology" ILIKE '%calcination%';

-- Mechanical processes
UPDATE facilities 
SET technology_category = 'Mechanical'
WHERE "Primary Recycling Technology" ILIKE '%mechanical%' 
   OR "Primary Recycling Technology" ILIKE '%shredding%' 
   OR "Primary Recycling Technology" ILIKE '%physical separation%'
   OR "Primary Recycling Technology" ILIKE '%de-manufacturing%'
   OR "Primary Recycling Technology" ILIKE '%crushing%'
   OR "Primary Recycling Technology" ILIKE '%grinding%'
   OR "Primary Recycling Technology" ILIKE '%sorting%'
   OR "Primary Recycling Technology" ILIKE '%battery recycling%'
   OR "Primary Recycling Technology" ILIKE '%material recovery%';

-- Hybrid processes
UPDATE facilities 
SET technology_category = 'Hybrid'
WHERE "Primary Recycling Technology" ILIKE '%spoke%hub%' 
   OR "Primary Recycling Technology" ILIKE '%integrated%'
   OR ("Primary Recycling Technology" ILIKE '%mechanical%' AND "Primary Recycling Technology" ILIKE '%hydro%')
   OR ("Primary Recycling Technology" ILIKE '%physical%' AND "Primary Recycling Technology" ILIKE '%chemical%')
   OR "Primary Recycling Technology" ILIKE '%combined%';

-- Proprietary/unique processes
UPDATE facilities 
SET technology_category = 'Proprietary'
WHERE technology_category IS NULL
   AND ("Primary Recycling Technology" ILIKE '%proprietary%'
   OR "Primary Recycling Technology" ILIKE '%hydro-to-cathode%'
   OR "Primary Recycling Technology" ILIKE '%generation 3%'
   OR "Primary Recycling Technology" ILIKE '%multi-chemistry%'
   OR "Primary Recycling Technology" ILIKE '%patent%'
   OR "Primary Recycling Technology" ILIKE '%direct%'
   OR "Primary Recycling Technology" ILIKE '%strategic%'
   OR "Primary Recycling Technology" ILIKE '%green battery%'
   OR "Primary Recycling Technology" ILIKE '%novel%'
   OR "Primary Recycling Technology" ILIKE '%advanced%'
   OR "Primary Recycling Technology" ILIKE '%rotary%');

-- Catch any remaining uncategorized technologies and set to most likely category
UPDATE facilities 
SET technology_category = 'Mechanical'
WHERE technology_category IS NULL;