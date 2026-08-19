import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Role = "employee" | "boss";

export type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  role: Role | null;
  fullName: string;
};

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    user: null,
    role: null,
    fullName: "",
  });

  useEffect(() => {
    let active = true;

    const loadProfile = async (session: Session | null) => {
      if (!session) {
        if (active) setState({ loading: false, session: null, user: null, role: null, fullName: "" });
        return;
      }
      const [{ data: roleRow }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("profiles").select("full_name").eq("id", session.user.id).maybeSingle(),
      ]);
      if (!active) return;
      setState({
        loading: false,
        session,
        user: session.user,
        role: (roleRow?.role as Role | undefined) ?? null,
        fullName: profile?.full_name || session.user.email || "",
      });
    };

    supabase.auth.getSession().then(({ data }) => loadProfile(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setState((s) => ({ ...s, loading: true }));
        loadProfile(session);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
