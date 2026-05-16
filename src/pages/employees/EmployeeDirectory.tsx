import { Plus, Mail, Phone, Loader2, Search, Copy, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth, useIsAdminOrManager } from "@/hooks/useAuth";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  requested_role: string | null;
  status: "pending" | "approved" | "rejected";
  is_active: boolean;
  avatar_url: string | null;
};

const ROLE_NAMES: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  bde: "BDE",
  software_dev: "Software Developer",
  net_security: "Network & Security",
  data_analyst: "Data Analyst",
  secretary: "Secretary",
};

export default function EmployeeDirectory() {
  const { onlineUsers } = useAuth();
  const isAdminOrManager = useIsAdminOrManager();
  const [employees, setEmployees] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, requested_role, status, is_active, avatar_url")
      .eq("status", "approved")
      .order("full_name");

    if (error) {
      toast.error(error.message);
    } else {
      setEmployees((data as ProfileRow[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/auth`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Registration link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-in fade-in zoom-in duration-300">
      <PageHeader 
        title="Employee Directory" 
        description="All team members across departments" 
        breadcrumbs={[{ label: "Employees" }]}
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite New Employee</DialogTitle>
                <DialogDescription>
                  For security reasons, new employees must create their own credentials. Share the registration link with them to get started.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col space-y-4 py-4">
                <div className="bg-muted p-4 rounded-md text-sm text-muted-foreground border border-border/50">
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Copy the registration link below.</li>
                    <li>Send the link to the new employee.</li>
                    <li>They will create an account and verify their email.</li>
                    <li>Once registered, go to the <strong>User Approvals</strong> tab to approve them and assign their role.</li>
                  </ol>
                </div>
                <div className="flex items-center space-x-2">
                  <Input 
                    readOnly 
                    value={`${window.location.origin}/auth`} 
                    className="flex-1 bg-muted/50 cursor-copy"
                    onClick={handleCopyLink}
                  />
                  <Button size="icon" onClick={handleCopyLink} variant="secondary">
                    {copied ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <DialogFooter className="sm:justify-start">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        } 
      />

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading directory...
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
          No employees found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((e) => {
            const initials = e.full_name
              ? e.full_name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
              : "?";
            const roleName = e.requested_role ? (ROLE_NAMES[e.requested_role] || e.requested_role) : "Employee";
            const isOnline = onlineUsers.includes(e.id);

            return (
              <Section key={e.id} className="hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-lg overflow-hidden border border-primary/20">
                      {e.avatar_url ? (
                        <img src={e.avatar_url} alt={e.full_name || "Avatar"} className="h-full w-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    {isAdminOrManager && (
                      isOnline ? (
                        <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background shadow-sm" title="Online" />
                      ) : (
                        <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-muted-foreground border-2 border-background shadow-sm" title="Offline" />
                      )
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="font-semibold truncate" title={e.full_name || "Unknown"}>
                        {e.full_name || "Unknown"}
                      </div>
                      {isAdminOrManager && !e.is_active && <StatusBadge status="Inactive" />}
                    </div>
                    <div className="text-xs font-medium text-muted-foreground bg-muted inline-flex px-2 py-0.5 rounded mb-3">
                      {roleName}
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground group">
                        <Mail className="h-3.5 w-3.5 shrink-0 group-hover:text-primary transition-colors" />
                        <span className="truncate" title={e.email || "N/A"}>{e.email || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground group">
                        <Phone className="h-3.5 w-3.5 shrink-0 group-hover:text-primary transition-colors" />
                        <span>{e.phone || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Section>
            );
          })}
        </div>
      )}
    </div>
  );
}
