import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useUser } from "./UserContext";
import { isAdminEmail } from "@/lib/auth";

type AuthProviderType = "email" | "google" | "facebook";

interface AuthUser {
  id: string;
  email: string;
  provider: AuthProviderType;
  password?: string;
  creatorId: string;
  status?: "active" | "banned";
  banReason?: string;
  bannedUntil?: string | null;
  banIssuedAt?: string;
}

interface RegisterWithEmailPayload {
  name: string;
  username: string;
  email: string;
  password: string;
}

type SessionState = { mode: "auth"; authId: string } | { mode: "guest" } | null;
type SessionMode = "auth" | "guest" | "none";

interface AuthContextValue {
  authUser: AuthUser | null;
  sessionMode: SessionMode;
  isAdmin: boolean;
  loginWithEmail: (email: string, password: string) => boolean;
  registerWithEmail: (payload: RegisterWithEmailPayload) => boolean;
  loginWithProvider: (provider: Exclude<AuthProviderType, "email">, selectedEmail?: string) => boolean;
  continueAsGuest: () => void;
  changePassword: (currentPassword: string, newPassword: string) => boolean;
  deleteAccountByCreatorId: (creatorId: string) => void;
  banAccountByCreatorId: (creatorId: string, reason: string, bannedUntil?: string | null) => void;
  unbanAccountByCreatorId: (creatorId: string) => void;
  logout: () => void;
}

const USERS_STORAGE_KEY = "adspark-auth-users";
const SESSION_STORAGE_KEY = "adspark-auth-session";

const authSeed: AuthUser[] = [
  {
    id: "auth-creator-pro",
    email: "creativepro@example.com",
    provider: "email",
    password: "password123",
    creatorId: "creator-pro",
    status: "active",
  },
  {
    id: "auth-brand-master",
    email: "brandmaster@example.com",
    provider: "email",
    password: "password123",
    creatorId: "brand-master",
    status: "active",
  },
  {
    id: "auth-fearless-2",
    email: "fearlessbeke2@gmail.com",
    provider: "email",
    password: "admin123",
    creatorId: "admin-fearless-2",
    status: "active",
  },
  {
    id: "auth-fearless-7",
    email: "fearlessbeke7@gmail.com",
    provider: "email",
    password: "admin123",
    creatorId: "admin-fearless-7",
    status: "active",
  },
];

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

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
    const byId = new Map<string, AuthUser>();
    authSeed.forEach((user) => byId.set(user.id, user));
    stored?.forEach((user) => {
      if (user?.id && user.email) {
        byId.set(user.id, user);
      }
    });
    return Array.from(byId.values()).map((user) => normalizeAuthUser(user));
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

  const loginWithEmail = useCallback<AuthContextValue["loginWithEmail"]>(
    (email, password) => {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = users.find((user) => user.email === normalizedEmail && user.provider === "email");

      if (!existing || existing.password !== password) {
        toast.error("Invalid email or password");
        return false;
      }

      let userToApply = existing;
      if (existing.status === "banned") {
        const expires = existing.bannedUntil ? new Date(existing.bannedUntil).getTime() : null;
        const now = Date.now();
        const expired = expires !== null && Number.isFinite(expires) && expires < now;
        if (expired) {
          userToApply = {
            ...existing,
            status: "active",
            bannedUntil: null,
            banReason: undefined,
            banIssuedAt: undefined,
          };
          setUsers((prev) => prev.map((user) => (user.id === existing.id ? userToApply : user)));
        } else {
          toast.error(
            existing.bannedUntil
              ? `This account is banned until ${new Date(existing.bannedUntil).toLocaleString()}`
              : "This account has been permanently banned.",
          );
          return false;
        }
      }

      applyAuthUser(userToApply);
      toast.success("Logged in successfully");
      return true;
    },
    [applyAuthUser, users],
  );

  const registerWithEmail = useCallback<AuthContextValue["registerWithEmail"]>(
    ({ name, username, email, password }) => {
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedUsername = username.trim();
      if (!trimmedUsername) {
        toast.error("Username is required");
        return false;
      }

      if (users.some((user) => user.email === normalizedEmail)) {
        toast.error("An account with this email already exists");
        return false;
      }

      const normalizedUsername = trimmedUsername.toLowerCase();
      if (creators.some((creator) => creator.username.toLowerCase() === normalizedUsername)) {
        toast.error("Username is already taken");
        return false;
      }

      const isAdminAccount = isAdminEmail(normalizedEmail);

      const profile = registerCreator({
        name: name.trim() || "New Creator",
        username: trimmedUsername,
        email: normalizedEmail,
        role: isAdminAccount ? "admin" : "creator",
      });

      const newAuthUser: AuthUser = {
        id: createId(),
        email: normalizedEmail,
        password,
        provider: "email",
        creatorId: profile.id,
        status: "active",
      };

      setUsers((prev) => [...prev, newAuthUser]);
      applyAuthUser(newAuthUser);
      toast.success("Account created");
      return true;
    },
    [applyAuthUser, creators, registerCreator, users],
  );

  const loginWithProvider = useCallback<AuthContextValue["loginWithProvider"]>(
    (provider, selectedEmail) => {
      const providerEmail = (selectedEmail?.trim().toLowerCase() || `${provider}@demo.adspark.dev`).replace(
        /\s+/g,
        "",
      );
      let existing = users.find((user) => user.email === providerEmail && user.provider === provider);

      if (!existing) {
        const displayName = selectedEmail ? selectedEmail.split("@")[0] : provider === "google" ? "Google" : "Facebook";
        const baseUsername = displayName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || provider;
        const generatedProfile = registerCreator({
          name: `${displayName} Creator`,
          username: `${baseUsername}-${Math.random().toString(36).slice(2, 8)}`,
          email: providerEmail,
          role: "creator",
          avatar:
            provider === "google"
              ? "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4f1.svg"
              : "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f4f7.svg",
        });

        existing = {
          id: createId(),
          email: providerEmail,
          provider,
          creatorId: generatedProfile.id,
          status: "active",
        };
        setUsers((prev) => [...prev, existing!]);
      }

      let userToApply = existing;
      if (existing.status === "banned") {
        const expires = existing.bannedUntil ? new Date(existing.bannedUntil).getTime() : null;
        const now = Date.now();
        const expired = expires !== null && Number.isFinite(expires) && expires < now;
        if (expired) {
          userToApply = {
            ...existing,
            status: "active",
            bannedUntil: null,
            banReason: undefined,
            banIssuedAt: undefined,
          };
          setUsers((prev) => prev.map((user) => (user.id === existing!.id ? userToApply : user)));
        } else {
          toast.error(
            existing.bannedUntil
              ? `This account is banned until ${new Date(existing.bannedUntil).toLocaleString()}`
              : "This account has been permanently banned.",
          );
          return false;
        }
      }

      applyAuthUser(userToApply);
        toast.success(`Signed in with ${provider === "google" ? "Google" : "Facebook"}`);
      return true;
    },
    [applyAuthUser, registerCreator, users],
  );

  const changePassword = useCallback<AuthContextValue["changePassword"]>(
    (currentPassword, newPassword) => {
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

      let updatedSuccessfully = false;
      setUsers((prev) => {
        const index = prev.findIndex((user) => user.id === authUser.id);
        if (index === -1) {
          toast.error("Something went wrong. Try again.");
          return prev;
        }

        const target = prev[index];
        if (target.password !== currentPassword) {
          toast.error("Current password is incorrect");
          return prev;
        }

        const clone = [...prev];
        clone[index] = { ...target, password: trimmed };
        toast.success("Password updated");
        updatedSuccessfully = true;
        return clone;
      });

      return updatedSuccessfully;
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

  const continueAsGuest = useCallback(() => {
    setCurrentAuthId(null);
    setSession({ mode: "guest" });
    const fallbackId = creators[0]?.id;
    if (fallbackId) {
      setCurrentUserId(fallbackId);
    }
    toast.info("Browsing as a guest. Sign up to unlock all features.");
  }, [creators, setCurrentUserId]);

  const logout = useCallback(() => {
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
