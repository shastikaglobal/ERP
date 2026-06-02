import mssql from 'mssql';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

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
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const result = await pool.request()
      .query(`
        SELECT EmployeeCode, LogDateTime, Direction, DeviceId 
        FROM Attlogs 
        WHERE LogDateTime >= '2026-06-01 00:00:00'
        ORDER BY LogDateTime ASC
      `);
      
    console.log("Punches in local MS SQL Attlogs for 2026-06-01:");
    console.log(result.recordset);
    
    await pool.close();
  } catch (err) {
    console.error(err);
  }
}
run();
