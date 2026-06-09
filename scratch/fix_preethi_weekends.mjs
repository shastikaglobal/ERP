import fs from 'fs';

const attendancePath = 'd:/ERP1/ERP/src/pages/employees/Attendance.tsx';
const salaryPath = 'd:/ERP1/ERP/src/pages/employees/SalaryReport.tsx';

let attendanceStr = fs.readFileSync(attendancePath, 'utf-8');

// Attendance: getEmployeeMonthStats
attendanceStr = attendanceStr.replace(
  /const perDay = Math\.round\(monthlySalary \/ 26\); \/\/ 26 working days \(Sundays excluded\)/g,
  `const isPreethi = emp.full_name?.toLowerCase().includes("preethi");\n    const perDay = Math.round(monthlySalary / (isPreethi ? 22 : 26)); // 22 for Preethi, 26 for others`
);

attendanceStr = attendanceStr.replace(
  /const isSunday = new Date\(dateStr\)\.getDay\(\) === 0;/g,
  `const d = new Date(dateStr);\n        const isSunday = d.getDay() === 0 || (isPreethi && d.getDay() === 6);`
);

attendanceStr = attendanceStr.replace(
  /explanation: isSunday \? 'Sunday \(Holiday\)' :/g,
  `explanation: isSunday ? 'Weekend (Holiday)' :`
);

// Attendance: rows map
attendanceStr = attendanceStr.replace(
  /const perDay = Math\.round\(monthlySalary \/ 26\);\n\s*const halfDay = Math\.round\(perDay \/ 2\);/g,
  `const isPreethi = emp.full_name?.toLowerCase().includes("preethi");\n                              const perDay = Math.round(monthlySalary / (isPreethi ? 22 : 26));\n                              const halfDay = Math.round(perDay / 2);`
);

fs.writeFileSync(attendancePath, attendanceStr);

let salaryStr = fs.readFileSync(salaryPath, 'utf-8');

// SalaryReport: workingDays calculation
salaryStr = salaryStr.replace(
  /const workingDays = 26; \/\/ 30 days minus ~4 Sundays/,
  `const isPreethi = emp.full_name?.toLowerCase().includes("preethi");\n    const workingDays = isPreethi ? 22 : 26; // 22 for Preethi, 26 for others`
);

// SalaryReport: day skip logic
salaryStr = salaryStr.replace(
  /\/\/ Skip Sundays \(0 = Sunday\)\n\s*if \(curr\.getDay\(\) !== 0\) \{/g,
  `// Skip Sundays (0 = Sunday). Skip Saturdays for Preethi.\n      const isWeekend = curr.getDay() === 0 || (isPreethi && curr.getDay() === 6);\n      if (!isWeekend) {`
);

fs.writeFileSync(salaryPath, salaryStr);

console.log("Done updating weekend logic for Preethi.");
