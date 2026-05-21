
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { X, Check, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type FollowUp = {
  id: string;
  company_name: string;
  contact_name?: string | null;
  follow_up_date: string;
  assigned_to: string;
};

export function FollowUpReminders() {
  const { profile, roleSlugs } = useAuth();
  const [reminders, setReminders] = useState<FollowUp[]>([]);

  const fetchReminders = async () => {
    if (!profile) return;

    const allowedRoles = ["admin", "bd", "bde", "manager"];
    const hasAccess = Array.from(roleSlugs).some(r => allowedRoles.includes(r));
    if (!hasAccess) return;

    const today = new Date().toISOString().split('T')[0];
    console.log("Checking reminders for date:", today);
    console.log("Profile:", profile);

    try {
      const { data, error } = await supabase
        .from("follow_ups")
        .select("id, company_name, contact_name, follow_up_date, assigned_to")
        .eq("follow_up_date", today)
        .eq("is_notified", false);

      console.log("Reminders found:", data, "Error:", error);

      if (error) throw error;
      if (data && data.length > 0) {
        setReminders(data as FollowUp[]);
      }
    } catch (error: any) {
      console.error("Error fetching reminders:", error.message);
    }
  };

  const markAsDone = async (id: string, company_name: string) => {
    try {
      const { error } = await supabase
        .from("follow_ups")
        .update({ is_notified: true })
        .eq("id", id);

      if (error) throw error;
      
      setReminders(prev => prev.filter(r => r.id !== id));
      toast.success(`Follow-up for ${company_name} marked as done`);
    } catch (error: any) {
      toast.error("Failed to update reminder: " + error.message);
    }
  };

  useEffect(() => {
    fetchReminders();
    
    // Check every 30 minutes
    const interval = setInterval(fetchReminders, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [profile?.id]);

  if (reminders.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full">
      {reminders.map((reminder) => (
        <div 
          key={reminder.id}
          className="bg-gray-900 border border-amber-500/50 rounded-xl shadow-xl p-4 animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="bg-amber-500 rounded-full p-2 mt-0.5">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-bold text-amber-400">
                Reminder: You were asked to call {reminder.company_name} today!
              </p>
              {reminder.contact_name && (
                <p className="text-xs text-gray-300">Contact: {reminder.contact_name}</p>
              )}
              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  className="bg-amber-500 hover:bg-amber-600 text-black h-8 text-[10px] uppercase font-bold"
                  onClick={() => markAsDone(reminder.id, reminder.company_name)}
                >
                  <Check className="mr-1 h-3.5 w-3.5" /> Done
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-8 text-[10px] uppercase font-bold text-gray-400 hover:text-white hover:bg-gray-700"
                  onClick={() => setReminders(prev => prev.filter(r => r.id !== reminder.id))}
                >
                  <X className="mr-1 h-3.5 w-3.5" /> Later
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
