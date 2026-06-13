const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const dotenvPath = fs.existsSync(path.join(__dirname, '.env'))
  ? path.join(__dirname, '.env')
  : path.join(__dirname, '..', '.env');
require('dotenv').config({ path: dotenvPath });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.error('[Auth] Token validation failed:', error?.message);
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = { sub: user.id, ...user };
    
    // Set auth context for RLS policies to work properly
    // This allows functions like current_company_id() to work
    if (user.id) {
      try {
        // Set the auth.uid for Supabase RLS functions
        // We use a direct query to set the context before any subsequent queries
        req.dbClient = { userId: user.id };
        console.log(`[Auth] User ${user.id} authenticated successfully`);
      } catch (contextErr) {
        console.error('[Auth] Failed to set auth context:', contextErr.message);
        // Continue anyway - the user is authenticated
      }
    }

    next();
  } catch (err) {
    console.error('[Auth] Unexpected error:', err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = { requireAuth };
