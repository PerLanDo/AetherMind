import { readFileSync } from "fs";
import { join } from "path";
import { Database } from "better-sqlite3";

const db = new Database("aethermind.db");

const runMigration = (filename: string) => {
  try {
    const migrationPath = join(__dirname, "migrations", filename);
    const sql = readFileSync(migrationPath, "utf-8");

    // Split by semicolon and execute each statement
    const statements = sql.split(";").filter((stmt) => stmt.trim());

    statements.forEach((statement) => {
      if (statement.trim()) {
        db.exec(statement.trim());
      }
    });

    console.log(`✅ Migration ${filename} completed successfully`);
  } catch (error) {
    console.error(`❌ Migration ${filename} failed:`, error);
    process.exit(1);
  }
};

// Run migrations
console.log("Running database migrations...");
runMigration("001-add-cloud-key.sql");
console.log("All migrations completed!");

db.close();
