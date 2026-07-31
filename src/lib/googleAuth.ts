import { vpsDb } from "@/lib/vpsDb";


export const signInWithGoogle = async () => {
  const { data, error } = await vpsDb.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        prompt: 'select_account'
      }
    },
  });

  if (error) {
    console.error("Error signing in with Google:", error.message);
    throw error;
  }
  
  return data;
};
