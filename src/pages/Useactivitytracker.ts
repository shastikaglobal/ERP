import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export function useActivityTracker(moduleName: string) {
    const { user } = useAuth();
    const idleTimer = useRef<ReturnType<typeof setTimeout>>();
    const sessionId = useRef<string>(crypto.randomUUID());

    useEffect(() => {
        if (!user) return;

        // 1. Log page visit immediately on mount
        supabase.from("activity_logs").insert({
            user_id: user.id,
            user_name: user.user_metadata?.full_name || user.email || "Unknown",
            module: moduleName,
            event_type: "page_visit",
            session_id: sessionId.current,
        });

        // 2. Idle detection — 5 min no activity = idle event
        const resetIdle = () => {
            clearTimeout(idleTimer.current);
            idleTimer.current = setTimeout(() => {
                supabase.from("activity_logs").insert({
                    user_id: user.id,
                    user_name: user.user_metadata?.full_name || user.email || "Unknown",
                    module: moduleName,
                    event_type: "idle",
                    session_id: sessionId.current,
                });
            }, 5 * 60 * 1000);
        };

        // 3. Throttle helper — 30s per event type
        function throttle(fn: () => void, ms: number) {
            let last = 0;
            return () => {
                const now = Date.now();
                if (now - last > ms) {
                    last = now;
                    fn();
                }
            };
        }

        // 4. Track mouse + keyboard
        const onMouseMove = throttle(() => {
            resetIdle();
            supabase.from("activity_logs").insert({
                user_id: user.id,
                user_name: user.user_metadata?.full_name || user.email || "Unknown",
                module: moduleName,
                event_type: "mouse_move",
                session_id: sessionId.current,
            });
        }, 30000);

        const onKeyDown = throttle(() => {
            resetIdle();
            supabase.from("activity_logs").insert({
                user_id: user.id,
                user_name: user.user_metadata?.full_name || user.email || "Unknown",
                module: moduleName,
                event_type: "keypress",
                session_id: sessionId.current,
            });
        }, 30000);

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("keydown", onKeyDown);
        resetIdle();

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("keydown", onKeyDown);
            clearTimeout(idleTimer.current);
        };
    }, [user, moduleName]);
}