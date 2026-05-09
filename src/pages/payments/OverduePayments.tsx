import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Section } from "@/components/shared/FormShell";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

export default function OverduePayments() {
  const { profile } = useAuth();

  const { data: overdue = [], isLoading } = useQuery({
    queryKey: ['overdue_invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          amount,
          currency,
          status,
          due_at,
          customers ( name )
        `)
        .eq('status', 'Overdue');
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  const total = overdue.reduce((s: number, i: any) => s + (i.amount || 0), 0);

  return (
    <div>
      <PageHeader title="Overdue Payments" description="Invoices past their due date" breadcrumbs={[{ label: "Payments" }, { label: "Overdue" }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Overdue Count" value={String(overdue.length)} />
        <StatCard label="Overdue Amount" value={`$${total.toLocaleString()}`} />
        <StatCard label="Avg Days Late" value="12" />
        <StatCard label="Recovery Rate" value="87%" />
      </div>
      <Section title="Overdue Invoices">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-2">
            {overdue.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border border-border border-dashed rounded-md">No overdue invoices found</div>
            ) : (
              overdue.map((i: any) => (
                <div key={i.id} className="flex items-center gap-3 p-3 border border-border rounded-md">
                  <div className="h-9 w-9 rounded-md bg-destructive/10 text-destructive flex items-center justify-center"><AlertCircle className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{i.customers?.name || "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{i.invoice_number} · Due {i.due_at ? format(new Date(i.due_at), 'MMM dd, yyyy') : '—'} · {i.currency} {i.amount?.toLocaleString()}</div>
                  </div>
                  <Button size="sm" variant="outline">Send Reminder</Button>
                </div>
              ))
            )}
          </div>
        )}
      </Section>
    </div>
  );
}
