import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useUser } from "./UserContext";
import { isAdminEmail } from "@/lib/auth";
import { supabase } from "@/supabaseClient";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

type AuthProviderType = "email" | "google" | "facebook";

interface AuthUser {
  id: string;
  email: string;
  provider: AuthProviderType;
  creatorId: string;
  status?: "active" | "banned";
  banReason?: string;
  bannedUntil?: string | null;
  banIssuedAt?: string;
  displayName?: string | null;
  photoURL?: string | null;
  emailVerified?: boolean;
}

interface RegisterWithEmailPayload {
  name: string;
  username: string;
  email: string;
  password: string;
}

const areAuthUsersEqual = (left: AuthUser, right: AuthUser) =>
  left.id === right.id &&
  left.email === right.email &&
  left.provider === right.provider &&
  left.creatorId === right.creatorId &&
  left.status === right.status &&
  left.banReason === right.banReason &&
  left.bannedUntil === right.bannedUntil &&
  left.banIssuedAt === right.banIssuedAt &&
  left.displayName === right.displayName &&
  left.photoURL === right.photoURL &&
  left.emailVerified === right.emailVerified;

type SessionState = { mode: "auth"; authId: string } | { mode: "guest" } | null;
type SessionMode = "auth" | "guest" | "none";

interface AuthContextValue {
  authUser: AuthUser | null;
  sessionMode: SessionMode;
  isAdmin: boolean;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  registerWithEmail: (payload: RegisterWithEmailPayload) => Promise<boolean>;
  loginWithProvider: (provider: Exclude<AuthProviderType, "email">) => Promise<boolean>;
  continueAsGuest: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  deleteAccountByCreatorId: (creatorId: string) => void;
  banAccountByCreatorId: (creatorId: string, reason: string, bannedUntil?: string | null) => void;
  unbanAccountByCreatorId: (creatorId: string) => void;
  logout: () => Promise<void>;
}

const USERS_STORAGE_KEY = "adspark-auth-users";
const SESSION_STORAGE_KEY = "adspark-auth-session";

const readStoredUsers = (): AuthUser[] | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as AuthUser[];
    }
    return null;
  } catch {
    return null;
  }
};

const readStoredSession = (): SessionState => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed?.mode === "auth" && typeof parsed.authId === "string") {
      return { mode: "auth", authId: parsed.authId };
    }
    if (parsed?.mode === "guest") {
      return { mode: "guest" };
    }
    return null;
  } catch {
    return null;
  }
};

const mapSupabaseProvider = (user: SupabaseUser): AuthProviderType => {
  const provider = user.app_metadata?.provider;
  if (provider === "google") {
    return "google";
  }
  if (provider === "facebook") {
    return "facebook";
  }
  return "email";
};

const usernameFromEmail = (email: string) => email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");

const formatSupabaseError = (error: unknown) => {
  if (error && typeof error === "object") {
    const maybe = error as { message?: string; code?: string };
    if (maybe.code === "over_email_send_rate_limit") {
      return "Too many requests. Try again in a moment.";
    }
    if (typeof maybe.message === "string" && maybe.message.trim().length > 0) {
      return maybe.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong";
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { registerCreator, setCurrentUserId, creators } = useUser();

  const normalizeAuthUser = useCallback((user: AuthUser): AuthUser => {
    const status = user.status ?? "active";
    if (status === "banned" && user.bannedUntil) {
      const expires = new Date(user.bannedUntil).getTime();
      if (Number.isFinite(expires) && expires < Date.now()) {
        return {
          ...user,
          status: "active",
          bannedUntil: null,
          banReason: undefined,
          banIssuedAt: undefined,
        };
      }
    }
    return {
      ...user,
      status,
      bannedUntil: user.bannedUntil ?? null,
    };
  }, []);

  const [users, setUsers] = useState<AuthUser[]>(() => {
    const stored = readStoredUsers();
    if (!stored) {
      return [];
    }
    return stored.map((user) => normalizeAuthUser(user));
  });

  const initialSession = useMemo<SessionState>(() => readStoredSession(), []);

  const [session, setSession] = useState<SessionState>(initialSession);
  const [currentAuthId, setCurrentAuthId] = useState<string | null>(
    initialSession?.mode === "auth" ? initialSession.authId : null,
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (session) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [session]);

  const authUser = useMemo<AuthUser | null>(() => {
    if (!currentAuthId) return null;
    return users.find((user) => user.id === currentAuthId) ?? null;
  }, [currentAuthId, users]);

  const applyAuthUser = useCallback(
    (user: AuthUser) => {
      setCurrentAuthId(user.id);
      setCurrentUserId(user.creatorId);
      setSession({ mode: "auth", authId: user.id });
    },
    [setCurrentUserId],
  );

  const ensureAuthUser = useCallback(
    (
      supabaseUser: SupabaseUser,
      provider: AuthProviderType,
      options?: { name?: string; username?: string },
    ) => {
      const rawEmail = supabaseUser.email?.trim();
      if (!rawEmail) {
        toast.error("Your account is missing an email address");
        return null;
      }

      const email = rawEmail.toLowerCase();
      const uid = supabaseUser.id;

      const existing =
        users.find((user) => user.id === uid) ?? users.find((user) => user.email === email) ?? null;

      let creatorId = existing?.creatorId;
      let profile = creatorId ? creators.find((creator) => creator.id === creatorId) : undefined;

      if (!creatorId) {
        const matchedCreator = creators.find(
          (creator) => creator.email && creator.email.toLowerCase() === email,
        );
        profile =
          matchedCreator ??
          registerCreator({
            id: uid,
            name:
              options?.name ??
              supabaseUser.user_metadata?.full_name ??
              supabaseUser.user_metadata?.name ??
              usernameFromEmail(email),
            username: options?.username ?? usernameFromEmail(email),
            email,
            role: isAdminEmail(email) ? "admin" : "creator",
            avatar: supabaseUser.user_metadata?.avatar_url ?? undefined,
            bio: supabaseUser.user_metadata?.bio,
            focus: supabaseUser.user_metadata?.focus,
            location: supabaseUser.user_metadata?.location,
          });
        creatorId = profile.id;
      }

      const displayName =
        options?.name ??
        supabaseUser.user_metadata?.full_name ??
        supabaseUser.user_metadata?.name ??
        supabaseUser.user_metadata?.user_name ??
        existing?.displayName ??
        null;

      const normalized = normalizeAuthUser({
        ...(existing ?? {}),
        id: uid,
        email,
        provider,
        creatorId,
        displayName,
        photoURL: supabaseUser.user_metadata?.avatar_url ?? existing?.photoURL ?? null,
        emailVerified: Boolean(supabaseUser.email_confirmed_at),
        status: existing?.status ?? "active",
        banReason: existing?.banReason,
        bannedUntil: existing?.bannedUntil ?? null,
        banIssuedAt: existing?.banIssuedAt,
      } as AuthUser);

      let nextUser: AuthUser | null = normalized;
      setUsers((prev) => {
        const idx = prev.findIndex((user) => user.id === normalized.id);
        if (idx === -1) {
          const filtered = prev.filter((user) => user.email !== normalized.email);
          return [...filtered, normalized];
        }

        const current = prev[idx];
        if (areAuthUsersEqual(current, normalized)) {
          nextUser = current;
          return prev;
        }

        const clone = [...prev];
        clone[idx] = { ...current, ...normalized };
        return clone;
      });

      const syncProfile = profile ?? creators.find((creator) => creator.id === creatorId);
      if (syncProfile) {
        void (async () => {
          const { error } = await supabase
            .from("users")
            .upsert(
              {
                id: uid,
                username: syncProfile.username,
                display_name: syncProfile.name,
                avatar_url: syncProfile.avatar,
                bio: syncProfile.bio,
                role: syncProfile.role,
                focus: syncProfile.focus,
                location: syncProfile.location,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "id" },
            );
          if (error) {
            console.error("Failed to sync Supabase profile", error);
          }
        })();
      }

      return nextUser;
    },
    [creators, normalizeAuthUser, registerCreator, users],
  );

  const syncSession = useCallback(
    async (supabaseSession: Session | null, phase: "init" | "event" = "event") => {
      const supabaseUser = supabaseSession?.user ?? null;
      if (!supabaseUser) {
        setCurrentAuthId(null);
        setSession({ mode: "guest" });
        return;
      }

      if (!supabaseUser.email_confirmed_at) {
        if (phase === "event") {
          toast.info("Please verify your email before signing in.");
        }
        await supabase.auth.signOut();
        return;
      }

      const provider = mapSupabaseProvider(supabaseUser);
      const synced = ensureAuthUser(supabaseUser, provider);
      if (!synced) {
        await supabase.auth.signOut();
        return;
      }

      if (synced.status === "banned") {
        toast.error(
          synced.bannedUntil
            ? `This account is banned until ${new Date(synced.bannedUntil).toLocaleString()}`
            : "This account has been permanently banned.",
        );
        await supabase.auth.signOut();
        return;
      }

      applyAuthUser(synced);
    },
    [applyAuthUser, ensureAuthUser],
  );

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      void syncSession(data.session, "init");
    });
  }, [syncSession]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, supabaseSession) => {
      void syncSession(supabaseSession);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [syncSession]);

  const loginWithEmail = useCallback<AuthContextValue["loginWithEmail"]>(
    async (email, password) => {
      const normalizedEmail = email.trim().toLowerCase();
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          const message = error.message?.toLowerCase() ?? "";
          if (message.includes("email") && message.includes("confirm")) {
            await supabase.auth.resend({ type: "signup", email: normalizedEmail });
            toast.info("Verification email sent! Check your inbox.");
          } else {
            toast.error(formatSupabaseError(error));
          }
          return false;
        }

        const user = data.user;
        if (!user) {
          toast.error("Unable to sign in. Try again.");
          return false;
        }

        if (!user.email_confirmed_at) {
          toast.info("Please verify your email before signing in.");
          return false;
        }

        const provider = mapSupabaseProvider(user);
        const synced = ensureAuthUser(user, provider);
        if (!synced) {
          await supabase.auth.signOut();
          return false;
        }

        if (synced.status === "banned") {
          await supabase.auth.signOut();
          toast.error(
            synced.bannedUntil
              ? `This account is banned until ${new Date(synced.bannedUntil).toLocaleString()}`
              : "This account has been permanently banned.",
          );
          return false;
        }

        applyAuthUser(synced);
        toast.success("Logged in successfully");
        return true;
      } catch (error) {
        toast.error(formatSupabaseError(error));
        return false;
      }
    },
    [applyAuthUser, ensureAuthUser],
  );

  const registerWithEmail = useCallback<AuthContextValue["registerWithEmail"]>(
    async ({ name, username, email, password }) => {
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedUsername = username.trim();
      const trimmedName = name.trim();

      if (!trimmedUsername) {
        toast.error("Username is required");
        return false;
      }

      const normalizedUsername = trimmedUsername.toLowerCase();
      if (creators.some((creator) => creator.username.toLowerCase() === normalizedUsername)) {
        toast.error("Username is already taken");
        return false;
      }

      try {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: trimmedName || trimmedUsername,
              username: trimmedUsername,
            },
          },
        });

        if (error) {
          toast.error(formatSupabaseError(error));
          return false;
        }

        if (data.user) {
          ensureAuthUser(data.user, "email", {
            name: trimmedName || "New Creator",
            username: trimmedUsername,
          });
        }

        await supabase.auth.signOut();

        setCurrentAuthId(null);
        setSession({ mode: "guest" });
        const fallbackId = creators[0]?.id;
        if (fallbackId) {
          setCurrentUserId(fallbackId);
        }

        toast.success("Account created");
        toast.info("Verification email sent! Check your inbox.");
        return true;
      } catch (error) {
        toast.error(formatSupabaseError(error));
        return false;
      }
    },
    [creators, ensureAuthUser, setCurrentUserId],
  );

  const loginWithProvider = useCallback<AuthContextValue["loginWithProvider"]>(
    async (provider) => {
      if (provider !== "google") {
        toast.error("Only Google sign-in is supported at the moment");
        return false;
      }

      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin,
          },
        });

        if (error) {
          toast.error(formatSupabaseError(error));
          return false;
        }

        if (data?.url) {
          window.location.href = data.url;
        }

        toast.info("Redirecting to Google sign-in...");
        return true;
      } catch (error) {
        toast.error(formatSupabaseError(error));
        return false;
      }
    },
    [],
  );

  const changePassword = useCallback<AuthContextValue["changePassword"]>(
    async (currentPassword, newPassword) => {
      if (!authUser) {
        toast.error("Sign in to update your password");
        return false;
      }

      if (authUser.provider !== "email") {
        toast.info("Password changes are managed through your provider");
        return false;
      }

      const trimmed = newPassword.trim();
      if (trimmed.length < 8) {
        toast.error("Password must be at least 8 characters");
        return false;
      }

      try {
        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: authUser.email,
          password: currentPassword,
        });

        if (reauthError) {
          toast.error("Current password is incorrect");
          return false;
        }

        const { error } = await supabase.auth.updateUser({ password: trimmed });
        if (error) {
          toast.error(formatSupabaseError(error));
          return false;
        }

        toast.success("Password updated");
        return true;
      } catch (error) {
        toast.error(formatSupabaseError(error));
        return false;
      }
    },
    [authUser],
  );

  const deleteAccountByCreatorId = useCallback<AuthContextValue["deleteAccountByCreatorId"]>(
    (creatorId) => {
      const removedAuthIds: string[] = [];
      let removedCurrent = false;

      setUsers((prev) => {
        const remaining = prev.filter((user) => {
          if (user.creatorId === creatorId) {
            removedAuthIds.push(user.id);
            if (user.id === currentAuthId) {
              removedCurrent = true;
            }
            return false;
          }
          return true;
        });
        return remaining;
      });

      if (removedAuthIds.length === 0) {
        return;
      }

      if (removedCurrent) {
        setCurrentAuthId(null);
        setSession({ mode: "guest" });
      } else {
        setSession((prev) => {
          if (prev?.mode === "auth" && removedAuthIds.includes(prev.authId)) {
            return { mode: "guest" };
          }
          return prev;
        });
      }

      void (async () => {
        const { error } = await supabase.from("users").delete().in("id", removedAuthIds);
        if (error) {
          console.error("Failed to delete Supabase profiles", error);
        }
      })();
    },
    [currentAuthId],
  );

  const banAccountByCreatorId = useCallback<AuthContextValue["banAccountByCreatorId"]>(
    (creatorId, reason, bannedUntil = null) => {
      const bannedUser = users.find((user) => user.creatorId === creatorId);
      setUsers((prev) =>
        prev.map((user) =>
          user.creatorId === creatorId
            ? {
                ...user,
                status: "banned",
                banReason: reason,
                bannedUntil: bannedUntil ?? null,
                banIssuedAt: new Date().toISOString(),
              }
            : user,
        ),
      );

      if (bannedUser && bannedUser.id === currentAuthId) {
        setCurrentAuthId(null);
        setSession({ mode: "guest" });
        toast.info("Your account has been banned and you have been signed out.");
      }
    },
    [currentAuthId, users],
  );

  const unbanAccountByCreatorId = useCallback<AuthContextValue["unbanAccountByCreatorId"]>(
    (creatorId) => {
      setUsers((prev) =>
        prev.map((user) =>
          user.creatorId === creatorId
            ? {
                ...user,
                status: "active",
                banReason: undefined,
                bannedUntil: null,
                banIssuedAt: undefined,
              }
            : user,
        ),
      );
    },
    [],
  );

  const continueAsGuest = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setCurrentAuthId(null);
    setSession({ mode: "guest" });
    const fallbackId = creators[0]?.id;
    if (fallbackId) {
      setCurrentUserId(fallbackId);
    }
    toast.info("Browsing as a guest. Sign up to unlock all features.");
  }, [creators, setCurrentUserId]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setCurrentAuthId(null);
    setSession({ mode: "guest" });
    const fallbackId = creators[0]?.id;
    if (fallbackId) {
      setCurrentUserId(fallbackId);
    }
    toast.success("Logged out");
  }, [creators, setCurrentUserId]);

  useEffect(() => {
    if (session?.mode === "auth") {
      const existing = users.find((user) => user.id === session.authId);
      if (existing) {
        setCurrentAuthId(existing.id);
        setCurrentUserId(existing.creatorId);
        return;
      }
      setSession(null);
      setCurrentAuthId(null);
    } else if (session?.mode === "guest") {
      setCurrentAuthId(null);
      const fallbackId = creators[0]?.id;
      if (fallbackId) {
        setCurrentUserId(fallbackId);
      }
    }
  }, [session, users, creators, setCurrentUserId]);

  useEffect(() => {
    if (authUser) {
      setCurrentUserId(authUser.creatorId);
    }
  }, [authUser, setCurrentUserId]);

  const sessionMode: SessionMode = authUser ? "auth" : session?.mode ?? "none";
  const isAdmin = authUser ? isAdminEmail(authUser.email) : false;

  const value = useMemo<AuthContextValue>(
    () => ({
      authUser,
      sessionMode,
      isAdmin,
      loginWithEmail,
      registerWithEmail,
      loginWithProvider,
      continueAsGuest,
      changePassword,
      deleteAccountByCreatorId,
      banAccountByCreatorId,
      unbanAccountByCreatorId,
      logout,
    }),
    [
      authUser,
      sessionMode,
      isAdmin,
      loginWithEmail,
      registerWithEmail,
      loginWithProvider,
      continueAsGuest,
      changePassword,
      deleteAccountByCreatorId,
      banAccountByCreatorId,
      unbanAccountByCreatorId,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
