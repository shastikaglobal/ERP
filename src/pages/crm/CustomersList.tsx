import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, UserCheck, Globe, Search, Filter, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";

export default function CustomersList() {
  const { profile } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCustomers = async () => {
    if (!profile?.company_id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("company_id", profile.company_id)
        .order("name");
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (err: any) {
      console.error("Fetch error:", err);
      toast.error("Failed to load customer directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [profile?.company_id]);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery) return customers;
    const query = searchQuery.toLowerCase();
    return customers.filter(c => 
      c.name?.toLowerCase().includes(query) || 
      c.email?.toLowerCase().includes(query) || 
      c.country?.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    
    try {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
      toast.success("Customer removed successfully");
      setCustomers(customers.filter(c => c.id !== id));
    } catch (err: any) {
      toast.error("Could not delete customer. They may have active orders.");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Customer Directory" 
        description="Official database of your global clients and export partners"
        breadcrumbs={[{ label: "CRM", to: "/crm/leads" }, { label: "Customers" }]}
      />

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, email, or country..." 
            className="pl-10 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden shadow-2xl border-white/5">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-white/5">
              <TableHead className="font-bold text-xs uppercase tracking-wider">Customer Name</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Region / Country</TableHead>
              <TableHead className="font-bold text-xs uppercase tracking-wider">Contact Email</TableHead>
              <TableHead className="text-right font-bold text-xs uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary opacity-50" />
                  <p className="mt-4 text-sm text-muted-foreground">Accessing Directory...</p>
                </TableCell>
              </TableRow>
            ) : filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-20">
                  <div className="max-w-xs mx-auto space-y-3">
                    <UserCheck className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground font-medium">
                      {searchQuery ? `No matches found for "${searchQuery}"` : "Your Customer Directory is empty."}
                    </p>
                    <p className="text-xs text-muted-foreground/60">
                      Convert your won leads from the CRM pipeline to build your official client list.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-primary/5 transition-colors border-white/5">
                  <TableCell className="font-bold">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                        {customer.name?.charAt(0).toUpperCase()}
                      </div>
                      {customer.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-blue-500/70" />
                      <span className="font-medium">{customer.country || "Unspecified"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {customer.email || "No email recorded"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
                      onClick={() => handleDelete(customer.id, customer.name)}
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
      
      {/* Search Insights */}
      {filteredCustomers.length > 0 && searchQuery && (
        <p className="text-xs text-muted-foreground italic">
          Showing {filteredCustomers.length} of {customers.length} total customers.
        </p>
      )}
    </div>
  );
}

