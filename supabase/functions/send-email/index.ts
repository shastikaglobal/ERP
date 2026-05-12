import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

// Technical Polyfill needed for modern Deno environments
if (typeof Deno.writeAll !== "function") {
  Deno.writeAll = async (w: any, data: Uint8Array) => {
    let nwritten = 0;
    while (nwritten < data.length) {
      nwritten += await w.write(data.subarray(nwritten));
    }
  };
}

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
      port: parseInt(String(company.smtp_port) || "587"),
      username: company.smtp_user,
      password: company.smtp_pass,
      from: company.from_email || company.smtp_user
    };

    const processedAttachments = [];
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        const response = await fetch(att.url);
        const buffer = await response.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }

        processedAttachments.push({
          filename: att.filename,
          content: btoa(binary),
          encoding: "base64"
        });
      }
    }

    const client = new SmtpClient();
    
    try {
      if (smtpConfig.port === 465) {
        await client.connectTLS({
          hostname: smtpConfig.hostname,
          port: smtpConfig.port,
          username: smtpConfig.username,
          password: smtpConfig.password,
        });
      } else {
        await client.connect({
          hostname: smtpConfig.hostname,
          port: smtpConfig.port,
          username: smtpConfig.username,
          password: smtpConfig.password,
        });
      }

      await client.send({
        from: smtpConfig.from,
        to: to,
        subject: subject,
        content: text || "HTML Email",
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
      return new Response(JSON.stringify({ error: smtpErr.message }), {
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
