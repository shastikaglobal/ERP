const db = require('./db');

(async () => {
  try {
    // Update the workflow function to handle NULL company_id
    const functionSQL = `
CREATE OR REPLACE FUNCTION handle_lead_stage_change()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Get company_id from lead or from created_by user's profile
  v_company_id := NEW.company_id;
  IF v_company_id IS NULL AND NEW.created_by IS NOT NULL THEN
    SELECT company_id INTO v_company_id FROM profiles WHERE id = NEW.created_by LIMIT 1;
  END IF;
  
  -- Default to a system company if still NULL
  IF v_company_id IS NULL THEN
    v_company_id := '00000000-0000-0000-0000-00000000ae01'::UUID; -- fallback
  END IF;

  -- If stage changed TO 'Won', create a customer record
  IF NEW.stage = 'Won' AND (OLD.stage IS NULL OR OLD.stage != 'Won') THEN
    INSERT INTO customers (
      id, company_id, name, country, email, phone, created_by, created_at
    ) VALUES (
      gen_random_uuid(),
      v_company_id,
      NEW.company_name,
      NEW.country,
      NEW.email,
      NEW.phone,
      NEW.created_by,
      NOW()
    )
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

  -- If stage changed FROM 'Won' TO something else, mark customer as deleted
  IF OLD.stage = 'Won' AND NEW.stage != 'Won' THEN
    UPDATE customers 
    SET is_deleted = true, deleted_at = NOW()
    WHERE email = NEW.email AND is_deleted = false;
    
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

    console.log('Updating workflow automation function with NULL company_id handling...');
    const result = await db.query(functionSQL);
    console.log('✅ Function updated successfully');

    // Test with a lead that has valid company_id
    console.log('\nTesting with lead that has company_id...');
    const testLead = await db.query(
      "SELECT id, stage FROM leads WHERE company_id IS NOT NULL AND is_deleted IS FALSE LIMIT 1"
    );
    
    if (testLead.rows.length > 0) {
      const leadId = testLead.rows[0].id;
      const oldStage = testLead.rows[0].stage;
      const newStage = oldStage === 'Won' ? 'Contacted' : 'Won';
      
      console.log(`Updating lead ${leadId} from '${oldStage}' to '${newStage}'...`);
      const updateResult = await db.query(
        'UPDATE leads SET stage = $1 WHERE id = $2 RETURNING id, stage, company_id',
        [newStage, leadId]
      );
      console.log('✅ Updated:', updateResult.rows[0]);

      if (newStage === 'Won') {
        // Check if customer was created
        const customerCheck = await db.query(
          'SELECT * FROM customers WHERE created_at > NOW() - INTERVAL \'1 minute\' ORDER BY created_at DESC LIMIT 1'
        );
        if (customerCheck.rows.length > 0) {
          console.log('✅ Customer record created:', customerCheck.rows[0]);
        }
      }
    } else {
      console.log('No leads with company_id found for testing');
    }

  } catch (err) {
    console.error('ERROR:', err.message);
    console.error('Stack:', err.stack);
  }
  process.exit(0);
})();
