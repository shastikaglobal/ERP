import { vpsDb } from "@/lib/vpsDb";


export const logCRMAction = async (action: string, recordCount: number = 0, details?: any) => {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) return;
    const { user } = await res.json();
    if (!user) return;
    
    // [VPS Migration] audit log insert removed - use /api/crm/audit-logs
  } catch (error) {
    console.error("Failed to log CRM action:", error);
  }
};
