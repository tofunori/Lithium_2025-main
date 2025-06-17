import { Client } from 'pg';

// Neon database configuration using Vercel environment variables
const createNeonClient = () => {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error("Error: DATABASE_URL is missing from environment variables");
    throw new Error("Database connection string not found");
  }

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  return client;
};

export { createNeonClient };

console.log("Neon client configuration loaded.");