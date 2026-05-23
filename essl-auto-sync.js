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

// Helper function to format date from eSSL (usually "DD-MM-YYYY" or "YYYY-MM-DD")
function parseDateString(dateStr) {
  if (!dateStr) return null;
  // If Excel gives a serial number date
  if (typeof dateStr === 'number') {
    const d = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
    return d.toISOString().split('T')[0];
  }
  // Try parsing string
  if (dateStr.includes('/')) return dateStr.split('/').reverse().join('-');
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 2) return `${parts[2]}-${parts[1]}-${parts[0]}`; // DD-MM-YYYY -> YYYY-MM-DD
    return dateStr;
  }
  return null;
}

// Helper to convert time "10:30" or "10:30:00" to valid ISO timestamp
function createIsoTimestamp(dateStr, timeStr) {
  if (!timeStr || timeStr === '--:--' || timeStr.trim() === '') return null;
  
  // If Excel gave decimal fraction for time
  if (typeof timeStr === 'number') {
    const totalSeconds = Math.round(timeStr * 86400);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    timeStr = `${hours}:${minutes}`;
  }

  const dStr = parseDateString(dateStr);
  if (!dStr) return null;

  try {
    return new Date(`${dStr}T${timeStr.substring(0,5)}:00`).toISOString();
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
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let successCount = 0;
    let skippedCount = 0;

    for (const row of data) {
      // Map based on provided exact columns:
      // Employee Code, Date, In Time, Out Time, Status
      const bioId = row['Employee Code']?.toString().trim();
      const rawDate = row['Date'];
      const rawInTime = row['In Time'];
      const rawOutTime = row['Out Time'];
      let status = row['Status']?.toString().toLowerCase().includes('absent') ? 'absent' : 'present';
      
      // Some exports use 'A' for absent, 'P' for present
      if (row['Status'] === 'A') status = 'absent';

      if (!bioId || !rawDate) continue;

      // Find employee in ERP
      const emp = profiles.find(p => p.biometric_id === bioId);
      if (!emp) {
        // Employee not mapped yet
        skippedCount++;
        continue;
      }

      const isoDate = parseDateString(rawDate);
      const isoIn = createIsoTimestamp(rawDate, rawInTime);
      const isoOut = createIsoTimestamp(rawDate, rawOutTime);

      if (!isoDate) continue;

      // Check if record exists
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
