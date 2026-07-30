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

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*') {
    this.action = 'select';
    this.selectCols = columns;
    return this;
  }

  insert(values: any) {
    this.action = 'insert';
    this.payloadData = values;
    return this;
  }

  update(values: any) {
    this.action = 'update';
    this.payloadData = values;
    return this;
  }

  upsert(values: any) {
    this.action = 'upsert';
    this.payloadData = values;
    return this;
  }

  delete() {
    this.action = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ type: 'neq', column, value });
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push({ type: 'gt', column, value });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push({ type: 'gte', column, value });
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push({ type: 'lt', column, value });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push({ type: 'lte', column, value });
    return this;
  }

  like(column: string, pattern: string) {
    this.filters.push({ type: 'like', column, value: pattern });
    return this;
  }

  ilike(column: string, pattern: string) {
    this.filters.push({ type: 'ilike', column, value: pattern });
    return this;
  }

  is(column: string, value: any) {
    this.filters.push({ type: 'is', column, value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ type: 'in', column, value: values });
    return this;
  }

  or(filtersString: string) {
    this.filters.push({ type: 'or', column: '', value: filtersString });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderCol = column;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  limit(value: number) {
    this.limitVal = value;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${baseUrl}/api/vps-fallback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
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
        
        // Handle global auth failure (Token expired/Invalid token)
        if (res.status === 401) {
          window.dispatchEvent(new CustomEvent('vps-auth-error', { detail: errData }));
        }

        const fallbackError = {
          data: null,
          error: {
            message: errData?.error || `API failed with status ${res.status}`,
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
          message: fallbackErr.message || "Local server connection failed",
          status: 500
        }
      };
      if (onfulfilled) return onfulfilled(networkError);
      return networkError;
    }
  }
}

export const supabase = {
  from: (table: string) => {
    return new VPSFallbackQueryBuilder(table);
  },
  // Global Mock for Realtime Channels (Prevents "channel is not a function" crashes)
  channel: (name: string) => ({
    on: () => ({ subscribe: () => {} }),
    subscribe: () => {},
    unsubscribe: () => {},
    send: () => {}
  }),
  removeChannel: () => {},
  // Global Mock for Auth (Prevents "getSession is not a function" crashes)
  // Our backend /api endpoints now use cookies automatically, so token can be null.
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({ data: { session: null, user: null }, error: new Error('Use VPS /api/auth/login directly') }),
    signOut: async () => ({ error: null }),
    updateUser: async () => ({ data: { user: null }, error: new Error('Use VPS /api/auth/update-password directly') }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  }
} as any;