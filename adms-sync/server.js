const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
globalThis.WebSocket = ws;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8082;

// Initialize Supabase Client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ CRITICAL ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Use raw text body parser to handle the tab-separated values sent by ZKTeco devices
app.use(express.text({ type: '*/*', limit: '10mb' }));

console.log("🚀 Starting ADMS Sync Server...");
console.log(`🔗 Supabase Target URL: ${SUPABASE_URL}`);

/**
 * 1. GET /iclock/cdata - Handshake & Device Initialization
 * Device queries server configurations and registers itself.
 */
app.get('/iclock/cdata', (req, res) => {
  const sn = req.query.SN || 'UNKNOWN';
  console.log(`\n📡 [GET /iclock/cdata] Handshake received from device SN: ${sn}`);
  console.log("Params:", req.query);

  // Configuration options to send back to the device to control sync behavior
  const responseConfig = [
    `GET OPTION FROM: ${sn}`,
    `Stamp=${Date.now()}`,
    `OpStamp=${process.env.ADMS_OP_STAMP || '1'}`,
    `ErrorDelay=${process.env.ADMS_ERROR_DELAY || '60'}`,
    `Delay=${process.env.ADMS_DELAY || '30'}`,
    `TransTimes=${process.env.ADMS_TRANS_TIMES || '00:00;23:59'}`,
    `TransInterval=${process.env.ADMS_TRANS_INTERVAL || '1'}`,
    `TransFlag=${process.env.ADMS_TRANS_FLAG || '1111111111'}`,
    `Realtime=${process.env.ADMS_REALTIME || '1'}`,
    `Encrypt=${process.env.ADMS_ENCRYPT || '0'}`
  ].join('\r\n') + '\r\n';

  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send(responseConfig);
});

/**
 * 2. POST /iclock/cdata - Receive Punch Logs (ATTLOG) & Operation Logs (OPERLOG)
 * The device pushes new attendance records here.
 */
app.post('/iclock/cdata', async (req, res) => {
  const sn = req.query.SN || 'UNKNOWN';
  const table = req.query.table || 'UNKNOWN';
  console.log(`\n📥 [POST /iclock/cdata] Data upload from SN: ${sn}, Table: ${table}`);

  const rawData = req.body;
  if (!rawData || rawData.trim() === '') {
    console.log("⚠️ Received empty payload.");
    return res.status(200).send('OK');
  }

  // Handle Attendance Logs
  if (table.toUpperCase() === 'ATTLOG') {
    try {
      const lines = rawData.split(/\r?\n/);
      console.log(`📦 Parsing ${lines.length} lines of attendance logs...`);

      // Fetch active profiles from Supabase to map biometric IDs to employee IDs
      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, company_id, biometric_id');

      if (profErr) {
        console.error("❌ Failed to load profiles from Supabase:", profErr.message);
        // Respond OK anyway so device doesn't get stuck, but log the error
        return res.status(200).send('OK');
      }

      let processedCount = 0;

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // ATTLOG format: User-PIN \t Timestamp \t Status \t VerifyMode \t WorkCode ...
        const parts = line.split('\t');
        const biometricId = parts[0]?.trim();
        const punchTimeStr = parts[1]?.trim(); // Format: YYYY-MM-DD HH:mm:ss

        if (!biometricId || !punchTimeStr) {
          console.warn(`⚠️ Skipped invalid line format: "${line}"`);
          continue;
        }

        // Match profile by biometric_id
        const emp = profiles.find(p => 
          p.biometric_id === biometricId || 
          (p.biometric_id && Number(p.biometric_id) === Number(biometricId))
        );

        if (!emp) {
          console.warn(`⚠️ Skipped punch: Biometric ID [${biometricId}] is not mapped to any profile in Supabase.`);
          continue;
        }

        // Parse punch timestamp
        const dateParts = punchTimeStr.split(' ');
        const dateStr = dateParts[0]; // "YYYY-MM-DD"
        
        // Assume device is running in India Standard Time (+05:30)
        const tzOffset = process.env.DEVICE_TIMEZONE_OFFSET || '+05:30';
        const punchTimeUTC = new Date(punchTimeStr.replace(' ', 'T') + tzOffset);

        if (isNaN(punchTimeUTC.getTime())) {
          console.error(`❌ Invalid timestamp parsed: "${punchTimeStr}"`);
          continue;
        }

        const punchTimeIso = punchTimeUTC.toISOString();

        // Check if attendance record already exists for this day
        const { data: existing, error: existErr } = await supabase
          .from('attendance_logs')
          .select('*')
          .eq('employee_id', emp.id)
          .eq('date', dateStr)
          .maybeSingle();

        if (existErr) {
          console.error(`❌ DB error checking attendance for employee [${emp.id}] on [${dateStr}]:`, existErr.message);
          continue;
        }

        if (!existing) {
          // Create new record with clock_in = punchTime
          const { error: insertErr } = await supabase
            .from('attendance_logs')
            .insert({
              employee_id: emp.id,
              company_id: emp.company_id,
              date: dateStr,
              status: 'present',
              clock_in: punchTimeIso,
              clock_out: null
            });

          if (insertErr) {
            console.error(`❌ Failed to insert attendance:`, insertErr.message);
          } else {
            console.log(`✅ Logged Clock-In for employee [${emp.id}] on ${dateStr} at ${punchTimeIso}`);
            processedCount++;
          }
        } else {
          // Record exists. Update clock_in or clock_out.
          let updatedClockIn = existing.clock_in;
          let updatedClockOut = existing.clock_out;

          const currentPunchTimeMs = punchTimeUTC.getTime();

          if (!updatedClockIn) {
            updatedClockIn = punchTimeIso;
          } else {
            const existingInMs = new Date(updatedClockIn).getTime();
            if (currentPunchTimeMs < existingInMs) {
              updatedClockIn = punchTimeIso; // Earlier punch is clock_in
            }
          }

          // Update clock_out if the punch is later than clock_in and at least 1 minute apart
          const existingInMs = new Date(updatedClockIn).getTime();
          if (currentPunchTimeMs > existingInMs) {
            if (!updatedClockOut) {
              if (currentPunchTimeMs - existingInMs >= 60 * 1000) { // 1 min buffer
                updatedClockOut = punchTimeIso;
              }
            } else {
              const existingOutMs = new Date(updatedClockOut).getTime();
              if (currentPunchTimeMs > existingOutMs) {
                updatedClockOut = punchTimeIso; // Later punch is clock_out
              }
            }
          }

          const { error: updateErr } = await supabase
            .from('attendance_logs')
            .update({
              clock_in: updatedClockIn,
              clock_out: updatedClockOut,
              status: 'present'
            })
            .eq('id', existing.id);

          if (updateErr) {
            console.error(`❌ Failed to update attendance [${existing.id}]:`, updateErr.message);
          } else {
            console.log(`🔄 Updated attendance for employee [${emp.id}] on ${dateStr}: In=${updatedClockIn?.substring(11,19)}, Out=${updatedClockOut?.substring(11,19)}`);
            processedCount++;
          }
        }
      }

      console.log(`🎉 Sync completed. Successfully processed ${processedCount} punch(es).`);
    } catch (err) {
      console.error("❌ Exception during ATTLOG parsing:", err);
    }
  }

  // Respond with OK to acknowledge receipt
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send('OK');
});

/**
 * 3. GET /iclock/getrequest - Pending commands query
 * Device asks server if there are any commands to execute.
 */
app.get('/iclock/getrequest', (req, res) => {
  const sn = req.query.SN || 'UNKNOWN';
  console.log(`\n⏳ [GET /iclock/getrequest] Command request from SN: ${sn}`);
  
  // Return OK indicating no pending commands
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send('OK');
});

/**
 * 4. POST /iclock/devicecmd - Command Execution Result
 * Device posts the execution result of commands.
 */
app.post('/iclock/devicecmd', (req, res) => {
  const sn = req.query.SN || 'UNKNOWN';
  console.log(`\n📥 [POST /iclock/devicecmd] Command execution report from SN: ${sn}`);
  console.log("Payload:", req.body);

  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send('OK');
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🟢 ADMS Sync Server is listening on http://0.0.0.0:${PORT}`);
});
