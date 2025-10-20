const mysql = require("mysql2");

// Database connection configuration
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "logicode",
});

// Read and execute the migration
const fs = require("fs");
const path = require("path");

async function runMigration() {
  try {
    console.log("🔄 Starting database migration...");

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      "migrations",
      "add_language_to_testcases.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        console.log("📝 Executing:", statement.substring(0, 50) + "...");
        await db.promise().execute(statement);
      }
    }

    console.log("✅ Migration completed successfully!");
    console.log(
      "🔍 The testcases table now has a language field to filter test cases by language."
    );
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    if (error.code === "ER_DUP_FIELDNAME") {
      console.log(
        "ℹ️  The language field already exists. Migration may have been run before."
      );
    }
  } finally {
    db.end();
  }
}

runMigration();
