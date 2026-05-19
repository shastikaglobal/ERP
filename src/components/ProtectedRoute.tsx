import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { session, profile, loading, refresh, roleSlugs } = useAuth();
  const location = useLocation();

  // Robust fallback: if profile is null, poll for it because the trigger might be delayed
  // and Realtime websockets can sometimes be blocked or dropped.
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session && !profile && !loading) {
      interval = setInterval(() => {
        refresh();
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [session, profile, loading, refresh]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // Wait for the backend trigger to create the profile row
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-muted-foreground animate-pulse">Setting up your account...</p>
        </div>
      </div>
    );
  }

  // Redirect users with pending/rejected profiles to the correct onboarding/waiting routes
  if (profile.status !== "approved") {
    if (profile.requested_role) {
      return <Navigate to="/waiting-approval" replace />;
    } else {
      return <Navigate to="/complete-profile" replace />;
    }
  }

  // BDE Role Route Restriction
  const isBde = roleSlugs.has("bd") || 
                roleSlugs.has("bde") || 
                (profile?.requested_role && ["bd", "bde"].includes(profile.requested_role.toLowerCase()));

  if (isBde) {
    const allowedPrefixes = ["/dashboards", "/dashboard", "/crm", "/customers", "/quotations", "/documents", "/system"];
    const isAllowed = allowedPrefixes.some(prefix => 
      location.pathname === prefix || location.pathname.startsWith(prefix + "/")
    );
    if (!isAllowed) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}
