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

-- Reset all technology_category values to NULL for clean start
UPDATE facilities SET technology_category = NULL;

-- HYDROMETALLURGY: Wet chemical processes, acid/base leaching, solvent extraction
UPDATE facilities 
SET technology_category = 'Hydrometallurgy'
WHERE technology_category IS NULL
   AND ("Primary Recycling Technology" ILIKE '%hydrometallurg%' 
   OR "Primary Recycling Technology" ILIKE '%hydro-metallurg%'
   OR "Primary Recycling Technology" ILIKE '%chemical%leach%'
   OR "Primary Recycling Technology" ILIKE '%acid%leach%'
   OR "Primary Recycling Technology" ILIKE '%leach%'
   OR "Primary Recycling Technology" ILIKE '%solvent%extract%'
   OR "Primary Recycling Technology" ILIKE '%wet%process%'
   OR "Primary Recycling Technology" ILIKE '%aqueous%'
   OR "Primary Recycling Technology" ILIKE '%precipitation%'
   OR "Primary Recycling Technology" ILIKE '%dissolution%'
   OR "Primary Recycling Technology" ILIKE '%electrolysis%'
   OR "Primary Recycling Technology" ILIKE '%electrowinning%'
   OR "Primary Recycling Technology" ILIKE '%chemical%extract%'
   OR "Primary Recycling Technology" ILIKE '%liquid%'
   OR "Primary Recycling Technology" ILIKE '%solution%'
   OR "Primary Recycling Technology" ILIKE '%hydro-to-cathode%'
   OR "Primary Recycling Technology" ILIKE '%direct%precursor%'
   OR "Primary Recycling Technology" ILIKE '%cathode%active%material%'
   OR "Primary Recycling Technology" ILIKE '%CAM%'
   OR "Primary Recycling Technology" ILIKE '%refining%'
   OR "Primary Recycling Technology" ILIKE '%purification%');

-- PYROMETALLURGY: High temperature processes, smelting, thermal treatment
UPDATE facilities 
SET technology_category = 'Pyrometallurgy'
WHERE technology_category IS NULL
   AND ("Primary Recycling Technology" ILIKE '%pyrometallurg%'
   OR "Primary Recycling Technology" ILIKE '%pyro-metallurg%' 
   OR "Primary Recycling Technology" ILIKE '%smelting%' 
   OR "Primary Recycling Technology" ILIKE '%furnace%'
   OR "Primary Recycling Technology" ILIKE '%kiln%'
   OR "Primary Recycling Technology" ILIKE '%calcination%'
   OR "Primary Recycling Technology" ILIKE '%roasting%'
   OR "Primary Recycling Technology" ILIKE '%thermal%treat%'
   OR "Primary Recycling Technology" ILIKE '%high%temperature%'
   OR "Primary Recycling Technology" ILIKE '%pyrolysis%'
   OR "Primary Recycling Technology" ILIKE '%incineration%'
   OR "Primary Recycling Technology" ILIKE '%combustion%'
   OR "Primary Recycling Technology" ILIKE '%melting%'
   OR "Primary Recycling Technology" ILIKE '%fire%refining%'
   OR "Primary Recycling Technology" ILIKE '%plasma%'
   OR "Primary Recycling Technology" ILIKE '%arc%furnace%'
   OR "Primary Recycling Technology" ILIKE '%reduction%'
   OR "Primary Recycling Technology" ILIKE '%oxidation%'
   OR "Primary Recycling Technology" ILIKE '%heating%');

-- HYBRID: Combined mechanical and chemical processes, integrated approaches
UPDATE facilities 
SET technology_category = 'Hybrid'
WHERE technology_category IS NULL
   AND ("Primary Recycling Technology" ILIKE '%spoke%hub%' 
   OR "Primary Recycling Technology" ILIKE '%spoke%&%hub%'
   OR "Primary Recycling Technology" ILIKE '%integrated%'
   OR "Primary Recycling Technology" ILIKE '%combined%'
   OR "Primary Recycling Technology" ILIKE '%hybrid%'
   OR "Primary Recycling Technology" ILIKE '%multi-step%'
   OR "Primary Recycling Technology" ILIKE '%two-stage%'
   OR "Primary Recycling Technology" ILIKE '%multiple%process%'
   OR ("Primary Recycling Technology" ILIKE '%mechanical%' AND "Primary Recycling Technology" ILIKE '%chemical%')
   OR ("Primary Recycling Technology" ILIKE '%physical%' AND "Primary Recycling Technology" ILIKE '%chemical%')
   OR ("Primary Recycling Technology" ILIKE '%mechanical%' AND "Primary Recycling Technology" ILIKE '%hydro%')
   OR ("Primary Recycling Technology" ILIKE '%mechanical%' AND "Primary Recycling Technology" ILIKE '%thermal%')
   OR ("Primary Recycling Technology" ILIKE '%shredding%' AND "Primary Recycling Technology" ILIKE '%leaching%')
   OR ("Primary Recycling Technology" ILIKE '%sorting%' AND "Primary Recycling Technology" ILIKE '%extraction%')
   OR "Primary Recycling Technology" ILIKE '%pre-process%'
   OR "Primary Recycling Technology" ILIKE '%pre%treat%');

-- MECHANICAL: Physical processing, disassembly, sorting, shredding
UPDATE facilities 
SET technology_category = 'Mechanical'
WHERE technology_category IS NULL
   AND ("Primary Recycling Technology" ILIKE '%mechanical%'
   OR "Primary Recycling Technology" ILIKE '%physical%separation%'
   OR "Primary Recycling Technology" ILIKE '%shredding%' 
   OR "Primary Recycling Technology" ILIKE '%crushing%'
   OR "Primary Recycling Technology" ILIKE '%grinding%'
   OR "Primary Recycling Technology" ILIKE '%sorting%'
   OR "Primary Recycling Technology" ILIKE '%dismantling%'
   OR "Primary Recycling Technology" ILIKE '%disassembly%'
   OR "Primary Recycling Technology" ILIKE '%de-manufacturing%'
   OR "Primary Recycling Technology" ILIKE '%material%recovery%'
   OR "Primary Recycling Technology" ILIKE '%separation%'
   OR "Primary Recycling Technology" ILIKE '%sizing%'
   OR "Primary Recycling Technology" ILIKE '%screening%'
   OR "Primary Recycling Technology" ILIKE '%collection%'
   OR "Primary Recycling Technology" ILIKE '%preparation%'
   OR "Primary Recycling Technology" ILIKE '%processing%'
   OR "Primary Recycling Technology" ILIKE '%handling%'
   OR "Primary Recycling Technology" ILIKE '%storage%'
   OR "Primary Recycling Technology" ILIKE '%logistics%'
   OR "Primary Recycling Technology" ILIKE '%transport%');

-- Handle specific technology names that might not match patterns above
-- Categorize proprietary/novel technologies into the most appropriate category

-- Advanced/novel hydrometallurgy processes
UPDATE facilities 
SET technology_category = 'Hydrometallurgy'
WHERE technology_category IS NULL
   AND ("Primary Recycling Technology" ILIKE '%direct%recycling%'
   OR "Primary Recycling Technology" ILIKE '%generation%3%'
   OR "Primary Recycling Technology" ILIKE '%novel%'
   OR "Primary Recycling Technology" ILIKE '%advanced%'
   OR "Primary Recycling Technology" ILIKE '%proprietary%'
   OR "Primary Recycling Technology" ILIKE '%innovative%'
   OR "Primary Recycling Technology" ILIKE '%next-generation%'
   OR "Primary Recycling Technology" ILIKE '%breakthrough%'
   OR "Primary Recycling Technology" ILIKE '%cutting-edge%')
   AND ("Primary Recycling Technology" ILIKE '%chemical%'
   OR "Primary Recycling Technology" ILIKE '%extract%'
   OR "Primary Recycling Technology" ILIKE '%process%'
   OR "Primary Recycling Technology" ILIKE '%refin%'
   OR "Primary Recycling Technology" ILIKE '%purif%'
   OR "Primary Recycling Technology" ILIKE '%recover%');

-- Everything else defaults to Mechanical (most common category)
UPDATE facilities 
SET technology_category = 'Mechanical'
WHERE technology_category IS NULL;