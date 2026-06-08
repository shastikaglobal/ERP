import { format, subDays, differenceInDays, addDays, parseISO, startOfMonth } from "date-fns";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const salaryMap = {
  'Gayathri': 12000,
  'Jayasri S': 12000,
  'karunya': 12000,
  'Kaviya': 12000,
  'Lakshmana Gokul': 30000,
  'Madhumitha': 12000,
  'Narmatha Subramaniyam': 8000,
  'Nethra Sree': 8000,
  'Preethi M': 30000,
  'sathpreethika': 12000,
  'Swathi Swathi': 8000,
  'Vemula Navya lahari': 12000,
  'uma parameshwari': 17000
};

const getEmpSalary = (fullName) => {
  if (!fullName) return 0;
  const name = fullName.trim().toLowerCase();
  for (const [key, value] of Object.entries(salaryMap)) {
    if (key.trim().toLowerCase() === name) {
      return value;
    }
  }
  return 0;
};

const getLateMinutes = (clockInStr, deadlineStr) => {
  const deadline = deadlineStr || '08:00:00';
  const [dHours, dMinutes, dSeconds = 0] = deadline.split(':').map(Number);
  const punchDate = new Date(clockInStr);
  
  const deadlineDate = new Date(punchDate);
  deadlineDate.setHours(dHours, dMinutes, dSeconds, 0);
  
  if (punchDate.getTime() <= deadlineDate.getTime()) {
    return 0;
  }
  
  const diffMs = punchDate.getTime() - deadlineDate.getTime();
  return Math.floor(diffMs / (1000 * 60));
};

const getEmployeeMonthStats = (
  empId,
  monthStr, 
  emp,
  allLogs, 
  upToDateStr 
) => {
  const empLogs = allLogs[empId] || {};
  const monthlySalary = Number(emp.monthly_salary) || getEmpSalary(emp.full_name) || 0;
  const perDay = Math.round(monthlySalary / 26); 
  const halfDay = Math.round(perDay / 2);
  const deadline = emp.punch_deadline || (emp.full_name?.toLowerCase().startsWith("preethi") ? "10:00:00" : "08:00:00");

  let calculationEnd;
  if (upToDateStr && upToDateStr.startsWith(monthStr)) {
    calculationEnd = parseISO(upToDateStr);
  } else {
    const [year, month] = monthStr.split('-').map(Number);
    calculationEnd = new Date(year, month, 0);
  }
  
  const [year, month] = monthStr.split('-').map(Number);
  const calculationStart = new Date(year, month - 1, 1);
  
  const days = [];
  let curr = calculationStart;
  while (curr <= calculationEnd) {
    days.push(format(curr, 'yyyy-MM-dd'));
    curr = addDays(curr, 1);
  }

  let paidLeavesUsed = 0;
  let unpaidLeavesUsed = 0;
  let excusedPermissionsUsed = 0; 
  let totalCut = 0;

  const dailyDetails = {};

  days.forEach(dateStr => {
    const log = empLogs[dateStr];
    
    if (log) {
      if (log.status === 'on_leave') {
        paidLeavesUsed++;
        if (paidLeavesUsed <= 1) {
          dailyDetails[dateStr] = {
            status: 'paid_leave',
            cut: 0,
            isExcused: false,
            minutesLate: 0,
            explanation: 'Paid Leave'
          };
        } else {
          totalCut += perDay;
          unpaidLeavesUsed++;
          dailyDetails[dateStr] = {
            status: 'unpaid_leave',
            cut: perDay,
            isExcused: false,
            minutesLate: 0,
            explanation: 'Unpaid Leave'
          };
        }
      } else if (log.clock_in) {
        const minutesLate = getLateMinutes(log.clock_in, deadline);
        const isLate = minutesLate >= 2;

        if (isLate) {
          if (log.is_excused) {
            dailyDetails[dateStr] = {
              status: 'present',
              cut: 0,
              isExcused: true,
              minutesLate,
              explanation: `Late (Admin Excused)`
            };
          } else {
            totalCut += halfDay;
            dailyDetails[dateStr] = {
              status: 'late_cut',
              cut: halfDay,
              isExcused: false,
              minutesLate,
              explanation: 'Late (No permission)'
            };
          }
        } else {
          dailyDetails[dateStr] = {
            status: 'present',
            cut: 0,
            isExcused: false,
            minutesLate,
            explanation: 'On Time'
          };
        }
      } else {
        totalCut += perDay;
        dailyDetails[dateStr] = {
          status: 'absent',
          cut: perDay,
          isExcused: false,
          minutesLate: 0,
          explanation: 'Absent (No clock in)'
        };
      }
    } else {
      totalCut += perDay;
      dailyDetails[dateStr] = {
        status: 'absent',
        cut: perDay,
        isExcused: false,
        minutesLate: 0,
        explanation: 'Absent (No record)'
      };
    }
  });

  return { dailyDetails };
};

async function main() {
  const { data: logs } = await supabase.from('attendance_logs').select('*');
  const grouped = {};
  logs.forEach(log => {
    if (!grouped[log.employee_id]) grouped[log.employee_id] = {};
    grouped[log.employee_id][log.date] = log;
  });

  const { data: profiles } = await supabase.from('profiles').select('*').eq('full_name', 'Gayathri');
  const gayathri = profiles[0];

  const stats = getEmployeeMonthStats(gayathri.id, '2026-06', gayathri, grouped);
  
  const daysInRange = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05'];
  
  let rangeTotalCut = 0;
  daysInRange.forEach(dateStr => {
    const detail = stats.dailyDetails[dateStr];
    console.log(dateStr, detail);
    if (detail) {
      if (detail.status !== 'paid_leave' && detail.status !== 'present') {
         rangeTotalCut += detail.cut;
      }
    }
  });
  console.log("Range Total Cut:", rangeTotalCut);
}
main();
