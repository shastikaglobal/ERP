import { useNavigate, useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Phone, Mail, MapPin, Sprout } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Section } from "@/components/shared/FormShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useFarmerContext } from "@/context/FarmerContext";
import { useIsAdminOrManager } from "@/hooks/useAuth";

export default function FarmerDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  // Redirect common module names if they accidentally hit this dynamic route (due to typos or casing issues)
  const idLower = id?.toLowerCase() || '';
  if (['collections', 'collection', 'goods-collection'].includes(idLower)) return <Navigate to="/farmers/collections" replace />;
  if (['rating', 'ratings', 'farmer-rating'].includes(idLower)) return <Navigate to="/farmers/rating" replace />;
  if (['payouts', 'payout', 'payments'].includes(idLower)) return <Navigate to="/farmers/payouts" replace />;
  if (['commitments', 'commitment', 'supply-commitments'].includes(idLower)) return <Navigate to="/farmers/commitments" replace />;
  if (['contracts', 'contract', 'contract-farming'].includes(idLower)) return <Navigate to="/farmers/contracts" replace />;
  if (['farm-visits', 'visits'].includes(idLower)) return <Navigate to="/farmers/farm-visits" replace />;
  if (['kyc'].includes(idLower)) return <Navigate to="/farmers/kyc" replace />;
  if (['verification', 'verify'].includes(idLower)) return <Navigate to="/farmers/verification" replace />;

  const { farmers } = useFarmerContext();
  const isAdmin = useIsAdminOrManager();
  
  const farmer = farmers.find(f => f.id === id);
  const isLoading = false;

  const { data: pos } = useQuery({
    queryKey: ["farmer-pos", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("id, po_number, order_date, total, status")
        .eq("farmer_id", id!)
        .neq("is_deleted", true)
        .order("order_date", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }
  if (!farmer) {
    return <div className="text-sm text-muted-foreground">Farmer not found.</div>;
  }

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => nav("/farmers")} className="mb-2 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>
      <PageHeader
        title={farmer.full_name}
        description={farmer.code || undefined}
        breadcrumbs={[{ label: "Farmers", to: "/farmers" }, { label: farmer.full_name }]}
        actions={<StatusBadge status={"Active"} />}
      />

      {isAdmin && farmer.created_by_name && (
        <div className="mb-6 p-4 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a]">
          <h3 className="text-sm font-medium text-slate-300 mb-2">Record Ownership</h3>
          <div className="flex gap-8 text-sm">
            <div><span className="text-muted-foreground mr-2">Created By:</span> {farmer.created_by_name}</div>
            {farmer.created_at && <div><span className="text-muted-foreground mr-2">Created At:</span> {new Date(farmer.created_at).toLocaleString()}</div>}
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Contact" className="lg:col-span-1">
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{farmer.phone || "—"}</li>
            <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{farmer.email || "—"}</li>
            <li className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" /><span>{[farmer.village, farmer.district, farmer.state, farmer.country].filter(Boolean).join(", ") || "—"}</span></li>
            <li className="flex items-center gap-2"><Sprout className="h-3.5 w-3.5 text-muted-foreground" />{(farmer.primary_crops || []).join(", ") || "—"}</li>
          </ul>
        </Section>

        <Section title="Recent purchase orders" className="lg:col-span-2">
          {!pos || pos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No purchase orders yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr><th className="text-left py-2">PO #</th><th className="text-left">Date</th><th className="text-right">Total</th><th className="text-left pl-3">Status</th></tr>
              </thead>
              <tbody>
                {pos.map((po) => (
                  <tr key={po.id} className="border-b last:border-0 border-border hover:bg-muted/40 cursor-pointer"
                      onClick={() => nav(`/procurement/orders`)}>
                    <td className="py-2 font-mono text-xs">{po.po_number}</td>
                    <td>{po.order_date}</td>
                    <td className="text-right tabular-nums">${Number(po.total).toLocaleString()}</td>
                    <td className="pl-3"><StatusBadge status={po.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {farmer.notes && (
          <Section title="Notes" className="lg:col-span-3">
            <p className="text-sm whitespace-pre-wrap">{farmer.notes}</p>
          </Section>
        )}
      </div>
    </div>
  );
}
