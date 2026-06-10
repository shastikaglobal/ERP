import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";
import { Search, Plus, Edit2, Trash2, Loader2, Eye, EyeOff, Phone, User, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";

const initialWarehouseFormState = {
  id: "",
  name: "",
  location: "",
  city: "",
  capacity: "",
  capacity_unit: "tons",
  manager_name: "",
  contact_number: "",
  status: "Active",
  notes: "",
};

const initialStockFormState = {
  id: "",
  warehouse_id: "",
  product_name: "",
  quantity: "",
  unit: "kg",
  last_updated: new Date().toISOString().slice(0, 10),
  notes: "",
};

const statusColorMap: Record<string, string> = {
  Active: "bg-green-50 text-green-800 border-green-200",
  Inactive: "bg-gray-50 text-gray-800 border-gray-200",
  Full: "bg-red-50 text-red-800 border-red-200",
};

export default function MultiWarehouse() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [warehouseFormState, setWarehouseFormState] = useState(initialWarehouseFormState);
  const [stockFormState, setStockFormState] = useState(initialStockFormState);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [expandedWarehouseId, setExpandedWarehouseId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);
  const [confirmType, setConfirmType] = useState<"warehouse" | "stock">("warehouse");
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null);

  const { data: warehouses = [], isLoading: isWarehousesLoading } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("warehouses")
        .select("*")
        .neq("is_deleted", true)
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: warehouseStock = [] } = useQuery({
    queryKey: ["warehouse-stock", expandedWarehouseId],
    queryFn: async () => {
      if (!expandedWarehouseId) return [];
      const { data, error } = await supabase
        .from("warehouse_stock")
        .select("*")
        .eq("warehouse_id", expandedWarehouseId)
        .neq("is_deleted", true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!expandedWarehouseId,
  });

  const warehouseMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (payload.id) {
        const { error } = await supabase
          .from("warehouses")
          .update({
            name: payload.name,
            location: payload.location,
            city: payload.city,
            capacity: payload.capacity ? Number(payload.capacity) : null,
            capacity_unit: payload.capacity_unit,
            manager_name: payload.manager_name,
            contact_number: payload.contact_number,
            status: payload.status,
            notes: payload.notes,
          })
          .eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("warehouses").insert([
          {
            name: payload.name,
            location: payload.location,
            city: payload.city,
            capacity: payload.capacity ? Number(payload.capacity) : null,
            capacity_unit: payload.capacity_unit,
            manager_name: payload.manager_name,
            contact_number: payload.contact_number,
            status: payload.status,
            notes: payload.notes,
          },
        ]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      setIsWarehouseModalOpen(false);
      setSelectedWarehouse(null);
      setWarehouseFormState(initialWarehouseFormState);
      toast.success("Warehouse saved successfully.");
    },
    onError: (err: any) => toast.error(err.message || "Failed to save warehouse."),
  });

  const stockMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (payload.id) {
        const { error } = await supabase
          .from("warehouse_stock")
          .update({
            product_name: payload.product_name,
            quantity: Number(payload.quantity),
            unit: payload.unit,
            last_updated: payload.last_updated,
            notes: payload.notes,
          })
          .eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("warehouse_stock").insert([
          {
            warehouse_id: payload.warehouse_id,
            product_name: payload.product_name,
            quantity: Number(payload.quantity),
            unit: payload.unit,
            last_updated: payload.last_updated,
            notes: payload.notes,
          },
        ]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-stock"] });
      setIsStockModalOpen(false);
      setStockFormState(initialStockFormState);
      toast.success("Stock saved successfully.");
    },
    onError: (err: any) => toast.error(err.message || "Failed to save stock."),
  });

  const { profile } = useAuth();

  const deleteWarehouseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("warehouses").update({
        is_deleted: true,
        is_active: false,
        deleted_at: new Date().toISOString(),
        deleted_by: profile?.id || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast.success("Warehouse hidden successfully.");
      setIsConfirmOpen(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete warehouse."),
  });

  const deleteStockMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("warehouse_stock").update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: profile?.id || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse-stock"] });
      toast.success("Stock hidden successfully.");
      setIsConfirmOpen(false);
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete stock."),
  });

  const filteredWarehouses = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return (warehouses || []).filter((warehouse: any) => {
      const nameMatch = warehouse.name?.toLowerCase().includes(query) || false;
      const cityMatch = warehouse.city?.toLowerCase().includes(query) || false;
      const statusMatch = statusFilter === "all" || warehouse.status === statusFilter;
      return (nameMatch || cityMatch) && statusMatch;
    });
  }, [warehouses, searchTerm, statusFilter]);

  const summary = useMemo(() => {
    const totalWarehouses = (warehouses || []).length;
    const activeWarehouses = (warehouses || []).filter((w: any) => w.status === "Active").length;
    const totalStock = (warehouseStock || []).reduce((sum, s: any) => sum + Number(s.quantity || 0), 0);
    const nonActiveWarehouses = totalWarehouses - activeWarehouses;

    return { totalWarehouses, activeWarehouses, totalStock, nonActiveWarehouses };
  }, [warehouses, warehouseStock]);

  const openAddWarehouseModal = () => {
    setSelectedWarehouse(null);
    setWarehouseFormState(initialWarehouseFormState);
    setIsWarehouseModalOpen(true);
  };

  const openEditWarehouseModal = (warehouse: any) => {
    setSelectedWarehouse(warehouse);
    setWarehouseFormState({
      id: warehouse.id,
      name: warehouse.name || "",
      location: warehouse.location || "",
      city: warehouse.city || "",
      capacity: String(warehouse.capacity || ""),
      capacity_unit: warehouse.capacity_unit || "tons",
      manager_name: warehouse.manager_name || "",
      contact_number: warehouse.contact_number || "",
      status: warehouse.status || "Active",
      notes: warehouse.notes || "",
    });
    setIsWarehouseModalOpen(true);
  };

  const handleSaveWarehouse = () => {
    if (!warehouseFormState.name || !warehouseFormState.location) {
      toast.error("Please fill in all required fields.");
      return;
    }

    warehouseMutation.mutate(warehouseFormState);
  };

  const openAddStockModal = (warehouseId: string) => {
    setStockFormState({
      ...initialStockFormState,
      warehouse_id: warehouseId,
    });
    setSelectedStockId(null);
    setIsStockModalOpen(true);
  };

  const openEditStockModal = (stock: any) => {
    setStockFormState({
      id: stock.id,
      warehouse_id: stock.warehouse_id,
      product_name: stock.product_name || "",
      quantity: String(stock.quantity || ""),
      unit: stock.unit || "kg",
      last_updated: stock.last_updated || new Date().toISOString().slice(0, 10),
      notes: stock.notes || "",
    });
    setSelectedStockId(stock.id);
    setIsStockModalOpen(true);
  };

  const handleSaveStock = () => {
    if (!stockFormState.product_name || !stockFormState.quantity) {
      toast.error("Please fill in all required fields.");
      return;
    }

    stockMutation.mutate(stockFormState);
  };

  const openConfirm = (id: string, type: "warehouse" | "stock" = "warehouse") => {
    setConfirmTargetId(id);
    setConfirmType(type);
    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!confirmTargetId) return;
    if (confirmType === "warehouse") {
      deleteWarehouseMutation.mutate(confirmTargetId);
    } else {
      deleteStockMutation.mutate(confirmTargetId);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Multi-Warehouse Management"
        description="Manage stock across multiple warehouse locations"
        breadcrumbs={[{ label: "Inventory", to: "/inventory" }, { label: "Multi-Warehouse Management" }]}
        actions={
          <Button onClick={openAddWarehouseModal} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Warehouse
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Warehouses</p>
            <p className="text-3xl font-bold">{summary.totalWarehouses}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Active Warehouses</p>
            <p className="text-3xl font-bold text-green-500">{summary.activeWarehouses}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Stock</p>
            <p className="text-3xl font-bold">{Number(summary.totalStock).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Full / Inactive</p>
            <p className="text-3xl font-bold text-red-500">{summary.nonActiveWarehouses}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:gap-4 md:grid-cols-3">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search by warehouse name or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Full">Full</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isWarehousesLoading ? (
        <Card>
          <CardContent className="py-10">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading warehouses...
            </div>
          </CardContent>
        </Card>
      ) : filteredWarehouses.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No warehouses found.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredWarehouses.map((warehouse: any) => (
              <div key={warehouse.id} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <h3 className="font-bold text-lg">{warehouse.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {warehouse.location}{warehouse.city ? `, ${warehouse.city}` : ""}
                    </div>
                  </div>
                  <Badge className={`border px-2 ${statusColorMap[warehouse.status] || statusColorMap.Active}`}>
                    {warehouse.status}
                  </Badge>
                </div>

                {warehouse.manager_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{warehouse.manager_name}</span>
                  </div>
                )}

                {warehouse.contact_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{warehouse.contact_number}</span>
                  </div>
                )}

                {warehouse.capacity && (
                  <div className="text-sm text-muted-foreground">
                    Capacity: {Number(warehouse.capacity).toLocaleString()} {warehouse.capacity_unit}
                  </div>
                )}

                {warehouse.notes && (
                  <p className="text-xs text-muted-foreground italic">{warehouse.notes}</p>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => {
                      if (expandedWarehouseId === warehouse.id) {
                        setExpandedWarehouseId(null);
                      } else {
                        setExpandedWarehouseId(warehouse.id);
                      }
                    }}
                  >
                    {expandedWarehouseId === warehouse.id ? (
                      <>
                        <EyeOff className="h-4 w-4" /> Hide Stock
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" /> View Stock
                      </>
                    )}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEditWarehouseModal(warehouse)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openConfirm(warehouse.id, "warehouse")}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {expandedWarehouseId && (
            <Card>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">
                    Stock in {warehouses.find((w: any) => w.id === expandedWarehouseId)?.name}
                  </h3>
                  <Button
                    size="sm"
                    onClick={() => openAddStockModal(expandedWarehouseId)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" /> Add Stock
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {warehouseStock.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                            No stock records for this warehouse.
                          </TableCell>
                        </TableRow>
                      ) : (
                        warehouseStock.map((stock: any) => (
                          <TableRow key={stock.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{stock.product_name}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {Number(stock.quantity).toLocaleString()} {stock.unit}
                            </TableCell>
                            <TableCell className="text-sm">
                              {stock.last_updated ? format(parseISO(stock.last_updated), "MMM d, yyyy") : "-"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{stock.notes || "-"}</TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button size="sm" variant="ghost" onClick={() => openEditStockModal(stock)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => openConfirm(stock.id, "stock")}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={isWarehouseModalOpen} onOpenChange={setIsWarehouseModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedWarehouse ? "Edit Warehouse" : "Add New Warehouse"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Warehouse Name *</Label>
                <Input
                  value={warehouseFormState.name}
                  onChange={(e) => setWarehouseFormState((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Main Warehouse"
                />
              </div>
              <div className="space-y-2">
                <Label>Location *</Label>
                <Input
                  value={warehouseFormState.location}
                  onChange={(e) => setWarehouseFormState((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Industrial Park"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={warehouseFormState.city}
                  onChange={(e) => setWarehouseFormState((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="e.g., Bangalore"
                />
              </div>
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input
                  type="number"
                  min="0"
                  value={warehouseFormState.capacity}
                  onChange={(e) => setWarehouseFormState((prev) => ({ ...prev, capacity: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Capacity Unit</Label>
                <Input
                  value={warehouseFormState.capacity_unit}
                  onChange={(e) => setWarehouseFormState((prev) => ({ ...prev, capacity_unit: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Manager Name</Label>
                <Input
                  value={warehouseFormState.manager_name}
                  onChange={(e) => setWarehouseFormState((prev) => ({ ...prev, manager_name: e.target.value }))}
                  placeholder="e.g., John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Number</Label>
                <Input
                  value={warehouseFormState.contact_number}
                  onChange={(e) => setWarehouseFormState((prev) => ({ ...prev, contact_number: e.target.value }))}
                  placeholder="e.g., +91-XXXXXXXXXX"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={warehouseFormState.status} onValueChange={(value) => setWarehouseFormState((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Full">Full</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={warehouseFormState.notes}
                onChange={(e) => setWarehouseFormState((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWarehouseModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveWarehouse} disabled={warehouseMutation.isLoading}>
              {warehouseMutation.isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Warehouse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isStockModalOpen} onOpenChange={setIsStockModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedStockId ? "Edit Stock" : "Add Stock"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Product Name *</Label>
                <Input
                  value={stockFormState.product_name}
                  onChange={(e) => setStockFormState((prev) => ({ ...prev, product_name: e.target.value }))}
                  placeholder="e.g., Tender Coconut"
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min="0"
                  value={stockFormState.quantity}
                  onChange={(e) => setStockFormState((prev) => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input
                  value={stockFormState.unit}
                  onChange={(e) => setStockFormState((prev) => ({ ...prev, unit: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Updated</Label>
                <Input
                  type="date"
                  value={stockFormState.last_updated}
                  onChange={(e) => setStockFormState((prev) => ({ ...prev, last_updated: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={stockFormState.notes}
                onChange={(e) => setStockFormState((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStockModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStock} disabled={stockMutation.isLoading}>
              {stockMutation.isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={confirmType === "warehouse" ? "Delete Warehouse" : "Delete Stock"}
        description={confirmType === "warehouse" ? "Are you sure you want to delete this warehouse and all its stock? This action cannot be undone." : "Are you sure you want to delete this stock record? This action cannot be undone."}
        onConfirm={handleConfirm}
        isLoading={confirmType === "warehouse" ? deleteWarehouseMutation.isLoading : deleteStockMutation.isLoading}
      />
    </div>
  );
}
