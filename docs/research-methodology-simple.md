# Simple Guide: Find EV Lithium Recycling Facilities

## What You Need
- Gemini with Deep Research
- Google Search
- Spreadsheet (Excel or Google Sheets)
- 2-3 hours per day for 2-3 weeks

## How to Write Better Gemini Queries
- Be specific about output format: "List in table format with columns for..."
- Ask for sources: "Include your sources for each facility"
- Request completeness: "Be comprehensive and include all known facilities"
- Specify timeframe: "Include facilities announced or operational as of 2024-2025"

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

## Phase 1: Find Facilities with Gemini

### Step 1: General Search
Ask Gemini: *"Find all lithium battery recycling facilities in North America. Include company name, location, status, and capacity."*

### Step 2: Search by Technology
Ask Gemini: 
- *"Find hydrometallurgical lithium battery recycling plants in North America"*
- *"Find mechanical lithium battery processing facilities in North America"*

### Step 3: Search by Country
Ask Gemini:
- *"Find lithium battery recycling facilities in USA by state"*
- *"Find lithium battery recycling facilities in Canada"*
- *"Find lithium battery recycling facilities in Mexico"*

### Step 4: Search by Company
For major companies (Li-Cycle, Redwood Materials, etc.), ask:
*"Find all [Company Name] lithium battery recycling facilities in North America"*

### Step 5: Cross-Validation
Ask Gemini to validate your findings:
- *"Review this list of facilities [paste your list]. Are there any major facilities I'm missing?"*
- *"Which of these facilities have been cancelled or postponed?"*
- *"What are the latest updates on these planned facilities?"*

**Record Everything**: Add every facility Gemini finds to your spreadsheet.

## Phase 2: Verify with Google

### Step 6: Company Website Verification
Google search: `"[Company Name]" lithium recycling`
- Check company website
- Look for facility information

### Step 7: Press Release Verification
Google search: `"[Facility Name]" press release`
- Find official announcements
- Verify details match

### Step 8: Mark Verification Status
Mark as Verified if you find:
- Company website mentions facility
- At least one news article or press release confirms it
- Location and details make sense

## Phase 3: Clean Up Data

### Step 9: Standardize Categories
**Status**: Operating, Construction, Planned, or Closed  
**Technology**: Hydrometallurgy, Mechanical, Pyrometallurgy, or Hybrid  
**Capacity**: Convert everything to "tonnes/year"

### Step 10: Final Quality Check
- Remove duplicates
- Fix any missing information
- Mark unclear items as "Needs More Research"
- Ask Gemini: *"For each facility in my list, rate the confidence level (High/Medium/Low) based on available information"*

## Success Target
- Find 20-30 facilities total
- Verify 80% of them with Google
- Cover USA, Canada, and Mexico
- Include all technology types

## Getting the Most from Gemini Deep Research
- Use follow-up questions to dig deeper
- Ask for specific details about unclear facilities
- Request recent news updates for verification
- Ask Gemini to fact-check contradictory information

## Common Issues to Avoid
- Facilities that were announced but never built
- Pilot plants confused with commercial facilities
- Battery manufacturing mixed with recycling
- Outdated information (facilities that closed)

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
**Structure**: 10 Sequential Steps across 3 Phases  
**Time Investment**: 2-3 hours daily  
**Expected Results**: 20-30 verified facilities  
**Tools**: Gemini Deep Research + Google + Spreadsheet (or Supabase)
