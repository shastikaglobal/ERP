import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/FormShell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Approvals from "@/pages/Approvals";
import { useAuth } from "@/hooks/useAuth";

type Role = { id: string; name: string; slug: string };
type Permission = { id: string; module: string };

export default function RolesPermissions() {
  const { profile, roleSlugs } = useAuth();
  const canManageRoles = roleSlugs.has("admin") || roleSlugs.has("manager");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [accessMap, setAccessMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!profile?.company_id) return;
    loadData();
  }, [profile?.company_id]);

  const loadData = async () => {
    setLoading(true);
    // 1. Fetch roles specifically for this company
    const { data: dbRoles } = await supabase.from("roles")
      .select("id, name, slug")
      .eq("company_id", profile!.company_id)
      .order("created_at");
    
    // 2. Fetch all system permissions available
    const { data: dbPerms } = await supabase.from("permissions")
      .select("id, module");
      
    // 3. Fetch existing assignments
    const { data: dbRolePerms } = await supabase.from("role_permissions")
      .select("role_id, permission_id");

    if (dbRoles && dbPerms) {
      setRoles(dbRoles);
      setPermissions(dbPerms);
      
      // Get unique modules and alphabetize them
      const mods = Array.from(new Set(dbPerms.map(p => p.module))).sort();
      setModules(mods);

      // Build the access map
      const newMap: Record<string, boolean> = {};
      if (dbRolePerms) {
        dbRolePerms.forEach(rp => {
          const perm = dbPerms.find(p => p.id === rp.permission_id);
          if (perm) {
            newMap[`${rp.role_id}_${perm.module}`] = true;
          }
        });
      }
      setAccessMap(newMap);
    }
    setLoading(false);
  };

  const toggleAccess = (roleId: string, module: string) => {
    setAccessMap(prev => ({
      ...prev,
      [`${roleId}_${module}`]: !prev[`${roleId}_${module}`]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Convert matrix map back into role_permissions payload
    const newRolePerms: { role_id: string, permission_id: string }[] = [];
    
    for (const role of roles) {
      for (const module of modules) {
        if (accessMap[`${role.id}_${module}`]) {
          // If enabled, grant all underlying sub-permissions (view, edit, manage, etc.)
          const modulePerms = permissions.filter(p => p.module === module);
          for (const p of modulePerms) {
            newRolePerms.push({ role_id: role.id, permission_id: p.id });
          }
        }
      }
    }

    try {
      // Clean sweep: delete all permissions for these roles first
      const roleIds = roles.map(r => r.id);
      if (roleIds.length > 0) {
        await supabase.from("role_permissions").delete().in("role_id", roleIds);
      }
      
      // Insert new mapped permissions
      if (newRolePerms.length > 0) {
        const { error } = await supabase.from("role_permissions").insert(newRolePerms);
        if (error) throw error;
      }
      
      toast.success("Database successfully updated!");
    } catch (e: any) {
      toast.error("Error saving permissions: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <PageHeader 
        title="Roles & Permissions" 
        description="Configure access for each role. Saved directly to the live database." 
        breadcrumbs={[{ label: "Employees" }, { label: "Roles" }]} 
        actions={canManageRoles && <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save to Database"}</Button>}
      />
      <Approvals />
      {canManageRoles && (
        <>
          <div className="border-t border-border my-6" />
          <Section>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs uppercase font-medium text-muted-foreground px-3 py-3">Module</th>
                    {roles.map((r) => (
                      <th key={r.id} className="text-center text-xs uppercase font-medium text-muted-foreground px-3 py-3">
                        {r.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modules.map((mod) => (
                    <tr key={mod} className="border-b last:border-0 border-border hover:bg-sidebar-accent/30 transition-colors">
                      <td className="px-3 py-3 font-medium capitalize">{mod}</td>
                      {roles.map((r) => {
                        const hasAccess = accessMap[`${r.id}_${mod}`];
                        return (
                          <td 
                            key={r.id} 
                            className="text-center px-3 py-3 cursor-pointer select-none group"
                            onClick={() => toggleAccess(r.id, mod)}
                          >
                            <div className={`mx-auto flex h-6 w-6 items-center justify-center rounded transition-colors ${hasAccess ? 'bg-success/20' : 'bg-transparent hover:bg-sidebar-accent'}`}>
                              {hasAccess ? (
                                <Check className="h-4 w-4 text-success" />
                              ) : (
                                <span className="text-muted-foreground/30 group-hover:text-muted-foreground/60">—</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
