import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // Hard-block: profile must exist and be approved
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Setting up your account…</div>
      </div>
    );
  }

  if (!profile.requested_role && profile.status === "pending") {
    // Brand new Google sign-in: collect phone + role first
    return <Navigate to="/complete-profile" replace />;
  }

  if (profile.status !== "approved") {
    return <Navigate to="/waiting-approval" replace />;
  }

  return children;
}
