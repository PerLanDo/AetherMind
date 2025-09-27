import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Migration script to add cloud_key column to files table
 * Run this script with: npx tsx migrations/add-cloud-key.ts
 */

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log("🔄 Running migration: Add cloud_key column to files table...");

  try {
    // Add the cloud_key column
    await pool.query(`
      ALTER TABLE files 
      ADD COLUMN IF NOT EXISTS cloud_key TEXT;
    `);

    console.log("✅ Successfully added cloud_key column");

    // Add index for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_files_cloud_key 
      ON files(cloud_key);
    `);

    console.log("✅ Successfully created index on cloud_key");

    // Add comment for documentation
    await pool.query(`
      COMMENT ON COLUMN files.cloud_key IS 
      'Storage key for files stored in Backblaze B2 cloud storage';
    `);

    console.log("✅ Successfully added column comment");

    console.log("🎉 Migration completed successfully!");
    console.log("");
    console.log("Next steps:");
    console.log("1. Deploy your updated application");
    console.log("2. Test file upload/download functionality");
    console.log(
      "3. Existing files will continue to work (fallback to legacy storage)"
    );
    console.log("4. New files will use Backblaze B2 cloud storage");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log("Migration completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export default runMigration;
