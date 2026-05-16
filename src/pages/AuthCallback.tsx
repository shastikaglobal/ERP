import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let mounted = true;
    let handled = false;

    const handleUser = async (userId: string, email: string, metadata: any) => {
      if (handled) return;
      handled = true;

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("status")
          .eq("id", userId)
          .maybeSingle();

        if (error) throw error;

        if (!profile) {
          await supabase.from("profiles").insert({
            id: userId,
            email: email,
            status: "pending",
            full_name: metadata?.full_name || email?.split("@")[0] || "User",
          });
        }
        
        if (mounted) navigate("/dashboard", { replace: true });
      } catch (err: any) {
        if (mounted) setErrorMsg(err.message || "An error occurred.");
      }
    };

    // Wait a bit for Supabase to parse the hash tokens first
    const init = setTimeout(async () => {
      // Try getSession first
      const { data: { session } } = await supabase.auth.getSession();
      if (session && mounted) {
        await handleUser(session.user.id, session.user.email ?? "", session.user.user_metadata);
        return;
      }

      // Then listen for SIGNED_IN
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" && session && mounted) {
          await handleUser(session.user.id, session.user.email ?? "", session.user.user_metadata);
        }
      });

      // Final timeout - 8 seconds
      setTimeout(() => {
        if (!handled && mounted) {
          subscription.unsubscribe();
          setErrorMsg("Login failed. Please try again.");
        }
      }, 8000);

    }, 500); // 500ms delay lets Supabase parse hash

    return () => {
      mounted = false;
      clearTimeout(init);
    };
  }, [navigate]);

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="p-6 text-center max-w-md w-full border rounded-lg shadow-sm bg-card">
          <h2 className="text-lg font-semibold text-destructive mb-2">Authentication Error</h2>
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
          <button
            onClick={() => navigate("/auth")}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm w-full"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-4">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
      <div className="text-lg font-medium text-foreground">Completing sign in...</div>
      <div className="text-sm text-muted-foreground">Please wait while we verify your account.</div>
    </div>
  );
}