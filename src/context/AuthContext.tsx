import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useUser } from "./UserContext";
import { isAdminEmail } from "@/lib/auth";
import { auth, googleProvider } from "@/firebaseConfig";
import {
  EmailAuthProvider,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";

type AuthProviderType = "email" | "google" | "facebook";

interface AuthUser {
  id: string;
  email: string;
  provider: AuthProviderType;
  creatorId: string;
  password?: string;
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
  left.password === right.password &&
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

const mapFirebaseProvider = (user: FirebaseUser): AuthProviderType => {
  const providerId = user.providerData[0]?.providerId;
  if (providerId === "google.com") {
    return "google";
  }
  return "email";
};

const usernameFromEmail = (email: string) => email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");

const formatFirebaseError = (error: unknown) => {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "An account with this email already exists";
      case "auth/invalid-email":
        return "Enter a valid email address";
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "Invalid email or password";
      case "auth/user-disabled":
        return "This account has been disabled";
      case "auth/user-not-found":
        return "No account found with these credentials";
      case "auth/popup-closed-by-user":
        return "Popup closed before completing sign in";
      default:
        return error.message;
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

  const ensureAuthUser = useCallback(
    (
      firebaseUser: FirebaseUser,
      provider: AuthProviderType,
      options?: { name?: string; username?: string },
    ) => {
      const rawEmail = firebaseUser.email?.trim();
      if (!rawEmail) {
        toast.error("Your account is missing an email address");
        return null;
      }

      const email = rawEmail.toLowerCase();
      const uid = firebaseUser.uid;

      const existing =
        users.find((user) => user.id === uid) ?? users.find((user) => user.email === email) ?? null;

      let creatorId = existing?.creatorId;

      if (!creatorId) {
        const matchedCreator = creators.find(
          (creator) => creator.email && creator.email.toLowerCase() === email,
        );
        const profile =
          matchedCreator ??
          registerCreator({
            name: options?.name ?? firebaseUser.displayName ?? usernameFromEmail(email),
            username: options?.username ?? usernameFromEmail(email),
            email,
            role: isAdminEmail(email) ? "admin" : "creator",
            avatar: firebaseUser.photoURL ?? undefined,
          });
        creatorId = profile.id;
      }

      const base: AuthUser = {
        id: uid,
        email,
        provider,
        creatorId,
        password: existing?.password,
        status: existing?.status ?? "active",
        banReason: existing?.banReason,
        bannedUntil: existing?.bannedUntil ?? null,
        banIssuedAt: existing?.banIssuedAt,
        displayName: firebaseUser.displayName ?? existing?.displayName ?? null,
        photoURL: firebaseUser.photoURL ?? existing?.photoURL ?? null,
        emailVerified: firebaseUser.emailVerified,
      };

      const normalized = normalizeAuthUser(base);

      let nextUser: AuthUser | null = normalized;
      setUsers((prev) => {
        const idx = prev.findIndex((user) => user.id === normalized.id);
        if (idx === -1) {
          const filtered = prev.filter((user) => user.email !== normalized.email);
          if (filtered.length === prev.length) {
            return [...prev, normalized];
          }
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

      return nextUser;
    },
    [creators, normalizeAuthUser, registerCreator, users],
  );

  const loginWithEmail = useCallback<AuthContextValue["loginWithEmail"]>(
    async (email, password) => {
      const normalizedEmail = email.trim().toLowerCase();
      try {
        const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        const provider = mapFirebaseProvider(credential.user);
        await credential.user.reload();
        if (!credential.user.emailVerified) {
          try {
            await sendEmailVerification(credential.user);
            toast.info(`Verify your email. A verification link was sent to ${credential.user.email ?? normalizedEmail}.`);
          } catch (verificationError) {
            toast.error(formatFirebaseError(verificationError));
          }
          await signOut(auth);
          return false;
        }
        const synced = ensureAuthUser(credential.user, provider);
        if (!synced) {
          await signOut(auth);
          return false;
        }
        if (synced.status === "banned") {
          await signOut(auth);
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
        toast.error(formatFirebaseError(error));
        return false;
      }
    },
    [applyAuthUser, ensureAuthUser],
  );

  const registerWithEmail = useCallback<AuthContextValue["registerWithEmail"]>(
    async ({ name, username, email, password }) => {
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedUsername = username.trim();

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
        const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
        const trimmedName = name.trim();
        if (trimmedName) {
          await updateProfile(credential.user, { displayName: trimmedName });
        }
        await sendEmailVerification(credential.user);

        const synced = ensureAuthUser(credential.user, "email", {
          name: trimmedName || "New Creator",
          username: trimmedUsername,
        });

        if (!synced) {
          await signOut(auth);
          return false;
        }

        try {
          await signOut(auth);
        } catch {
          // ignore
        }

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
        toast.error(formatFirebaseError(error));
        return false;
      }
    },
    [creators, ensureAuthUser, setCurrentAuthId, setCurrentUserId, setSession],
  );

  const loginWithProvider = useCallback<AuthContextValue["loginWithProvider"]>(
    async (provider) => {
      if (provider !== "google") {
        toast.error("Only Google sign-in is supported at the moment");
        return false;
      }

      try {
        const result = await signInWithPopup(auth, googleProvider);
        const synced = ensureAuthUser(result.user, "google");
        if (!synced) {
          await signOut(auth);
          return false;
        }
        if (synced.status === "banned") {
          await signOut(auth);
          toast.error(
            synced.bannedUntil
              ? `This account is banned until ${new Date(synced.bannedUntil).toLocaleString()}`
              : "This account has been permanently banned.",
          );
          return false;
        }

        applyAuthUser(synced);
        toast.success("Signed in with Google");
        return true;
      } catch (error) {
        const message = formatFirebaseError(error);
        if (message === "Popup closed before completing sign in") {
          toast.info(message);
        } else {
          toast.error(message);
        }
        return false;
      }
    },
    [applyAuthUser, ensureAuthUser],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentAuthId(null);
        setSession({ mode: "guest" });
        return;
      }

      if (!firebaseUser.emailVerified) {
        toast.info("Please verify your email before signing in.");
        await signOut(auth);
        return;
      }

      const provider = mapFirebaseProvider(firebaseUser);
      const synced = ensureAuthUser(firebaseUser, provider);
      if (!synced) {
        await signOut(auth);
        return;
      }

      if (synced.status === "banned") {
        await signOut(auth);
        toast.error(
          synced.bannedUntil
            ? `This account is banned until ${new Date(synced.bannedUntil).toLocaleString()}`
            : "This account has been permanently banned.",
        );
        return;
      }

      applyAuthUser(synced);
    });

    return () => unsubscribe();
  }, [applyAuthUser, ensureAuthUser]);

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

      if (!auth.currentUser || !auth.currentUser.email) {
        toast.error("No authenticated session");
        return false;
      }

      const trimmed = newPassword.trim();
      if (trimmed.length < 8) {
        toast.error("Password must be at least 8 characters");
        return false;
      }

      try {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, trimmed);
        setUsers((prev) =>
          prev.map((user) => (user.id === authUser.id ? { ...user, password: undefined } : user)),
        );
        toast.success("Password updated");
        return true;
      } catch (error) {
        toast.error(formatFirebaseError(error));
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
      await signOut(auth);
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
      await signOut(auth);
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
