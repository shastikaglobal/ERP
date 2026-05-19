import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

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

  // Redirect users with pending/rejected profiles to the correct onboarding/waiting routes
  if (profile && profile.status !== "approved") {
    if (profile.requested_role) {
      return <Navigate to="/waiting-approval" replace />;
    } else {
      return <Navigate to="/complete-profile" replace />;
    }
  }

  return children;
}
