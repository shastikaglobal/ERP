import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (loading) return;

    if (session) {
      navigate("/dashboard", { replace: true });
    } else {
      setErrorMsg("Authentication failed or session expired. Please sign in again.");
    }
  }, [session, loading, navigate]);

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