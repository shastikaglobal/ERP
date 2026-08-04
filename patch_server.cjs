const fs = require('fs');
let f = fs.readFileSync('adms-sync/server.js', 'utf8');

const payslipsRoute = `
// PAYSLIPS ROUTE
app.get('/api/payslips', async (req, res) => {
  try {
    const { employee_id, month } = req.query;
    if (!employee_id || !month) return res.status(400).json({ error: 'Missing employee_id or month' });
    
    // First, check if payslip already exists
    const { rows: existing } = await db.query('SELECT * FROM payslips WHERE employee_id = $1 AND month_year = $2', [employee_id, month]);
    if (existing.length > 0) {
      return res.json(existing[0]);
    }
    
    // If not, fetch employee master data and calculate
    const { rows: emps } = await db.query('SELECT * FROM profiles WHERE id = $1', [employee_id]);
    if (emps.length === 0) return res.status(404).json({ error: 'Employee not found' });
    
    const emp = emps[0];
    const basic = parseFloat(emp.monthly_salary) || 0;
    const basicEarnings = basic * 0.4;
    const hraEarnings = basic * 0.2;
    const pfDeduction = basicEarnings * 0.12;
    
    const gross = basicEarnings + hraEarnings;
    const net = gross - pfDeduction;
    
    const { rows: inserted } = await db.query(\`
      INSERT INTO payslips (
        employee_id, month_year, emp_code, employee_name, father_husband_name, 
        department, designation, pan_no, esi_no, pf_no, bank_name, bank_account_no, uan_no,
        basic_earnings, hra_earnings, pf_deduction, gross_pay, total_deductions, net_pay
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    \`, [
      employee_id, month, emp.employee_id, emp.full_name, emp.father_husband_name,
      emp.department, emp.role, emp.pan_no, emp.esi_no, emp.pf_no, emp.bank_name, emp.bank_account_no, emp.uan_no,
      basicEarnings, hraEarnings, pfDeduction, gross, pfDeduction, net
    ]);
    
    return res.json(inserted[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

`;

if (!f.includes('/api/payslips')) {
  f = f.replace('const app = express();', 'const app = express();\n' + payslipsRoute);
  fs.writeFileSync('adms-sync/server.js', f);
  console.log('Added /api/payslips');
} else {
  console.log('already exists');
}
