const db = require('../adms-sync/db');

async function main() {
  try {
    await db.query(`ALTER TABLE quotations ADD COLUMN IF NOT EXISTS created_by UUID`);
    // Optional: Add a foreign key constraint to profiles if you want
    // await db.query(`ALTER TABLE quotations ADD CONSTRAINT fk_quotations_created_by FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL`);
    console.log('Successfully added created_by column to quotations table');
  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    process.exit();
  }
}

main();
