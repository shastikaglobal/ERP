import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

const config = {
  user: process.env.MSSQL_USER || 'sa',
  password: process.env.MSSQL_PASSWORD || 'essl@123',
  server: process.env.MSSQL_SERVER || 'localhost',
  database: process.env.MSSQL_DATABASE || 'etimetracklite1',
  options: {
    encrypt: false, // For local dev
    trustServerCertificate: true,
    instanceName: process.env.MSSQL_INSTANCE || 'SQLEXPRESS'
  }
};

async function checkDb() {
  try {
    console.log("Connecting to MS SQL...");
    let pool = await sql.connect(config);
    console.log("Connected! Querying top 5 attendance logs for June...");
    
    // In eTimeTrackLite, the table is usually DeviceLogs or AttendanceLogs
    // Let's check table names first
    let result = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' AND (TABLE_NAME LIKE '%Log%' OR TABLE_NAME LIKE '%Punch%')
    `);
    
    console.log("Tables found:", result.recordset.map(r => r.TABLE_NAME));
    
    // Now try to query DeviceLogs if it exists
    const hasDeviceLogs = result.recordset.some(r => r.TABLE_NAME === 'DeviceLogs');
    const hasAttendanceLogs = result.recordset.some(r => r.TABLE_NAME === 'AttendanceLogs');
    
    let table = hasDeviceLogs ? 'DeviceLogs' : (hasAttendanceLogs ? 'AttendanceLogs' : null);
    
    if (table) {
      console.log(`Querying ${table}...`);
      let logs = await pool.request().query(`
        SELECT TOP 10 * FROM ${table}
        ORDER BY LogDate DESC
      `);
      console.log("Recent logs:", logs.recordset);
    }
    
    pool.close();
  } catch (err) {
    console.error("SQL Error:", err);
  }
}

checkDb();
