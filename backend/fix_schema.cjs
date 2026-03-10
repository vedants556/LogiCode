const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function main() {
    const db = await mysql.createConnection({
        host: process.env.MYSQLHOST || 'localhost',
        user: process.env.MYSQLUSER || 'root',
        password: process.env.MYSQLPASSWORD || '131313',
        database: process.env.MYSQL_DATABASE || 'codesync'
    });

    try {
        const [rows] = await db.execute('DESCRIBE testcases');
        const fields = rows.map(r => r.Field);
        if (!fields.includes('language')) {
            await db.execute('ALTER TABLE testcases ADD COLUMN language VARCHAR(50) DEFAULT "c"');
            console.log('Added language column to testcases');
        }

        const [q_rows] = await db.execute('DESCRIBE questions');
        const q_fields = q_rows.map(r => r.Field);
        if (!q_fields.includes('selected_languages')) {
            await db.execute('ALTER TABLE questions ADD COLUMN selected_languages TEXT, ADD COLUMN language_templates TEXT, ADD COLUMN language_solutions TEXT');
            console.log('Added language columns to questions');
        }

        console.log('Database verification complete');
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await db.end();
    }
}

main();
