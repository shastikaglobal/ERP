const db = require('./db');

(async () => {
  try {
    // Create or replace the function that handles workflow automation
    const functionSQL = `
CREATE OR REPLACE FUNCTION handle_lead_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If stage changed TO 'Won', create a customer record
  IF NEW.stage = 'Won' AND (OLD.stage IS NULL OR OLD.stage != 'Won') THEN
    INSERT INTO customers (
      id, company_id, name, country, email, phone, created_by, created_at
    ) SELECT
      gen_random_uuid(),
      NEW.company_id,
      NEW.company_name,
      NEW.country,
      NEW.email,
      NEW.phone,
      NEW.created_by,
      NOW()
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Lead % converted to customer', NEW.id;
  END IF;

  -- If stage changed TO 'Client Successfully Acquired', create client_acquisition record
  IF NEW.stage = 'Client Successfully Acquired' AND (OLD.stage IS NULL OR OLD.stage != 'Client Successfully Acquired') THEN
    INSERT INTO client_acquisition (
      id, lead_id, client_name, country, assigned_bde, inquiry_source,
      acquisition_date, product_interested, created_at, status
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      NEW.company_name,
      NEW.country,
      NEW.assigned_to,
      NEW.source,
      CURRENT_DATE,
      NEW.interested_product,
      NOW(),
      'Active'
    )
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Lead % added to client_acquisition', NEW.id;
  END IF;

  -- If stage changed FROM 'Won' TO something else, mark customer as inactive or delete
  IF OLD.stage = 'Won' AND NEW.stage != 'Won' THEN
    -- Optionally mark as deleted or update status
    UPDATE customers 
    SET is_deleted = true, deleted_at = NOW()
    WHERE email = NEW.email AND company_id = NEW.company_id AND is_deleted = false;
    
    RAISE NOTICE 'Customer % marked as deleted due to stage change', NEW.id;
  END IF;

  -- If stage changed FROM 'Client Successfully Acquired' TO something else
  IF OLD.stage = 'Client Successfully Acquired' AND NEW.stage != 'Client Successfully Acquired' THEN
    UPDATE client_acquisition
    SET is_deleted = true, deleted_at = NOW()
    WHERE lead_id = NEW.id AND is_deleted = false;
    
    RAISE NOTICE 'Client acquisition record % marked as deleted', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
    `;

    console.log('Creating workflow automation function...');
    const result = await db.query(functionSQL);
    console.log('✅ Function created successfully');

    // Create the trigger if it doesn't exist
    const triggerSQL = `
DROP TRIGGER IF EXISTS lead_stage_change_trigger ON leads;

CREATE TRIGGER lead_stage_change_trigger
AFTER UPDATE OF stage ON leads
FOR EACH ROW
EXECUTE FUNCTION handle_lead_stage_change();
    `;

    console.log('Creating workflow automation trigger...');
    const triggerResult = await db.query(triggerSQL);
    console.log('✅ Trigger created successfully');

    // Test the function with a sample update
    console.log('\nTesting workflow automation...');
    const testLead = await db.query("SELECT id, stage FROM leads WHERE is_deleted IS FALSE LIMIT 1");
    if (testLead.rows.length > 0) {
      const leadId = testLead.rows[0].id;
      const oldStage = testLead.rows[0].stage;
      const testStage = 'Won';
      
      console.log(`Updating lead ${leadId} stage to '${testStage}'...`);
      const updateResult = await db.query(
        'UPDATE leads SET stage = $1 WHERE id = $2 RETURNING stage',
        [testStage, leadId]
      );
      console.log('✅ Updated to:', updateResult.rows[0].stage);

      // Check if customer was created
      const customerCheck = await db.query(
        'SELECT * FROM customers WHERE created_at > NOW() - INTERVAL \'1 minute\' LIMIT 1'
      );
      if (customerCheck.rows.length > 0) {
        console.log('✅ Customer record created:', customerCheck.rows[0].name);
      }
    }

  } catch (err) {
    console.error('ERROR:', err.message);
  }
  process.exit(0);
})();
