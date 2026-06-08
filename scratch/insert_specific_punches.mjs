import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const dateStr = `${year}-${month}-${day}`; // 2026-06-06

function getPunchTime(hh, mm) {
  const d = new Date(year, today.getMonth(), today.getDate(), hh, mm, 0);
  return d.toISOString();
}

const punches = [
  { name: 'Gayathri', id: '700d7c5e-a48c-45b3-a585-b25ae230e598', time: getPunchTime(7, 56) },
  { name: 'Madhu', id: 'ab83656d-1a62-40c0-8603-f3fb1fa16c5b', time: getPunchTime(7, 56) },
  { name: 'Jayasri', id: '77c6a842-dca1-4765-851a-d5d066cb876d', time: getPunchTime(7, 56) },
  { name: 'Sathpreethi', id: 'd7c9e4b7-d6db-45ce-aa54-ce0f1a494daa', time: getPunchTime(7, 56) },
  
  { name: 'Uma', id: 'f75da685-2a51-4b42-a804-b44fb296b639', time: getPunchTime(7, 57) },
  { name: 'Karunya', id: '59df2897-02e4-4ab3-80ba-dc016642ba04', time: getPunchTime(7, 57) },
  { name: 'Swathi', id: '4722ecc8-ec1f-4afb-acf8-444d3bdba677', time: getPunchTime(7, 57) },
  
  { name: 'Narmatha', id: '0a98a02b-8269-4aca-903c-63952697fab5', time: getPunchTime(9, 16) }
];

async function insertPunches() {
  for (const p of punches) {
    const { error } = await supabase.from('attendance_logs').insert({
      employee_id: p.id,
      date: dateStr,
      status: 'present',
      clock_in: p.time,
      is_manual: true,
      notes: 'Added manually via admin'
    });
    if (error) {
      console.error(`❌ Failed to insert for ${p.name}:`, error.message);
    } else {
      console.log(`✅ Inserted ${p.name} at ${new Date(p.time).toLocaleTimeString()}`);
    }
  }
}

insertPunches();
