// Verify routes are loaded correctly
const express = require('express');
const crmRoutes = require('./adms-sync/routes/crm.js');

console.log('🔍 Checking CRM routes...\n');

// CRM routes should be a Router instance
console.log('Routes object type:', typeof crmRoutes);
console.log('Routes constructor name:', crmRoutes?.constructor?.name);

// Get route stack
if (crmRoutes.stack) {
  console.log(`\nFound ${crmRoutes.stack.length} middleware/route layers:\n`);
  crmRoutes.stack.forEach((layer, idx) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
      const path = layer.route.path;
      console.log(`  [${methods}] ${path}`);
    } else if (layer.name === 'router' && layer.handle.stack) {
      console.log(`  [Router] with ${layer.handle.stack.length} subroutes`);
    }
  });
} else {
  console.log('No stack found');
  console.log('Properties:', Object.keys(crmRoutes));
}
