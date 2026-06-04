import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const SESSION_ID =
  Math.random().toString(36).substring(2, 15) +
  Math.random().toString(36).substring(2, 15);

export function useActivityTracker(moduleName: string) {
  const { user, profile } = useAuth();

  const lastMouseLogRef = useRef<number>(0);
  const lastKeyLogRef = useRef<number>(0);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const throttleMs = 30000;
  const idleLimitMs = 300000;

  useEffect(() => {
    if (!user) return;

    const userName = profile?.full_name || user.email || "Unknown";
    const userId = user.id;

    // Log page_visit on mount
    const logPageVisit = async () => {
      await (supabase.from("activity_logs") as any).insert({
        user_id: userId,
        user_name: userName,
        module: moduleName,
        event_type: "page_visit",
        session_id: SESSION_ID,
      });
    };

    logPageVisit();

    // Throttled logging function
    const logEvent = async (eventType: string) => {
      const { error } = await (supabase.from("activity_logs") as any).insert({
        user_id: userId,
        user_name: userName,
        module: moduleName,
        event_type: eventType,
        session_id: SESSION_ID,
      });
      if (error) console.error(`[ActivityTracker] ${eventType} error:`, error.message);
    };

    const resetIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => logEvent("idle"), idleLimitMs);
    };

    resetIdleTimer();

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

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keypress", handleKeyPress);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keypress", handleKeyPress);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [user, profile, moduleName]);
}