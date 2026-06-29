import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Supabase environment variables are missing");
}

// Hybrid storage: Use localStorage but fall back to sessionStorage for PKCE verifier
class HybridStorage implements Storage {
  private localStoragePrefix = 'supabase-';
  
  getItem(key: string): string | null {
    // Try sessionStorage first for PKCE verifier (doesn't survive tab close)
    if (key.includes('pkce')) {
      const val = sessionStorage.getItem(key);
      if (val) return val;
    }
    // Fall back to localStorage
    return localStorage.getItem(key);
  }
  
  setItem(key: string, value: string): void {
    // Store PKCE verifier in both sessionStorage AND localStorage
    if (key.includes('pkce')) {
      sessionStorage.setItem(key, value);
    }
    localStorage.setItem(key, value);
  }
  
  removeItem(key: string): void {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  }
  
  clear(): void {
    localStorage.clear();
    sessionStorage.clear();
  }
  
  key(index: number): string | null {
    return localStorage.key(index);
  }
  
  get length(): number {
    return localStorage.length;
  }
}

const hybridStorage = new HybridStorage();

const client = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: hybridStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  }
});

// Custom Auth Wrapper to fallback to local auth when Supabase is restricted
class CustomAuthWrapper {
  private listeners: Set<(event: string, session: any) => void> = new Set();
  private currentSession: any = null;

  constructor() {
    const saved = localStorage.getItem('sb-local-auth-session');
    if (saved) {
      try {
        this.currentSession = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved local session", e);
      }
    }
  }

  async getSession() {
    return { data: { session: this.currentSession }, error: null };
  }

  async getUser(token?: string) {
    return { data: { user: this.currentSession?.user || null }, error: null };
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    this.listeners.add(callback);
    // Fire initial state
    if (this.currentSession) {
      setTimeout(() => callback('INITIAL_SESSION', this.currentSession), 0);
    } else {
      setTimeout(() => callback('SIGNED_OUT', null), 0);
    }

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners.delete(callback);
          }
        }
      }
    };
  }

  async signInWithPassword(credentials: { email?: string; password?: string }) {
    try {
      const { data, error } = await client.auth.signInWithPassword(credentials as any);
      if (error) {
        // Fallback to local auth for ANY error (e.g. quota limit, paused project, or user not found in Supabase Auth but exists locally)
        throw new Error(error.message || "Supabase auth failed");
      }
      
      this.currentSession = data.session;
      localStorage.setItem('sb-local-auth-session', JSON.stringify(data.session));
      this.notifyListeners('SIGNED_IN', data.session);
      return { data, error: null };
    } catch (err) {
      console.warn("Supabase auth restricted. Falling back to local VPS auth...", err);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: credentials.email, password: credentials.password })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return { data: null, error: { message: errData?.error || "Invalid login credentials" } };
        }

        const resData = await res.json();
        if (resData?.session) {
          this.currentSession = resData.session;
          localStorage.setItem('sb-local-auth-session', JSON.stringify(resData.session));
          this.notifyListeners('SIGNED_IN', resData.session);
          return { data: resData, error: null };
        } else {
          return { data: null, error: { message: "Invalid session response from local server" } };
        }
      } catch (localErr: any) {
        return { data: null, error: { message: localErr.message || "Local auth server offline" } };
      }
    }
  }

  async signOut() {
    this.currentSession = null;
    localStorage.removeItem('sb-local-auth-session');
    this.notifyListeners('SIGNED_OUT', null);
    try {
      await client.auth.signOut();
    } catch (e) {}
    return { error: null };
  }

  async updateUser(attributes: any) {
    return { data: { user: this.currentSession?.user || null }, error: null };
  }

  private notifyListeners(event: string, session: any) {
    this.listeners.forEach(cb => {
      try {
        cb(event, session);
      } catch (err) {
        console.error("Error in auth listener:", err);
      }
    });
  }
}

export const supabase = new Proxy(client, {
  get(target, prop, receiver) {
    if (prop === 'auth') {
      return (target as any)._customAuth || ((target as any)._customAuth = new CustomAuthWrapper());
    }
    return Reflect.get(target, prop, receiver);
  }
}) as any;