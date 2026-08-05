import { apiFetch } from "@/lib/api";
// [VPS Migration] ZohoMailService rewritten to use adms-sync REST API
// No Supabase client is used here. All DB access goes through apiFetch().

export interface ZohoTokenResponse {
  access_token: string;
  refresh_token?: string;
  api_domain: string;
  token_type: string;
  expires_in: number;
}

export interface ZohoEmail {
  messageId: string;
  subject: string;
  sender: string;
  toAddress: string;
  content: string;
  receivedTime: string;
  isRead: boolean;
}

export class ZohoMailService {
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = import.meta.env.VITE_ZOHO_CLIENT_ID;
    this.clientSecret = import.meta.env.VITE_ZOHO_CLIENT_SECRET;
  }

  /**
   * Get valid access token via adms-sync REST API
   */
  async getAccessToken(accountId: string): Promise<string> {
    const res = await apiFetch(`/api/emails/accounts/${accountId}/token`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Zoho account not found or token fetch failed');
    const data = await res.json();
    return data.access_token;
  }

  /**
   * Send an email via Zoho API (token fetched from backend)
   */
  async sendEmail(accountId: string, params: { to: string; subject: string; content: string }) {
    const res = await apiFetch('/api/emails/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ accountId, ...params }),
    });
    return res.json();
  }

  /**
   * Fetch recent messages from Inbox via backend
   */
  async fetchEmails(accountId: string, folderName = 'inbox') {
    const res = await apiFetch(`/api/emails/fetch?accountId=${accountId}&folder=${folderName}`, {
      credentials: 'include',
    });
    if (!res.ok) return [];
    const result = await res.json();
    return result.data || [];
  }

  /**
   * Sync Zoho emails via adms-sync backend
   */
  async syncEmails(accountId: string, companyId: string) {
    const res = await apiFetch('/api/emails/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ accountId, companyId }),
    });
    return res.json();
  }
}
