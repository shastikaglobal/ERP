const fs = require('fs');
let c = fs.readFileSync('farmers_vps_for_edit.js', 'utf8');

// Fix POST /visits
const postVisitsRegex = /router\.post\('\/visits', requireAuth, async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: err\.message \}\);\s*\}\s*\}\);/g;
const newPostVisits = `router.post('/visits', requireAuth, async (req, res) => {
  try {
    const { id, farmer_id, date, status, purpose, notes } = req.body;
    const userRes = await db.query('SELECT full_name FROM profiles WHERE id = $1', [req.user.sub]);
    const visitedBy = userRes.rows[0]?.full_name || req.user.sub;
    
    const { rows } = await db.query(
      \`INSERT INTO farm_visits (id, farmer_id, visit_date, status, purpose, notes, visited_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = NOW()
       RETURNING *\`,
      [id, farmer_id, date, status || 'Scheduled', purpose, notes, visitedBy]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});`;

c = c.replace(postVisitsRegex, newPostVisits);

// Fix PUT /api/farmers/:id
const putUpdateRegex = /code = COALESCE\(\$12, code\),\s*updated_at = NOW\(\)\s*WHERE id = \$13 RETURNING \*\`,/g;
const newPutUpdate = `code = COALESCE($12, code),
        verification_status = COALESCE($14, verification_status),
        farm_area = COALESCE($15, farm_area),
        updated_at = NOW()
       WHERE id = $13 RETURNING *\`,`;

c = c.replace(putUpdateRegex, newPutUpdate);

fs.writeFileSync('farmers_vps_for_edit.js', c);
console.log('Fixed farmers_vps_for_edit.js');
