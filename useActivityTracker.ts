import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

// Session ID unique to this tab session
const SESSION_ID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export function useActivityTracker(moduleName: string) {
  const { user, profile } = useAuth();
  
  const lastMouseLogRef = useRef<number>(0);
  const lastKeyLogRef = useRef<number>(0);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const throttleMs = 30000; // 30 seconds
  const idleLimitMs = 300000; // 5 minutes

  useEffect(() => {
    if (!user) return;

    const userName = profile?.full_name || user.email || "Unknown BDE";
    const userId = user.id;

    // 1. Log page_visit on mount
    const logPageVisit = async () => {
      await supabase.from("activity_logs").insert({
        user_id: userId,
        user_name: userName,
        module: moduleName,
        event_type: "page_visit",
        session_id: SESSION_ID,
      });
    };

    logPageVisit();

    // 2. Throttle Logging Functions
    const logEvent = async (eventType: "mouse_move" | "keypress" | "idle") => {
      await supabase.from("activity_logs").insert({
        user_id: userId,
        user_name: userName,
        module: moduleName,
        event_type: eventType,
        session_id: SESSION_ID,
      });
    };

    // 3. Reset Idle Timeout helper
    const resetIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      
      idleTimerRef.current = setTimeout(() => {
        logEvent("idle");
      }, idleLimitMs);
    };

    // Initialize first idle timer
    resetIdleTimer();

    // 4. Input Handlers
    const handleMouseMove = () => {
      resetIdleTimer();
      const now = Date.now();
      if (now - lastMouseLogRef.current > throttleMs) {
        logEvent("mouse_move");
        lastMouseLogRef.current = now;
      }
    };

    const handleKeyPress = () => {
      resetIdleTimer();
      const now = Date.now();
      if (now - lastKeyLogRef.current > throttleMs) {
        logEvent("keypress");
        lastKeyLogRef.current = now;
      }
    };

    // 5. Attach listeners to window
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keypress", handleKeyPress);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keypress", handleKeyPress);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [user, profile, moduleName]);
}
