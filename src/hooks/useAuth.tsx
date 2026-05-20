import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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
};

type AuthCtx = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  permissions: Set<string>;
  roleSlugs: Set<string>;
  loading: boolean;
  onlineUsers: string[];
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [roleSlugs, setRoleSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const loadUserData = async (userId: string) => {
    // 1. Fetch Profile
    const { data: prof } = await supabase
      .from("profiles")
      .select("id, company_id, full_name, email, avatar_url, status, requested_role, rejection_reason")
      .eq("id", userId)
      .maybeSingle();

    if (prof) {
      // 2. Fetch Company Name separately
      let companyName = null;
      if (prof.company_id) {
        const { data: comp } = await supabase
          .from("companies")
          .select("name")
          .eq("id", prof.company_id)
          .maybeSingle();
        companyName = comp?.name || null;
      }

      setProfile({
        ...(prof as Profile),
        company_name: companyName
      });
    } else {
      setProfile(null);
    }

    // 3. Fetch Roles & Permissions
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role_id, roles(slug, role_permissions(permissions(code)))")
      .eq("user_id", userId);
    const codes = new Set<string>();
    const slugs = new Set<string>();
    roles?.forEach((r: any) => {
      if (r.roles?.slug) slugs.add(r.roles.slug);
      r.roles?.role_permissions?.forEach((rp: any) => {
        if (rp.permissions?.code) codes.add(rp.permissions.code);
      });
    });
    setPermissions(codes);
    setRoleSlugs(slugs);
  };

  useEffect(() => {
    let userId: string | null = null;
    let profileSub: ReturnType<typeof supabase.channel> | null = null;
    let rolesSub: ReturnType<typeof supabase.channel> | null = null;
    let presenceChannel: ReturnType<typeof supabase.channel> | null = null;
    let sessionInterval: NodeJS.Timeout | null = null;

    const setupSessionInterval = (sess: Session | null) => {
      if (sessionInterval) clearInterval(sessionInterval);
      // Removed active_sessions logic related to profile selector
    };

    const subscribeRealtime = (uid: string) => {
      // Clean up previous channels using removeChannel to bypass the internal cache
      if (profileSub) supabase.removeChannel(profileSub);
      if (rolesSub) supabase.removeChannel(rolesSub);
      if (presenceChannel) supabase.removeChannel(presenceChannel);

      const rand = Math.random().toString(36).substring(7);

      // Listen to changes on this user's profile row
      profileSub = supabase
        .channel(`profile-${uid}-${rand}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles", filter: `id=eq.${uid}` },
          () => loadUserData(uid)
        )
        .subscribe();

      // Listen to changes on this user's roles
      rolesSub = supabase
        .channel(`user-roles-${uid}-${rand}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "user_roles", filter: `user_id=eq.${uid}` },
          () => loadUserData(uid)
        )
        .subscribe();

      // Realtime Presence for Online Status
      presenceChannel = supabase.channel(`online-users-${rand}`, {
        config: { presence: { key: uid } }
      });
      
      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel!.presenceState();
          setOnlineUsers(Object.keys(state));
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel!.track({ online_at: new Date().toISOString() });
          }
        });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((evt, sess) => {
      // Debug: log auth state changes to help diagnose PKCE/token exchange issues
      // (temporary - remove after debugging)
      // eslint-disable-next-line no-console
      console.debug("supabase.onAuthStateChange", { evt, sess });
      setSession(sess);
      setupSessionInterval(sess);
      if (sess?.user) {
        userId = sess.user.id;
        setTimeout(() => loadUserData(sess.user.id), 0);
        subscribeRealtime(sess.user.id);
      } else {
        userId = null;
        if (profileSub) supabase.removeChannel(profileSub);
        if (rolesSub) supabase.removeChannel(rolesSub);
        if (presenceChannel) supabase.removeChannel(presenceChannel);
        setProfile(null);
        setPermissions(new Set());
        setRoleSlugs(new Set());
        setOnlineUsers([]);
      }
    });

    supabase.auth.getSession()
      .then(({ data: { session: sess } }) => {
        // Debug: log initial session fetch
        // eslint-disable-next-line no-console
        console.debug("supabase.getSession result", { sess });
        setSession(sess);
        setupSessionInterval(sess);
        if (sess?.user) {
          userId = sess.user.id;
          loadUserData(sess.user.id).finally(() => setLoading(false));
          subscribeRealtime(sess.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("supabase.getSession error", err);
        setLoading(false);
      });

    return () => {
      if (sessionInterval) clearInterval(sessionInterval);
      subscription.unsubscribe();
      if (profileSub) supabase.removeChannel(profileSub);
      if (rolesSub) supabase.removeChannel(rolesSub);
      if (presenceChannel) supabase.removeChannel(presenceChannel);
    };
  }, []);

  const refresh = async () => {
    if (session?.user) await loadUserData(session.user.id);
  };

  const signOut = async () => {
    // Session tracking via active_sessions is removed
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, profile, permissions, roleSlugs, loading, onlineUsers, signOut, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Fail-safe: avoid throwing during HMR/network blips — return a minimal fallback
    // eslint-disable-next-line no-console
    console.warn("useAuth used outside AuthProvider — returning fallback context");
    return {
      session: null,
      user: null,
      profile: null,
      permissions: new Set<string>(),
      roleSlugs: new Set<string>(),
      loading: true,
      onlineUsers: [],
      signOut: async () => {},
      refresh: async () => {},
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
  return roleSlugs.has("admin") || roleSlugs.has("manager");
}

export function useCanManageApprovals() {
  const { roleSlugs } = useAuth();
  return roleSlugs.has("admin") || roleSlugs.has("manager") || roleSlugs.has("secretary");
}
