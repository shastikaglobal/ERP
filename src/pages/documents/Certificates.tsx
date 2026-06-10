import { useState, useEffect } from "react";
import { Award, Loader2, Trash2, FileText, Package } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Certificates() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCerts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("export_orders")
          .select("*, export_shipments(*)")
          .neq("is_deleted", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setShipments(data || []);
      } catch (err) {
        console.error("Cert load error:", err);
        toast.error("Failed to load certificates");
      } finally {
        setLoading(false);
      }
    };
    fetchCerts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this certificate record?")) return;

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
      toast.success("Certificate record hidden successfully");
      setShipments(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      toast.error("Failed to delete: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Certificates of Origin" 
        description="Manage international trade certificates" 
        breadcrumbs={[{ label: "Documents" }, { label: "Certificates" }]} 
      />
      
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : shipments.length === 0 ? (
        <div className="text-center p-20 border-2 border-dashed border-primary/20 rounded-2xl bg-primary/5">
          <Award className="h-16 w-16 mx-auto text-primary/40 mb-4" />
          <h3 className="text-xl font-bold text-primary mb-2">No Export Orders Found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            Certificates of Origin are automatically generated for every Export Order. 
            Create your first order to see it here!
          </p>
          <Button onClick={() => window.location.href = '/orders/create'}>
            Create New Export Order
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shipments.map((cert) => {
            const shipmentId = cert.export_shipments?.[0]?.id;
            return (
              <Card key={cert.id} className="overflow-hidden border-primary/10 hover:border-primary/30 transition-all hover:shadow-xl group">
                <CardHeader className="bg-muted/30 pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Award className="h-5 w-5" />
                      </div>
                      <span className="font-mono text-sm font-bold tracking-tighter">
                        {cert.order_number?.replace('EXP', 'COO')}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(cert.id)} 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <StatusBadge status={cert.status} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Consignee</p>
                    <p className="font-bold text-lg leading-tight">{cert.customer_name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1 border-l-2 border-primary/20 pl-3">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Destination</p>
                      <p className="text-sm font-medium">{cert.customer_country || 'International'}</p>
                    </div>
                    <div className="space-y-1 border-l-2 border-primary/20 pl-3">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Product</p>
                      <div className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5 text-primary" />
                        <p className="text-sm font-medium truncate">{cert.product}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/10 border-t p-3">
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90" 
                    onClick={() => window.open(`/certificates/${shipmentId || cert.id}/preview`, '_blank')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    GENERATE CERTIFICATE
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
