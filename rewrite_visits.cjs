const fs = require('fs');
let c = fs.readFileSync('/var/www/adms-sync/routes/farmers.js', 'utf8');

const visitsRegex = /router\.get\('\/visits', requireAuth, async \(req, res\) => \{\s*try \{\s*const \{ company_id \} = req\.query;\s*if \(!company_id\) return res\.status\(400\)\.json\(\{ error: 'company_id required' \}\);\s*const \{ rows \} = await db\.query\('SELECT \* FROM farm_visits WHERE company_id = \$1 ORDER BY date DESC', \[company_id\]\);\s*res\.json\(rows\);\s*\} catch \(err\) \{\s*res\.status\(500\)\.json\(\{ error: err\.message \}\);\s*\}\s*\}\);/g;

c = c.replace(visitsRegex, `router.get('/visits', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM farm_visits ORDER BY visit_date DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`);

fs.writeFileSync('/var/www/adms-sync/routes/farmers.js', c);
console.log('Fixed GET visits');
