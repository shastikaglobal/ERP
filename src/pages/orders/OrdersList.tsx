import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Receipt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAuth } from "@/hooks/useAuth";

type ExportOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_country: string;
  product: string;
  quantity: number;
  unit: string;
  total_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  order_date: string;
};

export default function OrdersList() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [orders, setOrders] = useState<ExportOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this order?")) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: any = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch(`/api/finance/export_orders/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error(await res.text() || "Failed to delete order");

      // Update local state to hide the deleted item from UI
      setOrders(orders.filter(o => o.id !== id));
      toast.success("Order removed from view (soft-deleted)");
    } catch (err: any) {
      toast.error("Failed to delete order");
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!profile?.company_id) return;
        const { data: { session } } = await supabase.auth.getSession();
        const headers: any = { 'Content-Type': 'application/json' };
        if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

        const res = await fetch(`/api/finance/export_orders?company_id=${profile.company_id}`, { headers });
        if (!res.ok) throw new Error(await res.text() || "Failed to load orders");

        const data = await res.json();
        const sorted = data.sort((a: any, b: any) => new Date(b.created_at || b.order_date).getTime() - new Date(a.created_at || a.order_date).getTime());
        setOrders(sorted || []);
      } catch (err: any) {
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [profile?.company_id]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Export Orders</h1>
          <p className="text-sm text-muted-foreground">Manage your customer export orders</p>
        </div>
        <Button onClick={() => navigate("/orders/create")}>
          <Plus className="mr-2 h-4 w-4" /> Create Order
        </Button>
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Payment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                  <p className="text-muted-foreground">No export orders found.</p>
                  <Button variant="link" onClick={() => navigate("/orders/create")}>Create the first order</Button>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow 
                  key={order.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  <TableCell className="font-medium text-primary">{order.order_number}</TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell>{order.customer_country}</TableCell>
                  <TableCell>{order.product}</TableCell>
                  <TableCell className="text-right">{order.quantity} {order.unit}</TableCell>
                  <TableCell className="text-right font-medium">
                    {order.currency} {Number(order.total_amount).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-center">
                    <StatusBadge status={order.payment_status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDelete(e, order.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
