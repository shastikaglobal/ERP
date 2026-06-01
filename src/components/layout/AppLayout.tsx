import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";
import { TeamChatPanel } from "../dashboard/TeamChatPanel";
import { useActivityTracker } from "@/hooks/useActivityTracker";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Globally track user activity across all pages nested inside the main dashboard layout
  useActivityTracker(location.pathname);

  return (
    <div className="min-h-screen flex w-full bg-background relative">
      <AppSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
      <TeamChatPanel />
    </div>
  );
}
