# Simple Guide: Find EV Lithium Recycling Facilities

## What You Need
- Gemini with Deep Research
- Google Search
- Spreadsheet (Excel or Google Sheets)
- 2-3 hours per day for 2-3 weeks

## Database Setup
Create a spreadsheet with these columns:
- Company Name
- Facility Name
- Location
- Status (Operating/Construction/Planned)
- Technology Type
- Capacity
- Sources Found
- Verified (Yes/No)

## Week 1: Find Facilities with Gemini

### Day 1: General Search
Ask Gemini: *"Find all lithium battery recycling facilities in North America. Include company name, location, status, and capacity."*

### Day 2: Search by Technology
Ask Gemini: 
- *"Find hydrometallurgical lithium battery recycling plants in North America"*
- *"Find mechanical lithium battery processing facilities in North America"*

### Day 3: Search by Country
Ask Gemini:
- *"Find lithium battery recycling facilities in USA by state"*
- *"Find lithium battery recycling facilities in Canada"*
- *"Find lithium battery recycling facilities in Mexico"*

### Day 4-5: Search by Company
For major companies (Li-Cycle, Redwood Materials, etc.), ask:
*"Find all [Company Name] lithium battery recycling facilities in North America"*

**Record Everything**: Add every facility Gemini finds to your spreadsheet.

## Week 2: Verify with Google

### For Each Facility:

**Step 1**: Google search: `"[Company Name]" lithium recycling`
- Check company website
- Look for facility information

**Step 2**: Google search: `"[Facility Name]" press release`
- Find official announcements
- Verify details match

**Step 3**: Mark as Verified if you find:
- Company website mentions facility
- At least one news article or press release confirms it
- Location and details make sense

## Week 3: Clean Up Data

### Standardize Everything:
**Status**: Operating, Construction, Planned, or Uncertain  
**Technology**: Hydrometallurgy, Mechanical, Pyrometallurgy, or Hybrid  
**Capacity**: Convert everything to "tonnes/year"

### Final Check:
- Remove duplicates
- Fix any missing information
- Mark unclear items as "Needs More Research"

## Success Target
- Find 20-30 facilities total
- Verify 80% of them with Google
- Cover USA, Canada, and Mexico
- Include all technology types

## Quick Tips
- Start broad, then get specific
- Always verify with Google
- When in doubt, mark as "Uncertain"
- Save sources for everything you find
- If you can't verify something, don't include it

## Optional: Supabase Database Setup

If you want to use a database instead of a spreadsheet, create a Supabase project and run these SQL commands:

```sql
-- Main facilities table
CREATE TABLE facilities (
  ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "Company" TEXT,
  "Facility Name/Site" TEXT,
  "Location" TEXT,
  "Operational Status" TEXT,
  "Primary Recycling Technology" TEXT,
  "Annual Processing Capacity (tonnes/year)" TEXT,
  "Latitude" TEXT,
  "Longitude" TEXT,
  "Gemini Sources" TEXT,
  "Google Verification Sources" TEXT,
  "Verification Status" TEXT,
  technology_category TEXT,
  research_date DATE
);

-- Optional: Detailed information table
CREATE TABLE facility_details (
  facility_id UUID REFERENCES facilities(ID),
  technology_description TEXT,
  website TEXT,
  feedstock TEXT,
  product TEXT,
  investment_usd TEXT,
  jobs NUMERIC,
  additional_notes TEXT,
  PRIMARY KEY (facility_id)
);
```

---
**Time Needed**: 2-3 weeks, 2-3 hours daily  
**Expected Results**: 20-30 verified facilities  
**Tools**: Gemini + Google + Spreadsheet (or Supabase)
