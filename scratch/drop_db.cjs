const mssql = require('mssql');
require('dotenv').config();

const mssqlConfig = {
  server: process.env.MSSQL_SERVER || 'localhost',
  user: process.env.MSSQL_USER || 'sa',
  password: process.env.MSSQL_PASSWORD || 'essl@123',
  database: 'master', // connect to master to drop etimetracklite1
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: process.env.MSSQL_INSTANCE || 'SQLEXPRESS'
  }
};

async function run() {
  try {
    console.log("Connecting to MS SQL Server...");
    const pool = await mssql.connect(mssqlConfig);
    console.log("Connected. Dropping database 'etimetracklite1'...");
    
    // Set single user mode to close active connections, then drop
    await pool.request().query(`
      ALTER DATABASE etimetracklite1 SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
      DROP DATABASE etimetracklite1;
    `);
    
    console.log("Database 'etimetracklite1' dropped successfully.");
    await pool.close();
  } catch (err) {
    console.error("Error during database drop:", err.message);
  } finally {
    process.exit(0);
  }
}

run();
