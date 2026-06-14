const db = require('./adms-sync/db');

async function testInsert() {
    try {
        console.log("Attempting to insert into acquisition_channels as erp_admin...");
        // Try to insert with a random UUID to avoid conflicts
        const res = await db.query(
            `INSERT INTO acquisition_channels (company_id, channel_name, avg_lead_cost) VALUES ($1, $2, $3) RETURNING *`,
            ['00000000-0000-0000-0000-00000000ae01', 'Test Channel ' + Date.now(), 10]
        );
        console.log("Insert successful:", res.rows[0]);
    } catch (err) {
        console.error("Insert FAILED:", err.message);
    } finally {
        process.exit();
    }
}

testInsert();
