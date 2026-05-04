import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type ApprovalStatus = "pending" | "approved" | "rejected";

type Profile = {
  id: string;
  company_id: string | null;
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

  const loadUserData = async (userId: string) => {
    const { data: prof } = await supabase
      .from("profiles")
      .select("id, company_id, full_name, email, avatar_url, status, requested_role, rejection_reason")
      .eq("id", userId)
      .maybeSingle();
    setProfile((prof as Profile) ?? null);

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
      if (sess?.user) {
        setTimeout(() => loadUserData(sess.user.id), 0);
      } else {
        setProfile(null);
        setPermissions(new Set());
        setRoleSlugs(new Set());
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      if (sess?.user) loadUserData(sess.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refresh = async () => {
    if (session?.user) await loadUserData(session.user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ session, user: session?.user ?? null, profile, permissions, roleSlugs, loading, signOut, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
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
