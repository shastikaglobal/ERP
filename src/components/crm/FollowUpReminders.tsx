
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
  reminder_time: string;
};

export function FollowUpReminders() {
  const { profile, roleSlugs } = useAuth();
  const [reminders, setReminders] = useState<FollowUp[]>([]);

  console.log("FollowUpReminders: profile=", profile, "roleSlugs=", Array.from(roleSlugs));

  const fetchReminders = async () => {
    if (!profile) return;

    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHHMM = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    try {
      const { data, error } = await supabase
        .from("follow_ups")
        .select("id, company_name, contact_name, follow_up_date, assigned_to, reminder_time")
        .eq("follow_up_date", today)
        .eq("is_notified", false);

      if (error) throw error;
      
      if (data) {
        // Filter those where current time matches or has passed the reminder_time
        const pending = (data as FollowUp[]).filter(r => {
          if (!r.reminder_time) return true; // Show immediately if no time set
          
          const [remH, remM] = r.reminder_time.split(':');
          const remHHMM = `${remH}:${remM}`;
          
          return currentHHMM >= remHHMM;
        });

        setReminders(pending);
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
    if (profile) {
      fetchReminders();
      // Check every minute for precise time-based notifications
      const interval = setInterval(fetchReminders, 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [profile?.id]);

  if (!profile) return null;

  if (reminders.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full">
      {reminders.map((reminder) => (
        <div 
          key={reminder.id}
          className="bg-gray-900 border border-amber-500/50 rounded-xl shadow-2xl p-5 animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="bg-amber-500 rounded-full p-2.5 mt-0.5 shadow-lg shadow-amber-500/20">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 space-y-1.5">
              <p className="text-sm font-extrabold text-amber-400 tracking-tight leading-tight">
                Reminder: You were asked to call {reminder.company_name} at {reminder.reminder_time ? (
                  new Date(`2000-01-01T${reminder.reminder_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
                ) : '09:00 AM'} today!
              </p>
              {reminder.contact_name && (
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                   Contact: <span className="text-gray-200">{reminder.contact_name}</span>
                </p>
              )}
              <div className="flex gap-2.5 pt-2">
                <Button 
                  size="sm" 
                  className="bg-amber-500 hover:bg-amber-600 text-black h-9 px-4 text-[10px] uppercase font-black tracking-widest shadow-lg shadow-amber-500/10"
                  onClick={() => markAsDone(reminder.id, reminder.company_name)}
                >
                  <Check className="mr-1.5 h-4 w-4" /> Got it
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-9 px-3 text-[10px] uppercase font-bold text-gray-400 hover:text-white hover:bg-gray-800"
                  onClick={() => setReminders(prev => prev.filter(r => r.id !== reminder.id))}
                >
                  <X className="mr-1.5 h-4 w-4" /> Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
