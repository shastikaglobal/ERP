import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Receipt, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";

type PurchaseOrder = {
  id: string;
  po_number: string;
  farmer_id: string;
  status: string;
  order_date: string;
  total: number;
  currency: string;
  farmers?: { full_name: string };
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500 hover:bg-gray-600 text-white",
  approved: "bg-blue-500 hover:bg-blue-600 text-white",
  sent: "bg-blue-500 hover:bg-blue-600 text-white",
  confirmed: "bg-green-500 hover:bg-green-600 text-white",
  received: "bg-purple-500 hover:bg-purple-600 text-white",
  cancelled: "bg-red-500 hover:bg-red-600 text-white",
};

export default function PurchaseOrdersListLive() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // Use the professional database-level join
        const { data, error } = await supabase
          .from("purchase_orders")
          .select(`
            id, 
            po_number, 
            farmer_id, 
            status, 
            order_date, 
            total, 
            currency, 
            farmer:farmers(full_name)
          `)
          .order("order_date", { ascending: false });

        if (error) throw error;
        setOrders(data as any);
      } catch (err: any) {
        toast.error(err.message || "Failed to fetch purchase orders");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">Manage your procurement orders from suppliers</p>
        </div>
        <Button onClick={() => navigate("/procurement/orders/create")}>
          <Plus className="mr-2 h-4 w-4" /> Create PO
        </Button>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Loading orders...</p>
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                  <p className="text-muted-foreground">No purchase orders found.</p>
                  <Button variant="link" onClick={() => navigate("/procurement/orders/create")}>
                    Create your first PO
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((po) => (
                <TableRow key={po.id} className="hover:bg-white/[0.02] cursor-pointer" onClick={() => navigate(`/procurement/orders/${po.id}`)}>
                  <TableCell className="font-medium text-primary hover:underline">{po.po_number}</TableCell>
                  <TableCell>{po.farmer?.full_name || "Unknown Supplier"}</TableCell>
                  <TableCell>{format(new Date(po.order_date), "MMM d, yyyy")}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select 
                      defaultValue={po.status} 
                      onValueChange={async (newStatus) => {
                        const { error } = await supabase.from('purchase_orders').update({ status: newStatus }).eq('id', po.id);
                        if (error) toast.error("Failed to update status");
                        else {
                          toast.success("Status updated");
                          setOrders(orders.map(o => o.id === po.id ? { ...o, status: newStatus } : o));
                        }
                      }}
                    >
                      <SelectTrigger className={`w-32 h-8 text-xs font-bold uppercase ${STATUS_COLORS[po.status] || "bg-gray-500"}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {po.currency} {Number(po.total)?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/procurement/orders/${po.id}`)}>
                      Details
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-white/10">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete Purchase Order {po.po_number} and all its linked items. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-white/5 border-white/10">Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={async () => {
                              const { error } = await supabase.from('purchase_orders').delete().eq('id', po.id);
                              if (error) toast.error("Failed to delete order");
                              else {
                                toast.success("Order deleted successfully");
                                setOrders(orders.filter(o => o.id !== po.id));
                              }
                            }}
                          >
                            Delete Order
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
