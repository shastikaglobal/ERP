import { useEffect, useState } from "react";
import { Loader2, Check, X, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdminOrManager } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  requested_role: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
};

const ROLE_OPTIONS = [
  { slug: "admin", name: "Admin" },
  { slug: "manager", name: "Manager" },
  { slug: "bde", name: "BDE" },
  { slug: "software_dev", name: "Software Dev" },
  { slug: "net_security", name: "Net & Security" },
  { slug: "data_analyst", name: "Data Analyst" },
  { slug: "secretary", name: "Secretary" },
];

export default function Approvals() {
  const isAdminOrManager = useIsAdminOrManager();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingRoleSel, setPendingRoleSel] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, requested_role, status, rejection_reason, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as ProfileRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (!isAdminOrManager) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center space-y-5 animate-in fade-in zoom-in duration-500">
        <div className="h-20 w-20 bg-destructive/10 text-destructive rounded-full flex items-center justify-center ring-8 ring-destructive/5">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Access Denied</h2>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            You do not have the required administrative permissions to view or manage user approvals. Please contact your system administrator if you believe this is an error.
          </p>
        </div>
        <Button variant="default" onClick={() => navigate("/")} className="mt-4 shadow-md">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const approve = async (r: ProfileRow) => {
    const role = pendingRoleSel[r.id] || r.requested_role || "bde";
    setBusyId(r.id);
    const { data, error } = await supabase.rpc("approve_user", { _target: r.id, _role_slug: role });
    setBusyId(null);
    if (error) {
      console.error("approve_user error:", error);
      alert(`Approve failed: ${error.message}`);
      toast.error(error.message);
      return;
    }
    toast.success(`${r.email} approved as ${role}`);
    load();
  };

  const reject = async (r: ProfileRow) => {
    const reason = window.prompt(`Reject ${r.email}? Optional reason:`) ?? null;
    if (reason === null) return;
    setBusyId(r.id);
    const { error } = await supabase.rpc("reject_user", { _target: r.id, _reason: reason });
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`${r.email} rejected`);
    load();
  };

  const pending = rows.filter((r) => r.status === "pending");
  const approved = rows.filter((r) => r.status === "approved");
  const rejected = rows.filter((r) => r.status === "rejected");

  const changeRole = async (r: ProfileRow) => {
    const role = pendingRoleSel[r.id] || r.requested_role || "bde";
    setBusyId(r.id);
    const { error } = await supabase.rpc("approve_user", { _target: r.id, _role_slug: role });
    setBusyId(null);
    if (error) {
      console.error("changeRole error:", error);
      alert(`Change role failed: ${error.message}`);
      toast.error(error.message);
      return;
    }
    toast.success(`${r.email} role changed to ${role}`);
    load();
  };

  const renderTable = (list: ProfileRow[], showActions = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Requested Role</TableHead>
          <TableHead>Status</TableHead>
          {showActions && <TableHead className="text-right">Action</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {list.length === 0 && (
          <TableRow><TableCell colSpan={showActions ? 6 : 5} className="text-center text-sm text-muted-foreground py-8">No records</TableCell></TableRow>
        )}
        {list.map((r) => (
          <TableRow key={r.id}>
            <TableCell>{r.full_name || "—"}</TableCell>
            <TableCell className="text-sm">{r.email}</TableCell>
            <TableCell className="text-sm">{r.phone || "—"}</TableCell>
            <TableCell>{r.requested_role || <span className="text-muted-foreground text-sm">—</span>}</TableCell>
            <TableCell>
              <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>
                {r.status}
              </Badge>
            </TableCell>
            {showActions && (
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                    <Select
                      value={pendingRoleSel[r.id] || r.requested_role || "bde"}
                      onValueChange={(v) => setPendingRoleSel((p) => ({ ...p, [r.id]: v }))}
                    >
                      <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((rOpt) => <SelectItem key={rOpt.slug} value={rOpt.slug}>{rOpt.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  <Button size="sm" onClick={() => approve(r)} disabled={busyId === r.id}>
                    <Check className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => reject(r)} disabled={busyId === r.id}>
                    <X className="h-3.5 w-3.5 mr-1" /> Reject
                  </Button>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="User Approvals"
        description="Approve or reject employee registrations and assign their role."
      />
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="erp-card p-2">{renderTable(pending, true)}</TabsContent>
          <TabsContent value="approved" className="erp-card p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Change Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approved.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">No records</TableCell></TableRow>
                )}
                {approved.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.full_name || "—"}</TableCell>
                    <TableCell className="text-sm">{r.email}</TableCell>
                    <TableCell className="text-sm">{r.phone || "—"}</TableCell>
                    <TableCell><Badge variant="default">{r.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Select
                          value={pendingRoleSel[r.id] || r.requested_role || "bde"}
                          onValueChange={(v) => setPendingRoleSel((p) => ({ ...p, [r.id]: v }))}
                        >
                          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((rOpt) => <SelectItem key={rOpt.slug} value={rOpt.slug}>{rOpt.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="outline" onClick={() => changeRole(r)} disabled={busyId === r.id}>
                          <Check className="h-3.5 w-3.5 mr-1" /> Change
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="rejected" className="erp-card p-2">{renderTable(rejected)}</TabsContent>
        </Tabs>
      )}
    </div>
  );
}
