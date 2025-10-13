import { ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react";
import { toast } from "sonner";
import { useUser, CreatorProfile } from "./UserContext";

type AuthProviderType = "email" | "google" | "facebook";

interface AuthUser {
  id: string;
  email: string;
  provider: AuthProviderType;
  password?: string;
  creatorId: string;
}

interface RegisterWithEmailPayload {
  name: string;
  username: string;
  email: string;
  password: string;
}

interface AuthContextValue {
  authUser: AuthUser | null;
  loginWithEmail: (email: string, password: string) => boolean;
  registerWithEmail: (payload: RegisterWithEmailPayload) => boolean;
  loginWithProvider: (provider: Exclude<AuthProviderType, "email">) => boolean;
  logout: () => void;
}

const authSeed: AuthUser[] = [
  {
    id: "auth-creator-pro",
    email: "creativepro@example.com",
    provider: "email",
    password: "password123",
    creatorId: "creator-pro",
  },
  {
    id: "auth-brand-master",
    email: "brandmaster@example.com",
    provider: "email",
    password: "password123",
    creatorId: "brand-master",
  },
];

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { registerCreator, setCurrentUserId, creators } = useUser();

  const [users, setUsers] = useState<AuthUser[]>(authSeed);
  const [currentAuthId, setCurrentAuthId] = useState<string | null>(authSeed[0].id);

  const authUser = useMemo<AuthUser | null>(() => {
    if (!currentAuthId) return null;
    return users.find((user) => user.id === currentAuthId) ?? null;
  }, [currentAuthId, users]);

  const applyAuthUser = useCallback(
    (user: AuthUser) => {
      setCurrentAuthId(user.id);
      setCurrentUserId(user.creatorId);
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

      applyAuthUser(existing);
      toast.success("Logged in successfully");
      return true;
    },
    [applyAuthUser, users],
  );

  const registerWithEmail = useCallback<AuthContextValue["registerWithEmail"]>(
    ({ name, username, email, password }) => {
      const normalizedEmail = email.trim().toLowerCase();
      if (users.some((user) => user.email === normalizedEmail)) {
        toast.error("An account with this email already exists");
        return false;
      }

      if (creators.some((creator) => creator.username === username.trim())) {
        toast.error("Username is already taken");
        return false;
      }

      const profile = registerCreator({
        name: name.trim() || "New Creator",
        username: username.trim(),
        email: normalizedEmail,
        role: "creator",
      });

      const newAuthUser: AuthUser = {
        id: createId(),
        email: normalizedEmail,
        password,
        provider: "email",
        creatorId: profile.id,
      };

      setUsers((prev) => [...prev, newAuthUser]);
      applyAuthUser(newAuthUser);
      toast.success("Account created");
      return true;
    },
    [applyAuthUser, creators, registerCreator, users],
  );

  const loginWithProvider = useCallback<AuthContextValue["loginWithProvider"]>(
    (provider) => {
      const providerEmail = `${provider}@demo.adspark.dev`;
      let existing = users.find((user) => user.email === providerEmail && user.provider === provider);

      if (!existing) {
        const generatedProfile = registerCreator({
          name: provider === "google" ? "Google Creator" : "Facebook Creator",
          username: `${provider}-${Math.random().toString(36).slice(2, 8)}`,
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
        };
        setUsers((prev) => [...prev, existing!]);
      }

      applyAuthUser(existing);
      toast.success(`Signed in with ${provider === "google" ? "Google" : "Facebook"}`);
      return true;
    },
    [applyAuthUser, registerCreator, users],
  );

  const logout = useCallback(() => {
    setCurrentAuthId(null);
    const fallbackId = creators[0]?.id;
    if (fallbackId) {
      setCurrentUserId(fallbackId);
    }
    toast.success("Logged out");
  }, [creators, setCurrentUserId]);

  const value = useMemo<AuthContextValue>(
    () => ({ authUser, loginWithEmail, registerWithEmail, loginWithProvider, logout }),
    [authUser, loginWithEmail, registerWithEmail, loginWithProvider, logout],
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
