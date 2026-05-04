import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, Truck } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { orders } from "@/data/mock";

export default function OrderDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const o = orders.find((x) => x.id === id) ?? orders[0];

  return (
    <div>
      <PageHeader title={o.id} description={o.customer} breadcrumbs={[{ label: "Sales Orders", to: "/orders" }, { label: o.id }]}
        actions={<>
          <Button variant="outline" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" />Back</Button>
          <Button variant="outline" size="sm"><FileText className="h-4 w-4 mr-1.5" />Invoice</Button>
          <Button size="sm" onClick={() => nav("/shipments/create")}><Truck className="h-4 w-4 mr-1.5" />Create Shipment</Button>
        </>}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Section title="Order Details">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-muted-foreground mb-1">Status</dt><dd><StatusBadge status={o.status} /></dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Incoterm</dt><dd>{o.incoterm}</dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Created</dt><dd>{o.createdAt}</dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Delivery</dt><dd>{o.deliveryDate}</dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Items</dt><dd>{o.items}</dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Amount</dt><dd className="font-semibold">{o.currency} {o.amount.toLocaleString()}</dd></div>
            </dl>
          </Section>
          <Section title="Line Items">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-xs text-muted-foreground uppercase">
                <th className="text-left py-2">Product</th><th className="text-right py-2">Qty</th><th className="text-right py-2">Price</th><th className="text-right py-2">Total</th>
              </tr></thead>
              <tbody>
                {Array.from({ length: Math.min(o.items, 6) }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0 border-border">
                    <td className="py-3">Item line {i + 1}</td>
                    <td className="text-right py-3 tabular-nums">{100 + i * 20}</td>
                    <td className="text-right py-3 tabular-nums">$4.50</td>
                    <td className="text-right py-3 tabular-nums">${((100 + i * 20) * 4.5).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
        <div className="space-y-4">
          <Section title="Customer">
            <div className="text-sm font-medium">{o.customer}</div>
            <div className="text-xs text-muted-foreground mt-1">View customer profile →</div>
          </Section>
          <Section title="Status Timeline">
            <ol className="space-y-3">
              {["Order placed", "Approved", "Processing", "Shipped", "Delivered"].map((s, i) => (
                <li key={s} className="flex items-center gap-2 text-sm">
                  <span className={`h-2 w-2 rounded-full ${i <= 2 ? "bg-success" : "bg-muted-foreground"}`} />
                  <span className={i <= 2 ? "" : "text-muted-foreground"}>{s}</span>
                </li>
              ))}
            </ol>
          </Section>
        </div>
      </div>
    </div>
  );
}
