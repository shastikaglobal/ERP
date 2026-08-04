// [VPS Migration] This file is a safe stub replacing the old Supabase client.
// `createClient` no longer instantiates a real Supabase connection.
// All data access goes through the adms-sync REST API.

export function createClient(_url?: string, _key?: string) {
  const noop = async () => ({ data: null, error: new Error('Supabase removed. Use REST API.') });
  return {
    from: (_table: string) => ({
      select: () => ({ eq: () => ({ single: noop, data: null, error: new Error('Supabase removed') }) }),
      upsert: noop,
      update: () => ({ eq: noop }),
    }),
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
  };
}
