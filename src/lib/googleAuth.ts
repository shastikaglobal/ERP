import { vpsDb } from "@/lib/vpsDb";


export const signInWithGoogle = async () => {
  const data = null; const error = new Error("[VPS Migration] Google OAuth now handled by /api/auth"); // removed

  if (error) {
    console.error("Error signing in with Google:", error.message);
    throw error;
  }
  
  return data;
};
