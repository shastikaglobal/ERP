
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type User = { id: string; email: string; user_metadata?: any };
export type Session = { user: User; access_token?: string };

export type ApprovalStatus = "pending" | "approved" | "rejected";

type Profile = {
  id: string;
  company_id: string | null;
  company_name?: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  status: ApprovalStatus;
  requested_role: string | null;
  rejection_reason: string | null;
  email_signature: string | null;
  phone: string | null;
  dob: string | null;
  joining_date: string | null;
  system_mode: string | null;
  city: string | null;
};

type AuthCtx = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  permissions: Set<string>;
  roleSlugs: Set<string>;
  loading: boolean;
  onlineUsers: string[];
  activeMinutes: number;
  idleMinutes: number;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  updateSessionState: (user: User) => void;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [roleSlugs, setRoleSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [onlineUsers] = useState<string[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activeMinutes] = useState(0);
  const [idleMinutes] = useState(0);

  const loadUserData = async (userId: string) => {
    let prof: any = null;

    try {
      const res = await fetch('/api/vps-fallback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          table: 'profiles',
          action: 'select',
          select: 'id, company_id, full_name, email, avatar_url, status, requested_role, rejection_reason, phone, dob, joining_date, system_mode, city, biometric_id, department, employee_id, role',
          filters: [{ column: 'id', type: 'eq', value: userId }],
          single: true
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (!json.error) {
          prof = json.data;
        } else {
          console.warn('[Auth] Profile API error:', json.error);
        }
      } else {
        const errText = await res.text().catch(() => '');
        console.error(`[Auth] Profile fetch HTTP ${res.status}:`, errText);
      }
    } catch (err: any) {
      console.error('[Auth] Profile fetch failed:', err.message || err);
    }

    if (prof) {
      let companyName = null;
      if (prof.company_id) {
        try {
          const compRes = await fetch('/api/vps-fallback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              table: 'companies',
              action: 'select',
              select: 'name',
              filters: [{ column: 'id', type: 'eq', value: prof.company_id }],
              single: true
            })
          });
          if (compRes.ok) {
            const compJson = await compRes.json();
            companyName = compJson.data?.name || null;
          }
        } catch {
          companyName = "Shastika Global Impex";
        }
      }

      setProfile({
        ...(prof as Profile),
        company_name: companyName
      });
    } else {
      // Profile not found — set a minimal placeholder so the app doesn't loop
      setProfile(null);
    }

    const codes = new Set<string>();
    const slugs = new Set<string>();

    try {
      const res = await fetch('/api/auth/roles', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.roles) {
          data.roles.forEach((r: any) => {
            if (r.slug) slugs.add(r.slug);
            if (r.code) codes.add(r.code);
          });
        }
      }
    } catch (err: any) {
      console.error('[Auth] user_roles fetch failed:', err.message || err);
    }

    setPermissions(codes);
    setRoleSlugs(slugs);
  };

  const startSession = async (user: User) => {
    try {
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: user.id, email: user.email })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentSessionId(data.id);
      }
    } catch (e) {}
  };

  const endSession = async () => {
    if (!session?.user) return;
    try {
      await fetch('/api/sessions/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: session.user.id })
      });
    } catch (e) {}
  };

  const updateSessionState = (user: User) => {
    setSession({ user });
    loadUserData(user.id);
    startSession(user);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Log out on page refresh
        const navEntries = performance.getEntriesByType("navigation");
        const isReload = (navEntries.length > 0 && (navEntries[0] as any).type === "reload") || 
                         (performance.navigation && performance.navigation.type === 1);

        if (isReload) {
          await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
          setSession(null);
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const { user } = await res.json();
          setSession({ user });
          await loadUserData(user.id);
          startSession(user);
        } else if (res.status === 401) {
          // Attempt token refresh
          const refreshRes = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
          if (refreshRes.ok) {
            const retryRes = await fetch('/api/auth/me', { credentials: 'include' });
            if (retryRes.ok) {
              const { user } = await retryRes.json();
              setSession({ user });
              await loadUserData(user.id);
              startSession(user);
              setLoading(false);
              return;
            }
          }
          setSession(null);
        } else {
          setSession(null);
        }
      } catch (err) {
        console.error("Auth check failed", err);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const refresh = async () => {
    if (session?.user) await loadUserData(session.user.id);
  };

  const signOut = async () => {
    await endSession();
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setSession(null);
    setProfile(null);
    setPermissions(new Set());
    setRoleSlugs(new Set());
    window.location.href = "/auth";
  };

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, profile, permissions, roleSlugs, loading, onlineUsers, activeMinutes, idleMinutes, signOut, refresh, updateSessionState }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    console.warn("useAuth used outside AuthProvider — returning fallback context");
    return {
      session: null,
      user: null,
      profile: null,
      permissions: new Set<string>(),
      roleSlugs: new Set<string>(),
      loading: false,
      onlineUsers: [],
      activeMinutes: 0,
      idleMinutes: 0,
      signOut: async () => {},
      refresh: async () => {},
      updateSessionState: (_user: User) => {}
    } as AuthCtx;
  }
  return ctx;
}

export function useCan() {
  const { permissions } = useAuth();
  return (code: string) => permissions.has(code);
}

export function useIsAdminOrManager() {
  const { roleSlugs } = useAuth();
  const slugs = Array.from(roleSlugs).map(s => s.toLowerCase());
  return slugs.includes("admin") || slugs.includes("manager");
}

export function useCanManageApprovals() {
  const { roleSlugs } = useAuth();
  const slugs = Array.from(roleSlugs).map(s => s.toLowerCase());
  return slugs.includes("admin") || slugs.includes("manager") || slugs.includes("secretary");
}
