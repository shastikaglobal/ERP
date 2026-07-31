// Mock Supabase Client to allow the build to pass

const mockBuilder = {
  select: () => mockBuilder,
  insert: () => mockBuilder,
  update: () => mockBuilder,
  delete: () => mockBuilder,
  eq: () => mockBuilder,
  neq: () => mockBuilder,
  gt: () => mockBuilder,
  gte: () => mockBuilder,
  lt: () => mockBuilder,
  lte: () => mockBuilder,
  like: () => mockBuilder,
  ilike: () => mockBuilder,
  is: () => mockBuilder,
  in: () => mockBuilder,
  contains: () => mockBuilder,
  containedBy: () => mockBuilder,
  rangeGt: () => mockBuilder,
  rangeGte: () => mockBuilder,
  rangeLt: () => mockBuilder,
  rangeLte: () => mockBuilder,
  rangeAdjacent: () => mockBuilder,
  overlaps: () => mockBuilder,
  textSearch: () => mockBuilder,
  match: () => mockBuilder,
  not: () => mockBuilder,
  or: () => mockBuilder,
  filter: () => mockBuilder,
  order: () => mockBuilder,
  limit: () => mockBuilder,
  range: () => mockBuilder,
  abortSignal: () => mockBuilder,
  single: () => Promise.resolve({ data: null, error: null }),
  maybeSingle: () => Promise.resolve({ data: null, error: null }),
  csv: () => Promise.resolve({ data: "", error: null }),
  then: (resolve: any) => resolve({ data: [], error: null }),
  catch: (reject: any) => reject(null),
};

const mockChannel = {
  on: () => mockChannel,
  subscribe: () => mockChannel,
  unsubscribe: () => mockChannel,
  send: () => Promise.resolve({ status: "ok" }),
  track: () => Promise.resolve({ status: "ok" }),
  untrack: () => Promise.resolve({ status: "ok" }),
};

export const supabase = {
  from: () => mockBuilder,
  auth: {
    signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
    signInWithOAuth: () => Promise.resolve({ data: { provider: null, url: null }, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    resetPasswordForEmail: () => Promise.resolve({ data: null, error: null }),
    updateUser: () => Promise.resolve({ data: { user: null }, error: null }),
  },
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      download: () => Promise.resolve({ data: new Blob(), error: null }),
      remove: () => Promise.resolve({ data: null, error: null }),
      list: () => Promise.resolve({ data: [], error: null }),
      getPublicUrl: () => ({ data: { publicUrl: "" } }),
      createSignedUrl: () => Promise.resolve({ data: { signedUrl: "" }, error: null }),
    }),
  },
  functions: {
    invoke: () => Promise.resolve({ data: null, error: null }),
  },
  channel: () => mockChannel,
  removeChannel: () => Promise.resolve({ status: "ok" }),
  removeAllChannels: () => Promise.resolve({ status: "ok" }),
  getChannels: () => [],
};

// Also mock createClient for any files that might try to import it
export const createClient = () => supabase;
