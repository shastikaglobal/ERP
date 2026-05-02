import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Lead = {
  id: string;
  company_name: string;
  contact_name: string;
  country: string;
  interested_product: string;
  stage: string;
  assigned_to: string | null;
  profiles?: { full_name: string };
};

const STAGES = ["new", "contacted", "negotiation", "qualified", "won", "lost"];

const STAGE_COLORS: Record<string, string> = {
  new: "bg-slate-500",
  contacted: "bg-blue-500",
  negotiation: "bg-yellow-500",
  qualified: "bg-purple-500",
  won: "bg-green-500",
  lost: "bg-red-500",
};

export default function LeadsList() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [country, setCountry] = useState("");
  const [product, setProduct] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          id, company_name, contact_name, country, interested_product, stage, assigned_to,
          profiles:assigned_to (full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data as unknown as Lead[]);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) {
      toast.error("Company name is required");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("leads").insert({
        company_name: companyName,
        contact_name: contactName,
        country: country,
        interested_product: product,
        stage: "new",
        assigned_to: user?.id,
      });

      if (error) throw error;
      
      toast.success("Lead created successfully");
      setIsDialogOpen(false);
      setCompanyName("");
      setContactName("");
      setCountry("");
      setProduct("");
      fetchLeads();
    } catch (error: any) {
      toast.error(error.message || "Failed to create lead");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
      toast.success("Lead deleted");
      fetchLeads();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete lead");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Lead</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddLead} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Interested Product</Label>
                <Input value={product} onChange={(e) => setProduct(e.target.value)} />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Lead
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No leads found.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.company_name}</TableCell>
                  <TableCell>{lead.contact_name || "-"}</TableCell>
                  <TableCell>{lead.country || "-"}</TableCell>
                  <TableCell>{lead.interested_product || "-"}</TableCell>
                  <TableCell>
                    <Badge className={`${STAGE_COLORS[lead.stage]} hover:${STAGE_COLORS[lead.stage]} capitalize`}>
                      {lead.stage}
                    </Badge>
                  </TableCell>
                  <TableCell>{lead.profiles?.full_name || "Unassigned"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(lead.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
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
