import { supabase } from "@/integrations/supabase/client";
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
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    let userId = null;
    if (res.ok) {
      const { user } = await res.json();
      userId = user?.id;
    }
    
    // If no companyId provided, try to fetch it
    let companyId = params.companyId;
    if (!companyId && userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userId)
        .single();
      if (profile) {
        companyId = profile.company_id;
      }
    }

    // Call the Resend edge function
    const { data, error } = await supabase.functions.invoke('send-resend-email', {
      body: {
        ...params,
        companyId
      }
    });

    if (error) {
      console.error("Error sending transactional email:", error);
      toast.error("Failed to queue email");
      return { success: false, error };
    }

    // Listen for realtime status update if it was queued successfully
    if (data?.success) {
      toast.success("Email queued for delivery");
      
      // NOTE: Supabase Realtime has been disabled due to quota limits.
      // Status toasts won't appear automatically for now.
      /*
      const channel = supabase.channel(`email_logs_status`);
      
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'email_logs',
          filter: `status=eq.success`, 
        },
        (payload) => {
          if (payload.new.details?.to === params.to || 
             (Array.isArray(params.to) && payload.new.details?.to.includes(params.to[0]))) {
            toast.success(`Email delivered to ${Array.isArray(params.to) ? params.to[0] : params.to}`);
            supabase.removeChannel(channel);
          }
        }
      ).subscribe();

      // Cleanup listener after 10 seconds to avoid memory leaks if delivery takes too long
      setTimeout(() => {
        supabase.removeChannel(channel);
      }, 10000);
      */
    }

    return data;
  } catch (err: any) {
    console.error("Exception sending transactional email:", err);
    toast.error("Failed to send email");
    return { success: false, error: err };
  }
};
