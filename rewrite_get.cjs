const fs = require('fs');

let c = fs.readFileSync('/var/www/adms-sync/routes/farmers.js', 'utf8');

const regexMap = {
  contracts: { table: 'contract_farming' },
  commitments: { table: 'supply_commitments' },
  collections: { table: 'goods_collections' },
  payouts: { table: 'payouts' },
  ratings: { table: 'farmer_ratings' },
  documents: { table: 'farmer_documents' },
  tickets: { table: 'farmer_support' }
};

for (const [route, info] of Object.entries(regexMap)) {
  const getRegex = new RegExp(`router\\.get\\('/${route}', requireAuth, async \\(req, res\\) => \\{\\s*try \\{\\s*const \\{ company_id \\} = req\\.query;\\s*if \\(!company_id\\) return res\\.status\\(400\\)\\.json\\(\\{ error: 'company_id required' \\}\\);\\s*const \\{ rows \\} = await db\\.query\\('SELECT \\* FROM [a-zA-Z_]+ WHERE company_id = \\$1 ORDER BY [a-zA-Z_]+ DESC', \\[company_id\\]\\);\\s*res\\.json\\(rows\\);\\s*\\} catch \\(err\\) \\{\\s*res\\.status\\(500\\)\\.json\\(\\{ error: err\\.message \\}\\);\\s*\\}\\s*\\}\\);`);
  
  const getReplacement = `router.get('/${route}', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM ${info.table} ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`;

  c = c.replace(getRegex, getReplacement);
}

fs.writeFileSync('/var/www/adms-sync/routes/farmers.js', c);
console.log('Fixed GET endpoints in farmers.js');
