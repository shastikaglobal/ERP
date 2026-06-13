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
    
    // Query punches for today: 2026-06-12
    const result = await pool.request()
      .query(`
        SELECT EmployeeCode, LogDateTime, Direction, DeviceId 
        FROM Attlogs 
        WHERE LogDateTime >= '2026-06-12 00:00:00'
        ORDER BY LogDateTime DESC
      `);
      
    console.log("Punches in local MS SQL Attlogs for 2026-06-12:");
    console.log(result.recordset);
    
    // Check total count of all logs
    const countResult = await pool.request()
      .query(`SELECT COUNT(*) as count FROM Attlogs`);
    console.log("Total punches in local MS SQL database:", countResult.recordset[0].count);

    // Let's also see the latest 5 logs in local DB
    const latestResult = await pool.request()
      .query(`SELECT TOP 5 EmployeeCode, LogDateTime, Direction, DeviceId FROM Attlogs ORDER BY LogDateTime DESC`);
    console.log("Latest 5 punches in local MS SQL database:", latestResult.recordset);

    await pool.close();
  } catch (err) {
    console.error(err);
  }
}
run();
