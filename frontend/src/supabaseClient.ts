import { createClient } from '@supabase/supabase-js';

// Supabase credentials directly embedded
const supabaseUrl = 'https://coskkeqncufimswnraub.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvc2trZXFuY3VmaW1zd25yYXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMTIwODMsImV4cCI6MjA1OTc4ODA4M30.Ormp29h_Ofg64vTHwVpIusislXeWrtOXahDUZ-vatMU';

// Optional: Add a check to ensure the keys are not empty strings, though unlikely here.
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Error: Supabase URL or Anon Key is missing in supabaseClient.ts");
  // Consider throwing an error or handling this case appropriately
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
      heartbeat_interval_ms: 30000, // Send heartbeat every 30 seconds
    },
    timeout: 20000, // 20 second timeout for realtime operations
  },
  global: {
    headers: {
      'x-client-info': 'lithium-facilities-app',
    },
  },
});

console.log("Supabase client initialized.");