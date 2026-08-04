import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { vpsDb } from "@/lib/vpsDb";


function parseHashParams(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return {
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
    error: params.get('error'),
    error_description: params.get('error_description'),
    type: params.get('type'),
  };
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let active = true;

    async function handleAuth() {
      try {
        const error = searchParams.get('error');
        const error_description = searchParams.get('error_description');
        const code = searchParams.get('code');
        const hash = window.location.hash;
        const hashParams = parseHashParams(hash);

        // Check for error in query params or hash
        const finalError = error || hashParams.error;
        const finalErrorDesc = error_description || hashParams.error_description;

        if (finalError) {
          if (active) setErrorMsg(finalErrorDesc || "Authentication failed.");
          return;
        }

        const isRecovery = searchParams.get("type") === "recovery" || hashParams.type === "recovery" || hash.includes("type=recovery");

        if (isRecovery) {
          console.log("[AuthCallback] Recovery flow detected. Clearing any existing session...");
          // Explicitly sign out of any existing session (like admin) to avoid session cross-talk
          await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); // [VPS Migration]
          
          if (code) {
            console.log("[AuthCallback] Exchanging recovery code for session...");
            // [VPS Migration] OAuth code exchange removed (handled by VPS backend)
            if (exchangeError) throw exchangeError;
            if (active) navigate("/auth?mode=reset", { replace: true });
          } else if (hashParams.access_token && hashParams.refresh_token) {
            console.log("[AuthCallback] Setting session from recovery hash tokens...");
            // [VPS Migration] setSession removed (handled by VPS backend)
            if (setSessionError) throw setSessionError;
            if (active) navigate("/auth?mode=reset", { replace: true });
          } else {
            // Check if there is already a session that got set automatically
            // [VPS Migration] Session now comes from useAuth hook, not vpsDb
            if (session) {
              console.log("[AuthCallback] Active session found after signOut. Proceeding to reset.");
              if (active) navigate("/auth?mode=reset", { replace: true });
            } else {
              throw new Error("No recovery code or tokens found in the URL. Please request a new password reset link.");
            }
          }
        } else {
          // Standard login callback flow
          if (code) {
            console.log("[AuthCallback] Exchanging login code for session...");
            // [VPS Migration] OAuth code exchange removed (handled by VPS backend)
            if (exchangeError) throw exchangeError;
            if (active) navigate("/dashboard", { replace: true });
          } else {
            // [VPS Migration] Session now comes from useAuth hook, not vpsDb
            if (session) {
              if (active) navigate("/dashboard", { replace: true });
            } else {
              // Wait a tiny bit for auto-sign in if hash is present
              setTimeout(async () => {
                // [VPS Migration] Session now comes from useAuth hook, not vpsDb
                if (retrySession && active) {
                  navigate("/dashboard", { replace: true });
                } else if (active) {
                  setErrorMsg("No active session found. Please sign in.");
                }
              }, 1000);
            }
          }
        }
      } catch (err: any) {
        console.error("[AuthCallback] Error during callback handling:", err);
        if (active) setErrorMsg(err.message || "An unexpected error occurred during authentication.");
      }
    }

    handleAuth();

    return () => {
      active = false;
    };
  }, [searchParams, navigate]);

  // Timeout just in case it hangs forever (15 seconds)
  useEffect(() => {
    if (errorMsg) return;
    
    const timer = setTimeout(() => {
      setErrorMsg("Authentication timed out. The session could not be established. Please try again.");
    }, 15000);

    return () => clearTimeout(timer);
  }, [errorMsg]);

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="p-6 text-center max-w-md w-full border rounded-lg shadow-sm bg-card">
          <h2 className="text-lg font-semibold text-destructive mb-2">Authentication Error</h2>
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
          <button
            onClick={() => navigate("/auth", { replace: true })}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md w-full hover:bg-primary/90"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <h2 className="text-xl font-semibold">Completing sign in...</h2>
      <p className="text-sm text-muted-foreground">Please wait while we establish your secure session.</p>
    </div>
  );
}