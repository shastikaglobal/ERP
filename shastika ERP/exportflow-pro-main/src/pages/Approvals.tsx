import { useEffect, useState } from "react";
import { Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdminOrManager } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
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
  "admin", "manager", "bd", "accounts", "operations", "qc", "procurement", "data_analyst", "marketing", "hr",
];

export default function Approvals() {
  const isAdminOrManager = useIsAdminOrManager();
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

  if (!isAdminOrManager) return <Navigate to="/dashboards/executive" replace />;

  const approve = async (r: ProfileRow) => {
    const role = pendingRoleSel[r.id] || r.requested_role || "bd";
    setBusyId(r.id);
    const { error } = await supabase.rpc("approve_user", { _target: r.id, _role_slug: role });
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
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
                    value={pendingRoleSel[r.id] || r.requested_role || "bd"}
                    onValueChange={(v) => setPendingRoleSel((p) => ({ ...p, [r.id]: v }))}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
          <TabsContent value="approved" className="erp-card p-2">{renderTable(approved)}</TabsContent>
          <TabsContent value="rejected" className="erp-card p-2">{renderTable(rejected)}</TabsContent>
        </Tabs>
      )}
    </div>
  );
}
