import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { to, subject, text, html, attachments, companyId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: company } = await supabaseClient.from("companies").select("*").eq("id", companyId).single();

    if (!company?.smtp_host || !company?.smtp_user || !company?.smtp_pass) {
      throw new Error("SMTP settings are incomplete.");
    }

    const smtpConfig = {
      hostname: company.smtp_host,
      port: parseInt(company.smtp_port || "587"),
      username: company.smtp_user,
      password: company.smtp_pass,
      from: company.from_email || company.smtp_user
    };

    // 1. Process attachments
    const processedAttachments = [];
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        const response = await fetch(att.url);
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        const uint8 = new Uint8Array(buffer);
        
        // Convert to base64 for deno-smtp
        let binary = "";
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        processedAttachments.push({
          filename: att.filename,
          content: base64,
          encoding: "base64"
        });
      }
    }

    const client = new SmtpClient();
    
    try {
      const connConfig = {
        hostname: smtpConfig.hostname,
        port: smtpConfig.port,
        username: smtpConfig.username,
        password: smtpConfig.password,
      };

      if (smtpConfig.port === 465) {
        await client.connectTLS(connConfig);
      } else {
        await client.connect(connConfig);
      }

      await client.send({
        from: smtpConfig.from,
        to: to,
        subject: subject,
        content: text || "This email requires an HTML compatible viewer",
        html: html || text,
        attachments: processedAttachments
      });

      await client.close();
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } catch (smtpErr) {
      console.error("SMTP Error:", smtpErr);
      return new Response(JSON.stringify({ error: `Zoho Error: ${smtpErr.message}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
