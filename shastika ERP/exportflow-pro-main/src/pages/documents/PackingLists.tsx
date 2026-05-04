import { FileBox, Download } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";
import { shipments } from "@/data/mock";

export default function PackingLists() {
  return (
    <div>
      <PageHeader title="Packing Lists" description="Per-shipment packing list documents" breadcrumbs={[{ label: "Documents" }, { label: "Packing Lists" }]} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shipments.map((s) => (
          <Section key={s.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-md bg-info-muted text-info flex items-center justify-center"><FileBox className="h-5 w-5" /></div>
              <Button variant="ghost" size="icon" className="h-7 w-7"><Download className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="font-semibold text-sm">PL-{s.id.slice(3)}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.customer}</div>
            <div className="text-xs text-muted-foreground mt-2">{s.containerCount} containers · {s.destination}</div>
          </Section>
        ))}
      </div>
    </div>
  );
}
