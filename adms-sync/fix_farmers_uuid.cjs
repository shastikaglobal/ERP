const fs = require('fs');
let code = fs.readFileSync('routes/farmers.js', 'utf8');

const regex = /router\.get\('\/:id',\s*requireAuth,\s*async\s*\(req,\s*res\)\s*=>\s*\{\s*try\s*\{\s*const\s*\{\s*id\s*\}\s*=\s*req\.params;/g;
const replacement = `router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({ error: "Invalid UUID format" });
    }`;

code = code.replace(regex, replacement);
fs.writeFileSync('routes/farmers.js', code);
console.log('Fixed UUID validation for farmers GET /:id');
