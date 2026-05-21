import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { Session, User } from "@supabase/supabase-js";

import {
  ensureProfile,
  getAdminSession,
  getProfile,
  signOut as signOutFromSupabase,
  supabase,
  updateProfile as updateProfileRecord
} from "@athmira/supabase";
import type { UserProfile } from "@athmira/types";

type AuthContextValue = {
  adminLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  loading: boolean;
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
  session: Session | null;
  signOut: () => Promise<void>;
  updateProfile: (
    updates: Partial<
      Pick<
        UserProfile,
        "email" | "name" | "preferred_language" | "newsletter_opt_in" | "gender" | "height_cm" | "weight_kg" | "date_of_birth"
      >
    >
  ) => Promise<UserProfile>;
  user: User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (!nextSession) {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const user = session?.user;

    if (!user) {
      setProfile(null);
      setIsAdmin(false);
      setAdminLoading(false);
      return;
    }

    const currentUser = user;
    let cancelled = false;

    async function loadProfile() {
      setError(null);

      try {
        const nextProfile = await ensureProfile({
          id: currentUser.id,
          email: currentUser.email ?? "",
          name: typeof currentUser.user_metadata.name === "string" ? currentUser.user_metadata.name : null,
          preferredLanguage:
            currentUser.user_metadata.preferred_language === "es" || currentUser.user_metadata.preferred_language === "en"
              ? currentUser.user_metadata.preferred_language
              : "en"
        });

        if (!cancelled) {
          setProfile(nextProfile);
        }
      } catch (profileError) {
        if (!cancelled) {
          setError(profileError instanceof Error ? profileError.message : "Unable to load profile.");
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  useEffect(() => {
    if (!session?.user) {
      setIsAdmin(false);
      setAdminLoading(false);
      return;
    }

    let cancelled = false;
    setAdminLoading(true);

    getAdminSession()
      .then((adminSession) => {
        if (!cancelled) {
          setIsAdmin(adminSession.isAdmin);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsAdmin(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAdminLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  const value = useMemo<AuthContextValue>(() => {
    async function refreshProfile() {
      if (!session?.user) {
        setProfile(null);
        return;
      }

      const nextProfile = await getProfile(session.user.id);
      setProfile(nextProfile);
    }

    async function updateProfile(updates: Parameters<AuthContextValue["updateProfile"]>[0]) {
      if (!session?.user) {
        throw new Error("You must be signed in to update your profile.");
      }

      const nextProfile = await updateProfileRecord(session.user.id, updates);
      setProfile(nextProfile);
      return nextProfile;
    }

    async function signOut() {
      await signOutFromSupabase();
      setSession(null);
      setProfile(null);
    }

    return {
      adminLoading,
      error,
      isAdmin,
      loading,
      profile,
      refreshProfile,
      session,
      signOut,
      updateProfile,
      user: session?.user ?? null
    };
  }, [adminLoading, error, isAdmin, loading, profile, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
