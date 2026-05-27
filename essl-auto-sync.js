import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import * as xlsx from 'xlsx';
import cron from 'node-cron';

// 1. Configure Supabase (Make sure to run this with .env variables or replace with actual keys)
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://sxebygxpjzntogzpjnga.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZWJ5Z3hwanpudG9nenBqbmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMjc5MzksImV4cCI6MjA5MjkwMzkzOX0.rtClmtuPuNicVQvBkITzY6PfFsh8yOYq3ykWoL9Ab_4';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Configure Folder Paths (Dynamic from .env, no hardcoding!)
const WATCH_FOLDER = process.env.ATTENDANCE_WATCH_FOLDER;

if (!WATCH_FOLDER) {
  console.error("❌ CRITICAL ERROR: ATTENDANCE_WATCH_FOLDER is not defined in your .env file!");
  process.exit(1);
}

const PROCESSED_FOLDER = path.join(WATCH_FOLDER, 'processed');

// Ensure folders exist
if (!fs.existsSync(WATCH_FOLDER)) fs.mkdirSync(WATCH_FOLDER, { recursive: true });
if (!fs.existsSync(PROCESSED_FOLDER)) fs.mkdirSync(PROCESSED_FOLDER, { recursive: true });

console.log(`🚀 Shastika Global eSSL Auto-Sync Service Started!`);
console.log(`📂 Watching folder: ${WATCH_FOLDER}`);

// Helper function to format date from eSSL (usually "DD-MM-YYYY", "DD-MMM-YYYY", or "YYYY-MM-DD")
function parseDateString(dateStr) {
  if (!dateStr) return null;
  // If Excel gives a serial number date
  if (typeof dateStr === 'number') {
    const d = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
    return d.toISOString().split('T')[0];
  }
  
  const cleanStr = dateStr.toString().trim();
  const monthMap = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
    january: "01", february: "02", march: "03", april: "04", june: "06",
    july: "07", august: "08", september: "09", october: "10", november: "11", december: "12"
  };

  const parts = cleanStr.split(/[-/]/);
  if (parts.length === 3) {
    let day = parts[0].trim();
    let month = parts[1].trim();
    let year = parts[2].trim();

    // If year is first (e.g. YYYY-MM-DD)
    if (day.length === 4) {
      const temp = day;
      day = year;
      year = temp;
    }

    day = day.padStart(2, '0');

    // If month is a word
    const monthLower = month.toLowerCase();
    if (monthMap[monthLower]) {
      month = monthMap[monthLower];
    } else {
      month = month.padStart(2, '0');
    }

    return `${year}-${month}-${day}`;
  }

  return null;
}

// Helper to convert time "10:30" or "10:30:00" to valid ISO timestamp
function createIsoTimestamp(dateStr, timeStr) {
  if (!timeStr || timeStr === '--:--' || timeStr.toString().trim() === '') return null;
  
  // If Excel gave decimal fraction for time
  if (typeof timeStr === 'number') {
    const totalSeconds = Math.round(timeStr * 86400);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    timeStr = `${hours}:${minutes}`;
  }

  // Handle case where dateStr is already parsed as YYYY-MM-DD
  const dStr = (dateStr.includes('-') && dateStr.split('-')[0].length === 4) ? dateStr : parseDateString(dateStr);
  if (!dStr) return null;

  try {
    return new Date(`${dStr}T${timeStr.toString().substring(0,5)}:00`).toISOString();
  } catch (e) {
    return null;
  }
}

async function processFile(filePath, fileName) {
  console.log(`\n📄 Processing file: ${fileName}...`);
  
  try {
    // Read Profiles from ERP
    const { data: profiles, error: profErr } = await supabase.from('profiles').select('id, company_id, biometric_id');
    if (profErr) throw new Error("Failed to load ERP profiles: " + profErr.message);

    // Read Excel/CSV
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Read raw rows as arrays of values
    const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    let successCount = 0;
    let skippedCount = 0;

    let currentDate = null;
    let colMap = {
      tCode: -1,
      name: -1,
      aInTime: -1,
      aOutTime: -1,
      status: -1,
      punchRecords: -1
    };

    // First check: does it look like a stacked report or a flat sheet?
    let isStackedReport = false;
    for (const row of rawRows) {
      if (row && Array.isArray(row) && row.join(" ").includes("Attendance Date")) {
        isStackedReport = true;
        break;
      }
    }

    if (isStackedReport) {
      console.log("ℹ️ Detected Stacked Daily Biometric Report format.");
      
      for (const row of rawRows) {
        if (!row || !Array.isArray(row) || row.length === 0) continue;

        const rowStr = row.join(" ");

        // 1. Check for Attendance Date context (e.g., "Attendance Date :  01-May-2026")
        if (rowStr.includes("Attendance Date")) {
          const match = rowStr.match(/Attendance Date\s*:\s*([0-9a-zA-Z-\s]+)/i);
          if (match && match[1]) {
            const parsed = parseDateString(match[1].trim());
            if (parsed) {
              currentDate = parsed;
              console.log(`📌 Active Date Context switched to: ${currentDate}`);
            }
          }
          continue;
        }

        // 2. Check for Header Row
        if (row.some(cell => cell && typeof cell === 'string' && cell.replace(/\s+/g, "").toLowerCase().includes("t.code"))) {
          colMap.tCode = row.findIndex(c => c && typeof c === 'string' && c.replace(/\s+/g, "").toLowerCase().includes("t.code"));
          colMap.name = row.findIndex(c => c && typeof c === 'string' && c.replace(/\s+/g, "").toLowerCase().includes("name"));
          colMap.aInTime = row.findIndex(c => c && typeof c === 'string' && c.replace(/\s+/g, "").toLowerCase().includes("a.intime"));
          colMap.aOutTime = row.findIndex(c => c && typeof c === 'string' && c.replace(/\s+/g, "").toLowerCase().includes("a.outtime"));
          colMap.status = row.findIndex(c => c && typeof c === 'string' && c.replace(/\s+/g, "").toLowerCase().includes("status"));
          colMap.punchRecords = row.findIndex(c => c && typeof c === 'string' && c.replace(/\s+/g, "").toLowerCase().includes("punchrecords"));
          continue;
        }

        // 3. Process Data Row
        if (currentDate && colMap.tCode !== -1) {
          const tCodeVal = row[colMap.tCode];
          if (tCodeVal !== undefined && tCodeVal !== null && tCodeVal !== "") {
            const bioId = tCodeVal.toString().trim();
            // Skip header repeat values, empty cells, or summaries
            if (
              bioId === "" ||
              bioId.toLowerCase().includes("t.code") ||
              bioId.toLowerCase().includes("t. code") ||
              bioId.toLowerCase().includes("total") ||
              bioId.toLowerCase().includes("attendance") ||
              bioId.toLowerCase().includes("company") ||
              bioId.toLowerCase().includes("department")
            ) {
              continue;
            }

            // Find employee in ERP
            const emp = profiles.find(p => p.biometric_id === bioId || (p.biometric_id && Number(p.biometric_id) === Number(bioId)));
            if (!emp) {
              skippedCount++;
              continue;
            }

            const rawInTime = colMap.aInTime !== -1 ? row[colMap.aInTime] : null;
            const rawOutTime = colMap.aOutTime !== -1 ? row[colMap.aOutTime] : null;
            const rawStatus = colMap.status !== -1 ? row[colMap.status]?.toString().trim() : "";

            let status = 'present';
            if (rawStatus && (rawStatus.toLowerCase().includes('absent') || rawStatus === 'A')) {
              status = 'absent';
            }

            const isoIn = createIsoTimestamp(currentDate, rawInTime);
            const isoOut = createIsoTimestamp(currentDate, rawOutTime);

            // Upsert attendance record
            const { data: existing } = await supabase
              .from('attendance_logs')
              .select('id')
              .eq('employee_id', emp.id)
              .eq('date', currentDate)
              .maybeSingle();

            if (existing) {
              await supabase.from('attendance_logs').update({
                clock_in: isoIn || null,
                clock_out: isoOut || null,
                status: status
              }).eq('id', existing.id);
            } else {
              await supabase.from('attendance_logs').insert({
                employee_id: emp.id,
                company_id: emp.company_id,
                date: currentDate,
                status: status,
                clock_in: isoIn || null,
                clock_out: isoOut || null
              });
            }
            successCount++;
          }
        }
      }
    } else {
      console.log("ℹ️ Detected flat Excel list format.");
      // Fallback to standard sheet_to_json flat format
      const data = xlsx.utils.sheet_to_json(sheet);
      
      for (const row of data) {
        const bioId = (row['Employee Code'] || row['T. Code'] || row['T.Code'])?.toString().trim();
        const rawDate = row['Date'] || row['Attendance Date'];
        const rawInTime = row['In Time'] || row['InTime'] || row['A. InTime'] || row['A.InTime'];
        const rawOutTime = row['Out Time'] || row['OutTime'] || row['A. OutTime'] || row['A.OutTime'];
        const rawStatus = row['Status']?.toString().trim() || "";

        if (!bioId || !rawDate) continue;

        const emp = profiles.find(p => p.biometric_id === bioId || (p.biometric_id && Number(p.biometric_id) === Number(bioId)));
        if (!emp) {
          skippedCount++;
          continue;
        }

        const isoDate = parseDateString(rawDate);
        if (!isoDate) continue;

        let status = 'present';
        if (rawStatus && (rawStatus.toLowerCase().includes('absent') || rawStatus === 'A')) {
          status = 'absent';
        }

        const isoIn = createIsoTimestamp(isoDate, rawInTime);
        const isoOut = createIsoTimestamp(isoDate, rawOutTime);

        const { data: existing } = await supabase
          .from('attendance_logs')
          .select('id')
          .eq('employee_id', emp.id)
          .eq('date', isoDate)
          .maybeSingle();

        if (existing) {
          await supabase.from('attendance_logs').update({
            clock_in: isoIn || null,
            clock_out: isoOut || null,
            status: status
          }).eq('id', existing.id);
        } else {
          await supabase.from('attendance_logs').insert({
            employee_id: emp.id,
            company_id: emp.company_id,
            date: isoDate,
            status: status,
            clock_in: isoIn || null,
            clock_out: isoOut || null
          });
        }
        successCount++;
      }
    }

    console.log(`✅ File ${fileName} completed! Successful: ${successCount}, Skipped/Unmapped: ${skippedCount}`);

    // Move file to processed folder
    fs.renameSync(filePath, path.join(PROCESSED_FOLDER, fileName));

  } catch (err) {
    console.error(`❌ Error processing ${fileName}:`, err);
  }
}

async function runSync() {
  console.log(`\n⏳ Running Sync Check at ${new Date().toLocaleString()}...`);
  try {
    const files = fs.readdirSync(WATCH_FOLDER);
    for (const file of files) {
      if (file.endsWith('.xlsx') || file.endsWith('.xls') || file.endsWith('.csv')) {
        await processFile(path.join(WATCH_FOLDER, file), file);
      }
    }
  } catch (err) {
    console.error("Failed to read watch folder:", err.message);
  }
}

// Run immediately on start
runSync();

// Schedule to run every 30 minutes
cron.schedule('*/30 * * * *', () => {
  runSync();
});
