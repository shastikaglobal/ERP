import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Ship, Container as ContainerIcon, Anchor, Truck as TruckIcon, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { shipments } from "@/data/mock";

const events = [
  { icon: CheckCircle2, label: "Booking confirmed", at: "2025-04-12 10:00", done: true },
  { icon: ContainerIcon, label: "Container loaded at warehouse", at: "2025-04-13 14:30", done: true },
  { icon: Anchor, label: "Departed from Mumbai (INMUN)", at: "2025-04-14 06:15", done: true },
  { icon: Ship, label: "In transit — Indian Ocean", at: "2025-04-17", done: true, current: true },
  { icon: Anchor, label: "Arrival at destination port", at: "Est. 2025-05-18", done: false },
  { icon: TruckIcon, label: "Final delivery", at: "Est. 2025-05-20", done: false },
];

export default function ShipmentDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const s = shipments.find((x) => x.id === id) ?? shipments[0];
  return (
    <div>
      <PageHeader title={s.id} description={`${s.customer} · ${s.carrier}`} breadcrumbs={[{ label: "Shipments", to: "/shipments" }, { label: s.id }]}
        actions={<Button variant="outline" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" />Back</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Section title="Timeline">
            <ol className="relative border-l-2 border-border ml-3 space-y-5">
              {events.map((e, i) => {
                const Icon = e.icon;
                return (
                  <li key={i} className="ml-6">
                    <span className={`absolute -left-[13px] flex items-center justify-center h-6 w-6 rounded-full border-2 border-background ${e.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="h-3 w-3" />
                    </span>
                    <div className={`text-sm font-medium ${e.current ? "text-primary" : ""}`}>{e.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{e.at}</div>
                  </li>
                );
              })}
            </ol>
          </Section>
        </div>
        <div className="space-y-4">
          <Section title="Status"><StatusBadge status={s.status} /></Section>
          <Section title="Route">
            <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" />{s.origin}</div>
            <div className="ml-2 my-1 h-6 border-l border-dashed border-muted-foreground" />
            <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-primary" />{s.destination}</div>
          </Section>
          <Section title="Details">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Carrier</dt><dd>{s.carrier}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Containers</dt><dd>{s.containerCount}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Departed</dt><dd>{s.departedAt}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">ETA</dt><dd>{s.eta}</dd></div>
            </dl>
          </Section>
        </div>
      </div>
    </div>
  );
}
