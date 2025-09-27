// Database connection for OMNISCI AI - based on javascript_database integration
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Debug: Log the DATABASE_URL to see what we're getting
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Present" : "Missing");
console.log("DATABASE_URL length:", process.env.DATABASE_URL?.length);
console.log(
  "DATABASE_URL starts with:",
  process.env.DATABASE_URL?.substring(0, 20)
);

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
