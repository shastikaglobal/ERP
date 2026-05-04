import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Mail, Phone, Building, Calendar, DollarSign, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { leads } from "@/data/mock";

export default function LeadDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const lead = leads.find((l) => l.id === id) ?? leads[0];

  return (
    <div>
      <PageHeader
        title={lead.company}
        breadcrumbs={[{ label: "CRM" }, { label: "Leads", to: "/crm/leads" }, { label: lead.id }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" />Back</Button>
            <Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-1.5" />Edit</Button>
            <Button size="sm" onClick={() => nav("/crm/convert")}><UserCheck className="h-4 w-4 mr-1.5" />Convert</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Section title="Overview">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-muted-foreground mb-1">Lead ID</dt><dd className="font-mono">{lead.id}</dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Status</dt><dd><StatusBadge status={lead.status} /></dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Source</dt><dd>{lead.source}</dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Owner</dt><dd>{lead.owner}</dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Country</dt><dd>{lead.country}</dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Estimated Value</dt><dd className="font-semibold">${lead.value.toLocaleString()}</dd></div>
            </dl>
          </Section>
          <Section title="Recent Activity">
            <ol className="relative border-l border-border ml-2 space-y-4">
              {[
                { who: lead.owner, what: "Sent intro email with product catalog", when: "2 days ago" },
                { who: lead.owner, what: "Discovery call scheduled for next week", when: "3 days ago" },
                { who: "System", what: "Lead created from website form", when: "5 days ago" },
              ].map((a, i) => (
                <li key={i} className="ml-4">
                  <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary border-4 border-background" />
                  <div className="text-sm font-medium">{a.what}</div>
                  <div className="text-xs text-muted-foreground">{a.who} · {a.when}</div>
                </li>
              ))}
            </ol>
          </Section>
        </div>
        <div className="space-y-4">
          <Section title="Contact">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" />{lead.contact}</div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{lead.contact.toLowerCase().replace(" ", ".")}@{lead.company.split(" ")[0].toLowerCase()}.com</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />+1 555 0100</div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />Last touch {lead.updatedAt}</div>
            </div>
          </Section>
          <Section title="Deal">
            <div className="text-3xl font-semibold tabular-nums">${lead.value.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">Estimated annual value</div>
          </Section>
        </div>
      </div>
    </div>
  );
}
