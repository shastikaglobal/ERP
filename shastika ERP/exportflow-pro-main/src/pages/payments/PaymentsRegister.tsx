import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Receipt, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { getPayments, getInvoices, seedFinanceData } from "@/lib/finance";
import { useAuth } from "@/hooks/useAuth";

export default function PaymentsRegister() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  
  const { data: all, isLoading } = useQuery({
    queryKey: ["payments-register"],
    queryFn: async () => {
      const [payments, invoices] = await Promise.all([
        getPayments(),
        getInvoices(),
      ]);

      return [
        ...payments.map((p) => ({
          id: p.id,
          ref: p.invoice_id,
          party: p.customer,
          amount: p.amount,
          currency: p.currency,
          method: p.method || "—",
          status: p.status,
          date: p.received_at,
        })),
        ...invoices
          .filter((i) => i.status !== "Paid")
          .map((i) => ({
            id: i.id,
            ref: i.order_id,
            party: i.customer,
            amount: i.amount,
            currency: i.currency,
            method: "Pending",
            status: i.status,
            date: i.due_at,
          })),
      ];
    },
  });

  const { mutate: addSampleData, isPending } = useMutation({
    mutationFn: async () => {
      if (!profile?.company_id) throw new Error("No company found");
      await seedFinanceData(profile.company_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments-register"] });
      toast.success("Sample data added!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Payment Register" description="All incoming and outstanding payments" breadcrumbs={[{ label: "Payments" }]} />
      {isLoading ? (
        <div className="erp-card flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !all || all.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-5 w-5" />}
          title="No payments yet"
          description="Payments and outstanding invoices will appear here."
          action={
            <Button size="sm" onClick={() => addSampleData()} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Sample Data
            </Button>
          }
        />
      ) : (
        <DataTable
          data={all}
          searchKeys={["id", "party"]}
          columns={[
            { key: "id", header: "ID", render: (r) => <span className="font-mono text-xs">{r.id.split('-')[0]}</span> },
            { key: "party", header: "Party", render: (r) => <span className="font-medium">{r.party}</span> },
            { key: "ref", header: "Reference", render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.ref ? r.ref.split('-')[0] : "—"}</span> },
            { key: "method", header: "Method", render: (r) => <span className="text-sm">{r.method}</span> },
            { key: "amount", header: "Amount", render: (r) => <span className="font-medium tabular-nums">{r.currency} {r.amount.toLocaleString()}</span> },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "date", header: "Date", render: (r) => <span className="text-xs text-muted-foreground">{r.date ? new Date(r.date).toLocaleDateString() : "—"}</span> },
          ]}
        />
      )}
    </div>
  );
}
