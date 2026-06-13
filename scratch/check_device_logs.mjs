import mssql from 'mssql';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const mssqlConfig = {
  server: process.env.MSSQL_SERVER || 'localhost',
  user: process.env.MSSQL_USER || 'sa',
  password: process.env.MSSQL_PASSWORD || 'essl@123',
  database: process.env.MSSQL_DATABASE || 'etimetracklite1',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: process.env.MSSQL_INSTANCE || 'SQLEXPRESS'
  }
};

async function run() {
  try {
    const pool = await mssql.connect(mssqlConfig);
    console.log("Connected to MSSQL.");
    
    // Check if DeviceLogs_6_2026 exists and query
    const result = await pool.request()
      .query(`
        SELECT TOP 20 UserId, LogDate, Direction, DeviceId 
        FROM DeviceLogs_6_2026 
        ORDER BY LogDate DESC
      `);
      
    console.log("Punches in local MS SQL DeviceLogs_6_2026:");
    console.log(result.recordset);
    
    await pool.close();
  } catch (err) {
    console.error(err);
  }
}
run();
