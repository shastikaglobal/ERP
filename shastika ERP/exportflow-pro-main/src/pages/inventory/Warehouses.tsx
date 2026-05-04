import { Warehouse, MapPin } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/FormShell";

const warehouses = [
  { id: "W-1", name: "Mumbai DC", city: "Mumbai, IN", capacity: "82%", skus: 412, area: "12,000 sqft" },
  { id: "W-2", name: "Chennai DC", city: "Chennai, IN", capacity: "64%", skus: 286, area: "8,500 sqft" },
  { id: "W-3", name: "Kochi DC", city: "Kochi, IN", capacity: "48%", skus: 124, area: "6,000 sqft" },
  { id: "W-4", name: "Pune DC", city: "Pune, IN", capacity: "71%", skus: 198, area: "9,200 sqft" },
];

export default function Warehouses() {
  return (
    <div>
      <PageHeader title="Warehouses" description="All distribution centers" breadcrumbs={[{ label: "Inventory" }, { label: "Warehouses" }]} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {warehouses.map((w) => (
          <Section key={w.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="h-10 w-10 rounded-md bg-primary-muted text-primary flex items-center justify-center"><Warehouse className="h-5 w-5" /></div>
              <span className="text-xs font-mono text-muted-foreground">{w.id}</span>
            </div>
            <div className="font-semibold">{w.name}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1"><MapPin className="h-3 w-3" />{w.city}</div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground text-xs">SKUs</span><span className="tabular-nums">{w.skus}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground text-xs">Area</span><span>{w.area}</span></div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">Capacity</span><span className="font-medium">{w.capacity}</span></div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: w.capacity }} /></div>
              </div>
            </div>
          </Section>
        ))}
      </div>
    </div>
  );
}
