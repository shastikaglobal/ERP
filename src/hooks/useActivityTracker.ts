import { apiFetch } from "@/lib/api";
import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

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

    const updateActiveSession = async (isIdle: boolean = false) => {
      // Stubbed out because /api/analytics/active_sessions does not exist on backend
      // and it was flooding the console with 404 errors.
    };

    // Log page_visit on mount
    const logPageVisit = async () => {
      await apiFetch('/api/analytics/activity_logs', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          user_name: userName,
          module: moduleName,
          event_type: "page_visit",
          session_id: SESSION_ID
      })
      });
      await updateActiveSession(false);
    };

    logPageVisit();

    // Throttled logging function
    const logEvent = async (eventType: string) => {
      try {
        const res = await apiFetch('/api/analytics/activity_logs', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            user_name: userName,
            module: moduleName,
            event_type: eventType,
            session_id: SESSION_ID
      })
        });
        if (!res.ok) {
          console.error(`[ActivityTracker] ${eventType} error: API returned not ok`);
        } else {
          await updateActiveSession(eventType === "idle");
        }
      } catch (error: any) {
        console.error(`[ActivityTracker] ${eventType} fetch error:`, error.message);
      }
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