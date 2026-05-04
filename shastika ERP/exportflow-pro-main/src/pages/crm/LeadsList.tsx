import { useNavigate } from "react-router-dom";
import { Plus, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { leads } from "@/data/mock";

export default function LeadsList() {
  const nav = useNavigate();
  return (
    <div>
      <PageHeader
        title="Leads"
        description="Track prospects through your sales pipeline"
        breadcrumbs={[{ label: "CRM" }, { label: "Leads" }]}
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
            <Button size="sm" onClick={() => nav("/crm/leads/create")}><Plus className="h-4 w-4 mr-1.5" />New Lead</Button>
          </>
        }
      />
      <DataTable
        data={leads}
        searchKeys={["company", "contact", "id"]}
        onRowClick={(r) => nav(`/crm/leads/${r.id}`)}
        columns={[
          { key: "id", header: "ID", render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.id}</span> },
          { key: "company", header: "Company", render: (r) => <span className="font-medium">{r.company}</span> },
          { key: "contact", header: "Contact", render: (r) => <span className="text-sm">{r.contact}</span> },
          { key: "country", header: "Country", render: (r) => <span className="text-sm text-muted-foreground">{r.country}</span> },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "value", header: "Est. Value", render: (r) => <span className="font-medium tabular-nums">${r.value.toLocaleString()}</span> },
          { key: "owner", header: "Owner", render: (r) => <span className="text-sm">{r.owner}</span> },
          { key: "updatedAt", header: "Updated", render: (r) => <span className="text-xs text-muted-foreground">{r.updatedAt}</span> },
        ]}
      />
    </div>
  );
}
