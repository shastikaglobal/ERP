import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Download, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

type Quotation = {
  id: string;
  quotation_number: string;
  total_amount: number;
  currency: string;
  status: string;
  items_count?: number;
  valid_until: string | null;
  created_at: string;
  customers: { name: string } | null;
  quotation_items?: { id: string }[];
};

export default function QuotationsList() {
  const nav = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuotations() {
      try {
        const { data, error } = await supabase
          .from("quotations")
          .select(`
            id, quotation_number, total_amount, currency, status, valid_until, created_at,
            customers (name),
            quotation_items (id)
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setQuotations(data as any);
      } catch (error: any) {
        toast.error("Failed to load quotations");
      } finally {
        setLoading(false);
      }
    }
    fetchQuotations();
  }, []);

  const formattedData = quotations.map(q => ({
    ...q,
    customer: q.customers?.name || "Unknown",
    items_count: q.quotation_items ? q.quotation_items.length : 0,
  }));

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Quotations" description="Manage all customer price quotes" breadcrumbs={[{ label: "Quotations" }]}
        actions={<>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
          <Button size="sm" onClick={() => nav("/quotations/create")}><Plus className="h-4 w-4 mr-1.5" />New Quotation</Button>
        </>}
      />
      <DataTable
        data={formattedData}
        searchKeys={["quotation_number", "customer"]}
        onRowClick={(r) => nav(`/quotations/${r.id}`)}
        columns={[
          { key: "quotation_number", header: "Quote #", render: (r) => <span className="font-mono text-xs font-semibold">{r.quotation_number}</span> },
          { key: "customer", header: "Customer", render: (r) => <span className="font-medium">{r.customer}</span> },
          { key: "items_count", header: "Items", render: (r) => <span className="tabular-nums">{r.items_count}</span> },
          { key: "amount", header: "Amount", render: (r) => <span className="font-medium tabular-nums">{r.currency} {Number(r.total_amount || 0).toLocaleString()}</span> },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "valid_until", header: "Valid Until", render: (r) => <span className="text-xs text-muted-foreground">{r.valid_until ? format(new Date(r.valid_until), "PP") : "-"}</span> },
          { key: "created_at", header: "Created", render: (r) => <span className="text-xs text-muted-foreground">{format(new Date(r.created_at), "PP")}</span> },
        ]}
      />
    </div>
  );
}
