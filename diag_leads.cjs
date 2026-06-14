const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: 'postgres://postgres:Sudar2023@195.35.22.13:5432/shastika_erp'
});

async function test() {
    try {
        console.log("Testing leads query...");
        const res = await pool.query("SELECT * FROM leads LIMIT 1");
        console.log("Columns found:", Object.keys(res.rows[0]));

        console.log("Testing is_deleted filter...");
        const res2 = await pool.query("SELECT COUNT(*) FROM leads WHERE is_deleted IS NOT TRUE");
        console.log("Count:", res2.rows[0].count);

        console.log("SUCCESS");
    } catch (err) {
        console.error("DIAGNOSTIC ERROR:", err.message);
    } finally {
        await pool.end();
    }
}

test();
