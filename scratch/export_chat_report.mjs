import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = "https://sxebygxpjzntogzpjnga.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4ZWJ5Z3hwanpudG9nenBqbmdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMjc5MzksImV4cCI6MjA5MjkwMzkzOX0.rtClmtuPuNicVQvBkITzY6PfFsh8yOYq3ykWoL9Ab_4";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log("Fetching all chat messages...");
  const { data: messages, error } = await supabase
    .from('team_chat')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Failed to fetch messages:", error);
    return;
  }

  console.log(`Fetched ${messages.length} messages. Formatting report...`);

  let mdContent = `# Team Chat Export Report\n\n`;
  mdContent += `Generated on: ${new Date().toLocaleString('en-IN')}\n`;
  mdContent += `Total Messages: ${messages.length}\n\n`;
  mdContent += `| Timestamp (IST) | Sender | Message | Attachment / Info |\n`;
  mdContent += `| --- | --- | --- | --- |\n`;

  for (const msg of messages) {
    const timeStr = new Date(msg.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const sender = msg.sender_name || 'Unknown';
    const cleanMsg = (msg.message || '').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|');
    
    let attachmentInfo = '-';
    if (msg.file_url) {
      attachmentInfo = `📎 File: ${msg.file_type || 'Unknown'} (${(msg.file_size ? (msg.file_size / 1024).toFixed(1) : 0)} KB)`;
    }
    if (msg.edited) {
      attachmentInfo += ' (Edited)';
    }

    mdContent += `| ${timeStr} | ${sender} | ${cleanMsg} | ${attachmentInfo} |\n`;
  }

  const workspaceReportPath = "d:/ERP1/ERP/scratch/team_chat_report.md";
  const artifactReportPath = "C:/Users/karun/.gemini/antigravity-ide/brain/9fb86da8-168d-4544-9920-2d392166f550/team_chat_report.md";

  fs.writeFileSync(workspaceReportPath, mdContent, 'utf-8');
  fs.writeFileSync(artifactReportPath, mdContent, 'utf-8');

  console.log(`Report successfully written to:\n - ${workspaceReportPath}\n - ${artifactReportPath}`);
}

main();
