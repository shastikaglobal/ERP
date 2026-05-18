import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Sprout, Loader2, Mail, Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { signInWithGoogle } from "@/lib/googleAuth";

export default function Auth() {
  const location = useLocation();
  const { session, loading } = useAuth();
  const [busyGoogle, setBusyGoogle] = useState(false);
  const [busyGithub, setBusyGithub] = useState(false);
  const [busyEmail, setBusyEmail] = useState(false);
  const [busyBypass, setBusyBypass] = useState(false);

  // Email Auth State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);

  const from = (location.state as { from?: string })?.from || "/dashboards/executive";

  if (!loading && session) return <Navigate to={from} replace />;

  const handleGoogle = async () => {
    setBusyGoogle(true);
    try {
      await signInWithGoogle();
      // browser will redirect — no need to setBusy(false)
    } catch (error: any) {
      setBusyGoogle(false);
      toast.error(error.message || "Could not sign in with Google");
    }
  };

  const handleGithub = async () => {
    setBusyGithub(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setBusyGithub(false);
      toast.error(error.message || "Could not sign in with GitHub");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please enter email and password");

    setBusyEmail(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          }
        });
        if (error) throw error;
        toast.success("Account created successfully! Please complete your profile.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        toast.success("Signed in successfully!");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setBusyEmail(false);
    }
  };

  const handleQuickLogin = async (role: 'admin' | 'bde') => {
    const devEmail = `${role}@shastika.local`;
    const devPassword = "password123";

    setBusyBypass(true);
    try {
      // 1. Try to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: devEmail,
        password: devPassword
      });

      if (error) {
        // 2. If user doesn't exist, sign up
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: devEmail,
          password: devPassword
        });
        if (signUpErr) throw signUpErr;

        // 3. Authenticate
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: devEmail,
          password: devPassword
        });
        if (signInErr) throw signInErr;
      }

      toast.success(`Logged in as dev-${role.toUpperCase()} successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Bypass login failed");
    } finally {
      setBusyBypass(false);
    }
  };

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Sprout className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-xl font-semibold">AgriExportOS</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Agriculture Export ERP
            </div>
          </div>
        </div>

        <div className="erp-card p-6 space-y-4">
          <div className="text-center space-y-1">
            <h1 className="text-lg font-semibold">Sign in to continue</h1>
            <p className="text-sm text-muted-foreground">
              New employees need approval from an Admin or Manager before access.
            </p>
          </div>

          {/* Google */}
          <Button
            onClick={handleGoogle}
            disabled={busyGoogle || busyGithub || busyEmail || busyBypass}
            className="w-full"
            size="lg"
            variant="outline"
          >
            {busyGoogle ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </Button>

          {/* GitHub */}
          <Button
            onClick={handleGithub}
            disabled={busyGoogle || busyGithub || busyEmail || busyBypass}
            className="w-full"
            size="lg"
            variant="outline"
          >
            {busyGithub ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/>
              </svg>
            )}
            Continue with GitHub
          </Button>

          {/* Standard Email/Password Login Option */}
          <div className="border-t border-border pt-3">
            {!showEmailAuth ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmailAuth(true)}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                Or use email and password
              </Button>
            ) : (
              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div className="space-y-1">
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 text-xs"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 text-xs"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1 text-xs"
                    disabled={busyGoogle || busyGithub || busyEmail || busyBypass}
                  >
                    {busyEmail && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    {isSignUp ? "Sign Up" : "Sign In"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => setIsSignUp(!isSignUp)}
                  >
                    {isSignUp ? "To Sign In" : "Create Account"}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Development / Localhost Quick Bypass (100% Reliable Local Testing) */}
          {isLocalhost && (
            <div className="border-t border-dashed border-primary/20 pt-4 mt-2 bg-primary/5 p-3 rounded-lg border">
              <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-primary">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>🔌 Local Developer Mode</span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">
                Google OAuth usually blocks logins inside private/incognito tabs on localhost. Use these one-click buttons to bypass OAuth and test roles instantly!
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => handleQuickLogin('bde')}
                  disabled={busyGoogle || busyGithub || busyEmail || busyBypass}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                >
                  {busyBypass ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : "⚡ Dev BDE"}
                </Button>
                <Button
                  onClick={() => handleQuickLogin('admin')}
                  disabled={busyGoogle || busyGithub || busyEmail || busyBypass}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                >
                  {busyBypass ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : "⚡ Dev Admin"}
                </Button>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            By continuing you agree to the workspace terms. Your account will be created with{" "}
            <span className="font-medium">Pending</span> status until approved.
          </p>
        </div>
      </div>
    </div>
  );
}