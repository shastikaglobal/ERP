import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export interface TransactionalEmailParams {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  companyId?: string;
  referenceId?: string;
  moduleName?: string;
}

/**
 * Sends a transactional email using the Resend Edge Function
 * and automatically listens for realtime delivery status updates.
 */
export const sendTransactionalEmail = async (params: TransactionalEmailParams) => {
  try {
    let token = "";
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "");
          token = data.access_token;
        } catch (e) {}
      }
    }

    const res = await apiFetch('/api/emails/send', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        record: {
          to_address: Array.isArray(params.to) ? params.to.join(",") : params.to,
          subject: params.subject,
          body_text: params.text,
          body_html: params.html,
          company_id: params.companyId,
          from_address: "erp@shastikaglobal.com" // Fallback sender
        }
      })
    });
    
    if (!res.ok) {
      const err = await res.json();
      console.error("Error sending transactional email:", err);
      toast.error("Failed to send email");
      return { success: false, error: err };
    }
    
    const data = await res.json();
    toast.success("Email queued for delivery");
    return data;
  } catch (err: any) {
    console.error("Exception sending transactional email:", err);
    toast.error("Failed to send email");
    return { success: false, error: err };
  }
};
