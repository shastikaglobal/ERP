const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE || 'shastika_erp',
});

async function getSchema() {
  try {
    const tables = [
      'products', 'warehouses', 'warehouse_zones', 'warehouse_racks', 
      'inventory_batches', 'stock_movements', 'damaged_stock', 
      'quality_control_logs', 'container_loadings', 'available_stock'
    ];
    
    for (const table of tables) {
      console.log(`\n--- ${table} ---`);
      const result = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);
      
      result.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));
    }
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

getSchema();
