
import { createClient } from '@/integrations/supabase/client';

export async function fetchBdeProfiles() {
  try {
    const res = await fetch('/api/crm/bde-profiles', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    if (!res.ok) {
      throw new Error("Failed to fetch BDE profiles");
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error in fetchBdeProfiles:", error);
    
    // Fallback if API fails
    const fallback = [];
    const requestedNames = ["Gayathri", "Vemula Navya Lahari", "Aditi"];
    requestedNames.forEach(name => {
      fallback.push({
        id: name.toLowerCase().replace(/\s/g, '-'),
        full_name: name,
        email: `${name.toLowerCase().replace(/\s/g, '')}@example.com`,
        requested_role: 'bde'
      });
    });
    return fallback;
  }
}
