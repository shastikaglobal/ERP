import mssql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

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

async function main() {
  let pool;
  try {
    pool = await mssql.connect(mssqlConfig);
    console.log("Connected to MSSQL");
    
    // Find all table names
    const tablesResult = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    console.log("All tables:");
    console.log(tablesResult.recordset.map(r => r.TABLE_NAME));
  } catch (err) {
    console.error(err);
  } finally {
    if (pool) await pool.close();
  }
}
main();
