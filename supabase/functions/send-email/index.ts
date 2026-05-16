import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { encodeBase64 } from "https://deno.land/std@0.203.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { to, subject, text, html, attachments, companyId, accountId } = body;

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Find account
    let account;
    if (accountId) {
      const { data } = await supabaseClient
        .from("zoho_accounts")
        .select("*")
        .eq("id", accountId)
        .single();
      if (data) account = data;
    }

    if (!account) {
      const { data } = await supabaseClient
        .from("zoho_accounts")
        .select("*")
        .eq("company_id", companyId)
        .limit(1);
      if (data?.length) account = data[0];
    }

    if (!account) throw new Error("No connected Zoho account found.");

    const apiDomain = account.account_email?.endsWith('.com') ? 'zoho.com' : 'zoho.in';
    
    // 2. Refresh token
    let accessToken = account.access_token;
    const now = new Date();
    const expiry = new Date(account.expiry_time);

    if (now.getTime() > expiry.getTime() - 300000) {
      const refreshResponse = await fetch(`https://accounts.${apiDomain}/oauth/v2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          refresh_token: account.refresh_token,
          client_id: Deno.env.get("ZOHO_CLIENT_ID")!,
          client_secret: Deno.env.get("ZOHO_CLIENT_SECRET")!,
          grant_type: "refresh_token",
        }),
      });
      const refreshData = await refreshResponse.json();
      if (refreshData.access_token) {
        accessToken = refreshData.access_token;
        const newExpiry = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();
        await supabaseClient.from("zoho_accounts").update({
          access_token: accessToken,
          expiry_time: newExpiry,
        }).eq("id", account.id);
      }
    }

    // 3. Get verified Zoho account ID
    let zohoId = account.zoho_account_id;
    if (!zohoId) {
      const accsResp = await fetch(`https://mail.${apiDomain}/api/accounts`, {
        headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
      });
      const accsData = await accsResp.json();
      if (accsData.data?.[0]?.accountId) {
        zohoId = accsData.data[0].accountId;
        await supabaseClient.from("zoho_accounts").update({ zoho_account_id: zohoId }).eq("id", account.id);
      }
    }

    if (!zohoId) throw new Error("Could not retrieve Zoho Account ID.");

    // 4. Process attachments
    const processedAttachments = [];
    if (Array.isArray(attachments)) {
      for (const att of attachments) {
        if (!att.path) continue;
        const { data: fileData, error } = await supabaseClient.storage.from("email-attachments").download(att.path);
        if (error || !fileData) continue;
        const bytes = new Uint8Array(await fileData.arrayBuffer());
        processedAttachments.push({
          name: att.filename,
          content: encodeBase64(bytes),
          isInline: false,
        });
      }
    }

    // 5. Send via Zoho Mail API
    const sendUrl = `https://mail.${apiDomain}/api/accounts/${zohoId}/messages`;
    
    // Prepare body
    const mailData: any = {
      fromAddress: account.account_email,
      toAddress: to,
      subject: subject || "(No Subject)",
      content: html || text || " ",
      mailFormat: html ? "html" : "text"
    };

    if (processedAttachments.length > 0) {
      mailData.attachments = processedAttachments;
    }

    const response = await fetch(sendUrl, {
      method: "POST",
      headers: {
        "Authorization": `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mailData),
    });

    const result = await response.json();
    
    if (!response.ok) {
      // RETURN DETAILED ERROR BODY TO FRONTEND
      const errorMessage = result.status?.description || JSON.stringify(result);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Zoho rejected the request: ${errorMessage}` 
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 6. Save history
    try {
      await supabaseClient.from("emails").insert({
        account_id: account.id,
        company_id: companyId,
        to_address: to,
        subject: subject || "(No Subject)",
        body: html || text,
      });
    } catch (dbErr) {
      console.warn("Could not save history, but email was sent:", dbErr);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully", messageId: result.data?.messageId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});