import { Award, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";

const certs = [
  { id: "COO-2025-0042", customer: "Mumbai Textiles Ltd", country: "India → Germany", status: "Approved", issued: "2025-04-15" },
  { id: "COO-2025-0041", customer: "Osaka Electronics", country: "India → Japan", status: "Approved", issued: "2025-04-12" },
  { id: "COO-2025-0040", customer: "Cairo Spices LLC", country: "India → Egypt", status: "Pending", issued: "2025-04-10" },
];

export default function Certificates() {
  return (
    <div>
      <PageHeader title="Certificates of Origin" description="Government-issued origin documents" breadcrumbs={[{ label: "Documents" }, { label: "Certificates" }]} />
      <Section>
        <div className="space-y-2">
          {certs.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3 border border-border rounded-md">
              <div className="h-9 w-9 rounded-md bg-success-muted text-success flex items-center justify-center"><Award className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium font-mono">{c.id}</div>
                <div className="text-xs text-muted-foreground">{c.customer} · {c.country} · Issued {c.issued}</div>
              </div>
              <StatusBadge status={c.status} />
              <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1.5" />PDF</Button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
