const db = require('../adms-sync/db');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  try {
    const biometricId = '1005';
    const punchTimeStr = '2026-06-12 12:30:00'; // Target punch time
    const directionStr = '1'; // 1 = out

    // Fetch profiles
    const { data: profiles } = await supabase.from('profiles').select('id, company_id, biometric_id');
    const emp = profiles.find(p => p.biometric_id === biometricId || (p.biometric_id && Number(p.biometric_id) === Number(biometricId)));
    
    if (!emp) {
      console.log("No profile found.");
      return;
    }

    const dateStr = punchTimeStr.split(' ')[0];
    const tzOffset = '+05:30';
    const punchTimeUTC = new Date(punchTimeStr.replace(' ', 'T') + tzOffset);
    const punchTimeIso = punchTimeUTC.toISOString();

    console.log("biometricId:", biometricId);
    console.log("emp.id:", emp.id);
    console.log("dateStr:", dateStr);
    console.log("punchTimeIso:", punchTimeIso);

    // Query existing record
    let existing = null;
    const { rows } = await db.query(
      'SELECT * FROM attendance_logs WHERE employee_id = $1 AND date = $2 LIMIT 1',
      [emp.id, dateStr]
    );
    if (rows.length > 0) existing = rows[0];

    console.log("Existing record in DB before sync:", existing);

    if (!existing) {
      console.log("No existing record. Would insert new check-in.");
    } else {
      console.log("Record exists. Simulating update logic...");
      let updatedClockIn = existing.clock_in;
      let updatedClockOut = existing.clock_out;

      console.log("Before: updatedClockIn type:", typeof updatedClockIn, "value:", updatedClockIn);
      console.log("Before: updatedClockOut type:", typeof updatedClockOut, "value:", updatedClockOut);

      const currentPunchTimeMs = punchTimeUTC.getTime();

      if (!updatedClockIn) {
        updatedClockIn = punchTimeIso;
      } else {
        const existingInMs = new Date(updatedClockIn).getTime();
        if (currentPunchTimeMs < existingInMs) {
          updatedClockIn = punchTimeIso;
        }
      }

      const existingInMs = new Date(updatedClockIn).getTime();
      if (currentPunchTimeMs > existingInMs) {
        if (!updatedClockOut) {
          if (currentPunchTimeMs - existingInMs >= 60 * 1000) {
            updatedClockOut = punchTimeIso;
          }
        } else {
          const existingOutMs = new Date(updatedClockOut).getTime();
          if (currentPunchTimeMs > existingOutMs) {
            updatedClockOut = punchTimeIso;
          }
        }
      }

      console.log("After checks: updatedClockIn type:", typeof updatedClockIn, "value:", updatedClockIn);
      console.log("After checks: updatedClockOut type:", typeof updatedClockOut, "value:", updatedClockOut);

      // Now run the try/catch logic exactly as server.js:
      try {
        updatedClockIn = updatedClockIn ? new Date(updatedClockIn).toISOString() : null;
        updatedClockOut = updatedClockOut ? new Date(updatedClockOut).toISOString() : null;

        console.log("After conversion: updatedClockIn type:", typeof updatedClockIn, "value:", updatedClockIn);
        console.log("After conversion: updatedClockOut type:", typeof updatedClockOut, "value:", updatedClockOut);

        // Run the query (but do not commit or run actual DB query if we don't want, let's run it anyway since we can change it back)
        await db.query(
          'UPDATE attendance_logs SET clock_in = $1, clock_out = $2, status = $3 WHERE id = $4',
          [updatedClockIn, updatedClockOut, 'present', existing.id]
        );

        console.log(`In substring type check:`, typeof updatedClockIn);
        console.log(`Out substring type check:`, typeof updatedClockOut);

        console.log(`🔄 Updated attendance for employee [${emp.id}] on ${dateStr}: In=${updatedClockIn?.substring(11,19)}, Out=${updatedClockOut?.substring(11,19)}`);
        console.log("Update success!");
      } catch (updateErr) {
        console.error(`❌ Failed to update attendance [${existing.id}]:`, updateErr.message);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
