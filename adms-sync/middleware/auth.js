const jwt = require('jsonwebtoken');
const db = require('../db');

const requireAuth = async (req, res, next) => {
  // Read token from HttpOnly cookie first, fallback to Authorization header
  let token = req.cookies?.accessToken;
  
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    console.log(`[DEBUG] requireAuth: No token provided for ${req.method} ${req.url}`);
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("FATAL: JWT_SECRET environment variable is missing.");
    }
    const decoded = jwt.verify(token, secret);

    // Verify user still exists and is active in DB
    const { rows } = await db.query(
      'SELECT id, email, is_active FROM profiles WHERE id = $1 AND is_deleted IS NOT TRUE LIMIT 1',
      [decoded.sub]
    );

    if (rows.length === 0 || !rows[0].is_active) {
      return res.status(401).json({ error: "User account deactivated or not found" });
    }

    req.user = { sub: decoded.sub, ...decoded };
    next();
  } catch (err) {
    console.warn(`[requireAuth] JWT verification failed for ${req.method} ${req.url}:`, err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = { requireAuth };
