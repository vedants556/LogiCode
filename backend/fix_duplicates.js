import mysql from "mysql2";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection configuration - same as index.js
let dbConfig;

if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  dbConfig = {
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    port: url.port || 3306,
  };
} else {
  dbConfig = {
    host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
    user: process.env.MYSQLUSER || process.env.DB_USER || "root",
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || "logicode",
    port: process.env.MYSQLPORT || 3306,
  };
}

const db = mysql.createConnection(dbConfig);

console.log("🔧 FIXING DUPLICATE SOLVED RECORDS");
console.log("=".repeat(60));
console.log("🔍 Connecting to database:", dbConfig.database);

db.connect(async (err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }

  console.log("✅ Connected to database\n");

  try {
    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      "migrations",
      "fix_duplicate_solved_records.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    console.log("📝 Reading migration file...");
    console.log("📄 File:", migrationPath);
    console.log("\n⚠️  WARNING: This will modify your database!");
    console.log("   - Duplicate records will be removed");
    console.log("   - A unique constraint will be added\n");

    // Count current duplicates
    const countQuery = `
      SELECT COUNT(*) as total,
             (SELECT COUNT(DISTINCT CONCAT(q_id, '-', user_id)) FROM solved) as unique_count
      FROM solved;
    `;

    db.query(countQuery, async (err, countResult) => {
      if (err) {
        console.error("❌ Error counting records:", err.message);
        db.end();
        return;
      }

      const before = countResult[0];
      console.log(
        `📊 Before: ${before.total} total records, ${before.unique_count} unique combinations`
      );
      console.log(
        `   Duplicates to remove: ${before.total - before.unique_count}\n`
      );

      // Split migration into statements
      const statements = migrationSQL
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

      console.log("🚀 Executing migration...\n");

      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          try {
            console.log(
              `   Step ${i + 1}/${statements.length}: ${statement.substring(
                0,
                60
              )}...`
            );
            await db.promise().execute(statement);
            console.log(`   ✅ Success\n`);
          } catch (error) {
            if (error.code === "ER_DUP_KEYNAME") {
              console.log(
                `   ℹ️  Unique constraint already exists (skipping)\n`
              );
            } else {
              console.error(`   ❌ Error: ${error.message}\n`);
              throw error;
            }
          }
        }
      }

      // Count after migration
      db.query(countQuery, (err, afterResult) => {
        if (err) {
          console.error(
            "❌ Error counting records after migration:",
            err.message
          );
          db.end();
          return;
        }

        const after = afterResult[0];
        console.log("=".repeat(60));
        console.log("✅ MIGRATION COMPLETED SUCCESSFULLY!\n");
        console.log("📊 Results:");
        console.log(`   Before: ${before.total} records`);
        console.log(`   After:  ${after.total} records`);
        console.log(
          `   Removed: ${before.total - after.total} duplicate records\n`
        );
        console.log("🎉 Your database is now clean!");
        console.log(
          "🔒 Unique constraint added to prevent future duplicates\n"
        );

        db.end();
      });
    });
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    db.end();
    process.exit(1);
  }
});
