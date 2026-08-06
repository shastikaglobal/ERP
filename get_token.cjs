const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '/var/www/adms-sync/.env' });

const token = jwt.sign(
  { sub: '4722ecc8-ec1f-4afb-acf8-444d3bdba677', role: 'admin' }, 
  process.env.JWT_SECRET || 'secret', 
  { expiresIn: '10h' }
);
console.log(token);
