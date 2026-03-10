import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function setup() {
    const dbConfig = {
        host: process.env.MYSQLHOST || "localhost",
        user: process.env.MYSQLUSER || "root",
        password: process.env.MYSQLPASSWORD || "131313",
        port: process.env.MYSQLPORT || 3306,
        multipleStatements: true,
    };

    const dbName = process.env.MYSQL_DATABASE || "codesync";

    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log("Connected to MySQL server.");

        // Create database if it doesn't exist
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        console.log(`Database '${dbName}' ensured.`);

        // Switch to the database
        await connection.query(`USE ${dbName}`);
        console.log(`Using database '${dbName}'.`);

        // Extract SQL from DATABASE_SCHEMA.md
        const schemaPath = path.join(__dirname, "..", "DATABASE_SCHEMA.md");
        const schemaContent = fs.readFileSync(schemaPath, "utf8");

        // Regular expression to match SQL code blocks
        const sqlRegex = /```sql([\s\S]*?)```/g;
        let match;
        let allSql = "";

        while ((match = sqlRegex.exec(schemaContent)) !== null) {
            allSql += match[1].trim() + "\n";
        }

        if (!allSql) {
            console.error("No SQL blocks found in DATABASE_SCHEMA.md");
            process.exit(1);
        }

        // Split by semicolon and filter out empty statements
        const statements = allSql
            .split(";")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

        console.log(`Found ${statements.length} SQL statements to execute.`);

        for (let statement of statements) {
            try {
                // Handle "CREATE TABLE" specifically to avoid errors if they already exist
                // although DATABASE_SCHEMA.md doesn't use "IF NOT EXISTS" in all blocks
                if (statement.toUpperCase().startsWith("CREATE TABLE")) {
                    const tableNameMatch = statement.match(/CREATE TABLE\s+(\w+)/i);
                    if (tableNameMatch) {
                        const tableName = tableNameMatch[1];
                        statement = statement.replace(/CREATE TABLE\s+/i, "CREATE TABLE IF NOT EXISTS ");
                    }
                }

                await connection.query(statement);
                console.log("Executed statement successfully.");
            } catch (err) {
                console.warn("Error executing statement:", err.message);
            }
        }

        console.log("✅ Local database setup completed successfully!");

        const [rows] = await connection.query("SHOW TABLES");
        console.log("Current tables in database:", rows.map(r => Object.values(r)[0]));

        await connection.end();
    } catch (error) {
        console.error("❌ Setup failed:", error.message);
        process.exit(1);
    }
}

setup();
