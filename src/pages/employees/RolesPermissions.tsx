import { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/FormShell";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Approvals from "@/pages/Approvals";
import { useAuth } from "@/hooks/useAuth";

const SECTION_MAPPING: Record<string, string[]> = {
  "DASHBOARDS": ["Executive & Activities", "Sales Analytics", "Shipment Analytics", "Financial Overview", "Employee Productivity", "Roles & Permissions"],
  "FARMERS": ["Farmers List", "Create Farmer", "Convert to Customer"],
  "CRM": ["Dashboard", "Leads", "Pipelines", "Follow-Ups", "Communication", "Client Acquisition", "Successful Conversation", "Client Success", "Customer Database", "Task", "Report", "Mail Box"],
  "REVENUE & PERFORMANCE ANALYTICS": ["Performance", "Revenue Analytics"],
  "MOBILE CRM": ["Mobile Login", "Push Notifications", "Call Logging", "GPS Tracking", "IP Tracking", "Device Authorization"],
  "PROCUREMENT": ["Dashboard", "Purchase Orders", "Suppliers"],
  "WAREHOUSE & INVENTORY": ["Dashboard", "Receiving Goods", "Available Stock Management", "Reserved Stock Tracking", "Export Ready Inventory", "Batch-wise Stock Tracking", "Damaged Stock Management", "Expiry Monitoring", "Multi-Warehouse Management", "Packing Management", "Inspection", "New Inspection", "Approvals", "WH Quality Control", "Container Loading", "Dispatch", "Shipment Register", "Create Shipment", "Container Tracking", "Delivery Status", "Barcodes", "Generate QR", "Scan", "Quotations", "Create Quotation", "Convert to Order", "Orders", "Create Order", "Status Tracking", "Fulfillment", "Invoices", "Packing Lists", "Certificate of Origin", "Document Viewer"],
  "REPORTS & ANALYTICS": ["Stock Summary", "Batch Tracking", "Dispatch Report", "Container Loading", "Damage/Wastage", "Inventory Aging", "Export Ready Stock"],
  "FINANCE": ["Payment Register", "Overdue", "Multi-Currency Ledger", "Financial Reports"],
  "TALLY": ["Tally Module", "Counts"],
  "ACCOUNTS": ["Journal Entry", "Ledger", "Trial Balance"],
  "REPORTS": ["GST Reports", "P&L Statement", "Balance Sheet"],
  "MASTERS": ["Parties", "Chart of Accounts"],
  "HR & EMPLOYEES": ["Directory", "Attendance", "Salary Report", "Face Attendance", "Register Face"],
  "SYSTEM": ["Notifications", "Activity Logs", "Subscriptions", "Settings", "Zoho Integration", "System Reset"]
};

// Flatten subsections for easy looping inside rows
const allSubsections = Object.entries(SECTION_MAPPING).flatMap(([section, subs]) => 
  subs.map(sub => ({ section, sub }))
);

type Profile = { 
  id: string; 
  full_name: string | null; 
  email: string | null; 
  employeeRole?: string; // from employees table
};

export default function RolesPermissions() {
  const { profile, roleSlugs } = useAuth();
  const slugs = Array.from(roleSlugs).map(s => s.toLowerCase());
  const canManageRoles = slugs.includes("admin") || slugs.includes("manager") || slugs.includes("secretary");
  const isAdmin = slugs.includes("admin");

  const [loading, setLoading] = useState(true);

  // --- Dynamic Matrix State ---
  const [users, setUsers] = useState<Profile[]>([]);
  const [dynamicAccessMap, setDynamicAccessMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!profile?.company_id) return;
    loadData();
  }, [profile?.company_id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // --- Fetching Users ---
      const { data: dbUsers, error: usersError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");
        
      if (usersError) throw usersError;

      // Fetch employees to map roles
      const { data: dbEmployees } = await (supabase
        .from("employees" as any)
        .select("email, role") as unknown as Promise<{ data: any[] }>);

      const mappedUsers = (dbUsers || []).map((u: any) => {
        const emp = dbEmployees?.find((e: any) => e.email?.toLowerCase() === u.email?.toLowerCase());
        return {
          ...u,
          employeeRole: emp?.role || "User"
        };
      });
      setUsers(mappedUsers);

      // --- Fetching Access ---
      const { data: dpData, error: dpError } = await (supabase
        .from("user_permissions" as any)
        .select("*")
        .eq("has_access", true) as unknown as Promise<{ data: any[], error: any }>);
        
      if (dpError) throw dpError;

      const newDynamicMap: Record<string, boolean> = {};
      if (dpData) {
        dpData.forEach(p => {
          newDynamicMap[`${p.user_id}_${p.section}`] = true;
        });
      }
      setDynamicAccessMap(newDynamicMap);

    } catch (e: any) {
      toast.error("Error loading data: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDynamicAccess = async (userId: string, subsection: string) => {
    if (!isAdmin) {
      toast.error("Only Administrators can modify user permissions.");
      return;
    }
    
    const currentVal = !!dynamicAccessMap[`${userId}_${subsection}`];
    const newVal = !currentVal;
    
    setDynamicAccessMap(prev => ({
      ...prev,
      [`${userId}_${subsection}`]: newVal
    }));

    try {
      console.log(`Before upsert: Attempting to save permission for User=${userId}, Section=${subsection}, Access=${newVal}`);
      
      const { error } = await (supabase
        .from("user_permissions" as any)
        .upsert({
          user_id: userId,
          section: subsection,
          has_access: newVal,
          granted_by: profile?.id
        }, { onConflict: 'user_id,section' }) as unknown as Promise<{ error: any }>);
        
      console.log(`After upsert: Supabase call completed. Error?`, error);

      if (error) throw error;

      console.log(`Successfully saved permission to DB for ${subsection}`);
      toast.success(`Permission ${newVal ? 'granted' : 'revoked'} for ${subsection} successfully!`);
    } catch (err: any) {
      console.error('Save permission error:', err);
      // Revert UI automatically if failure happens
      setDynamicAccessMap(prev => ({
        ...prev,
        [`${userId}_${subsection}`]: currentVal
      }));
      toast.error("Failed to update user permission: " + err.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <PageHeader 
          title="Roles & Permissions" 
          description="Manage systemic role defaults and specific user access." 
          breadcrumbs={[{ label: "Employees" }, { label: "Roles" }]} 
        />
        <Approvals />
      </div>

      {canManageRoles && (
        <>
          <div className="border-t border-border" />
          
          <Section>
            <div className="mb-4">
              <h3 className="text-lg font-semibold">User Content Permissions</h3>
              <p className="text-sm text-muted-foreground">Directly grant access to navigation sections per user. Auto-saves locally to user_permissions.</p>
            </div>
            
            <div className="overflow-x-auto max-h-[75vh] relative border border-border rounded-md custom-scrollbar">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="sticky top-0 z-30">
                  {/* --- SECTION HEADER ROW --- */}
                  <tr className="bg-primary/5">
                    <th 
                      rowSpan={2} 
                      className="text-left text-xs uppercase font-bold text-foreground px-4 py-3 sticky left-0 z-40 shadow-[1px_0_0_0_hsl(var(--border))] border-b border-border bg-card align-bottom"
                      style={{ minWidth: 200 }}
                    >
                      User
                    </th>
                    {Object.entries(SECTION_MAPPING).map(([section, subs]) => (
                      <th 
                        key={section} 
                        colSpan={subs.length} 
                        className="text-center text-[11px] uppercase font-bold text-primary px-3 py-2 border-l border-b border-border/50 border-border"
                      >
                        {section}
                      </th>
                    ))}
                  </tr>
                  {/* --- SUBSECTION HEADER ROW --- */}
                  <tr className="bg-muted shadow-sm">
                    {/* User column is occupied by rowSpan=2 */}
                    {Object.entries(SECTION_MAPPING).map(([section, subs]) => 
                      subs.map(sub => (
                        <th 
                          key={`${section}-${sub}`} 
                          className="text-center text-[10px] uppercase font-semibold text-muted-foreground px-3 py-2 border-l border-b border-border/50 border-border"
                        >
                          {sub}
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b last:border-0 border-border hover:bg-sidebar-accent/10 transition-colors bg-background">
                      <td className="px-4 py-3 sticky left-0 bg-background z-20 shadow-[1px_0_0_0_hsl(var(--border))]">
                        <div className="flex flex-col gap-1.5 items-start">
                          <div className="font-bold text-foreground">{u.full_name || 'Unnamed'}</div>
                          {u.employeeRole && (
                            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-wider border border-primary/20">
                              {u.employeeRole}
                            </span>
                          )}
                        </div>
                      </td>
                      {allSubsections.map(({ section, sub }) => {
                        const hasAccess = dynamicAccessMap[`${u.id}_${sub}`];
                        return (
                          <td 
                            key={`${section}-${sub}`} 
                            className={`text-center px-3 py-3 select-none group border-l border-border/50 ${isAdmin ? 'cursor-pointer' : 'cursor-default opacity-50'}`}
                            onClick={() => toggleDynamicAccess(u.id, sub)}
                          >
                            <div className={`mx-auto flex h-5 w-5 items-center justify-center rounded border transition-colors ${hasAccess ? 'bg-primary border-primary' : 'border-input group-hover:border-primary/50'}`}>
                              {hasAccess && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
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
