-- Migration to add full-text search capabilities to facilities

-- Create a function to generate searchable text from facility and related data
CREATE OR REPLACE FUNCTION facility_search_text(facility_id UUID)
RETURNS TEXT AS $$
DECLARE
    search_text TEXT;
BEGIN
    SELECT 
        COALESCE(f."Company", '') || ' ' ||
        COALESCE(f."Facility Name/Site", '') || ' ' ||
        COALESCE(f."Location", '') || ' ' ||
        COALESCE(f."Operational Status", '') || ' ' ||
        COALESCE(f."Primary Recycling Technology", '') || ' ' ||
        COALESCE(f.technology_category, '') || ' ' ||
        COALESCE(fd.technology_description, '') || ' ' ||
        COALESCE(fd.notes, '') || ' ' ||
        COALESCE(fd.feedstock, '') || ' ' ||
        COALESCE(fd.product, '') || ' ' ||
        COALESCE(fd.environmental_impact_details, '')
    INTO search_text
    FROM facilities f
    LEFT JOIN facility_details fd ON f."ID" = fd.facility_id
    WHERE f."ID" = facility_id;
    
    RETURN search_text;
END;
$$ LANGUAGE plpgsql;

-- Add a generated column for full-text search (PostgreSQL 12+)
-- Note: This requires PostgreSQL 12 or later. For earlier versions, use a trigger instead.
ALTER TABLE facilities 
ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (
    to_tsvector('english',
        COALESCE("Company", '') || ' ' ||
        COALESCE("Facility Name/Site", '') || ' ' ||
        COALESCE("Location", '') || ' ' ||
        COALESCE("Operational Status", '') || ' ' ||
        COALESCE("Primary Recycling Technology", '') || ' ' ||
        COALESCE(technology_category, '')
    )
) STORED;

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_facilities_search_vector ON facilities USING GIN (search_vector);

-- Create a more comprehensive search function
CREATE OR REPLACE FUNCTION search_facilities_fulltext(search_query TEXT)
RETURNS TABLE(
    "ID" UUID,
    "Company" TEXT,
    "Facility Name/Site" TEXT,
    "Location" TEXT,
    "Operational Status" TEXT,
    "Primary Recycling Technology" TEXT,
    technology_category TEXT,
    capacity_tonnes_per_year NUMERIC,
    "Latitude" NUMERIC,
    "Longitude" NUMERIC,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f."ID",
        f."Company",
        f."Facility Name/Site",
        f."Location",
        f."Operational Status",
        f."Primary Recycling Technology",
        f.technology_category,
        f.capacity_tonnes_per_year,
        f."Latitude",
        f."Longitude",
        ts_rank(f.search_vector, plainto_tsquery('english', search_query)) as rank
    FROM facilities f
    WHERE f.search_vector @@ plainto_tsquery('english', search_query)
    ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for commonly filtered columns
CREATE INDEX IF NOT EXISTS idx_facilities_operational_status ON facilities("Operational Status");
CREATE INDEX IF NOT EXISTS idx_facilities_technology_category ON facilities(technology_category);
CREATE INDEX IF NOT EXISTS idx_facilities_company ON facilities("Company");
CREATE INDEX IF NOT EXISTS idx_facilities_capacity ON facilities(capacity_tonnes_per_year);
CREATE INDEX IF NOT EXISTS idx_facilities_coordinates ON facilities("Latitude", "Longitude");

-- Create indexes on facility_details for feedstock and product filtering
CREATE INDEX IF NOT EXISTS idx_facility_details_feedstock ON facility_details USING GIN (to_tsvector('english', feedstock));
CREATE INDEX IF NOT EXISTS idx_facility_details_product ON facility_details USING GIN (to_tsvector('english', product));

-- Add comment explaining the migration
COMMENT ON FUNCTION search_facilities_fulltext(TEXT) IS 'Full-text search function for facilities using PostgreSQL text search capabilities';