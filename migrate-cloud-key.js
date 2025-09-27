import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

async function checkAndAddCloudKeyColumn() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  console.log("🔄 Connecting to database...");

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  try {
    // Check if cloud_key column already exists
    console.log("🔍 Checking if cloud_key column exists...");

    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'files' 
      AND column_name = 'cloud_key'
    `;

    if (columnCheck.length > 0) {
      console.log("✅ cloud_key column already exists!");
      return;
    }

    console.log("➕ Adding cloud_key column...");

    // Add the cloud_key column
    await sql`
      ALTER TABLE files 
      ADD COLUMN cloud_key TEXT;
    `;

    console.log("✅ Successfully added cloud_key column");

    // Add index for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_files_cloud_key 
      ON files(cloud_key);
    `;

    console.log("✅ Successfully created index on cloud_key");

    console.log("🎉 Migration completed successfully!");
    console.log("");
    console.log("✨ Backblaze B2 integration is now ready!");
    console.log("🔹 New file uploads will use cloud storage");
    console.log("🔹 Existing files will continue to work as before");
    console.log("🔹 Download links will use signed URLs for security");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkAndAddCloudKeyColumn()
    .then(() => {
      console.log("\n🚀 Migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Migration failed:", error);
      process.exit(1);
    });
}

export default checkAndAddCloudKeyColumn;
