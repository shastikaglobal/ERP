import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { orders } from "@/data/mock";

const stages = ["Pending", "Processing", "Shipped", "Delivered"];

export default function OrderStatus() {
  return (
    <div>
      <PageHeader title="Order Status Tracking" description="Monitor every order through the fulfillment lifecycle" breadcrumbs={[{ label: "Sales Orders" }, { label: "Status" }]} />
      <div className="space-y-3">
        {orders.map((o) => {
          const idx = stages.indexOf(o.status);
          return (
            <Section key={o.id}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-semibold text-sm">{o.id} — {o.customer}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Delivery {o.deliveryDate} · {o.currency} {o.amount.toLocaleString()}</div>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <div className="relative flex items-center justify-between">
                {stages.map((s, i) => (
                  <div key={s} className="flex flex-col items-center flex-1">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold z-10 ${i <= idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
                    <div className={`text-xs mt-1.5 ${i <= idx ? "font-medium" : "text-muted-foreground"}`}>{s}</div>
                  </div>
                ))}
                <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-muted -z-0">
                  <div className="h-full bg-primary transition-all" style={{ width: `${(idx / (stages.length - 1)) * 100}%` }} />
                </div>
              </div>
            </Section>
          );
        })}
      </div>
    </div>
  );
}
