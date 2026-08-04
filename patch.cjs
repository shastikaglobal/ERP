const fs = require('fs');
let f = fs.readFileSync('src/App.tsx', 'utf8');

if (!f.includes('const Payslips')) {
  f = f.replace(
    'const SalaryReport = lazy(() => import("./pages/employees/SalaryReport"));',
    'const SalaryReport = lazy(() => import("./pages/employees/SalaryReport"));\nconst Payslips = lazy(() => import("./pages/employees/Payslips"));'
  );
}

if (!f.includes('<Route path="/hr-employees/payslips"')) {
  f = f.replace(
    '<Route path="/employees/salary" element={<SalaryReport />} />',
    '<Route path="/employees/salary" element={<SalaryReport />} />\n              <Route path="/hr-employees/payslips" element={<Payslips />} />'
  );
}

fs.writeFileSync('src/App.tsx', f);
console.log('App.tsx patched.');
