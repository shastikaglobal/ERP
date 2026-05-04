import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/FormShell";
import { Mail, Phone, Calendar, FileText } from "lucide-react";

const activities = [
  { icon: Mail, who: "Sara Kim", what: "Sent quotation QT-2025-0142 to Mumbai Textiles", when: "10 minutes ago", type: "email" },
  { icon: Phone, who: "John Doe", what: "Discovery call with Berlin Auto GmbH", when: "1 hour ago", type: "call" },
  { icon: Calendar, who: "Maria Lopez", what: "Scheduled demo with Osaka Electronics", when: "3 hours ago", type: "meeting" },
  { icon: FileText, who: "John Doe", what: "Created lead L-1042 — Mumbai Textiles", when: "Yesterday", type: "note" },
  { icon: Mail, who: "Sara Kim", what: "Follow-up email to Lagos Foods Co", when: "Yesterday", type: "email" },
  { icon: Phone, who: "Maria Lopez", what: "Called Cairo Spices LLC — left voicemail", when: "2 days ago", type: "call" },
];

export default function LeadActivities() {
  return (
    <div>
      <PageHeader title="Lead Activities" description="All recent interactions across your CRM" breadcrumbs={[{ label: "CRM" }, { label: "Activities" }]} />
      <Section>
        <ol className="space-y-4">
          {activities.map((a, i) => {
            const Icon = a.icon;
            return (
              <li key={i} className="flex gap-3 pb-4 last:pb-0 border-b last:border-0 border-border">
                <div className="h-9 w-9 rounded-full bg-primary-muted text-primary flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm">{a.what}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{a.who} · {a.when}</div>
                </div>
              </li>
            );
          })}
        </ol>
      </Section>
    </div>
  );
}
