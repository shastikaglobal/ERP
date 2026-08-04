require('dotenv').config({path: '../.env'});
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE
});

async function run() {
  try {
    await pool.query(`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS father_husband_name TEXT,
      ADD COLUMN IF NOT EXISTS pan_no TEXT,
      ADD COLUMN IF NOT EXISTS esi_no TEXT,
      ADD COLUMN IF NOT EXISTS pf_no TEXT,
      ADD COLUMN IF NOT EXISTS bank_name TEXT,
      ADD COLUMN IF NOT EXISTS bank_account_no TEXT,
      ADD COLUMN IF NOT EXISTS uan_no TEXT;
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payslips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID REFERENCES profiles(id),
        month_year TEXT NOT NULL,
        
        -- Master info snapshot
        emp_code TEXT,
        employee_name TEXT,
        father_husband_name TEXT,
        department TEXT,
        designation TEXT,
        pan_no TEXT,
        esi_no TEXT,
        pf_no TEXT,
        bank_name TEXT,
        bank_account_no TEXT,
        uan_no TEXT,
        date_of_joining DATE,
        
        -- Earnings
        basic_rate NUMERIC DEFAULT 0,
        basic_days NUMERIC DEFAULT 0,
        basic_earnings NUMERIC DEFAULT 0,
        
        hra_rate NUMERIC DEFAULT 0,
        hra_days NUMERIC DEFAULT 0,
        hra_earnings NUMERIC DEFAULT 0,
        
        conveyance_rate NUMERIC DEFAULT 0,
        conveyance_days NUMERIC DEFAULT 0,
        conveyance_earnings NUMERIC DEFAULT 0,
        
        medical_rate NUMERIC DEFAULT 0,
        medical_days NUMERIC DEFAULT 0,
        medical_earnings NUMERIC DEFAULT 0,
        
        personal_rate NUMERIC DEFAULT 0,
        personal_days NUMERIC DEFAULT 0,
        personal_earnings NUMERIC DEFAULT 0,
        
        days_in_month NUMERIC DEFAULT 0,
        days_worked NUMERIC DEFAULT 0,
        days_payable NUMERIC DEFAULT 0,
        
        -- Deductions
        pf_deduction NUMERIC DEFAULT 0,
        esi_deduction NUMERIC DEFAULT 0,
        tds_deduction NUMERIC DEFAULT 0,
        pt_deduction NUMERIC DEFAULT 0,
        loan_deduction NUMERIC DEFAULT 0,
        advance_deduction NUMERIC DEFAULT 0,
        others_deduction NUMERIC DEFAULT 0,
        
        -- Totals
        gross_pay NUMERIC DEFAULT 0,
        total_deductions NUMERIC DEFAULT 0,
        net_pay NUMERIC DEFAULT 0,
        
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID,
        
        UNIQUE (employee_id, month_year)
      );
    `);
    console.log('Tables created/altered successfully');
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
run();
