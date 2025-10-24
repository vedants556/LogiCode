/**
 * Database Cleanup Script
 *
 * Cleans up old proctoring events and inactive sessions to prevent database bloat
 * Should be run periodically (daily or weekly) via cron job or scheduled task
 */

import mysql2 from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Database configuration (same as index.js)
function resolveRailwayTemplate(value) {
  if (!value || typeof value !== "string") return value;
  if (value.includes("${{")) return null;
  return value;
}

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
  const mysqlUrl = process.env.MYSQL_PUBLIC_URL || process.env.MYSQL_URL;

  if (mysqlUrl) {
    const resolvedUrl = resolveRailwayTemplate(mysqlUrl);
    if (resolvedUrl === null) {
      console.error(
        "❌ Railway template variables detected. Cannot connect to database."
      );
      process.exit(1);
    }

    const url = new URL(resolvedUrl);
    dbConfig = {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      port: url.port || 3306,
    };
  } else {
    dbConfig = {
      host: process.env.MYSQLHOST || "localhost",
      user: process.env.MYSQLUSER || "root",
      password: process.env.MYSQLPASSWORD,
      database: process.env.MYSQL_DATABASE || "codesync",
      port: process.env.MYSQLPORT || 3306,
    };
  }
}

// Cleanup configuration
const CLEANUP_CONFIG = {
  // Keep proctoring events for 30 days
  proctoringEventsRetentionDays: 30,

  // Keep inactive sessions for 7 days
  inactiveSessionsRetentionDays: 7,

  // Keep low severity events for only 7 days
  lowSeverityRetentionDays: 7,

  // Keep code submissions for 90 days (for plagiarism checks)
  codeSubmissionsRetentionDays: 90,
};

async function cleanupProctoringEvents(connection) {
  console.log("\n🧹 Cleaning up old proctoring events...");

  try {
    // Delete low severity events older than 7 days
    const [lowSeverityResult] = await connection.query(
      `DELETE FROM proctoring_events 
       WHERE severity = 'low' 
       AND timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [CLEANUP_CONFIG.lowSeverityRetentionDays]
    );

    console.log(
      `   ✅ Deleted ${lowSeverityResult.affectedRows} low severity events (older than ${CLEANUP_CONFIG.lowSeverityRetentionDays} days)`
    );

    // Delete all events older than 30 days
    const [allEventsResult] = await connection.query(
      `DELETE FROM proctoring_events 
       WHERE timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [CLEANUP_CONFIG.proctoringEventsRetentionDays]
    );

    console.log(
      `   ✅ Deleted ${allEventsResult.affectedRows} total events (older than ${CLEANUP_CONFIG.proctoringEventsRetentionDays} days)`
    );

    return lowSeverityResult.affectedRows + allEventsResult.affectedRows;
  } catch (error) {
    console.error("   ❌ Error cleaning proctoring events:", error.message);
    return 0;
  }
}

async function cleanupInactiveSessions(connection) {
  console.log("\n🧹 Cleaning up inactive sessions...");

  try {
    const [result] = await connection.query(
      `DELETE FROM active_sessions 
       WHERE is_active = FALSE 
       AND last_activity < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [CLEANUP_CONFIG.inactiveSessionsRetentionDays]
    );

    console.log(
      `   ✅ Deleted ${result.affectedRows} inactive sessions (older than ${CLEANUP_CONFIG.inactiveSessionsRetentionDays} days)`
    );

    return result.affectedRows;
  } catch (error) {
    console.error("   ❌ Error cleaning inactive sessions:", error.message);
    return 0;
  }
}

async function cleanupOldCodeSubmissions(connection) {
  console.log("\n🧹 Cleaning up old code submissions...");

  try {
    const [result] = await connection.query(
      `DELETE FROM code_submissions 
       WHERE submitted_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [CLEANUP_CONFIG.codeSubmissionsRetentionDays]
    );

    console.log(
      `   ✅ Deleted ${result.affectedRows} code submissions (older than ${CLEANUP_CONFIG.codeSubmissionsRetentionDays} days)`
    );

    return result.affectedRows;
  } catch (error) {
    console.error("   ❌ Error cleaning code submissions:", error.message);
    return 0;
  }
}

async function optimizeTables(connection) {
  console.log("\n⚡ Optimizing database tables...");

  const tables = ["proctoring_events", "active_sessions", "code_submissions"];

  for (const table of tables) {
    try {
      await connection.query(`OPTIMIZE TABLE ${table}`);
      console.log(`   ✅ Optimized table: ${table}`);
    } catch (error) {
      console.error(`   ❌ Error optimizing ${table}:`, error.message);
    }
  }
}

async function getTableStats(connection) {
  console.log("\n📊 Database Statistics:");

  const tables = [
    { name: "proctoring_events", display: "Proctoring Events" },
    { name: "active_sessions", display: "Active Sessions" },
    { name: "code_submissions", display: "Code Submissions" },
  ];

  for (const table of tables) {
    try {
      const [rows] = await connection.query(
        `SELECT COUNT(*) as count, 
         ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
         FROM information_schema.tables 
         WHERE table_schema = ? AND table_name = ?`,
        [dbConfig.database, table.name]
      );

      const [countRows] = await connection.query(
        `SELECT COUNT(*) as count FROM ${table.name}`
      );

      console.log(
        `   ${table.display}: ${countRows[0].count.toLocaleString()} records, ${
          rows[0]?.size_mb || 0
        } MB`
      );
    } catch (error) {
      console.error(
        `   ❌ Error getting stats for ${table.name}:`,
        error.message
      );
    }
  }
}

async function main() {
  console.log("╔════════════════════════════════════════════╗");
  console.log("║   Database Cleanup Script - LogiCode      ║");
  console.log("╚════════════════════════════════════════════╝");
  console.log(`\n⏰ Started at: ${new Date().toLocaleString()}`);

  let connection;

  try {
    // Connect to database
    console.log("\n🔌 Connecting to database...");
    connection = await mysql2.createConnection(dbConfig);
    console.log("   ✅ Connected successfully");

    // Show stats before cleanup
    await getTableStats(connection);

    // Run cleanup operations
    const eventsDeleted = await cleanupProctoringEvents(connection);
    const sessionsDeleted = await cleanupInactiveSessions(connection);
    const submissionsDeleted = await cleanupOldCodeSubmissions(connection);

    // Optimize tables
    await optimizeTables(connection);

    // Show stats after cleanup
    console.log("\n" + "=".repeat(50));
    await getTableStats(connection);

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📋 Cleanup Summary:");
    console.log(
      `   • Proctoring Events Deleted: ${eventsDeleted.toLocaleString()}`
    );
    console.log(
      `   • Inactive Sessions Deleted: ${sessionsDeleted.toLocaleString()}`
    );
    console.log(
      `   • Code Submissions Deleted: ${submissionsDeleted.toLocaleString()}`
    );
    console.log(
      `   • Total Records Deleted: ${(
        eventsDeleted +
        sessionsDeleted +
        submissionsDeleted
      ).toLocaleString()}`
    );

    console.log(
      `\n✅ Cleanup completed successfully at ${new Date().toLocaleString()}`
    );
  } catch (error) {
    console.error("\n❌ Fatal error during cleanup:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("\n🔌 Database connection closed");
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as runCleanup, CLEANUP_CONFIG };
