export const vpsDb = {
  from: (table: string) => {
    let _select = '*';
    let _filters: any[] = [];
    let _action = 'select';
    let _data: any = null;
    let _single = false;
    let _limit: number | null = null;
    let _order: any = null;

    const builder = {
      select: (cols = '*') => {
        _select = cols;
        return builder;
      },
      insert: (data: any) => {
        _action = 'insert';
        _data = data;
        return builder;
      },
      update: (data: any) => {
        _action = 'update';
        _data = data;
        return builder;
      },
      upsert: (data: any) => {
        _action = 'upsert';
        _data = data;
        return builder;
      },
      delete: () => {
        _action = 'delete';
        return builder;
      },
      eq: (col: string, val: any) => {
        _filters.push({ column: col, type: 'eq', value: val });
        return builder;
      },
      neq: (col: string, val: any) => {
        _filters.push({ column: col, type: 'neq', value: val });
        return builder;
      },
      gt: (col: string, val: any) => {
        _filters.push({ column: col, type: 'gt', value: val });
        return builder;
      },
      gte: (col: string, val: any) => {
        _filters.push({ column: col, type: 'gte', value: val });
        return builder;
      },
      lt: (col: string, val: any) => {
        _filters.push({ column: col, type: 'lt', value: val });
        return builder;
      },
      lte: (col: string, val: any) => {
        _filters.push({ column: col, type: 'lte', value: val });
        return builder;
      },
      in: (col: string, val: any[]) => {
        _filters.push({ column: col, type: 'in', value: val });
        return builder;
      },
      order: (col: string, opts: { ascending?: boolean } = {}) => {
        _order = { column: col, ascending: opts.ascending !== false };
        return builder;
      },
      limit: (n: number) => {
        _limit = n;
        return builder;
      },
      single: () => {
        _single = true;
        return builder;
      },
      maybeSingle: () => {
        _single = true;
        return builder;
      },
      execute: async () => {
        try {
          // We need a session token, but to avoid circular deps with useAuth, we can try grabbing it from localstorage or use credentials: 'include'
          const payload = {
            table,
            action: _action,
            select: _select,
            filters: _filters,
            data: _data,
            single: _single,
            limit: _limit,
            order: _order
          };

          const res = await fetch('/api/vps-fallback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload)
          });
          
          if (!res.ok) {
            const err = await res.text();
            return { data: null, error: new Error(err) };
          }
          
          const json = await res.json();
          if (json.error) return { data: null, error: new Error(json.error) };
          return { data: json.data, error: null };
        } catch (e: any) {
          return { data: null, error: e };
        }
      }
    };
    
    // Make builder awaitable (Promise-like)
    (builder as any).then = function(resolve: any, reject: any) {
      this.execute().then(resolve, reject);
    };
    
    return builder;
  },
  
  auth: {
    getUser: async () => {
      // Return dummy structure, proper auth is in useAuth
      return { data: { user: { id: "dummy-id" } }, error: null };
    },
    getSession: async () => {
      return { data: { session: null }, error: null };
    }
  },
  
  functions: {
    invoke: async (name: string, opts: any = {}) => {
      return { data: null, error: new Error("Functions not supported natively via vpsDb") };
    }
  },

  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: any) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include'
          });
          if (!res.ok) throw new Error("Upload failed");
          return { data: await res.json(), error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      getPublicUrl: (path: string) => {
        return { data: { publicUrl: `/uploads/${path}` } };
      }
    })
  },

  channel: (name: string) => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) })
  })
};
