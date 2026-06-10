import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileBox, Package, Loader2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/StatusBadge";

export default function PackingLists() {
  const navigate = useNavigate();
  const [packingLists, setPackingLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPLs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("export_orders")
          .select("*, export_shipments(*)")
          .neq("is_deleted", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPackingLists(data || []);
      } catch (err) {
        console.error("PL load error:", err);
        toast.error("Failed to load packing lists");
      } finally {
        setLoading(false);
      }
    };
    fetchPLs();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this packing list?")) return;

    try {
      const { error } = await supabase
        .from("export_orders")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: null,
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Packing list hidden successfully");
      setPackingLists(prev => prev.filter(pl => pl.id !== id));
    } catch (err: any) {
      toast.error("Failed to delete: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Packing Lists"
        description="Manage and print shipment packing lists"
        breadcrumbs={[{ label: "Documents" }, { label: "Packing Lists" }]}
      />

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : packingLists.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground italic">
          No packing lists found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packingLists.map((pl) => (
            <Card key={pl.id} className="overflow-hidden border-primary/10 hover:border-primary/30 transition-all">
              <CardHeader className="bg-muted/30 pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <FileBox className="h-5 w-5 text-primary" />
                    <span className="font-mono text-sm font-bold">
                      {pl.order_number?.replace('EXP', 'PL')}
                    </span>
                  </div>
                  <div className="flex gap-1 items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(pl.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <StatusBadge status={pl.status} />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Customer</p>
                  <p className="font-bold">{pl.customer_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Product</p>
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3 text-primary" />
                      <span className="text-sm font-medium">{pl.product}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Quantity</p>
                    <p className="text-sm font-medium tabular-nums">{pl.quantity} {pl.unit}</p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-muted/10 border-t p-3">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => navigate(`/documents/packing-lists/${pl.id}/preview`)}
                >
                  VIEW PDF
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}