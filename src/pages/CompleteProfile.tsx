import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Sprout, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";

const ROLE_OPTIONS = [
  { slug: "admin", label: "Admin" },
  { slug: "manager", label: "Manager" },
  { slug: "bd", label: "BD (Business Development)" },
  { slug: "accounts", label: "Accounts" },
  { slug: "operations", label: "Operations / Warehouse" },
  { slug: "qc", label: "Quality Control (QC)" },
  { slug: "procurement", label: "Procurement" },
  { slug: "data_analyst", label: "Data Analyst" },
  { slug: "marketing", label: "Marketing" },
  { slug: "hr", label: "HR" },
];

export default function CompleteProfile() {
  const nav = useNavigate();
  const { session, profile, loading, refresh, roleSlugs, signOut } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
    if (profile?.phone) setPhone((profile as any).phone || "");
    if (profile?.biometric_id) {
      setEmployeeId(profile.biometric_id);
    } else if (profile?.email) {
      const parts = profile.email.split('@');
      if (parts[0] && /^\d+$/.test(parts[0])) {
        setEmployeeId(parts[0]);
      }
    }
  }, [profile]);

  const isSecretary = roleSlugs?.has("secretary");

  if (!loading && !session) return <Navigate to="/auth" replace />;
  if (!loading && profile?.status === "approved") {
    return <Navigate to={isSecretary ? "/dashboards/finance-tally" : "/dashboards/executive"} replace />;
  }
  if (!loading && profile?.requested_role) return <Navigate to="/waiting-approval" replace />;

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground animate-pulse">Preparing your profile...</p>
        </div>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;
    if (!role) {
      toast.error("Please select your role");
      return;
    }
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!employeeId.trim()) {
      toast.error("Please enter your Employee ID / eSSL ID");
      return;
    }
    setBusy(true);

    try {
      // Check if biometric_id is already taken by another user
      const checkRes = await apiFetch(
        `/api/employees/check-employee-id?employee_id=${encodeURIComponent(employeeId.trim())}&exclude_id=${session.user.id}`,
        { credentials: 'include' }
      );
      const checkData = await checkRes.json();

      if (checkData.exists) {
        toast.error(`Employee ID/eSSL ID "${employeeId.trim()}" is already assigned to ${checkData.full_name || 'another user'}.`);
        setBusy(false);
        return;
      }

      const res = await apiFetch(`/api/employees/${session.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          full_name: fullName,
          phone,
          requested_role: role,
          employee_id: employeeId.trim(),
          biometric_id: employeeId.trim(),
          status: 'pending'
        })
      });
      if (!res.ok) throw new Error('Failed to update profile');

      await refresh();
      nav("/waiting-approval", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Sprout className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="text-xl font-semibold">Complete your profile</div>
        </div>
        <form onSubmit={submit} className="erp-card p-6 space-y-4">
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={profile?.email || session?.user.email || ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="employeeId">Employee ID / eSSL ID</Label>
            <Input
              id="employeeId"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="Enter your ID (e.g. 1022)"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98000 00000"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Requested role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role"><SelectValue placeholder="Select your role" /></SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r.slug} value={r.slug}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit for Approval
          </Button>
          <Button type="button" variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => signOut()}>
            Sign out / Switch account
          </Button>
        </form>
      </div>
    </div>
  );
}