import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Sprout, LayoutDashboard, ShieldCheck, Settings, Bot } from "lucide-react";
import { navGroups } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useAuth, useCan } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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

  const [openSubGroups, setOpenSubGroups] = useState<string[]>([]);
  const [aiOpen, setAiOpen] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [employeeAdmin, setEmployeeAdmin] = useState(false);

  const [counts, setCounts] = useState({ clientAcq: 0, conversions: 0, customers: 0 });

  useEffect(() => {
    // Auto-open sub-groups if active
    navGroups.forEach(g => {
      g.items.forEach(i => {
        if (i.items?.some(sub => location.pathname.startsWith(sub.url))) {
          setOpenSubGroups(prev => prev.includes(i.title) ? prev : [...prev, i.title]);
        }
      });
    });
  }, [location.pathname]);

  const toggleGroup = (title: string) =>
    setOpenGroups(prev => (prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]));

  const toggleSubGroup = (title: string) =>
    setOpenSubGroups(prev => (prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]));

  useEffect(() => {
    let mounted = true;
    const fetchCounts = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        let companyFilter: any = null;
        if (userId) {
          const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', userId).single();
          companyFilter = profile?.company_id || null;
        }

        const [acqRes, convRes, custRes] = await Promise.all([
          supabase.from('client_acquisition' as any).select('id', { count: 'exact', head: true }).maybeSingle(),
          supabase.from('leads' as any).select('id', { count: 'exact', head: true }).in('stage', ['Won', 'Client Successfully Acquired']).maybeSingle(),
          supabase.from('customers' as any).select('id', { count: 'exact', head: true }).maybeSingle()
        ]);

        if (!mounted) return;
        setCounts({
          clientAcq: acqRes?.count || 0,
          conversions: convRes?.count || 0,
          customers: custRes?.count || 0
        });
      } catch (err) {
        // ignore
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    let mounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    
    // We store user id separately for the fetch
    let currentUser: string | undefined;

    const fetchPerms = async () => {
      if (!currentUser) {
        const { data: { user } } = await supabase.auth.getUser();
        currentUser = user?.id;
      }
      
      console.log('Current user id:', currentUser);
      
      if (!currentUser || !profile?.email) return;
      
      let isEmpAdmin = false;
      try {
        const { data: empData } = await (supabase
          .from("employees" as any)
          .select("role")
          .eq("email", profile.email)
          .maybeSingle() as unknown as Promise<{ data: any }>);
        if (empData && empData.role?.toLowerCase() === "admin") {
          isEmpAdmin = true;
        }
      } catch (e) {
        console.error("Employee fetching error:", e);
      }
      
      if (mounted) setEmployeeAdmin(isEmpAdmin);

      if (isAdmin || isEmpAdmin) {
        if (mounted) setPermissionsLoading(false);
        return;
      }

      try {
        const { data, error } = await (supabase
          .from("user_permissions" as any)
          .select("section, has_access")
          .eq("user_id", currentUser)
          .eq("has_access", true) as unknown as Promise<{ data: any[], error: any }>);
          
        if (!mounted) return;
        if (data) {
          const perms = data.map(p => p.section.toLowerCase());
          console.log('Fetched permissions mapped:', perms);
          setPermissions(perms);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setPermissionsLoading(false);
      }
    };
    
    fetchPerms().then(() => {
      // Realtime subscription setup
      if (mounted) {
        channel = supabase
          .channel('sidebar-permissions')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_permissions',
            },
            (payload) => {
              console.log('Realtime permission change detected, re-fetching...', payload);
              setTimeout(() => {
                if (mounted) fetchPerms();
              }, 500);
            }
          )
          .subscribe();
      }
    });

    return () => { 
      mounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [profile?.email, isAdmin]);

  const activeIsAdmin = isAdmin || employeeAdmin;

  const visibleGroups = navGroups
    .map(g => {
      if (activeIsAdmin) return g;
      
      let items = g.items.map(i => {
        console.log('Nav item being checked:', i.title);
        if (i.items) {
          // nested children matching exactly as requested
          const subItems = i.items.filter(sub => {
            console.log('Nav item being checked (sub):', sub.title);
            return permissions.includes(sub.title.toLowerCase());
          });
          return { ...i, items: subItems };
        }
        return i;
      }).filter(i => {
        // preserve standard items if mapped, or if they have successfully permitted children
        return permissions.includes(i.title.toLowerCase()) || (i.items && i.items.length > 0);
      });

      // Filter Face Attendance for unauthorized users for extra safety if they somehow granted it
      if (g.title === "HR & Employees") {
        const allowedEmails = new Set([
          "vemulanavyalahar009@gmail.com",
          "kim.swathi.07@gmail.com",
        ]);
        const userEmail = profile?.email?.toLowerCase() ?? "";
        if (!allowedEmails.has(userEmail)) {
          items = items.filter(i => i.title !== "Face Attendance");
        }
      }
      
      return { ...g, items };
    })
    .filter(g => g.items.length > 0);

  if (permissionsLoading && !activeIsAdmin) {
    return (
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 shrink-0 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-transform lg:translate-x-0 items-center justify-center",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </aside>
    );
  }

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
          <div className="h-8 w-8 rounded-md flex items-center justify-center shadow-sm overflow-hidden bg-white">
            <img src="/logo.webp" alt="Company Logo" className="w-full h-full object-contain" />
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
                      const hasSubItems = item.items && item.items.length > 0;
                      const isSubOpen = openSubGroups.includes(item.title);
                      const isSubActive = item.items?.some(sub => location.pathname === sub.url || location.pathname.startsWith(sub.url + "/"));
                      const badgeCount = item.url === '/crm/client-acquisition' ? counts.clientAcq : item.url === '/crm/convert' ? counts.conversions : item.url === '/crm/customers' ? counts.customers : 0;

                      if (hasSubItems) {
                        return (
                          <div key={item.title} className="space-y-0.5">
                            <button
                              onClick={() => toggleSubGroup(item.title)}
                              className={cn(
                                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors border-l-[3px] border-transparent",
                                isSubActive ? "nav-active font-medium" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                              )}
                            >
                              {ItemIcon && <ItemIcon className="h-3.5 w-3.5 shrink-0" />}
                              <span className="truncate flex-1 text-left">{item.title}</span>
                              <ChevronDown className={cn("h-3 w-3 transition-transform", isSubOpen && "rotate-180")} />
                            </button>
                            {isSubOpen && (
                              <div className="ml-4 pl-2 border-l border-sidebar-border space-y-0.5">
                                {item.items!.map(subItem => {
                                  const SubIcon = subItem.icon;
                                  return (
                                    <NavLink
                                      key={subItem.url}
                                      to={subItem.url}
                                      end
                                      onClick={() => onClose()}
                                      className={({ isActive }) =>
                                        cn(
                                          "flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] transition-colors border-l-[3px] border-transparent",
                                          isActive ? "text-white bg-sidebar-accent font-medium border-primary" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                                        )
                                      }
                                    >
                                      {SubIcon && <SubIcon className="h-3 w-3 shrink-0" />}
                                      <span className="truncate">{subItem.title}</span>
                                    </NavLink>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

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
                          {badgeCount > 0 && (
                            <span className="ml-auto text-[11px] bg-white/5 text-white px-2 py-0.5 rounded-full font-semibold">{badgeCount}</span>
                          )}
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
