import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
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
};

const Ctx = createContext<AuthCtx | undefined>(undefined);


export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [roleSlugs, setRoleSlugs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activeMinutes, setActiveMinutes] = useState(0);
  const [idleMinutes, setIdleMinutes] = useState(0);
  const lastActivityRef = useRef<number>(Date.now());
  const currentSessionIdRef = useRef<string | null>(null);
  const [isIdle, setIsIdle] = useState(false);

  // Sync ref with state
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  // Track activity separate from the main auth useEffect
  useEffect(() => {
    if (!session?.user) {
      console.log('Session tracking skipped: No user');
      return;
    }

    console.log('Starting session tracking interval...');

    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const interval = setInterval(async () => {
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;
      const currentlyIdle = timeSinceLastActivity >= 60000;
      
      setIsIdle(currentlyIdle);

      try {
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        const res = await fetch('/api/sessions/ping', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify({ user_id: session.user.id, is_idle: currentlyIdle })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setActiveMinutes(data.active_minutes || 0);
            setIdleMinutes(data.idle_minutes || 0);
          }
        } else {
          console.log('Session timer pulse failed: No active session found to update for this user');
        }
      } catch (e) {
        console.error("Error in session tracking interval:", e);
      }
    }, 60000); // Every 1 minute

    // Activity listeners
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    return () => {
      console.log('Cleaning up session tracking interval...');
      clearInterval(interval);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
    };
  }, [session?.user]);


  const loadUserData = async (userId: string, userEmail?: string, userMetadata?: any) => {
    let prof: any = null;
    let rolesData: { roleSlugs: string[]; permissions: string[] } | null = null;
    const token = (await supabase.auth.getSession()).data.session?.access_token;

    // 1. Fetch Profile (Try local VPS API first, then fallback to Supabase)
    try {
      const res = await fetch(`/api/employees/${userId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        prof = await res.json();
      } else {
        throw new Error("Local profile API returned error status");
      }
    } catch (localErr) {
      console.warn('[Auth] Local profile fetch failed, trying Supabase:', localErr);
      try {
        const { data, error: fetchErr } = await supabase
          .from("profiles")
          .select("id, company_id, full_name, email, avatar_url, status, requested_role, rejection_reason, phone, dob, joining_date, system_mode, city, biometric_id, department, employee_id, role")
          .eq("id", userId)
          .maybeSingle();

        if (fetchErr) throw fetchErr;
        prof = data;
      } catch (err: any) {
        console.error('[Auth] Supabase profile fetch also failed:', err.message || err);
      }
    }

    if (!prof && (userEmail || session?.user?.email)) {
      // Profile does not exist, let's create a blank profile for this authenticated user!
      console.log(`[Auth] Profile for user ${userId} not found. Creating default profile...`);
      const emailVal = userEmail || session?.user?.email;
      const defaultFullName = userMetadata?.full_name || userMetadata?.name || emailVal || 'User';
      const { data: inserted, error: insertErr } = await supabase
        .from("profiles")
        .insert([{
          id: userId,
          email: emailVal,
          full_name: defaultFullName,
          company_id: '00000000-0000-0000-0000-00000000ae01', // shared default company
          status: 'pending'
        }])
        .select("id, company_id, full_name, email, avatar_url, status, requested_role, rejection_reason, phone, dob, joining_date, system_mode, city, biometric_id, department, employee_id, role")
        .maybeSingle();

      if (insertErr) {
        console.error('[Auth] Failed to create default profile:', insertErr.message);
      } else if (inserted) {
        prof = inserted;
        console.log('[Auth] Default profile created successfully:', prof);
      }
    }

    if (prof) {
      // 2. Fetch Company Name separately
      let companyName = null;
      if (prof.company_id) {
        try {
          const { data: comp } = await supabase
            .from("companies")
            .select("name")
            .eq("id", prof.company_id)
            .maybeSingle();
          companyName = comp?.name || null;
        } catch (compErr) {
          companyName = "Shastika Global Impex";
        }
      }

      setProfile({
        ...(prof as Profile),
        company_name: companyName
      });
    } else {
      setProfile(null);
    }

    // 3. Fetch Roles & Permissions (Try local VPS API first, then fallback to Supabase)
    const codes = new Set<string>();
    const slugs = new Set<string>();

    try {
      const res = await fetch(`/api/employees/${userId}/roles-permissions`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        rolesData = await res.json();
        if (rolesData) {
          rolesData.roleSlugs?.forEach(s => slugs.add(s));
          rolesData.permissions?.forEach(p => codes.add(p));
        }
      } else {
        throw new Error("Local roles-permissions API returned error status");
      }
    } catch (localErr) {
      console.warn('[Auth] Local roles/perms fetch failed, trying Supabase:', localErr);
      try {
        const { data: roles, error: rolesErr } = await supabase
          .from("user_roles")
          .select("role_id, roles(slug, role_permissions(permissions(code)))")
          .eq("user_id", userId);
        
        if (rolesErr) throw rolesErr;

        roles?.forEach((r: any) => {
          if (r.roles?.slug) slugs.add(r.roles.slug);
          r.roles?.role_permissions?.forEach((rp: any) => {
            if (rp.permissions?.code) codes.add(rp.permissions.code);
          });
        });
      } catch (err: any) {
        console.error('[Auth] Supabase user_roles fetch also failed:', err.message || err);
      }
    }

    setPermissions(codes);
    setRoleSlugs(slugs);
  };



  const startSession = async (user: User) => {
    if (typeof window === 'undefined') return;
    
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch('/api/sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ user_id: user.id, email: user.email })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentSessionId(data.id);
      }
    } catch (e) {
      console.error("Error starting session on VPS:", e);
    }
  };

  const endSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const token = (await supabase.auth.getSession()).data.session?.access_token;
      await fetch('/api/sessions/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ user_id: user.id })
      });
    } catch (e) {
      console.error("Error ending session on VPS:", e);
    }
  };



  useEffect(() => {
    let userId: string | null = null;
    let profileSub: ReturnType<typeof supabase.channel> | null = null;
    let rolesSub: ReturnType<typeof supabase.channel> | null = null;
    let rolePermsSub: ReturnType<typeof supabase.channel> | null = null;
    let presenceChannel: ReturnType<typeof supabase.channel> | null = null;

    const subscribeRealtime = (uid: string) => {
      // Clean up previous channels using removeChannel to bypass the internal cache
      if (profileSub) supabase.removeChannel(profileSub);
      if (rolesSub) supabase.removeChannel(rolesSub);
      if (rolePermsSub) supabase.removeChannel(rolePermsSub);
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

      // Listen to changes on role permissions (this makes permission matrix changes live)
      rolePermsSub = supabase
        .channel(`role-perms-${uid}-${rand}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "role_permissions" },
          () => loadUserData(uid)
        )
        .subscribe();


      // Realtime Presence for Online Status - use a constant channel name for all users
      presenceChannel = supabase.channel('global-presence', {
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
      console.debug("supabase.onAuthStateChange", { evt, sess });
      setSession(sess);
      if (sess?.user) {
        userId = sess.user.id;
        setTimeout(() => loadUserData(sess.user.id, sess.user.email, sess.user.user_metadata), 0);
        subscribeRealtime(sess.user.id);
        
        // Track session login
        if (evt === 'SIGNED_IN' || evt === 'INITIAL_SESSION') {
          startSession(sess.user);
        }
      } else {
        userId = null;
        if (profileSub) supabase.removeChannel(profileSub);
        if (rolesSub) supabase.removeChannel(rolesSub);
        if (presenceChannel) supabase.removeChannel(presenceChannel);
        setProfile(null);
        setPermissions(new Set());
        setRoleSlugs(new Set());
        setOnlineUsers([]);
        
        if (evt === 'SIGNED_OUT') {
          endSession();
        }
      }
    });

    supabase.auth.getSession()
      .then(({ data: { session: sess } }) => {
        console.debug("supabase.getSession result", { sess });
        setSession(sess);
        if (sess?.user) {
          userId = sess.user.id;
          loadUserData(sess.user.id, sess.user.email, sess.user.user_metadata).finally(() => setLoading(false));
          subscribeRealtime(sess.user.id);
          startSession(sess.user);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("supabase.getSession error", err);
        setLoading(false);
      });

    return () => {
      subscription.unsubscribe();
      if (profileSub) supabase.removeChannel(profileSub);
      if (rolesSub) supabase.removeChannel(rolesSub);
      if (presenceChannel) supabase.removeChannel(presenceChannel);
    };
  }, []);

  const refresh = async () => {
    if (session?.user) await loadUserData(session.user.id, session.user.email, session.user.user_metadata);
  };

  const signOut = async () => {
    await endSession();
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, profile, permissions, roleSlugs, loading, onlineUsers, activeMinutes, idleMinutes, signOut, refresh }}>
      {children}
    </Ctx.Provider>
  );
}


export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Fail-safe: avoid throwing during HMR/network blips — return a minimal fallback
     
    console.warn("useAuth used outside AuthProvider — returning fallback context");
    return {
      session: null,
      user: null,
      profile: null,
      permissions: new Set<string>(),
      roleSlugs: new Set<string>(),
      loading: true,
      onlineUsers: [],
      activeMinutes: 0,
      idleMinutes: 0,
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
  const slugs = Array.from(roleSlugs).map(s => s.toLowerCase());
  return slugs.includes("admin") || slugs.includes("manager");
}

export function useCanManageApprovals() {
  const { roleSlugs } = useAuth();
  const slugs = Array.from(roleSlugs).map(s => s.toLowerCase());
  return slugs.includes("admin") || slugs.includes("manager") || slugs.includes("secretary");
}
