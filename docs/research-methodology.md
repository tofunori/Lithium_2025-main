# Step-by-Step Methodology: Research EV Lithium Recycling Facilities Using Gemini + Google Verification

## Overview
This is a **tested, streamlined methodology** for systematically identifying and cataloging EV lithium recycling facilities across North America using Gemini Deep Research for discovery and Google for source verification. This simplified approach can identify 25+ facilities efficiently.

## Prerequisites and Setup

### Required Tools and Access
1. **Primary Research Tool**:
   - Gemini with Deep Research capability 

2. **Verification Tool**:
   - Google Search access
   - Ability to access company websites, press releases, and official sources

3. **Database Setup** (Recommended):
   - Supabase account and project, OR
   - Excel/Google Sheets for simpler setup

4. **Basic Requirements**:
   - 2-3 hours daily research time commitment
   - Note-taking system for source verification

### Database Setup Instructions
**Option A: Supabase (Recommended)**

Create new Supabase project named "facilities" with this structure:

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

**Option B: Spreadsheet Setup**

Create spreadsheet with these columns:
- Company
- Facility Name/Site  
- Location
- Operational Status
- Technology Type
- Capacity (tonnes/year)
- Gemini Sources
- Google Verification
- Verification Status
- Research Date
- Notes

## Step-by-Step Research Process

### Phase 1: Gemini Deep Research Discovery (Week 1-2)

#### Day 1: Initial Industry Mapping
**Objective**: Get broad overview and identify major players

**Gemini Query Sequence**:
1. Start with broad discovery:
   ```
   "Research and find all lithium battery recycling facilities in North America (USA, Canada, Mexico) that process EV batteries. For each facility provide: company name, facility name, exact location, operational status (operating/construction/planned), technology type, and annual processing capacity."
   ```

2. Follow up for comprehensive list:
   ```
   "Create a comprehensive list of companies operating lithium-ion battery recycling facilities in the United States, Canada, and Mexico. Include both large commercial facilities and pilot plants."
   ```

**Record Immediately**:
- Create initial database entries for each facility mentioned
- Note all sources that Gemini references  
- Mark as "Gemini Discovery - Day 1"

#### Day 2: Technology-Focused Discovery
**Objective**: Find facilities by processing technology type

**Gemini Queries**:
1. Hydrometallurgy focus:
   ```
   "Find all hydrometallurgical lithium battery recycling plants in North America. Include company names, locations, and processing capacities."
   ```

2. Mechanical processing focus:
   ```
   "List mechanical lithium battery shredding and processing facilities in USA, Canada, and Mexico. Include black mass production facilities."
   ```

3. Pyrometallurgy focus:
   ```
   "Identify pyrometallurgical facilities that process lithium batteries in North America, including smelters and high-temperature processing plants."
   ```

**Record and Compare**:
- Add any new facilities not found on Day 1
- Note technology classifications
- Cross-reference with Day 1 findings

#### Day 3-5: Geographic Deep Dives
**Objective**: Systematic coverage by region

**Day 3 - USA Focus**:
```
"Research lithium battery recycling facilities in each US state. Focus on industrial states like Arizona, Nevada, Texas, Ohio, South Carolina, Georgia. Provide detailed information for each facility found."
```

**Day 4 - Canada Focus**:
```
"Find all lithium battery recycling facilities in Canada, organized by province. Include Ontario, Quebec, and British Columbia. Provide facility details and current operational status."
```

**Day 5 - Mexico Focus**:
```
"Research lithium battery recycling facilities and operations in Mexico. Include both operational and planned facilities. Provide locations and technology types."
```

#### Day 6-7: Company-Specific Deep Dives
**Objective**: Comprehensive facility portfolios for major companies

For each major company identified (Li-Cycle, Redwood Materials, Ascend Elements, etc.):
```
"Research all [Company Name] lithium battery recycling facilities across North America. Provide complete details for each location including addresses, capacities, operational status, and technology used."
```

#### Day 8-9: Investment and Partnership Discovery
**Objective**: Find facilities through business relationships

**Gemini Queries**:
1. Government funding:
   ```
   "Find lithium battery recycling facilities that have received Department of Energy grants, loans, or Inflation Reduction Act funding. Include Canadian government investments."
   ```

2. Automotive partnerships:
   ```
   "Research automotive manufacturer partnerships with lithium battery recycling facilities in North America. Include GM, Ford, Tesla, and other OEM recycling partnerships."
   ```

3. Recent developments:
   ```
   "Find recently announced, under construction, or newly operational lithium battery recycling facilities in North America from 2022-2025."
   ```

### Phase 2: Google Verification Process (Week 3)

#### Verification Workflow for Each Facility

**Step 1: Company Website Verification**
1. Google search: `"[Company Name]" lithium battery recycling`
2. Go to official company website
3. Verify:
   - Facility existence and location
   - Technology description
   - Operational status
   - Processing capacity
4. **Record verification status**: "Company Website Confirmed" or "Needs Further Verification"

**Step 2: Press Release Verification**
1. Google search: `"[Facility Name]" "[Company Name]" press release`
2. Look for official announcements about:
   - Facility opening/groundbreaking
   - Investment amounts
   - Processing capacity
   - Technology details
3. **Record sources**: Press release dates and URLs

**Step 3: Government/Regulatory Verification**
1. For USA facilities: Search for EPA or state environmental permits
2. For Canada: Search Environment and Climate Change Canada databases
3. For Mexico: Search SEMARNAT records
4. Google search: `"[Facility Name]" environmental permit OR regulatory approval`

**Step 4: News Media Verification**
1. Google search: `"[Facility Name]" news OR announcement`
2. Look for local news coverage, industry publications
3. Verify current operational status
4. Check for recent updates or changes

**Step 5: Investment/Financial Verification**
1. Google search: `"[Company Name]" funding OR investment lithium recycling`
2. Look for:
   - Government grants (DOE, Canadian government)
   - Private investment rounds
   - Partnership announcements
3. Verify investment amounts and project scope

#### Quality Control Verification

**For each facility, confirm through Google search**:
- [ ] Company official website mentions facility
- [ ] At least one press release or news article confirms existence  
- [ ] Location details can be verified (address, industrial park, etc.)
- [ ] Technology type is consistently described across sources
- [ ] Operational status is current (within last 12 months)
- [ ] Processing capacity is documented (or reasonably estimated)

**Verification Status Categories**:
- **Confirmed**: Multiple independent sources verify all key details
- **Likely**: Company website + one additional source confirm
- **Uncertain**: Only single source or conflicting information
- **Unverified**: Cannot confirm through independent Google searches

### Phase 3: Data Standardization and Enhancement (Week 4)

#### Standardization Process

**Technology Categories** (choose one for each facility):
- **Hydrometallurgy**: Chemical/water-based processing
- **Mechanical**: Physical shredding/separation (black mass production)
- **Pyrometallurgy**: High-temperature smelting/thermal processing  
- **Hybrid**: Combination of multiple technologies

**Operational Status** (standardize to one of):
- **Operating**: Currently processing batteries
- **Construction**: Under construction with confirmed timeline
- **Planned**: Announced but construction not yet started
- **On Hold**: Construction/operations temporarily suspended
- **Closed**: Previously operated but now closed

**Capacity Standardization**:
- Convert all capacities to "tonnes/year"
- Note if capacity is "planned" vs "current"
- Estimate if exact figures unavailable using industry benchmarks

#### Enhanced Data Collection

For facilities with confirmed status, use targeted Google searches:

**Investment Information**:
```
"[Company Name]" "[Facility Name]" investment amount funding
```

**Employment Information**:  
```
"[Facility Name]" jobs employment hiring
```

**Technology Details**:
```
"[Company Name]" lithium recycling technology process description
```

**Partnership Details**:
```
"[Company Name]" automotive partnership supply agreement
```

## Data Recording Standards

### Required Fields (Must Complete)
- Company name
- Facility name/identifier
- Complete address (verified via Google Maps if needed)
- Operational status
- Technology category
- Processing capacity (tonnes/year)
- Gemini discovery source
- Google verification sources (minimum 2)
- Verification status
- Research date

### Enhanced Fields (Complete When Available)
- Investment amount (USD)
- Government funding received
- Automotive partnerships
- Input feedstock types
- Output products
- Website URL
- Key personnel/contacts

## Success Metrics and Targets

### Discovery Phase Targets (Gemini Research)
- **USA**: 15-20 facilities identified
- **Canada**: 8-12 facilities identified
- **Mexico**: 2-5 facilities identified  
- **Total Unique Companies**: 15+ companies
- **Technology Diversity**: All 4 categories represented

### Verification Phase Targets (Google Verification)
- **Confirmed Status**: 80%+ of facilities
- **Multiple Source Verification**: 90%+ of facilities
- **Current Information**: 95%+ verified within 12 months
- **Complete Core Data**: 85%+ of facilities

### Data Quality Expectations
- **Location Accuracy**: 100% (must be Google Maps verifiable)
- **Technology Classification**: 95% accuracy
- **Operational Status**: 90% current accuracy
- **Capacity Information**: 70% quantified (estimated acceptable)

## Timeline and Resource Planning

### Estimated Time Investment
- **Week 1**: Gemini Discovery Phase (15-20 hours)
  - 2-3 hours daily for systematic queries
- **Week 2**: Gemini Deep Dives (10-15 hours)  
  - 1-2 hours daily for company-specific research
- **Week 3**: Google Verification (15-20 hours)
  - 3-4 hours daily for systematic verification
- **Week 4**: Data Standardization (8-10 hours)
  - 2 hours daily for cleanup and enhancement
- **Total**: ~4 weeks, 48-65 hours

### Expected Results (Based on Proven Success)
- **25-35 facilities** identified and verified
- **15-20 unique companies** documented
- **80%+ verification rate** through Google sources
- **Geographic coverage**: All three countries represented
- **Technology coverage**: All major recycling approaches included

## Maintenance and Updates

### Quarterly Update Process
1. **Re-run key Gemini queries** to find new facilities
2. **Google verification updates** for all "Construction" and "Planned" facilities
3. **Status updates** for any "Uncertain" facilities from previous research
4. **New facility integration** following same verification process

### Monitoring for New Developments
**Monthly Google Alerts** (recommended setup):
- "lithium battery recycling facility North America"
- "EV battery recycling plant opening"
- "battery recycling construction groundbreaking"
- "[Major Company Names] lithium recycling"

## Quality Assurance Checklist

Before completing research, verify:
- [ ] All facilities have verified company websites
- [ ] All facilities have minimum 2 Google-verified sources
- [ ] Technology categories are standardized across all entries
- [ ] Operational status reflects most recent information available
- [ ] Geographic distribution covers all target regions
- [ ] Major industry players are represented in findings
- [ ] Investment/partnership data collected for major facilities
- [ ] Sources and verification status clearly documented

---

**Document Type**: Streamlined Two-Platform Methodology  
**Primary Tool**: Gemini Deep Research  
**Verification Tool**: Google Search  
**Expected Results**: 25-35 verified facilities  
**Time Investment**: 4 weeks, 50-65 hours  
**Success Rate**: 80%+ verification achievable  
**Last Updated**: June 2025