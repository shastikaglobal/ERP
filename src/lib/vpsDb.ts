
// Dummy export to prevent import errors in files that haven't removed the import yet
export const vpsDb = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    getUser: async () => ({ data: { user: null } }),
  }
};
