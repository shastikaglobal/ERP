import { vpsDb } from "@/lib/vpsDb";


export const logCRMAction = async (action: string, recordCount: number = 0, details?: any) => {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) return;
    const { user } = await res.json();
    if (!user) return;
    
    await vpsDb.from("audit_logs").insert({
      user_id: user.id,
      action: action,
      resource_type: "crm",
      details: { recordCount, ...details }
    });
  } catch (error) {
    console.error("Failed to log CRM action:", error);
  }
};
