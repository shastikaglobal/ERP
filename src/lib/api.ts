import { supabase } from "@/integrations/supabase/client";

export async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (!accessToken) {
    throw new Error("No active session available");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

export async function authFetch(input: RequestInfo, init: RequestInit = {}) {
  const headers = new Headers(init.headers ?? undefined);
  const authHeaders = await getAuthHeaders();

  Object.entries(authHeaders).forEach(([key, value]) => {
    if (value) headers.set(key, value);
  });

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
