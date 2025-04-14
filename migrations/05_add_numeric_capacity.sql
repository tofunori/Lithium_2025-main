-- Migration to add a numeric capacity column and populate it

-- 1. Add the new numeric column
ALTER TABLE public.facilities
ADD COLUMN capacity_tonnes_per_year NUMERIC;

-- 2. Populate the new column by converting the old text column
-- This attempts to cast the text to numeric, setting to NULL if conversion fails
UPDATE public.facilities
SET capacity_tonnes_per_year =
    CASE
        -- Check if the text value can be safely cast to numeric
        WHEN "Annual Processing Capacity (tonnes/year)" ~ '^[0-9]+(\.[0-9]+)?$' THEN
            CAST("Annual Processing Capacity (tonnes/year)" AS NUMERIC)
        -- Set to NULL for any non-numeric values (like 'N/A', empty strings, etc.)
        ELSE
            NULL
    END;

-- Optional: Add comments or indexes if needed
COMMENT ON COLUMN public.facilities.capacity_tonnes_per_year IS 'Numeric representation of the annual processing capacity in tonnes per year.';
