import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Sprout, LayoutDashboard, ShieldCheck, Settings, Bot } from "lucide-react";
import { navGroups } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useAuth, useCan } from "@/hooks/useAuth";
import { AIChatPanel } from "./AIChatPanel";

export function AppSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const can = useCan();
  const { profile, roleSlugs } = useAuth();

  const slugs = Array.from(roleSlugs).map(s => s.toLowerCase());
  const isAdmin = slugs.includes("admin");
  const isSecretary = slugs.includes("secretary");
  const isBde = slugs.includes("bd") ||
    slugs.includes("bde") ||
    (profile?.requested_role && ["bd", "bde"].includes(profile.requested_role.toLowerCase()));

  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    const active = navGroups.find(g => g.items.some(i => location.pathname.startsWith(i.url)));
    return active ? [active.title] : [navGroups[0].title];
  });

  const [aiOpen, setAiOpen] = useState(false);

  const toggleGroup = (title: string) =>
    setOpenGroups(prev => (prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]));

  const allowedSecretaryGroups = new Set(["dashboards", "quotations", "documents", "finance", "tally", "accounts", "hr & employees"]);
  const allowedBdeGroups = new Set(["dashboards", "crm", "mobile crm", "quotations", "documents", "system", "hr & employees"]);

  const visibleGroups = navGroups
    .map(g => {
      const groupTitleLower = g.title.toLowerCase();
      let items = g.items.filter(i => {
        if (isSecretary && allowedSecretaryGroups.has(groupTitleLower)) {
          if (groupTitleLower === "hr & employees") {
            return !i.permission || can(i.permission);
          }
          return true;
        }
        if (isBde && allowedBdeGroups.has(groupTitleLower)) {
          if (groupTitleLower === "hr & employees") {
            return !i.permission || can(i.permission);
          }
          return true;
        }
        return !i.permission || can(i.permission);
      });

      if (g.title === "Dashboards" && isSecretary && !isAdmin) {
        items = [
          { title: "Finance & Tally", url: "/dashboards/finance-tally", icon: LayoutDashboard },
          { title: "User Approvals", url: "/employees/roles", icon: ShieldCheck },
        ];
      }
      if (g.title === "Dashboards" && isBde && !isAdmin) {
        items = [{ title: "BDE Dashboard", url: "/dashboards/bde", icon: LayoutDashboard }];
      }
      if (g.title === "System" && isBde && !isAdmin) {
        items = [{ title: "Settings", url: "/system/settings", icon: Settings }];
      }
      return { ...g, items };
    })
    .filter(g => g.items.length > 0)
    .filter(g => {
      if (isAdmin) return true;
      const titleLower = g.title.toLowerCase();
      if (isSecretary) return allowedSecretaryGroups.has(titleLower);
      if (isBde) return allowedBdeGroups.has(titleLower);
      return true;
    });

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-14 flex items-center gap-2 px-4 border-b border-sidebar-border shrink-0">
          <div className="h-8 w-8 rounded-md logo-mark flex items-center justify-center shadow-sm">
            <Sprout className="h-4 w-4 text-[hsl(var(--primary-foreground))]" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground leading-tight truncate">
              {profile?.company_name || "AgriExport ERP"}
            </div>
            <div className="text-[10px] text-sidebar-muted uppercase tracking-wider">Impex · Agri Export ERP</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {visibleGroups.map(group => {
            const Icon = group.icon;
            const isOpen = openGroups.includes(group.title);
            const hasActive = group.items.some(i => location.pathname === i.url || location.pathname.startsWith(i.url + "/"));
            return (
              <div key={group.title}>
                <button
                  onClick={() => toggleGroup(group.title)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium transition-colors",
                    hasActive ? "text-white" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
                  )}
                >
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  <span className="flex-1 text-left uppercase tracking-wide text-[11px]">{group.title}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="mt-0.5 ml-3 pl-3 border-l border-sidebar-border space-y-0.5">
                    {group.items.map(item => {
                      const ItemIcon = item.icon;
                      return (
                        <NavLink
                          key={item.url}
                          to={item.url}
                          end
                          onClick={() => onClose()}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors border-l-[3px] border-transparent",
                              isActive ? "nav-active font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                            )
                          }
                        >
                          {ItemIcon && <ItemIcon className="h-3.5 w-3.5 shrink-0" />}
                          <span className="truncate">{item.title}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div>
            <button
              onClick={() => setAiOpen(true)}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs font-medium transition-colors text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
            >
              <Bot className="h-4 w-4" />
              <span className="flex-1 text-left uppercase tracking-wide text-[11px]">AI Assistant</span>
            </button>
          </div>
        </nav>

        <div className="border-t border-sidebar-border p-3 shrink-0">
          <div className="flex items-center gap-2 px-1">
            <div className="h-8 w-8 rounded-full logo-mark flex items-center justify-center text-xs font-bold text-[hsl(var(--primary-foreground))] overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                (profile?.full_name || profile?.email || "U").slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground truncate">
                {profile?.full_name && profile.full_name !== profile.email ? profile.full_name : profile?.email ? "User" : "User"}
              </div>
              <div className="text-[10px] text-sidebar-muted truncate capitalize">
                {roleSlugs.size > 0
                  ? Array.from(roleSlugs)
                      .map(s => s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()))
                      .join(", ")
                  : "No role assigned"}
              </div>
            </div>
            <div className="mt-2">
              <button
                onClick={() => {
                  navigate('/employees/face-attendance?mode=checkout');
                  onClose();
                }}
                className="w-full text-left text-xs text-sidebar-muted hover:text-white"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>
      <AIChatPanel open={aiOpen} onClose={() => setAiOpen(false)} />
    </>
  );
}
