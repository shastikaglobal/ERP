/**
 * Real-time verification test:
 * 1. Subscribes to active_sessions changes
 * 2. Updates Karunya's last_active to NOW
 * 3. Confirms the realtime event fires within 2 seconds
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

let eventReceived = false;

// Step 1: Subscribe to changes
const channel = sb.channel("verify-realtime")
  .on("postgres_changes", {
    event: "UPDATE",
    schema: "public",
    table: "active_sessions"
  }, (payload) => {
    const elapsed = Date.now() - triggerTime;
    console.log(`✅ Realtime event received in ${elapsed}ms!`);
    console.log(`   user: ${payload.new.profile_name}, last_active: ${payload.new.last_active}`);
    eventReceived = true;
  })
  .subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      console.log("📡 Realtime channel subscribed. Triggering test update...");
      
      // Step 2: Update last_active for Karunya
      triggerTime = Date.now();
      const { error } = await sb.from("active_sessions")
        .update({ last_active: new Date().toISOString() })
        .eq("user_id", "59df2897-02e4-4ab3-80ba-dc016642ba04");
      
      if (error) {
        console.error("❌ Update failed:", error.message);
      } else {
        console.log("⬆️  Update sent to database. Waiting for realtime event...");
      }
    }
  });

let triggerTime = 0;

// Step 3: Check after 5 seconds
setTimeout(async () => {
  if (!eventReceived) {
    console.log("⚠️  No realtime event received after 5s. Channel may not be in publication.");
  }
  await sb.removeChannel(channel);
  process.exit(0);
}, 6000);
