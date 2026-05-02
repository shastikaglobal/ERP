import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [errorMsg, setErrorMsg] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (loading) return; // Wait for AuthProvider to finish

    const handleUser = async () => {
      if (!session) {
        // No session after loading complete = real failure
        setErrorMsg("Login failed. Please try again.");
        return;
      }

      if (processing) return;
      setProcessing(true);

      try {
        const user = session.user;

        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("status")
          .eq("id", user.id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (!profile) {
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email,
              status: "pending",
              full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Unknown",
            });
          if (insertError) throw insertError;
          navigate("/pending", { replace: true });
        } else {
          if (profile.status === "approved") {
            navigate("/dashboard", { replace: true });
          } else {
            navigate("/pending", { replace: true });
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || "An error occurred.");
      }
    };

    handleUser();
  }, [session, loading]);

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