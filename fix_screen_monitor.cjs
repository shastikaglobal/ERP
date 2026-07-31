const fs = require('fs');
const path = 'e:\\SHASTI\\backuperp\\backuperp\\src\\pages\\crm\\ScreenMonitor.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/import \{ supabase \} from "@\/integrations\/supabase\/client";\n?/g, '');
content = content.replace(/import \{ useAuth \} from "@\/hooks\/useAuth";\n?/g, '');
content = content.replace(/import \{ Button \} from "@\/components\/ui\/button";/g, 'import { Button } from "@/components/ui/button";\nimport { useAuth } from "@/hooks/useAuth";');

content = content.replace(
  /await \(supabase\.from\("screen_signals"\) as any\)\.insert\(\{[\s\n]*from_user_id: adminId\.current,[\s\n]*to_user_id: targetUser\.id,[\s\n]*signal_type: "candidate",[\s\n]*payload: JSON\.stringify\(e\.candidate\)[\s\n]*\}\);/,
  `await fetch('/api/analytics/screen_signals', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from_user_id: adminId.current, to_user_id: targetUser.id, signal_type: "candidate", payload: JSON.stringify(e.candidate) }) });`
);

content = content.replace(
  /await \(supabase\.from\("screen_signals"\) as any\)\.insert\(\{[\s\n]*from_user_id: adminId\.current,[\s\n]*to_user_id: targetUser\.id,[\s\n]*signal_type: "watch_request",[\s\n]*payload: JSON\.stringify\(\{ adminId: adminId\.current \}\)[\s\n]*\}\);/,
  `await fetch('/api/analytics/screen_signals', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ from_user_id: adminId.current, to_user_id: targetUser.id, signal_type: "watch_request", payload: JSON.stringify({ adminId: adminId.current }) }) });`
);

content = content.replace(
  /supabase\.removeChannel\(channel\);/g,
  ``
);

content = content.replace(
  /supabase\.auth\.getSession\(\)\.then\(\(\{ data: \{ session \} \}\) => \{\s*if \(session\?\.user\) setMyUserId\(session\.user\.id\);\s*\}\);/,
  `// Session user ID is now handled via useAuth Hook`
);

content = content.replace(
  /const \{ data: profilesData \} = await supabase\.from\("profiles"\)\.select\("id, full_name, requested_role"\);/,
  `const pRes = await fetch('/api/employees', { credentials: 'include' });\n      const profilesData = await pRes.json().catch(() => []);`
);

content = content.replace(
  /const \{ data: logsData \} = await \(supabase\.from\("activity_logs"\) as any\)\s*\.select\("\*"\)\s*\.order\("created_at", \{ ascending: false \}\);/,
  `const lRes = await fetch('/api/analytics/activity_logs', { credentials: 'include' });\n      const logsData = await lRes.json().catch(() => []);`
);

content = content.replace(
  /const logsSubscription = supabase\s*\.channel\("activity-screen-monitor"\)\s*\.on\("postgres_changes", \{ event: "INSERT", schema: "public", table: "activity_logs" \}, \(payload\) => \{([\s\S]*?)\}\)\s*\.subscribe\(\);/,
  `// Real-time via polling
    const logsSubscription = setInterval(async () => {
      const res = await fetch('/api/analytics/activity_logs', { credentials: 'include' });
      if (res.ok) {
        const newLogs = await res.json();
        // Just re-fetch initial data to sync everything instead of complex delta logic
        if (newLogs && newLogs.length > 0) {
           fetchInitialData();
        }
      }
    }, 10000);`
);

content = content.replace(
  /supabase\.removeChannel\(logsSubscription\);/,
  `clearInterval(logsSubscription);`
);

// Add useAuth to ScreenMonitor
content = content.replace(
  /export default function ScreenMonitor\(\) \{/,
  `export default function ScreenMonitor() {
  const { session } = useAuth();
  useEffect(() => {
    if (session?.user?.id) setMyUserId(session.user.id);
  }, [session]);`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Replaced successfully");
