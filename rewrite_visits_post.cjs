const fs = require('fs');
let c = fs.readFileSync('farmers_vps_for_edit.js', 'utf8');

const postVisitsRegex = /router\.post\('\/visits', requireAuth, async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: err\.message \}\);\s*\}\s*\}\);/g;
const newPostVisits = `router.post('/visits', requireAuth, async (req, res) => {
  try {
    let { id, farmer_id, date, status, purpose, notes } = req.body;
    const userRes = await db.query('SELECT full_name FROM profiles WHERE id = $1', [req.user.sub]);
    const visitedBy = userRes.rows[0]?.full_name || req.user.sub;
    
    // Ensure id is a valid UUID, otherwise generate one
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!id || !uuidRegex.test(id)) {
      const crypto = require('crypto');
      id = crypto.randomUUID();
    }
    
    // Purpose cannot be null as per schema
    if (!purpose) purpose = 'General Visit';

    console.log("Executing SQL for POST /visits, id:", id);
    const { rows } = await db.query(
      \`INSERT INTO farm_visits (id, farmer_id, visit_date, status, purpose, notes, visited_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = NOW()
       RETURNING *\`,
      [id, farmer_id, date || new Date().toISOString(), status || 'Scheduled', purpose, notes || null, visitedBy]
    );
    console.log("Inserted Row:", rows[0]);
    res.json(rows[0]);
  } catch (err) {
    console.error("Route Error (POST /visits):", err);
    res.status(500).json({ error: err.message });
  }
});`;

c = c.replace(postVisitsRegex, newPostVisits);

fs.writeFileSync('farmers_vps_for_edit.js', c);
console.log('Fixed POST visits with UUID generation');
