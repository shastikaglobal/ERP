require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const logs = await prisma.$queryRawUnsafe(`
    SELECT "EmployeeCode", "LogDateTime" at time zone 'UTC' at time zone 'Asia/Kolkata' as "IST_Time", "Direction" 
    FROM "AttLogs" 
    WHERE "DeviceId" = 'NFZ8250603096' 
      AND "LogDateTime" >= '2026-06-11T18:30:00Z'
    ORDER BY "LogDateTime" DESC
  `);
  
  console.log(JSON.stringify(logs, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
