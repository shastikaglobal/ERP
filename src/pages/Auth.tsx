import { useState } from "react";
import { useSearchParams, useNavigate, Navigate, useLocation } from "react-router-dom";
import { Sprout, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ResetPasswordModal } from "@/components/ResetPasswordModal";
import { Input } from "@/components/ui/input";

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, profile, loading } = useAuth();
  const [busyEmail, setBusyEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpId, setSignUpId] = useState("");

  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const isResetMode = mode === "reset" || window.location.hash.includes("type=recovery");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busyReset, setBusyReset] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyEmail(true);

    try {
      let loginEmail = email.trim();

      // If it doesn't look like an email, assume it's an Employee ID or eSSL/Biometric ID
      if (!loginEmail.includes('@')) {
        const { data, error } = await supabase
          .from('profiles')
          .select('email')
          .or(`employee_id.eq.${loginEmail},biometric_id.eq.${loginEmail}`)
          .maybeSingle();

        if (error || !data || !data.email) {
          toast.error("Employee ID not found. Please check your ID or contact Admin.");
          setBusyEmail(false);
          return;
        }
        
        // Use the found email to log in
        loginEmail = data.email;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
      
      if (error) {
        toast.error(error.message || "Invalid login credentials");
        setBusyEmail(false);
      } else if (!data.session) {
        toast.error("Please confirm your email address before logging in.");
        setBusyEmail(false);
      }
    } catch (err: any) {
      console.error("Login exception:", err);
      toast.error(err?.message || "An unexpected error occurred during login.");
      setBusyEmail(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    setBusyEmail(true);

    try {
      const input = signUpId.trim();
      const payload = {};
      if (input.includes('@')) {
        payload.email = input;
      } else {
        payload.employeeId = input;
      }
      payload.password = password;

      // Call public backend registration endpoint
      const response = await fetch('/api/employees/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to sign up");
      }

      toast.success("Account registered! Logging you in...");

      // Automatically sign in the user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: result.email,
        password
      });

      if (signInError) throw signInError;

      toast.success("Logged in successfully!");
      setIsSignUp(false);
      setPassword("");
      setConfirmPassword("");
      setSignUpId("");
    } catch (err: any) {
      console.error("Sign up exception:", err);
      toast.error(err?.message || "An unexpected error occurred during sign up.");
    } finally {
      setBusyEmail(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    setBusyReset(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast.success("Password updated successfully!");
      navigate("/employees/face-attendance?mode=checkin", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setBusyReset(false);
    }
  };

  const from = (location.state as { from?: string })?.from || "/employees/face-attendance";
  
  if (!loading && session && !isResetMode) return <Navigate to={from} replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center justify-center rounded-lg bg-primary p-2">
            <img
              src="/assets/shastika-logo.png"
              alt="Shastika Global Impex"
              style={{ width: '80px', height: '80px', objectFit: 'contain' }}
            />
          </div>
          <div>
            <div className="text-xl font-semibold">Shastika Global Impex</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              IMPEX · AGRI EXPORT ERP
            </div>
          </div>
        </div>

        <div className="erp-card p-6 space-y-4">
          {isResetMode ? (
            <>
              <div className="text-center space-y-1">
                <h1 className="text-lg font-semibold">Set New Password</h1>
                <p className="text-sm text-muted-foreground">
                  Please enter your new secure password.
                </p>
              </div>

              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="bg-white/5"
                  />
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-white/5"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={busyReset}
                >
                  {busyReset ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
                </Button>
              </form>
            </>
          ) : isSignUp ? (
            <>
              <div className="text-center space-y-1">
                <h1 className="text-lg font-semibold">Create an account</h1>
                <p className="text-sm text-muted-foreground">
                  Enter your details to register.
                </p>
              </div>

              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Employee ID / Email"
                    value={signUpId}
                    onChange={(e) => setSignUpId(e.target.value)}
                    required
                    className="bg-white/5"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/5"
                  />
                  <Input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-white/5"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={busyEmail}
                >
                  {busyEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign Up"}
                </Button>
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setPassword("");
                      setConfirmPassword("");
                      setSignUpId("");
                    }}
                    className="text-xs text-primary hover:underline transition-colors"
                  >
                    Already have an account? Sign In
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="text-center space-y-1">
                <h1 className="text-lg font-semibold">Sign in to continue</h1>
                <p className="text-sm text-muted-foreground">
                  Enter your credentials to login.
                </p>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="User ID / Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5"
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/5"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setPassword("");
                      setConfirmPassword("");
                    }}
                    className="text-xs text-primary hover:underline transition-colors"
                  >
                    Create Account (Sign Up)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(true)}
                    className="text-xs text-primary hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={busyEmail}
                >
                  {busyEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
      <ResetPasswordModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} />
    </div>
  );
}