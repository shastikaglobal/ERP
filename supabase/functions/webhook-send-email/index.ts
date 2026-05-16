import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Clean email addresses — strips display names and angle brackets
// "John Doe <john@example.com>" → "john@example.com"
const cleanEmail = (email: string): string => {
  if (!email) return email;
  const match = email.match(/<([^>]+)>/);
  return match ? match[1].trim() : email.trim();
};

Deno.serve(async (req) => {
  let emailId: string | null = null;

  try {
    const payload = await req.json();

    // Webhook payload contains the new row in `record`
    const record = payload.record;
    if (!record || record.status !== 'pending') {
      return new Response("Ignored", { status: 200 });
    }

    const {
      id,
      to_address: to,
      subject,
      body_html: html,
      body_text: text,
      attachments,
      company_id: companyId,
      account_id: accountId
    } = record;

    emailId = id;

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Update status to 'sending' immediately
    await supabaseClient
      .from("emails")
      .update({ status: 'sending' })
      .eq('id', emailId);

    // 1. Find Zoho account
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

    // Determine API domain from account email
    const apiDomain = account.account_email?.endsWith('.com') ? 'zoho.com' : 'zoho.in';

    // 2. Refresh token if expiring within 5 minutes
    let accessToken = account.access_token;
    const now = new Date();
    const expiry = new Date(account.expiry_time);

    if (now.getTime() > expiry.getTime() - 300000) {
      const refreshResponse = await fetch(
        `https://accounts.${apiDomain}/oauth/v2/token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            refresh_token: account.refresh_token,
            client_id: Deno.env.get("ZOHO_CLIENT_ID")!,
            client_secret: Deno.env.get("ZOHO_CLIENT_SECRET")!,
            grant_type: "refresh_token",
          }),
        }
      );
      const refreshData = await refreshResponse.json();
      if (refreshData.access_token) {
        accessToken = refreshData.access_token;
        const newExpiry = new Date(
          Date.now() + refreshData.expires_in * 1000
        ).toISOString();
        await supabaseClient
          .from("zoho_accounts")
          .update({ access_token: accessToken, expiry_time: newExpiry })
          .eq("id", account.id);
      } else {
        throw new Error("Token refresh failed: " + JSON.stringify(refreshData));
      }
    }

    // 3. Get Zoho account ID (always as string to avoid JS precision loss)
    let zohoId = account.zoho_account_id
      ? String(account.zoho_account_id)
      : null;

    if (!zohoId) {
      const accsResp = await fetch(
        `https://mail.${apiDomain}/api/accounts`,
        { headers: { Authorization: `Zoho-oauthtoken ${accessToken}` } }
      );
      const accsData = await accsResp.json();
      if (accsData.data?.[0]?.accountId) {
        zohoId = String(accsData.data[0].accountId);
        await supabaseClient
          .from("zoho_accounts")
          .update({ zoho_account_id: zohoId })
          .eq("id", account.id);
      }
    }

    if (!zohoId) throw new Error("Could not retrieve Zoho Account ID.");

    // 4. Process attachments — upload to Zoho
    const processedAttachments: any[] = [];
    if (Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments) {
        if (!att.path) continue;

        const { data: fileData, error: downloadError } =
          await supabaseClient.storage
            .from("email-attachments")
            .download(att.path);

        if (downloadError || !fileData) {
          console.error("Attachment download failed:", downloadError?.message);
          continue;
        }

        const uploadUrl = `https://mail.${apiDomain}/api/accounts/${zohoId}/messages/attachments?fileName=${encodeURIComponent(
          att.filename || "attachment.pdf"
        )}`;

        const uploadRes = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            "Content-Type": "application/octet-stream",
          },
          body: fileData,
        });

        const uploadResult = await uploadRes.json();

        if (uploadRes.ok && uploadResult.data) {
          const attachmentData = Array.isArray(uploadResult.data)
            ? uploadResult.data[0]
            : uploadResult.data;
          processedAttachments.push({
            storeName: attachmentData.storeName,
            attachmentPath: attachmentData.attachmentPath,
            attachmentName: att.filename || "attachment.pdf",
          });
        } else {
          throw new Error(
            "Zoho Attachment Upload Failed: " + JSON.stringify(uploadResult)
          );
        }
      }
    }

    // 5. Send email via Zoho Mail API
    const sendUrl = `https://mail.${apiDomain}/api/accounts/${zohoId}/messages`;

    const mailData: any = {
      fromAddress: cleanEmail(account.account_email),
      toAddress: cleanEmail(to),
      subject: subject || "(No Subject)",
      content: html || text || " ",
      mailFormat: html ? "html" : "text",
    };

    if (processedAttachments.length > 0) {
      mailData.attachments = processedAttachments;
    }

    console.log("Sending email:", {
      from: mailData.fromAddress,
      to: mailData.toAddress,
      subject: mailData.subject,
      zohoId,
      apiDomain,
    });

    const response = await fetch(sendUrl, {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mailData),
    });

    const result = await response.json();

    if (!response.ok || result?.status?.code >= 400) {
      const errorMessage = JSON.stringify(result);
      console.error("Zoho API Error:", errorMessage);
      await supabaseClient
        .from("emails")
        .update({
          status: "failed",
          error_message: errorMessage,
        })
        .eq("id", emailId);
      return new Response(
        JSON.stringify({ success: false, error: errorMessage }),
        { status: 500 }
      );
    }

    // 6. Mark as sent
    await supabaseClient
      .from("emails")
      .update({
        status: "sent",
        delivered_at: new Date().toISOString(),
      })
      .eq("id", emailId);

    console.log("Email sent successfully:", emailId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("FATAL ERROR:", err.message);

    // Update email to failed if we have the ID
    if (emailId) {
      try {
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );
        await supabaseClient
          .from("emails")
          .update({
            status: "failed",
            error_message: err.message,
          })
          .eq("id", emailId);
      } catch (_) {
        // ignore secondary error
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
});