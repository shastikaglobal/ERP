const crmRoutes = require('./adms-sync/routes/crm.js');

console.log('router type', typeof crmRoutes, crmRoutes && crmRoutes.constructor && crmRoutes.constructor.name);
if (crmRoutes.stack) {
  console.log('route count', crmRoutes.stack.filter(l => l.route).length);
  crmRoutes.stack.filter(l => l.route).forEach((layer, idx) => {
    console.log(idx, Object.keys(layer.route.methods).join(',').toUpperCase(), layer.route.path);
  });
} else {
  console.log('no stack');
  console.log('keys', Object.keys(crmRoutes));
}
