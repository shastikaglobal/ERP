import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star, Mail, Phone } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/FormShell";
import { suppliers } from "@/data/mock";

export default function SupplierDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const s = suppliers.find((x) => x.id === id) ?? suppliers[0];
  return (
    <div>
      <PageHeader title={s.name} description={`${s.category} · ${s.country}`} breadcrumbs={[{ label: "Procurement" }, { label: "Suppliers", to: "/procurement/suppliers" }, { label: s.id }]}
        actions={<Button variant="outline" size="sm" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1.5" />Back</Button>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Section title="Performance">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-muted-foreground mb-1">Rating</dt><dd className="inline-flex items-center gap-1 font-semibold"><Star className="h-4 w-4 fill-warning text-warning" />{s.rating}/5</dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Open POs</dt><dd className="font-semibold">{s.openPOs}</dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">Total spend</dt><dd className="font-semibold">${s.totalSpend.toLocaleString()}</dd></div>
              <div><dt className="text-xs text-muted-foreground mb-1">On-time delivery</dt><dd className="font-semibold">94%</dd></div>
            </dl>
          </Section>
        </div>
        <Section title="Contact">
          <div className="space-y-3 text-sm">
            <div>{s.contact}</div>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{s.contact.toLowerCase().replace(" ", ".")}@supplier.com</div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />+91 22 1234 5678</div>
          </div>
        </Section>
      </div>
    </div>
  );
}
