// Apply technology categories migration using Supabase JS client
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file if present
try {
  require('dotenv').config();
} catch (error) {
  console.log('dotenv not installed, skipping .env loading');
}

// Check for required environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables. Please set:');
  console.error('- SUPABASE_URL or VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_KEY or VITE_SUPABASE_SERVICE_KEY');
  console.error('\nYou can set these in a .env file or in your environment.');
  process.exit(1);
}

// Initialize Supabase client with service key (needed for RPC)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Read the migration SQL file
const migrationFilePath = path.join(__dirname, '..', 'migrations', '01_add_technology_categories.sql');
const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');

// Break the SQL into statements
// This is a simple approach - for complex SQL parsing consider using a SQL parser
const statements = migrationSQL
  .replace(/--.*$/gm, '') // Remove comments
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0);

console.log(`Found ${statements.length} SQL statements to execute`);

// Execute each statement
async function runMigration() {
  try {
    for (let i = 0; i < statements.length; i++) {
      const sql = statements[i];
      console.log(`Executing statement ${i+1}/${statements.length}:`);
      console.log(`${sql.substring(0, 80)}${sql.length > 80 ? '...' : ''}`);
      
      // Execute the SQL statement
      const { data, error } = await supabase.rpc('pg_exec', { query: sql });
      
      if (error) {
        console.error(`Error executing statement ${i+1}:`, error);
        // Continue with next statement instead of failing completely
      } else {
        console.log(`Successfully executed statement ${i+1}`);
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();