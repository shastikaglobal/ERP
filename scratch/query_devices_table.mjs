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
    const result = await pool.request().query("SELECT * FROM Devices");
    console.log(result.recordset);
  } catch (err) {
    console.error(err);
  } finally {
    if (pool) await pool.close();
  }
}
main();
