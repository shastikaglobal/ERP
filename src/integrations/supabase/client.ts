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

class VPSFallbackQueryBuilder {
  private table: string;
  private action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private selectCols: string = '*';
  private filters: Array<{ type: string; column: string; value: any }> = [];
  private orderCol?: string;
  private orderAscending?: boolean;
  private limitVal?: number;
  private isSingle = false;
  private isMaybeSingle = false;
  private payloadData: any = null;
  private originalBuilder: any;

  constructor(table: string, originalBuilder: any) {
    this.table = table;
    this.originalBuilder = originalBuilder;
  }

  select(columns: string = '*') {
    this.action = 'select';
    this.selectCols = columns;
    if (this.originalBuilder) this.originalBuilder = this.originalBuilder.select(columns);
    return this;
  }

  insert(values: any) {
    this.action = 'insert';
    this.payloadData = values;
    if (this.originalBuilder) this.originalBuilder = this.originalBuilder.insert(values);
    return this;
  }

  update(values: any) {
    this.action = 'update';
    this.payloadData = values;
    if (this.originalBuilder) this.originalBuilder = this.originalBuilder.update(values);
    return this;
  }

  upsert(values: any) {
    this.action = 'upsert';
    this.payloadData = values;
    if (this.originalBuilder) this.originalBuilder = this.originalBuilder.upsert(values);
    return this;
  }

  delete() {
    this.action = 'delete';
    if (this.originalBuilder) this.originalBuilder = this.originalBuilder.delete();
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
    if (this.originalBuilder) this.originalBuilder = this.originalBuilder.eq(column, value);
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ type: 'neq', column, value });
    if (this.originalBuilder) this.originalBuilder = this.originalBuilder.neq(column, value);
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push({ type: 'gt', column, value });
    if (this.originalBuilder) this.originalBuilder = this.originalBuilder.gt(column, value);
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ type: 'gte', column, value });
    if (this.originalBuilder) this.originalBuilder = this.originalBuilder.gte(column, value);
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push({ type: 'lt', column, value });
    if (this.originalBuilder) this.originalBuilder = this.originalBuilder.lt(column, value);
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ type: 'lte', column, value });
    if (this.originalBuilder) this.originalBuilder = this.originalBuilder.lte(column, value);
    return this;
  }

  like(column: string, pattern: string) {
    this.filters.push({ type: 'like', column, value: pattern });
    if (this.originalBuilder) this.originalBuilder = this.originalBuilder.like(column, pattern);
    return this;
  }

  ilike(column: string, pattern: string) {
    this.filters.push({ type: 'ilike', column, value: pattern });
    if (this.originalBuilder) this.originalBuilder = this.originalBuilder.ilike(column, pattern);
    return this;
  }

  is(column: string, value: any) {
    this.filters.push({ type: 'is', column, value });
    if (this.originalBuilder) this.originalBuilder = this.originalBuilder.is(column, value);
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ type: 'in', column, value: values });
    if (this.originalBuilder) this.originalBuilder = this.originalBuilder.in(column, values);
    return this;
  }

  or(filtersString: string) {
    this.filters.push({ type: 'or', column: '', value: filtersString });
    if (this.originalBuilder) this.originalBuilder = this.originalBuilder.or(filtersString);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderCol = column;
    this.orderAscending = options?.ascending ?? true;
    if (this.originalBuilder) this.originalBuilder = this.originalBuilder.order(column, options);
    return this;
  }

  limit(value: number) {
    this.limitVal = value;
    if (this.originalBuilder) this.originalBuilder = this.originalBuilder.limit(value);
    return this;
  }

  single() {
    this.isSingle = true;
    if (this.originalBuilder) this.originalBuilder = this.originalBuilder.single();
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    if (this.originalBuilder) this.originalBuilder = this.originalBuilder.maybeSingle();
    return this;
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      if (this.originalBuilder) {
        const result = await this.originalBuilder;
        if (result.error && (
          result.error.code === '429' || 
          result.error.status === 401 ||
          result.error.status === 403 ||
          result.error.status === 429 ||
          result.error.message?.toLowerCase().includes('quota') ||
          result.error.message?.toLowerCase().includes('limit') ||
          result.error.message?.toLowerCase().includes('failed to fetch')
        )) {
          console.warn(`Supabase query failed with limit/quota. Falling back to local VPS for table '${this.table}'...`);
          throw new Error(result.error.message);
        }
        if (onfulfilled) return onfulfilled(result);
        return result;
      }
      throw new Error("No original builder");
    } catch (err) {
      try {
        const savedSession = localStorage.getItem('sb-local-auth-session');
        const token = savedSession ? JSON.parse(savedSession)?.access_token : null;

        const res = await fetch('/api/vps-fallback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            table: this.table,
            action: this.action,
            select: this.selectCols,
            filters: this.filters,
            data: this.payloadData,
            order: this.orderCol ? { column: this.orderCol, ascending: this.orderAscending } : undefined,
            limit: this.limitVal,
            single: this.isSingle,
            maybeSingle: this.isMaybeSingle
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const fallbackError = {
            data: null,
            error: {
              message: errData?.error || `VPS fallback failed with status ${res.status}`,
              status: res.status
            }
          };
          if (onfulfilled) return onfulfilled(fallbackError);
          return fallbackError;
        }

        const resData = await res.json();
        if (onfulfilled) return onfulfilled(resData);
        return resData;
      } catch (fallbackErr: any) {
        const networkError = {
          data: null,
          error: {
            message: fallbackErr.message || "Local VPS server connection failed",
            status: 500
          }
        };
        if (onfulfilled) return onfulfilled(networkError);
        return networkError;
      }
    }
  }
}

export const supabase = new Proxy(client, {
  get(target, prop, receiver) {
    if (prop === 'auth') {
      return (target as any)._customAuth || ((target as any)._customAuth = new CustomAuthWrapper());
    }
    if (prop === 'from') {
      return (table: string) => {
        const originalBuilder = target.from(table);
        return new VPSFallbackQueryBuilder(table, originalBuilder);
      };
    }
    return Reflect.get(target, prop, receiver);
  }
}) as any;