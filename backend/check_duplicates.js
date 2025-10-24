import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

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

console.log("🔍 Connecting to database:", dbConfig.database);

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }

  console.log("✅ Connected to database\n");

  // Check for duplicates
  const checkQuery = `
    SELECT q_id, user_id, COUNT(*) as count 
    FROM solved 
    GROUP BY q_id, user_id 
    HAVING count > 1
    ORDER BY count DESC;
  `;

  db.query(checkQuery, (err, duplicates) => {
    if (err) {
      console.error("❌ Error checking duplicates:", err.message);
      db.end();
      return;
    }

    console.log("📊 DUPLICATE RECORDS FOUND:");
    console.log("=".repeat(60));

    if (duplicates.length === 0) {
      console.log("✅ No duplicates found! Your database is clean.\n");
    } else {
      console.log(
        `⚠️  Found ${duplicates.length} duplicate user-problem combinations:\n`
      );

      duplicates.forEach((dup, index) => {
        console.log(
          `${index + 1}. Problem ID: ${dup.q_id}, User ID: ${
            dup.user_id
          }, Count: ${dup.count}`
        );
      });

      const totalDuplicates = duplicates.reduce(
        (sum, dup) => sum + (dup.count - 1),
        0
      );
      console.log(`\n💡 Total duplicate records to remove: ${totalDuplicates}`);
    }

    console.log("=".repeat(60));
    console.log("\n");

    // Check total records
    db.query("SELECT COUNT(*) as total FROM solved", (err, result) => {
      if (err) {
        console.error("❌ Error counting records:", err.message);
        db.end();
        return;
      }

      console.log("📈 SUMMARY:");
      console.log(`   Total records in 'solved' table: ${result[0].total}`);

      // Check unique combinations
      db.query(
        "SELECT COUNT(DISTINCT CONCAT(q_id, '-', user_id)) as unique_count FROM solved",
        (err, uniqueResult) => {
          if (err) {
            console.error("❌ Error counting unique records:", err.message);
            db.end();
            return;
          }

          console.log(
            `   Unique user-problem combinations: ${uniqueResult[0].unique_count}`
          );
          console.log(
            `   Duplicate records: ${
              result[0].total - uniqueResult[0].unique_count
            }\n`
          );

          if (duplicates.length > 0) {
            console.log("🔧 TO FIX THIS, RUN:");
            console.log("   node backend/fix_duplicates.js");
            console.log(
              "   OR manually run the SQL in: backend/migrations/fix_duplicate_solved_records.sql\n"
            );
          }

          db.end();
        }
      );
    });
  });
});
