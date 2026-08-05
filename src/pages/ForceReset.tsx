import { apiFetch } from "@/lib/api";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForceReset() {
  const { session, profile, refresh } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (!session) return <Navigate to="/auth" replace />;
  if (profile && !session.user.user_metadata?.force_password_reset) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    setBusy(true);
    try {
      const res = await apiFetch('/api/auth/update-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      
      toast.success("Password updated successfully");
      
      // Update local session metadata safely before refresh
      if (session?.user?.user_metadata) {
        session.user.user_metadata.force_password_reset = false;
      }
      
      await refresh();
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img src="/assets/logo.png" alt="Shastika Logo" className="h-16 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground">Action Required</h2>
        </div>

        <div className="erp-card p-6 space-y-4">
          <div className="text-center space-y-1">
            <h1 className="text-lg font-semibold">Set New Password</h1>
            <p className="text-sm text-muted-foreground">
              You must set a new password before you can access the dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={busy}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={busy}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={busy}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
