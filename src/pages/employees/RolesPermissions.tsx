import { Check } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/FormShell";

const roles = ["Admin", "Sales", "Logistics", "Finance", "Procurement", "Read-only"];
const permissions = [
  { module: "CRM", perms: [true, true, false, false, false, true] },
  { module: "Quotations", perms: [true, true, false, true, false, true] },
  { module: "Sales Orders", perms: [true, true, true, true, false, true] },
  { module: "Shipments", perms: [true, false, true, false, false, true] },
  { module: "Inventory", perms: [true, false, true, false, true, true] },
  { module: "Procurement", perms: [true, false, false, true, true, true] },
  { module: "Documents", perms: [true, true, true, true, true, true] },
  { module: "Payments", perms: [true, false, false, true, false, true] },
  { module: "Employees", perms: [true, false, false, false, false, false] },
  { module: "System", perms: [true, false, false, false, false, false] },
];

export default function RolesPermissions() {
  return (
    <div>
      <PageHeader title="Roles & Permissions" description="Configure access for each role" breadcrumbs={[{ label: "Employees" }, { label: "Roles" }]} />
      <Section>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left text-xs uppercase font-medium text-muted-foreground px-3 py-2">Module</th>
              {roles.map((r) => <th key={r} className="text-center text-xs uppercase font-medium text-muted-foreground px-3 py-2">{r}</th>)}
            </tr></thead>
            <tbody>
              {permissions.map((p) => (
                <tr key={p.module} className="border-b last:border-0 border-border">
                  <td className="px-3 py-2.5 font-medium">{p.module}</td>
                  {p.perms.map((v, i) => (
                    <td key={i} className="text-center px-3 py-2.5">
                      {v ? <Check className="h-4 w-4 text-success inline" /> : <span className="text-muted-foreground">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
