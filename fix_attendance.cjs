const fs = require('fs');

const file = 'src/pages/employees/Attendance.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `  const handleSaveManualTime = async (emp: any) => {
    if (!manualTime) return;
    setSavingManualTime(true);
    const todayStr = endDate;
    try {
      const timeIso = new Date(\`\${todayStr}T\${manualTime}\`).toISOString();`,
  `  const handleSaveManualTime = async (emp: any) => {
    if (!manualTime) return;
    setSavingManualTime(true);
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    try {
      const timeIso = new Date(\`\${todayStr}T\${manualTime}:00+05:30\`).toISOString();`
);

content = content.replace(
  `  const handleMarkOnLeave = async (emp: any) => {
    const todayStr = endDate;`,
  `  const handleMarkOnLeave = async (emp: any) => {
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });`
);

content = content.replace(
  `  const handleMarkOD = async (emp: any) => {
    const todayStr = endDate;
    try {
      const clockInTime = new Date(\`\${todayStr}T08:00:00\`).toISOString();`,
  `  const handleMarkOD = async (emp: any) => {
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    try {
      const clockInTime = new Date(\`\${todayStr}T08:00:00+05:30\`).toISOString();`
);

fs.writeFileSync(file, content);
console.log('Fixed Attendance.tsx manual punch handlers');
