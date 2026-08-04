import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

export type AppNotification = {
  id: string;
  company_id: string;
  user_id: string | null;
  title: string;
  body: string;
  type: "info" | "warning" | "success" | "destructive";
  is_read: boolean;
  created_at: string;
};

export function useNotifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    // Disabled during Supabase decoupling
    setNotifications([]);
    setLoading(false);
  }, []);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, loading, unreadCount, markRead, markAllRead, refetch: fetchNotifications };
}
