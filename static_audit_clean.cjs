const fs = require('fs');
const path = require('path');

const srcDir = 'src/pages';

const routeToFile = {
  '/dashboards/executive':              'dashboards/Executive.tsx',
  '/dashboards/finance-tally':          'dashboards/FinanceTally.tsx',
  '/dashboards/bde':                    'dashboards/BdeDashboard.tsx',
  '/dashboards/sales':                  'dashboards/SalesAnalytics.tsx',
  '/dashboards/shipments':              'dashboards/ShipmentAnalytics.tsx',
  '/dashboards/financial':              'dashboards/FinancialOverview.tsx',
  '/dashboards/employees':              'dashboards/EmployeeProductivity.tsx',
  '/farmers/':                          'farmers/FarmersList.tsx',
  '/farmers/create':                    'farmers/CreateFarmer.tsx',
  '/farmers/verification':              'farmers/FarmerVerification.tsx',
  '/farmers/kyc':                       'farmers/KYC.tsx',
  '/farmers/farm-visits':               'farmers/FarmVisits.tsx',
  '/farmers/contracts':                 'farmers/ContractFarming.tsx',
  '/farmers/commitments':               'farmers/SupplyCommitments.tsx',
  '/farmers/collections':               'farmers/GoodsCollection.tsx',
  '/farmers/payouts':                   'farmers/FarmerPayouts.tsx',
  '/farmers/rating':                    'farmers/FarmerRating.tsx',
  '/farmers/support':                   'farmers/FarmerSupport.tsx',
  '/procurement/orders':                'procurement/PurchaseOrdersListLive.tsx',
  '/procurement/orders/create':         'procurement/CreatePOLive.tsx',
  '/procurement/suppliers':             'procurement/SuppliersList.tsx',
  '/procurement/dashboard':             'procurement/ProcurementDashboard.tsx',
  '/qc/inspections':                    'qc/InspectionsList.tsx',
  '/qc/inspections/create':             'qc/CreateInspection.tsx',
  '/qc/approvals':                      'qc/QCApprovals.tsx',
  '/warehouse/container-loading':       'inventory/ContainerLoading.tsx',
  '/warehouse/dashboard':               'warehouse/WarehouseDashboard.tsx',
  '/warehouse/racks':                   'warehouse/WarehouseRacks.tsx',
  '/warehouse/zones':                   'warehouse/WarehouseZones.tsx',
  '/warehouse/receiving':               'warehouse/ReceivingGoods.tsx',
  '/warehouse/packing':                 'warehouse/PackingManagement.tsx',
  '/barcodes':                          'barcodes/BarcodesList.tsx',
  '/barcodes/generate':                 'barcodes/GenerateBarcode.tsx',
  '/barcodes/scan':                     'barcodes/ScanBarcode.tsx',
  '/inventory/products':                'inventory/ProductCatalog.tsx',
  '/inventory/products/create':         'inventory/CreateProduct.tsx',
  '/inventory/stock':                   'inventory/InventoryBatches.tsx',
  '/inventory/movements':               'inventory/StockMovements.tsx',
  '/inventory/warehouses':              'inventory/Warehouses.tsx',
  '/inventory/alerts':                  'inventory/LowStockAlerts.tsx',
  '/inventory/damaged':                 'inventory/DamagedStock.tsx',
  '/inventory/available-stock':         'inventory/AvailableStock.tsx',
  '/inventory/reserved-stock':          'inventory/ReservedStock.tsx',
  '/inventory/export-ready':            'inventory/ExportReady.tsx',
  '/inventory/batch-wise':              'inventory/BatchWiseStock.tsx',
  '/inventory/damaged-stock-management':'inventory/DamagedStockManagement.tsx',
  '/inventory/expiry-monitoring':       'inventory/ExpiryMonitoring.tsx',
  '/inventory/multi-warehouse':         'inventory/MultiWarehouse.tsx',
  '/reports':                           'reports/ReportsHub.tsx',
  '/reports/stock-summary':             'reports/StockSummaryReport.tsx',
  '/reports/batch-tracking':            'reports/BatchTrackingReport.tsx',
  '/reports/dispatch':                  'reports/DispatchReport.tsx',
  '/reports/container-loading':         'reports/ContainerLoadingReport.tsx',
  '/reports/damage-wastage':            'reports/DamageWastageReport.tsx',
  '/reports/inventory-aging':           'reports/InventoryAgingReport.tsx',
  '/reports/export-ready':              'reports/ExportReadyStockReport.tsx',
  '/quotations':                        'quotations/QuotationsList.tsx',
  '/quotations/create':                 'quotations/CreateQuotation.tsx',
  '/quotations/approvals':              'quotations/Approvals.tsx',
  '/quotations/convert':                'quotations/Convert.tsx',
  '/crm/dashboard':                     'crm/Dashboard.tsx',
  '/crm/activities':                    'crm/Activities.tsx',
  '/crm/leads':                         'crm/LeadsList.tsx',
  '/crm/follow-ups':                    'crm/FollowUps.tsx',
  '/crm/pipeline':                      'crm/Pipeline.tsx',
  '/crm/email':                         'crm/EmailIntegration.tsx',
  '/crm/tasks':                         'crm/Tasks.tsx',
  '/crm/security':                      'crm/Security.tsx',
  '/crm/client-acquisition':            'crm/ClientAcquisition.tsx',
  '/crm/advanced-security':             'crm/AdvancedSecurity.tsx',
  '/crm/reports':                       'crm/Reports.tsx',
  '/crm/performance':                   'crm/Performance.tsx',
  '/crm/revenue':                       'crm/RevenueAnalytics.tsx',
  '/crm/communication':                 'crm/Communication.tsx',
  '/crm/customer-database':             'crm/CustomerDatabase.tsx',
  '/crm/employee-activity':             'crm/EmployeeActivity.tsx',
  '/crm/convert':                       'crm/Convert.tsx',
  '/crm/customers':                     'crm/CustomersList.tsx',
  '/orders':                            'orders/OrdersList.tsx',
  '/orders/create':                     'orders/CreateOrder.tsx',
  '/orders/status':                     'orders/OrderStatus.tsx',
  '/orders/fulfillment':                'orders/Fulfillment.tsx',
  '/shipments':                         'shipments/ShipmentsList.tsx',
  '/shipments/create':                  'shipments/CreateShipment.tsx',
  '/shipments/containers':              'shipments/ContainerTracking.tsx',
  '/shipments/delivery':                'shipments/DeliveryStatus.tsx',
  '/shipments/dispatch':                'shipments/Dispatch.tsx',
  '/documents/invoices':                'documents/Invoices.tsx',
  '/documents/invoices/create':         'documents/CreateInvoice.tsx',
  '/documents/packing-lists':           'documents/PackingLists.tsx',
  '/documents/commercial-invoices':     'documents/CommercialInvoices.tsx',
  '/documents/certificates':            'documents/Certificates.tsx',
  '/certificates/create':               'documents/CreateCertificate.tsx',
  '/documents/viewer':                  'documents/DocumentViewer.tsx',
  '/payments':                          'payments/PaymentsRegister.tsx',
  '/payments/overdue':                  'payments/OverduePayments.tsx',
  '/payments/ledger':                   'payments/Ledger.tsx',
  '/payments/reports':                  'payments/FinancialReports.tsx',
  '/journal':                           'Tally/JournalEntry.tsx',
  '/tally':                             'Tally/index.tsx',
  '/employees':                         'employees/EmployeeDirectory.tsx',
  '/employees/roles':                   'employees/RolesPermissions.tsx',
  '/employees/attendance':              'employees/Attendance.tsx',
  '/employees/salary':                  'employees/SalaryReport.tsx',
  '/employees/leaves':                  'employees/LeaveManagement.tsx',
  '/employees/face-attendance':         'FaceAttendance.tsx',
  '/employees/register-face':           'RegisterFace.tsx',
  '/system/notifications':              'system/Notifications.tsx',
  '/system/logs':                       'system/ActivityLogs.tsx',
  '/system/audit-logs':                 'system/AuditLogs.tsx',
  '/system/subscriptions':              'system/Subscriptions.tsx',
  '/system/settings':                   'system/Settings.tsx',
  '/system/account':                    'system/AccountSettings.tsx',
  '/system/maintenance':                'system/Maintenance.tsx',
  '/system/integrations/zoho':          'system/ZohoIntegration.tsx',
  '/system/mailbox':                    'system/Mailbox.tsx',
};

// Known bad patterns that indicate runtime errors
const badPatterns = [
  { pattern: /vpsDb\s*\.\s*from\s*\(/, label: 'vpsDb.from() call (legacy Supabase - will crash)' },
  { pattern: /vpsDb\s*\.\s*channel\s*\(/, label: 'vpsDb.channel() call (legacy Supabase realtime - will crash)' },
  { pattern: /vpsDb\s*\.\s*storage/, label: 'vpsDb.storage call (legacy Supabase - will crash)' },
  { pattern: /legacyDb\s*\.\s*from/, label: 'legacyDb.from() call (dead)' },
  { pattern: /empSession\?\.\s*access_token/, label: 'undefined empSession reference' },
  { pattern: /const\s*\{\s*user\s*\}\s*=\s*\{\}\s*as\s*any/, label: 'stub user object (always undefined)' },
  { pattern: /const\s*sessionData\s*=\s*\{\s*session:\s*null\s*\}/, label: 'stub sessionData (always null token)' },
];

const results = { working: [], broken: [], missingFile: [] };

for (const [route, relFile] of Object.entries(routeToFile)) {
  const filePath = path.join(srcDir, relFile);
  if (!fs.existsSync(filePath)) {
    results.missingFile.push({ route, file: relFile });
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  for (const { pattern, label } of badPatterns) {
    if (pattern.test(content)) {
      issues.push(label);
    }
  }

  if (issues.length > 0) {
    results.broken.push({ route, file: relFile, issues });
  } else {
    results.working.push({ route, file: relFile });
  }
}

fs.writeFileSync('static_audit_results.json', JSON.stringify(results, null, 2));

// Print report
console.log('\n========================================');
console.log('  STATIC ROUTE AUDIT REPORT');
console.log('========================================');
console.log('Total routes audited: ' + Object.keys(routeToFile).length);
console.log('Clean:    ' + results.working.length);
console.log('Broken:   ' + results.broken.length);
console.log('Missing:  ' + results.missingFile.length);

if (results.broken.length > 0) {
  console.log('\n----- BROKEN PAGES -----');
  results.broken.forEach(b => {
    console.log('  ' + b.route + '  [' + b.file + ']');
    b.issues.forEach(i => console.log('    -> ' + i));
  });
}

if (results.missingFile.length > 0) {
  console.log('\n----- MISSING SOURCE FILES -----');
  results.missingFile.forEach(m => console.log('  ' + m.route + ' -> ' + m.file + ' (NOT FOUND)'));
}
