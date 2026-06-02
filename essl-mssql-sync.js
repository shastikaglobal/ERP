import { createClient } from '@supabase/supabase-js';
import mssql from 'mssql';
import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import dotenv from 'dotenv';

// 1. Load Configurations
dotenv.config({ override: true });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://sxebygxpjzntogzpjnga.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const mssqlConfig = {
  server: process.env.MSSQL_SERVER || 'localhost',
  user: process.env.MSSQL_USER || 'sa',
  password: process.env.MSSQL_PASSWORD || 'essl@123',
  database: process.env.MSSQL_DATABASE || 'etimetracklite1',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: process.env.MSSQL_INSTANCE || 'SQLEXPRESS'
  },
  connectionTimeout: 15000,
  requestTimeout: 15000
};

const SYNC_STATE_FILE = path.join(process.cwd(), '.last-mssql-sync');

console.log(`🚀 Shastika Global eSSL Live DB Sync Service Starting...`);

// Helper to get last sync time
function getLastSyncTime() {
  if (fs.existsSync(SYNC_STATE_FILE)) {
    try {
      const data = fs.readFileSync(SYNC_STATE_FILE, 'utf8').trim();
      if (data) {
        const parsedDate = new Date(data);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate;
        }
      }
    } catch (e) {
      console.warn("⚠️ Warning: Could not read last sync state file. Defaulting to recent history.");
    }
  }
  // Default: Sync from 3 days ago to ensure recent records are caught
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() - 3);
  return defaultDate;
}

// Helper to save last sync time
function saveLastSyncTime(date) {
  try {
    fs.writeFileSync(SYNC_STATE_FILE, date.toISOString(), 'utf8');
  } catch (e) {
    console.error("❌ Failed to save last sync state:", e.message);
  }
}

async function runSync() {
  console.log(`\n⏳ Running Live DB Sync Check at ${new Date().toLocaleString()}...`);
  
  let pool;
  try {
    // 1. Load active profiles from Supabase to match Biometric IDs
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('id, company_id, biometric_id');
      
    if (profErr) {
      throw new Error(`Failed to load ERP profiles from Supabase: ${profErr.message}`);
    }
    
    console.log(`👤 Loaded ${profiles.length} employee profiles from Supabase.`);

    // 2. Connect to local MS SQL Server
    pool = await mssql.connect(mssqlConfig);
    console.log(`🔌 Connected to local SQL Server [${mssqlConfig.server}\\${mssqlConfig.options.instanceName}].[${mssqlConfig.database}]`);

    // 3. Determine 'since' filter
    const sinceDate = getLastSyncTime();
    console.log(`🔍 Querying punches in [Attlogs] since: ${sinceDate.toISOString()} (Local/DB time)`);

    // 4. Query punches from MS SQL Server
    const queryResult = await pool.request()
      .input('sinceDate', mssql.DateTime2, sinceDate)
      .query(`
        SELECT EmployeeCode, LogDateTime, Direction, DeviceId 
        FROM Attlogs 
        WHERE LogDateTime >= @sinceDate
        ORDER BY LogDateTime ASC
      `);

    const punches = queryResult.recordset;
    console.log(`📥 Fetched ${punches.length} new punch logs from database.`);

    if (punches.length === 0) {
      console.log("😴 No new punches to sync.");
      // Even if no punches, update sync time to now to prevent querying ancient empty periods
      saveLastSyncTime(new Date());
      return;
    }

    // 5. Group punches by EmployeeCode and Date (YYYY-MM-DD)
    const punchesByGroup = {};
    let latestPunchTimeInBatch = sinceDate;

    for (const punch of punches) {
      if (!punch.EmployeeCode || !punch.LogDateTime) continue;

      const empCode = punch.EmployeeCode.toString().trim();
      const rawDate = new Date(punch.LogDateTime);
      
      // Adjust timezone offset: SQL Server datetime is stored in local time 
      // but read as UTC by the driver. We adjust it to actual UTC so that
      // when the cloud ERP displays it in local time, it shows the correct punch time.
      const timezoneOffsetMs = rawDate.getTimezoneOffset() * 60 * 1000;
      const logDateTime = new Date(rawDate.getTime() + timezoneOffsetMs);
      
      // Update our high-water mark sync timestamp
      if (logDateTime > latestPunchTimeInBatch) {
        latestPunchTimeInBatch = logDateTime;
      }

      // Convert punch time to local date string (YYYY-MM-DD) safely
      const dateStr = logDateTime.toISOString().substring(0, 10);
      const key = `${empCode}_${dateStr}`;

      if (!punchesByGroup[key]) {
        punchesByGroup[key] = {
          empCode,
          dateStr,
          times: []
        };
      }
      punchesByGroup[key].times.push(logDateTime);
    }

    // 6. Process and sync groups to Supabase
    let successCount = 0;
    let skippedCount = 0;

    for (const key in punchesByGroup) {
      const group = punchesByGroup[key];
      
      // Find matching profile in ERP
      const emp = profiles.find(p => 
        p.biometric_id === group.empCode || 
        (p.biometric_id && Number(p.biometric_id) === Number(group.empCode))
      );

      if (!emp) {
        console.warn(`⚠️ Skipped punch: Employee Code [${group.empCode}] is not mapped to any biometric_id in Supabase.`);
        skippedCount++;
        continue;
      }

      // Sort punch times for this day
      group.times.sort((a, b) => a - b);
      
      const clockIn = group.times[0];
      // and at least 15 minutes (900000 ms) after the clock in to prevent double-punch/testing errors
      let clockOut = null;
      if (group.times.length > 1) {
        const lastPunch = group.times[group.times.length - 1];
        if (lastPunch.getTime() - clockIn.getTime() >= 15 * 60 * 1000) {
          clockOut = lastPunch;
        }
      }

      const clockInIso = clockIn.toISOString();
      const clockOutIso = clockOut ? clockOut.toISOString() : null;

      // Helper to display time in local timezone in the console logs
      const getLocalTimeDisplay = (dateObj) => {
        if (!dateObj) return '';
        const localDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60 * 1000));
        return localDate.toISOString().substring(11, 19);
      };

      console.log(`🔄 Syncing: [${group.empCode}] for Date ${group.dateStr} -> In: ${getLocalTimeDisplay(clockIn)}${clockOut ? ', Out: ' + getLocalTimeDisplay(clockOut) : ''}`);

      // Check if attendance log already exists in Supabase
      const { data: existing, error: existErr } = await supabase
        .from('attendance_logs')
        .select('id, clock_in, clock_out')
        .eq('employee_id', emp.id)
        .eq('date', group.dateStr)
        .maybeSingle();

      if (existErr) {
        console.error(`❌ Error checking existing attendance for employee [${emp.id}]:`, existErr.message);
        continue;
      }

      if (existing) {
        // CRITICAL FIX: Always keep the EARLIEST clock_in.
        // When a new sync batch only contains a later punch (e.g. lunch-out),
        // the new clockIn would wrongly overwrite the real morning clock_in.
        let finalClockIn = clockInIso;
        if (existing.clock_in) {
          const existingClockInMs = new Date(existing.clock_in).getTime();
          if (existingClockInMs < clockIn.getTime()) {
            // Existing clock_in is earlier — keep it
            finalClockIn = existing.clock_in;
            console.log(`🔒 Keeping earlier clock_in [${existing.clock_in}] over new [${clockInIso}]`);
          }
        }

        // For clock_out: keep the LATEST punch if it's more than 15 mins after finalClockIn
        let finalClockOut = clockOutIso;
        if (!finalClockOut && existing.clock_out) {
          // No new clock_out in this batch — preserve the existing one
          finalClockOut = existing.clock_out;
        } else if (existing.clock_out && clockOutIso) {
          // Both exist — keep the later one
          const existingClockOutMs = new Date(existing.clock_out).getTime();
          const newClockOutMs = new Date(clockOutIso).getTime();
          if (existingClockOutMs > newClockOutMs) {
            finalClockOut = existing.clock_out;
          }
        }

        const { error: updateErr } = await supabase
          .from('attendance_logs')
          .update({
            clock_in: finalClockIn,
            clock_out: finalClockOut || null,
            status: 'present'
          })
          .eq('id', existing.id);

        if (updateErr) {
          console.error(`❌ Failed to update attendance [${existing.id}]:`, updateErr.message);
        } else {
          successCount++;
        }
      } else {
        // Insert new log
        const { error: insertErr } = await supabase
          .from('attendance_logs')
          .insert({
            employee_id: emp.id,
            company_id: emp.company_id,
            date: group.dateStr,
            status: 'present',
            clock_in: clockInIso,
            clock_out: clockOutIso || null
          });

        if (insertErr) {
          console.error(`❌ Failed to insert attendance for employee [${emp.id}]:`, insertErr.message);
        } else {
          successCount++;
        }
      }
    }

    console.log(`\n🎉 Sync Batch Completed! Successfully Upserted: ${successCount}, Unmapped/Skipped: ${skippedCount}`);

    // 7. Save high-water mark to prevent duplicate processing of older logs
    // Add 1 second to the latest punch time to avoid re-querying the exact last punch
    const nextSyncStart = new Date(latestPunchTimeInBatch.getTime() + 1000);
    saveLastSyncTime(nextSyncStart);

  } catch (err) {
    console.error("❌ Live Sync failed with error:", err.message);
  } finally {
    if (pool) {
      await pool.close();
      console.log("🔌 SQL Server connection pool closed.");
    }
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startSyncDaemon() {
  while (true) {
    try {
      await runSync();
    } catch (err) {
      console.error("❌ Fatal error in daemon sync loop:", err.message);
    }
    console.log(`😴 Sleeping for 2 minutes before next sync check...`);
    await sleep(2 * 60 * 1000); // 2 minutes in milliseconds
  }
}

startSyncDaemon();
