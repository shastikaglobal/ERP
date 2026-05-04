import { useEffect, useState, type FormEvent } from "react";
import { Plus, Mail, Phone, Loader2, Users, MoreVertical, Edit, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";



type Employee = {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  status: string;
};

type NewEmployee = {
  full_name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  active: boolean;
};

export default function EmployeeDirectory() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id ?? null;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newEmployee, setNewEmployee] = useState<NewEmployee>({
    full_name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    active: true,
  });

  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch all profiles
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, status, requested_role")
        .order("created_at", { ascending: false });

      if (profileError) throw profileError;

      // 2. Fetch all metrics
      const { data: metrics, error: metricsError } = await supabase
        .from("employee_productivity_metrics")
        .select("profile_id, role, department, active");

      // We ignore metrics error to allow the page to load even if the table is missing
      const metricsMap = (metrics ?? []).reduce((acc: any, m: any) => {
        acc[m.profile_id] = m;
        return acc;
      }, {});

      const mapped: Employee[] = (profiles ?? []).map((p: any) => {
        const m = metricsMap[p.id] || {};
        return {
          id: p.id,
          name: p.full_name ?? "Unnamed",
          role: m.role || p.requested_role || "—",
          department: m.department || "—",
          email: p.email ?? "—",
          phone: p.phone ?? "—",
          status: m.active !== undefined ? (m.active ? "Active" : "Inactive") : (p.status === "approved" ? "Active" : "Inactive"),
        };
      });

      setEmployees(mapped);
    } catch (err: any) {
      setError(err.message ?? "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const resetNewEmployeeForm = () => {
    setNewEmployee({
      full_name: "",
      email: "",
      phone: "",
      role: "",
      department: "",
      active: true,
    });
    setFormError(null);
  };

  const handleCreateEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!newEmployee.full_name.trim() || !newEmployee.email.trim() || !newEmployee.role.trim() || !newEmployee.department.trim()) {
      setFormError("Please fill in name, email, role, and department.");
      return;
    }

    if (!companyId) {
      setFormError("You must be logged in to a company to add employees.");
      return;
    }

    setSaving(true);

    try {
      // Generate a new UUID for the profile
      const newProfileId = crypto.randomUUID();

      // 1. Create a profile record
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: newProfileId,
          full_name: newEmployee.full_name,
          email: newEmployee.email,
          phone: newEmployee.phone,
          company_id: companyId,
          status: "approved",
          requested_role: newEmployee.role,
          is_active: true
        });

      if (profileError) throw profileError;

      // 2. Create productivity metrics record (which holds role/department in this schema)
      const { error: metricsError } = await supabase
        .from("employee_productivity_metrics")
        .insert({
          profile_id: newProfileId,
          company_id: companyId,
          role: newEmployee.role,
          department: newEmployee.department,
          active: true,
          attendance_pct: 100,
          tasks_completed: 0,
          avg_response_minutes: 0,
          productivity_score: 0,
          performance_label: "New"
        });

      if (metricsError) {
        // If metrics fails, we should ideally clean up the profile, 
        // but for now we just throw the error.
        throw metricsError;
      }

      await fetchEmployees();

      setDialogOpen(false);
      resetNewEmployeeForm();
    } catch (err: any) {
      setFormError(err.message ?? "Unable to add employee.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingEmployee) return;

    setFormError(null);
    if (!editingEmployee.name.trim() || !editingEmployee.email.trim() || !editingEmployee.role.trim() || !editingEmployee.department.trim()) {
      setFormError("Please fill in name, email, role, and department.");
      return;
    }

    setSaving(true);
    try {
      // 1. Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: editingEmployee.name,
          email: editingEmployee.email,
          phone: editingEmployee.phone,
          requested_role: editingEmployee.role,
        })
        .eq("id", editingEmployee.id);

      if (profileError) throw profileError;

      // 2. Update/Upsert metrics (role, department, active status)
      // We use upsert so that if the record doesn't exist, it gets created.
      const { error: metricsError } = await supabase
        .from("employee_productivity_metrics")
        .upsert({
          profile_id: editingEmployee.id,
          company_id: companyId, // profile's company_id
          role: editingEmployee.role,
          department: editingEmployee.department,
          active: editingEmployee.status === "Active",
        }, { onConflict: "company_id,profile_id" });

      if (metricsError) {
        console.error("Metrics update error:", metricsError);
        // We don't throw here to allow profile updates even if metrics table is missing/restricted
      }

      toast.success("Employee updated successfully");
      setEditDialogOpen(false);
      fetchEmployees();
    } catch (err: any) {
      setFormError(err.message ?? "Unable to update employee.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    setSaving(true);
    try {
      // Helper to safely delete from a table that might not exist
      const safeDelete = async (table: string, profileId: string) => {
        try {
          await supabase.from(table).delete().eq("profile_id", profileId);
        } catch (e) {
          console.warn(`Could not delete from ${table} (it might not exist):`, e);
        }
      };

      // 1-3. Delete from secondary tables (optional/resilient)
      await safeDelete("employee_productivity_metrics", employeeToDelete.id);
      await safeDelete("employee_attendance_records", employeeToDelete.id);
      await safeDelete("employee_task_history", employeeToDelete.id);

      // 4. Delete profile (This is the primary record)
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", employeeToDelete.id);

      if (profileError) {
        // Handle the case where even profiles delete returns a 404/not found error
        if (profileError.code === "PGRST204" || profileError.message.includes("not found")) {
           console.log("Profile already gone or table missing");
        } else {
          throw new Error(profileError.message || "Failed to delete profile. Please check if this employee has linked records.");
        }
      }

      // Optimistically update the UI by removing the employee from the local state
      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeToDelete.id));

      // Invalidate queries for other pages that use this data
      queryClient.invalidateQueries({ queryKey: ["employee_productivity"] });
      queryClient.invalidateQueries({ queryKey: ["employee_attendance"] });

      toast.success("Employee deleted successfully");
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
      
      // Refresh the list from the server to be sure
      await fetchEmployees();
    } catch (err: any) {
      console.error("Deletion error:", err);
      toast.error(err.message ?? "Failed to delete employee");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Employee Directory" description="All team members across departments" breadcrumbs={[{ label: "Employees" }]}
        actions={
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetNewEmployeeForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1.5" />Add Employee</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Employee</DialogTitle>
                <DialogDescription>Fill in the employee details to add them to the directory.</DialogDescription>
              </DialogHeader>
              <form className="grid gap-4 py-2" onSubmit={handleCreateEmployee}>
                <div className="grid gap-2">
                  <Label htmlFor="full_name">Full name</Label>
                  <Input id="full_name" placeholder="John Doe" value={newEmployee.full_name} onChange={(event) => setNewEmployee((prev) => ({ ...prev, full_name: event.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="john@example.com" value={newEmployee.email} onChange={(event) => setNewEmployee((prev) => ({ ...prev, email: event.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" placeholder="+91 98765 43210" value={newEmployee.phone} onChange={(event) => setNewEmployee((prev) => ({ ...prev, phone: event.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" placeholder="Sales Executive" value={newEmployee.role} onChange={(event) => setNewEmployee((prev) => ({ ...prev, role: event.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="department">Department</Label>
                  <Input id="department" placeholder="Sales" value={newEmployee.department} onChange={(event) => setNewEmployee((prev) => ({ ...prev, department: event.target.value }))} />
                </div>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <DialogFooter className="mt-4 gap-2">
                  <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Add employee"}</Button>
                  <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {loading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading employees…</span>
        </div>
      )}

      {error && (
        <div className="text-center py-20 text-destructive">
          <p>Error: {error}</p>
        </div>
      )}

      {!loading && !error && employees.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
          <Users className="h-10 w-10 opacity-40" />
          <p>No employees found</p>
        </div>
      )}

      {!loading && !error && employees.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((e) => (
            <Section key={e.id} className="relative group">
              <div className="absolute top-4 right-4 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setEditingEmployee(e);
                      setEditDialogOpen(true);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {
                      setEmployeeToDelete(e);
                      setDeleteDialogOpen(true);
                    }}>
                      <Trash2 className="h-4 w-4 mr-2" />Delete Employee
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-start gap-3 cursor-pointer" onClick={() => {
                setEditingEmployee(e);
                setEditDialogOpen(true);
              }}>
                <div className="h-12 w-12 rounded-full bg-primary-muted text-primary flex items-center justify-center font-semibold shrink-0">{e.name.split(" ").map(n => n[0]).join("")}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <div className="font-semibold text-sm sm:text-base leading-tight">{e.name}</div>
                    <StatusBadge status={e.status} />
                  </div>
                  <div className="text-xs text-muted-foreground">{e.role} · {e.department}</div>
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3 w-3 shrink-0" /><span className="truncate">{e.email}</span></div>
                    <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3 w-3 shrink-0" />{e.phone}</div>
                  </div>
                </div>
              </div>
            </Section>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update the information for {editingEmployee?.name}.</DialogDescription>
          </DialogHeader>
          {editingEmployee && (
            <form className="grid gap-4 py-2" onSubmit={handleUpdateEmployee}>
              <div className="grid gap-2">
                <Label htmlFor="edit_name">Full name</Label>
                <Input id="edit_name" value={editingEmployee.name} onChange={(event) => setEditingEmployee({ ...editingEmployee, name: event.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_email">Email</Label>
                <Input id="edit_email" type="email" value={editingEmployee.email} onChange={(event) => setEditingEmployee({ ...editingEmployee, email: event.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_phone">Phone</Label>
                <Input id="edit_phone" value={editingEmployee.phone} onChange={(event) => setEditingEmployee({ ...editingEmployee, phone: event.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_role">Role</Label>
                <Input id="edit_role" value={editingEmployee.role} onChange={(event) => setEditingEmployee({ ...editingEmployee, role: event.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_department">Department</Label>
                <Input id="edit_department" value={editingEmployee.department} onChange={(event) => setEditingEmployee({ ...editingEmployee, department: event.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_status">Status</Label>
                <select 
                  id="edit_status"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={editingEmployee.status}
                  onChange={(event) => setEditingEmployee({ ...editingEmployee, status: event.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              <DialogFooter className="mt-4 gap-2">
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
                <Button type="button" variant="secondary" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee
              <strong> {employeeToDelete?.name} </strong> and all associated productivity data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteEmployee();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={saving}
            >
              {saving ? "Deleting..." : "Delete Employee"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
