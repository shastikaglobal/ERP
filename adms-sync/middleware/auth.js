const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

let dir = __dirname;
let envPath;
while (dir) {
  const check = path.join(dir, '.env');
  if (fs.existsSync(check)) {
    envPath = check;
    break;
  }
  const parent = path.dirname(dir);
  if (parent === dir) break;
  dir = parent;
}
if (envPath) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log(`[DEBUG] requireAuth: No token provided for ${req.method} ${req.url}`);
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.log(`[DEBUG] requireAuth: Invalid token for ${req.method} ${req.url}:`, error?.message);
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = { sub: user.id, ...user };
    next();
  } catch (err) {
    console.log(`[DEBUG] requireAuth: Exception during token verification:`, err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = { requireAuth };
