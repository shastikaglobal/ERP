const fs = require('fs');
let text = fs.readFileSync('adms-sync/routes/farmers.js', 'utf8');

const replacement = `router.post('/contracts', requireAuth, async (req, res) => {
  try {
    const { id, farmer_id, contract_number, crop_name, agreed_quantity, agreed_price, start_date, end_date, status, document_url } = req.body;
    const { rows } = await db.query(
      \`INSERT INTO contract_farming (id, farmer_id, contract_number, crop_name, agreed_quantity, agreed_price, start_date, end_date, status, document_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *\`,
      [id, farmer_id, contract_number, crop_name, agreed_quantity, agreed_price, start_date, end_date, status, document_url]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`;

text = text.replace(/router\.post\('\/contracts', requireAuth, async \(req, res\) => \{[\s\S]*?res\.json\(rows\[0\]\);\n  \} catch \(err\) \{\n    res\.status\(500\)\.json\(\{ error: err\.message \}\);\n  \}\n\}\);/, replacement);

fs.writeFileSync('adms-sync/routes/farmers.js', text);
console.log('Done!');
