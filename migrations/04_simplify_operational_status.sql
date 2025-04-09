-- Migration to simplify the "Operational Status" column into four categories:
-- Operating, Construction, Planned, Unknown

-- Update statuses based on existing values
UPDATE public.facilities
SET "Operational Status" =
    CASE
        -- Keep 'Operational' as 'Operating' (assuming it should be standardized)
        WHEN "Operational Status" = 'Operational' THEN 'Operating'
        -- Map 'Under Construction' to 'Construction'
        WHEN "Operational Status" = 'Under Construction' THEN 'Construction'
        -- Keep 'Planned' as 'Planned'
        WHEN "Operational Status" = 'Planned' THEN 'Planned'
        -- Map all other non-null statuses to 'Unknown'
        WHEN "Operational Status" IS NOT NULL AND "Operational Status" NOT IN ('Operational', 'Under Construction', 'Planned') THEN 'Unknown'
        -- Map NULL statuses to 'Unknown'
        WHEN "Operational Status" IS NULL THEN 'Unknown'
        -- Default case (shouldn't be reached if logic above is complete, but good practice)
        ELSE "Operational Status"
    END
-- Only update rows where the status needs changing or is NULL
WHERE "Operational Status" IS NULL OR "Operational Status" NOT IN ('Operating', 'Construction', 'Planned');

-- Optional: Add a check constraint to enforce only these four values in the future
-- ALTER TABLE public.facilities
-- ADD CONSTRAINT check_operational_status_values
-- CHECK ("Operational Status" IN ('Operating', 'Construction', 'Planned', 'Unknown'));

-- Note: If you uncomment the check constraint, ensure all data conforms first.
-- You might need to run the UPDATE statement, verify the data, then run the ALTER TABLE statement separately.
