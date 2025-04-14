import csv
import json
import uuid
import io
import os

# Input CSV data as a multi-line string
csv_data = """company_name,city,region_name,country_name,status_name,status_effective_date_text,processing_capacity_mt_year,ev_equivalent_per_year,jobs,investment_usd,technology_name,technology_description,address,latitude,longitude,notes
"Li-Cycle","Rochester","New York","USA","Operational","Operational since 2020",18000,36000,35,"Spoke & Hub","Mechanical processing (shredding and physical separation) followed by hydrometallurgical processing.","Ste 350, Rochester, NY 14652",43.16103000,-77.61092400,"Spoke & Hub technology (mechanical processing)"
"Li-Cycle","Phoenix","Arizona","USA","Operational","Operational since 2022",18000,36000,,,"Spoke & Hub","Mechanical processing (shredding and physical separation) followed by hydrometallurgical processing.",,,,,"Spoke & Hub technology (mechanical processing)"
"Li-Cycle","Tuscaloosa","Alabama","USA","Operational","Operational since 2022",10000,20000,45,"Spoke & Hub","Mechanical processing (shredding and physical separation) followed by hydrometallurgical processing.",,,,,"Spoke & Hub technology (mechanical processing)"
"International Metals Reclamation Company (INMETCO)","Ellwood City","Pennsylvania","USA","Operational","Operational",6000,12000,,,"Pyrometallurgical","High-temperature smelting to recover metals.",,,,,
"Omega Harvested Metallurgical","Winchester","Ohio","USA","Operational","Operational",,,,,,,,,,,,"Technology not specified"
"Cirba Solutions","Wixom","Michigan","USA","Operational","Operational",23000,46000,,,,,,,,,"Technology not specified"
"Li Industries","Blacksburg","Virginia","USA","Operational","Operational",,,,,,,,,,,,"Technology not specified"
"Ascend Elements","Worcester","Massachusetts","USA","Operational","Operational",150,300,,,"Hydro-to-Cathode™","Direct precursor synthesis via hydrometallurgical process (Ascend Elements proprietary).",,,,,
"American Battery Technology Company","Fernley","Nevada","USA","Operational","Operational (permit granted)",20000,40000,50,5500000,"Strategic de-manufacturing","Proprietary process by American Battery Technology Company.","Fernley, Nevada",,,,
"Ascend Elements","Covington","Georgia","USA","Under Construction","Q4 2022",30000,70000,150,43000000,"Hydro-to-Cathode™","Direct precursor synthesis via hydrometallurgical process (Ascend Elements proprietary).",,,,,
"Ascend Elements","Hopkinsville","Kentucky","USA","Under Construction","Late 2023",107143,250000,400,1000000000,"Hydro-to-Cathode™","Direct precursor synthesis via hydrometallurgical process (Ascend Elements proprietary).",,,,,
"Ecobat","Casa Grande","Arizona","USA","Under Construction","Late 2023",10000,,,,,,,,,,,"Technology not specified"
"Li-Cycle","Warren","Ohio","USA","Under Construction","Early 2023",15000,30000,35,,"Spoke & Hub","Mechanical processing (shredding and physical separation) followed by hydrometallurgical processing.",,,,,"Spoke & Hub technology (mechanical processing)"
"Cirba Solutions","Eloy","Arizona","USA","Under Construction","Mid-2023",25000,50000,110,200000000,,,,,,,,,"Technology not specified"
"Ace Green Recycling","Houston area","Texas","USA","Planned","2025",20000,,,,"Green battery recycling","Proprietary process by Ace Green Recycling.",,,,,
"Redwood Materials","Near Reno","Nevada","USA","Planned","2030",,,1500,3500000000,"Hydrometallurgical","Chemical leaching of black mass to extract and separate metals.","2801 Lockheed Way, Carson City, NV 89706",,,,"Company reports capacity for 5 million EVs by 2030"
"Redwood Materials","Charleston","South Carolina","USA","Planned","2030",,,1500,3500000000,"Hydrometallurgical","Chemical leaching of black mass to extract and separate metals.",,,,,
"SungEel HiTech","Atlanta","Georgia","USA","Planned","2024",,,104,37000000,,,,,,,,,"Technology not specified"
"Cirba Solutions","Lancaster","Ohio","USA","Planned","2024/2025",100000,200000,150,200000000,,,,,,,,,"Technology not specified"
"Cirba Solutions","Columbia","South Carolina","USA","Planned","Late 2024",250000,500000,300,,,,,,,,,"Technology not specified"
"EVSX Corporation","Thorold","Ontario","Canada","Operational","Operational since July 2024",12500,,,,"Multi-chemistry processing line","Capable of handling various battery types including lithium-ion.",,,,,"Expanded March 2025. Partnership with Call2Recycle Canada."
"Li-Cycle","Kingston","Ontario","Canada","Operational","Operational",5000,,,,"Spoke & Hub","Mechanical processing (shredding and physical separation) followed by hydrometallurgical processing.",,,,,"Spoke & Hub technology. Li-Cycle has new Centre of Excellence here."
"Lithion Technologies","Saint-Bruno-de-Montarville","Quebec","Canada","Operational","Operational",10000,45000,60,,"Hydrometallurgical","Chemical leaching of black mass to extract and separate metals.","966 Parent Street, Saint-Bruno-de-Montarville, Quebec, J3V 6L7",45.53333300,-73.34999800,"First commercial plant. Expandable to 20,000 tonnes/year. Up to 95% recovery. Transforms batteries into black mass, metal pellets, plastic flakes."
"Lithion Technologies","Anjou","Quebec","Canada","Operational","Operational (demo since 2020)",200,,,,"Hydrometallurgical","Chemical leaching of black mass to extract and separate metals.",,,,,"Demonstration plant."
"Johnson Controls/Clarios","Cienega de Flores","Nuevo Leon","Mexico","Operational","Operational, upgrades in progress",,,,70000000,"Rotary furnaces with environmental control","Primarily for lead-acid, involves smelting (Johnson Controls/Clarios).",,,,,"Primarily lead-acid. Capacity being upgraded from 30 to 40 tonnes/hour of spent lead-acid batteries. $70M+ investment announced 2011."
"Ganfeng Lithium","Sonora","Sonora","Mexico","Planned","Announced 2020",,,,,"Lithium-ion battery recycling","General category for Ganfeng Lithium planned facility.",,,,,"Will recycle batteries from Tesla cars and Chinese electric buses. Located near Ganfeng lithium mining operations."
"""

# Define the output path
output_dir = "data"
output_filename = "facilities_transformed.csv"
output_path = os.path.join(output_dir, output_filename)

# Ensure the output directory exists
os.makedirs(output_dir, exist_ok=True)

# Use io.StringIO to treat the string data as a file
csvfile = io.StringIO(csv_data)
reader = csv.DictReader(csvfile)

transformed_data = []

for row in reader:
    properties = {}
    geometry = None

    # Map CSV fields to properties, handling empty values
    if row.get('company_name'): properties['company'] = row['company_name']
    if row.get('city'): properties['city'] = row['city']
    if row.get('region_name'): properties['region'] = row['region_name']
    if row.get('country_name'): properties['country'] = row['country_name']
    if row.get('status_name'): properties['status'] = row['status_name']
    if row.get('status_effective_date_text'): properties['status_effective_date'] = row['status_effective_date_text']
    if row.get('technology_name'): properties['technology'] = row['technology_name']
    if row.get('technology_description'): properties['technology_description'] = row['technology_description']
    if row.get('address'): properties['address'] = row['address']
    if row.get('notes'): properties['notes'] = row['notes']

    # Handle numeric fields with error checking
    try:
        if row.get('processing_capacity_mt_year'):
            properties['capacity_mt_year'] = int(row['processing_capacity_mt_year'])
    except (ValueError, TypeError):
        properties['capacity_mt_year'] = None # Or omit if preferred

    try:
        if row.get('ev_equivalent_per_year'):
            properties['ev_equivalent_per_year'] = int(row['ev_equivalent_per_year'])
    except (ValueError, TypeError):
        properties['ev_equivalent_per_year'] = None

    try:
        if row.get('jobs'):
            properties['jobs'] = int(row['jobs'])
    except (ValueError, TypeError):
        properties['jobs'] = None

    try:
        if row.get('investment_usd'):
            properties['investment_usd'] = int(row['investment_usd'])
    except (ValueError, TypeError):
        properties['investment_usd'] = None

    # Handle geometry
    latitude_str = row.get('latitude')
    longitude_str = row.get('longitude')
    try:
        if latitude_str and longitude_str:
            latitude = float(latitude_str)
            longitude = float(longitude_str)
            geometry = {
                "type": "Point",
                "coordinates": [longitude, latitude]
            }
    except (ValueError, TypeError):
        geometry = None # Invalid lat/lon format

    # Generate UUID
    facility_id = str(uuid.uuid4())

    # Append transformed record
    transformed_data.append({
        "id": facility_id,
        "properties": json.dumps(properties),
        "geometry": json.dumps(geometry) if geometry is not None else None # Store as JSON string or None
    })

# Write the transformed data to the output CSV
try:
    with open(output_path, 'w', newline='', encoding='utf-8') as outfile:
        # Ensure 'geometry' is included even if some rows have None
        fieldnames = ['id', 'properties', 'geometry']
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)

        writer.writeheader()
        writer.writerows(transformed_data)

    print(f"Successfully transformed data and saved to {output_path}")

except IOError as e:
    print(f"Error writing to file {output_path}: {e}")
except Exception as e:
    print(f"An unexpected error occurred: {e}")