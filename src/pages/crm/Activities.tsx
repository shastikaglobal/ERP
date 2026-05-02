import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

type Lead = {
  id: string;
  company_name: string;
};

type Activity = {
  id: string;
  lead_id: string | null;
  type: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  leads?: { company_name: string };
};

const TYPES = ["call", "meeting", "email", "follow_up"];

export default function LeadActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();

  // Form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState("call");
  const [leadId, setLeadId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [activitiesRes, leadsRes] = await Promise.all([
        supabase
          .from("activities")
          .select(`id, lead_id, type, title, due_date, completed, leads(company_name)`)
          .order("due_date", { ascending: true }),
        supabase
          .from("leads")
          .select("id, company_name")
          .order("company_name", { ascending: true })
      ]);

      if (activitiesRes.error) throw activitiesRes.error;
      if (leadsRes.error) throw leadsRes.error;

      setActivities(activitiesRes.data as unknown as Activity[]);
      setLeads(leadsRes.data as Lead[]);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error("Title is required");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("activities").insert({
        title,
        type,
        lead_id: leadId || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        created_by: user?.id,
      });

      if (error) throw error;
      
      toast.success("Activity created successfully");
      setIsDialogOpen(false);
      setTitle("");
      setType("call");
      setLeadId("");
      setDueDate("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create activity");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("activities")
        .update({ completed: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      setActivities(activities.map(a => a.id === id ? { ...a, completed: !currentStatus } : a));
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;
    try {
      const { error } = await supabase.from("activities").delete().eq("id", id);
      if (error) throw error;
      toast.success("Activity deleted");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete activity");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Activities</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Activity</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Activity</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddActivity} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map(t => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Associated Lead</Label>
                <Select value={leadId} onValueChange={setLeadId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a lead (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {leads.map(l => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Activity
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Lead / Company</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
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
            ) : activities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No activities found.
                </TableCell>
              </TableRow>
            ) : (
              activities.map((activity) => (
                <TableRow key={activity.id} className={activity.completed ? "opacity-60 bg-muted/30" : ""}>
                  <TableCell>
                    <Checkbox 
                      checked={activity.completed} 
                      onCheckedChange={() => toggleComplete(activity.id, activity.completed)} 
                    />
                  </TableCell>
                  <TableCell className={`font-medium ${activity.completed ? "line-through" : ""}`}>
                    {activity.title}
                  </TableCell>
                  <TableCell className="capitalize">{activity.type.replace("_", " ")}</TableCell>
                  <TableCell>{activity.leads?.company_name || "-"}</TableCell>
                  <TableCell>
                    {activity.due_date ? (
                      <div className="flex items-center text-sm">
                        <CalendarIcon className="mr-2 h-3 w-3 text-muted-foreground" />
                        {format(new Date(activity.due_date), "PPp")}
                      </div>
                    ) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={activity.completed ? "secondary" : "default"}>
                      {activity.completed ? "Completed" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(activity.id)}>
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
