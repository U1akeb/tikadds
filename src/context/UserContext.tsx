import { createContext, useContext, useMemo, useState, ReactNode, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { isAdminEmail } from "@/lib/auth";
import { supabase } from "@/supabaseClient";

export type UserRole = "creator" | "advertiser" | "admin";

export interface CreatorStats {
  videos: number;
  likes: number;
  shares: number;
  comments: number;
  earnings?: number;
  pendingEarnings?: number;
  submittedJobs?: number;
  jobsPosted?: number;
}

export interface CreatorVideo {
  id: string;
  title: string;
  thumbnail: string;
  src: string;
  banInfo?: VideoBanInfo;
}

export interface VideoBanInfo {
  isBanned: boolean;
  reason?: string;
  bannedUntil?: string | null;
  issuedAt?: string;
  issuedBy?: string;
}

export interface CreatorWarning {
  id: string;
  reason: string;
  issuedAt: string;
  issuedBy: string;
}

export interface AccountBanInfo {
  isBanned: boolean;
  reason?: string;
  bannedUntil?: string | null;
  issuedAt?: string;
  issuedBy?: string;
}

export interface CreatorProfile {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: UserRole;
  avatar: string;
  bio: string;
  location?: string;
  focus?: string;
  stats: CreatorStats;
  videos: CreatorVideo[];
  pinnedVideoIds: string[];
  lastProfileUpdate?: string;
  warnings: CreatorWarning[];
  banInfo: AccountBanInfo;
}

export type CurrentUser = CreatorProfile;

interface RegisterCreatorPayload {
  id?: string;
  name: string;
  username: string;
  email?: string;
  avatar?: string;
  role?: UserRole;
  bio?: string;
  focus?: string;
  location?: string;
}

interface UserContextValue {
  currentUser: CurrentUser;
  creators: CreatorProfile[];
  isContentRequester: boolean;
  setUserRole: (role: UserRole) => void;
  updateProfile: (data: Partial<Pick<CreatorProfile, "name" | "username" | "avatar" | "bio">>) => void;
  updatePinnedVideos: (videoIds: string[]) => void;
  registerCreator: (payload: RegisterCreatorPayload) => CreatorProfile;
  setCurrentUserId: (id: string) => void;
  toggleFollow: (targetId: string) => Promise<void>;
  isFollowing: (targetId: string) => boolean;
  getFollowersCount: (targetId: string) => number;
  getFollowingCount: (sourceId: string) => number;
  findCreatorByUsername: (username: string) => CreatorProfile | undefined;
  findCreatorById: (id: string) => CreatorProfile | undefined;
  deleteCreatorById: (id: string) => CreatorProfile | null;
  deleteCreatorByUsername: (username: string) => CreatorProfile | null;
  issueWarning: (username: string, reason: string, issuedBy: string) => boolean;
  banAccount: (username: string, reason: string, bannedUntil?: string | null, issuedBy?: string) => boolean;
  unbanAccount: (username: string) => boolean;
  deleteVideo: (username: string, videoId: string) => boolean;
  banVideo: (username: string, videoId: string, reason: string, bannedUntil?: string | null, issuedBy?: string) => boolean;
  unbanVideo: (username: string, videoId: string) => boolean;
}

const CREATORS_STORAGE_KEY = "adspark-creators";
const FOLLOW_STORAGE_KEY = "adspark-follow-map";
const CURRENT_USER_STORAGE_KEY = "adspark-current-user";

const seedProfileUpdatedAt = new Date().toISOString();
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const creatorsSeed: CreatorProfile[] = [
  {
    id: "creator-pro",
    name: "Creative Pro",
    username: "creativepro",
    email: "creativepro@example.com",
    role: "creator",
    avatar: "https://i.pravatar.cc/150?img=14",
    bio: "Award-winning ad creator helping brands tell stories that convert.",
    location: "Los Angeles, CA",
    focus: "Short-form product storytelling",
    stats: {
      videos: 64,
      likes: 128_500,
      shares: 32_940,
      comments: 12_410,
      earnings: 28_700,
      pendingEarnings: 1_850,
      submittedJobs: 18,
    },
    videos: [
      {
        id: "cp-1",
        title: "Glow Serum Launch",
        thumbnail: "https://images.unsplash.com/photo-1526045478516-99145907023c?auto=format&fit=crop&w=600&q=80",
        src: "https://cdn.coverr.co/videos/coverr-a-beautiful-river-6767/1080p.mp4",
      },
      {
        id: "cp-2",
        title: "Summer Street Wear",
        thumbnail: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80",
        src: "https://cdn.coverr.co/videos/coverr-a-fashion-runway-4888/1080p.mp4",
      },
      {
        id: "cp-3",
        title: "Smart Watch Reveal",
        thumbnail: "https://images.unsplash.com/photo-1485988412941-77a35537dae4?auto=format&fit=crop&w=600&q=80",
        src: "https://cdn.coverr.co/videos/coverr-futuristic-clock-2385/1080p.mp4",
      },
      {
        id: "cp-4",
        title: "Outdoor Adventure",
        thumbnail: "https://images.unsplash.com/photo-1499696010181-8f785ba67e45?auto=format&fit=crop&w=600&q=80",
        src: "https://cdn.coverr.co/videos/coverr-hiking-the-ridge-1624/1080p.mp4",
      },
      {
        id: "cp-5",
        title: "Coffeehouse Story",
        thumbnail: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=600&q=80",
        src: "https://cdn.coverr.co/videos/coverr-coffeehouse-4227/1080p.mp4",
      },
    ],
    pinnedVideoIds: ["cp-1", "cp-2", "cp-3"],
    lastProfileUpdate: seedProfileUpdatedAt,
    warnings: [],
    banInfo: { isBanned: false },
  },
  {
    id: "brand-master",
    name: "Brand Master",
    username: "brandmaster",
    email: "brandmaster@example.com",
    role: "advertiser",
    avatar: "https://i.pravatar.cc/150?img=47",
    bio: "Launching viral campaigns for lifestyle brands.",
    location: "New York, NY",
    focus: "Creator partnerships",
    stats: {
      videos: 12,
      likes: 48_230,
      shares: 8_540,
      comments: 6_105,
      jobsPosted: 9,
    },
    videos: [],
    pinnedVideoIds: [],
    lastProfileUpdate: seedProfileUpdatedAt,
    warnings: [],
    banInfo: { isBanned: false },
  },
  {
    id: "ad-genius",
    name: "Ad Genius",
    username: "adgenius",
    email: "adgenius@example.com",
    role: "creator",
    avatar: "https://i.pravatar.cc/150?img=11",
    bio: "Cinematic product videos and UGC that feels authentic.",
    location: "Austin, TX",
    focus: "Lifestyle & tech",
    stats: {
      videos: 38,
      likes: 92_411,
      shares: 19_204,
      comments: 8_912,
      earnings: 17_420,
      pendingEarnings: 980,
      submittedJobs: 12,
    },
    videos: [
      {
        id: "ag-1",
        title: "Behind the Scenes",
        thumbnail: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=600&q=80",
        src: "https://cdn.coverr.co/videos/coverr-camera-pan-over-mountains-8230/1080p.mp4",
      },
      {
        id: "ag-2",
        title: "Product Macro Shot",
        thumbnail: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0cb?auto=format&fit=crop&w=600&q=80",
        src: "https://cdn.coverr.co/videos/coverr-a-blurred-background-7214/1080p.mp4",
      },
      {
        id: "ag-3",
        title: "Studio Lighting Tips",
        thumbnail: "https://images.unsplash.com/photo-1526481280695-3c46917e2856?auto=format&fit=crop&w=600&q=80",
        src: "https://cdn.coverr.co/videos/coverr-studio-shoot-5354/1080p.mp4",
      },
    ],
    pinnedVideoIds: ["ag-1", "ag-2", "ag-3"],
    lastProfileUpdate: seedProfileUpdatedAt,
    warnings: [],
    banInfo: { isBanned: false },
  },
  {
    id: "admin-fearless-2",
    name: "Fearless Admin",
    username: "fearless2",
    email: "fearlessbeke2@gmail.com",
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Fearless%20Admin&backgroundColor=FAD4D8",
    bio: "Platform administrator with full access controls.",
    location: "Remote",
    focus: "Operations",
    stats: {
      videos: 12,
      likes: 8_420,
      shares: 1_230,
      comments: 980,
      earnings: 0,
      pendingEarnings: 0,
      submittedJobs: 0,
    },
    videos: [],
    pinnedVideoIds: [],
    lastProfileUpdate: seedProfileUpdatedAt,
    warnings: [],
    banInfo: { isBanned: false },
  },
  {
    id: "admin-fearless-7",
    name: "Fearless Admin Seven",
    username: "fearless7",
    email: "fearlessbeke7@gmail.com",
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=Fearless%20Seven&backgroundColor=E0F4F5",
    bio: "Administrator focused on growth and creator success.",
    location: "Remote",
    focus: "Growth",
    stats: {
      videos: 9,
      likes: 6_105,
      shares: 890,
      comments: 710,
      earnings: 0,
      pendingEarnings: 0,
      submittedJobs: 0,
    },
    videos: [],
    pinnedVideoIds: [],
    lastProfileUpdate: seedProfileUpdatedAt,
    warnings: [],
    banInfo: { isBanned: false },
  },
  {
    id: "spotlight-brand",
    name: "Spotlight Brands",
    username: "spotlight",
    email: "spotlight@example.com",
    role: "advertiser",
    avatar: "https://i.pravatar.cc/150?img=56",
    bio: "Curating the best branded content stories.",
    location: "Remote",
    focus: "Trend scouting",
    stats: {
      videos: 0,
      likes: 1_230,
      shares: 520,
      comments: 312,
      jobsPosted: 3,
    },
    videos: [],
    pinnedVideoIds: [],
    lastProfileUpdate: seedProfileUpdatedAt,
    warnings: [],
    banInfo: { isBanned: false },
  },
];

type FollowMap = Record<string, Set<string>>;

const followSeed: FollowMap = {
  "creator-pro": new Set(["ad-genius", "brand-master"]),
  "ad-genius": new Set(["creator-pro"]),
  "brand-master": new Set(["creator-pro"]),
  "admin-fearless-2": new Set(),
  "admin-fearless-7": new Set(),
};

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const createDefaultStats = (role: UserRole): CreatorStats => ({
  videos: 0,
  likes: 0,
  shares: 0,
  comments: 0,
  earnings: role === "creator" || role === "admin" ? 0 : undefined,
  jobsPosted: role === "advertiser" ? 0 : undefined,
  pendingEarnings: role === "creator" || role === "admin" ? 0 : undefined,
  submittedJobs: role === "creator" || role === "admin" ? 0 : undefined,
});

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const buildFollowSeed = () => {
    const map: FollowMap = {};
    creatorsSeed.forEach((creator) => {
      map[creator.id] = new Set(followSeed[creator.id] ?? []);
    });
    return map;
  };

  const normalizeVideoBan = (ban?: VideoBanInfo): VideoBanInfo => {
    if (!ban?.isBanned) {
      return { isBanned: false };
    }
    if (ban.bannedUntil) {
      const expires = new Date(ban.bannedUntil).getTime();
      if (Number.isFinite(expires) && expires < Date.now()) {
        return { isBanned: false };
      }
    }
    return {
      isBanned: true,
      reason: ban.reason,
      bannedUntil: ban.bannedUntil ?? null,
      issuedAt: ban.issuedAt ?? new Date().toISOString(),
      issuedBy: ban.issuedBy,
    };
  };

  const normalizeAccountBan = (ban?: AccountBanInfo): AccountBanInfo => {
    if (!ban?.isBanned) {
      return { isBanned: false };
    }
    if (ban.bannedUntil) {
      const expires = new Date(ban.bannedUntil).getTime();
      if (Number.isFinite(expires) && expires < Date.now()) {
        return { isBanned: false };
      }
    }
    return {
      isBanned: true,
      reason: ban.reason,
      bannedUntil: ban.bannedUntil ?? null,
      issuedAt: ban.issuedAt ?? new Date().toISOString(),
      issuedBy: ban.issuedBy,
    };
  };

  const sanitizeCreator = (creator: CreatorProfile): CreatorProfile => {
    const admin = isAdminEmail(creator.email);
    const safeRole: UserRole = !admin && creator.role === "admin" ? "creator" : creator.role;
    const normalizedVideos = (creator.videos ?? []).map((video) => ({
      ...video,
      banInfo: normalizeVideoBan(video.banInfo),
    }));
    const banInfo = normalizeAccountBan(creator.banInfo);
    const warnings = Array.isArray(creator.warnings) ? creator.warnings : [];
    return {
      ...creator,
      role: safeRole,
      stats: {
        videos: normalizedVideos.length,
        likes: creator.stats.likes,
        shares: creator.stats.shares,
        comments: creator.stats.comments,
        earnings: safeRole === "creator" || safeRole === "admin" ? creator.stats.earnings ?? 0 : creator.stats.earnings,
        jobsPosted: safeRole === "advertiser" ? creator.stats.jobsPosted ?? 0 : creator.stats.jobsPosted,
        pendingEarnings:
          safeRole === "creator" || safeRole === "admin"
            ? creator.stats.pendingEarnings ?? 0
            : creator.stats.pendingEarnings,
        submittedJobs:
          safeRole === "creator" || safeRole === "admin"
            ? creator.stats.submittedJobs ?? 0
            : creator.stats.submittedJobs,
      },
      lastProfileUpdate: creator.lastProfileUpdate ?? seedProfileUpdatedAt,
      videos: normalizedVideos,
      warnings,
      banInfo,
    };
  };

  const [creators, setCreators] = useState<CreatorProfile[]>(() => {
    if (typeof window === "undefined") {
      return creatorsSeed.map(sanitizeCreator);
    }
    try {
      const raw = window.localStorage.getItem(CREATORS_STORAGE_KEY);
      if (!raw) {
        return creatorsSeed.map(sanitizeCreator);
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const byId = new Map<string, CreatorProfile>();
        creatorsSeed.forEach((creator) => byId.set(creator.id, sanitizeCreator(creator)));
        (parsed as CreatorProfile[]).forEach((creator) => {
          if (creator?.id) {
            byId.set(creator.id, sanitizeCreator(creator));
          }
        });
        return Array.from(byId.values());
      }
    } catch {
      /* noop */
    }
    return creatorsSeed.map(sanitizeCreator);
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    if (typeof window === "undefined") {
      return creatorsSeed[0].id;
    }
    try {
      const stored = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (stored) {
        return stored;
      }
    } catch {
      /* noop */
    }
    return creatorsSeed[0].id;
  });

  const [followMap, setFollowMap] = useState<FollowMap>(() => {
    if (typeof window === "undefined") {
      return buildFollowSeed();
    }
    try {
      const raw = window.localStorage.getItem(FOLLOW_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, string[]>;
        if (parsed && typeof parsed === "object") {
          const map: FollowMap = {};
          Object.entries(parsed).forEach(([key, value]) => {
            map[key] = new Set(Array.isArray(value) ? value : []);
          });
          return map;
        }
      }
    } catch {
      /* noop */
    }
    return buildFollowSeed();
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(CREATORS_STORAGE_KEY, JSON.stringify(creators));
  }, [creators]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const serialized = Object.fromEntries(
      Object.entries(followMap).map(([key, value]) => [key, Array.from(value)]),
    );
    window.localStorage.setItem(FOLLOW_STORAGE_KEY, JSON.stringify(serialized));
  }, [followMap]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    setFollowMap((prev) => {
      let changed = false;
      const next: FollowMap = { ...prev };
      creators.forEach(({ id }) => {
        if (!next[id]) {
          next[id] = new Set();
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [creators]);

  useEffect(() => {
    if (!creators.some((creator) => creator.id === currentUserId)) {
      const fallback = creators[0]?.id;
      if (fallback) {
        setCurrentUserId(fallback);
      }
    }
  }, [creators, currentUserId]);

  useEffect(() => {
    let cancelled = false;
    const loadProfiles = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, username, display_name, avatar_url, bio, role, focus, location");
      if (error) {
        console.error("Failed to fetch profiles", error);
        toast.error("Unable to load profiles from Supabase");
        return;
      }
      if (cancelled || !data) {
        return;
      }

      setCreators((prev) => {
        const byId = new Map(prev.map((creator) => [creator.id, creator]));

        data.forEach((row) => {
          const existing = byId.get(row.id);
          const role = (row.role as UserRole | null) ?? existing?.role ?? "creator";
          const username = row.username?.trim() || existing?.username || `user-${row.id.slice(0, 6)}`;
          const name = row.display_name?.trim() || existing?.name || username;
          const avatar = row.avatar_url?.trim() || existing?.avatar ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=B8DBD9`;
          const baseStats = existing?.stats ?? createDefaultStats(role);

          const updated: CreatorProfile = {
            id: row.id,
            name,
            username,
            email: existing?.email,
            role,
            avatar,
            bio: row.bio ?? existing?.bio ?? (role === "advertiser" ? "New advertiser on Ad Spark." : "New creator on Ad Spark."),
            focus: row.focus ?? existing?.focus,
            location: row.location ?? existing?.location,
            stats: baseStats,
            videos: existing?.videos ?? [],
            pinnedVideoIds: existing?.pinnedVideoIds ?? [],
            lastProfileUpdate: existing?.lastProfileUpdate ?? new Date().toISOString(),
            warnings: existing?.warnings ?? [],
            banInfo: existing?.banInfo ?? { isBanned: false },
          };

          byId.set(updated.id, updated);
        });

        return Array.from(byId.values());
      });
    };

    void loadProfiles();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadFollows = async () => {
      const { data, error } = await supabase.from("follows").select("follower_id, following_id");
      if (error) {
        console.error("Failed to fetch follows", error);
        toast.error("Unable to load follow data");
        return;
      }
      if (cancelled || !data) {
        return;
      }

      setFollowMap((prev) => {
        const next: FollowMap = { ...prev };
        data.forEach(({ follower_id, following_id }) => {
          if (!next[following_id]) {
            next[following_id] = new Set();
          }
          next[following_id]!.add(follower_id);
        });
        return next;
      });
    };

    void loadFollows();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizeUsername = useCallback((value: string) => value.trim().toLowerCase(), []);

  const isUsernameAvailable = useCallback(
    (username: string, excludeId?: string) => {
      const normalized = normalizeUsername(username);
      if (!normalized) {
        return false;
      }
      return !creators.some(
        (creator) => creator.id !== excludeId && normalizeUsername(creator.username) === normalized,
      );
    },
    [creators, normalizeUsername],
  );

  const currentUser = useMemo<CurrentUser>(() => {
    const base = creators.find((creator) => creator.id === currentUserId);
    if (!base) {
      throw new Error("Current user not found");
    }
    return { ...base };
  }, [creators, currentUserId]);

  const setUserRole = useCallback(
    (role: UserRole) => {
      let appliedRole: UserRole | null = null;
      setCreators((prev) =>
        prev.map((creator) => {
          if (creator.id !== currentUserId) {
            return creator;
          }

          const adminEmail = isAdminEmail(creator.email);
          const enforcedRole: UserRole = !adminEmail && role === "admin" ? creator.role : role;
          appliedRole = enforcedRole;

          return {
            ...creator,
            role: enforcedRole,
            stats:
              enforcedRole === "creator"
                ? { ...creator.stats, jobsPosted: creator.stats.jobsPosted ?? 0 }
                : {
                    ...creator.stats,
                    earnings: creator.stats.earnings,
                    pendingEarnings: creator.stats.pendingEarnings,
                  },
          };
        }),
      );

      if (!appliedRole) {
        return;
      }

      void (async () => {
        const { error } = await supabase
          .from("users")
          .update({ role: appliedRole, updated_at: new Date().toISOString() })
          .eq("id", currentUserId);
        if (error) {
          console.error("Failed to update role", error);
          toast.error("Unable to update role right now");
        }
      })();
    },
    [currentUserId],
  );

  const updateProfile = useCallback<UserContextValue["updateProfile"]>(
    (data) => {
      const trimmedName = data.name?.trim();
      const trimmedUsername = data.username?.trim();
      const trimmedAvatar = data.avatar?.trim();
      const trimmedBio = data.bio?.trim();

      if (trimmedUsername && !isUsernameAvailable(trimmedUsername, currentUserId)) {
        toast.error("Username is already taken");
        return;
      }

      const now = Date.now();
      const lastUpdate = currentUser.lastProfileUpdate ? new Date(currentUser.lastProfileUpdate).getTime() : 0;
      const isAdmin = isAdminEmail(currentUser.email);

      if (!isAdmin && lastUpdate && now - lastUpdate < ONE_WEEK_MS) {
        const remaining = ONE_WEEK_MS - (now - lastUpdate);
        const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
        toast.warning(`You can update your profile again in ${days} day${days === 1 ? "" : "s"}.`);
        return;
      }

      let hasChanges = false;
      const updates: Partial<CreatorProfile> = {};

      if (trimmedName && trimmedName !== currentUser.name) {
        updates.name = trimmedName;
        hasChanges = true;
      }

      const currentUsernameNormalized = currentUser.username.toLowerCase();

      if (trimmedUsername && trimmedUsername.toLowerCase() !== currentUsernameNormalized) {
        updates.username = trimmedUsername;
        hasChanges = true;
      }

      if (data.avatar !== undefined && trimmedAvatar !== currentUser.avatar) {
        updates.avatar = trimmedAvatar || currentUser.avatar;
        hasChanges = true;
      }

      if (data.bio !== undefined && trimmedBio !== currentUser.bio) {
        updates.bio = trimmedBio ?? "";
        hasChanges = true;
      }

      if (!hasChanges) {
        toast.info("No changes detected");
        return;
      }

      setCreators((prev) =>
        prev.map((creator) =>
          creator.id === currentUserId
            ? {
                ...creator,
                ...updates,
                lastProfileUpdate: new Date(now).toISOString(),
              }
            : creator,
        ),
      );

      const supabaseUpdate: Record<string, unknown> = {
        updated_at: new Date(now).toISOString(),
      };
      if (updates.name) {
        supabaseUpdate.display_name = updates.name;
      }
      if (updates.username) {
        supabaseUpdate.username = updates.username;
      }
      if (data.avatar !== undefined) {
        supabaseUpdate.avatar_url = updates.avatar ?? currentUser.avatar;
      }
      if (data.bio !== undefined) {
        supabaseUpdate.bio = updates.bio ?? "";
      }

      void (async () => {
        const { error } = await supabase
          .from("users")
          .update(supabaseUpdate)
          .eq("id", currentUserId);
        if (error) {
          console.error("Failed to update profile", error);
          toast.error("Unable to sync profile changes");
        }
      })();

      toast.success("Profile updated");
    },
    [currentUser, currentUserId, isUsernameAvailable],
  );

  const updatePinnedVideos = useCallback<UserContextValue["updatePinnedVideos"]>((videoIds) => {
    setCreators((prev) =>
      prev.map((creator) =>
        creator.id === currentUserId
          ? {
              ...creator,
              pinnedVideoIds: Array.from(new Set(videoIds)).slice(0, 3),
            }
          : creator,
      ),
    );
  }, [currentUserId]);

  const registerCreator = useCallback<UserContextValue["registerCreator"]>((payload) => {
    const id = payload.id ?? createId();
    const requestedRole = payload.role ?? "creator";
    const adminEmail = isAdminEmail(payload.email);
    const enforcedRole: UserRole = !adminEmail && requestedRole === "admin" ? "creator" : requestedRole;
    let desiredUsername = payload.username?.trim() || `user-${id.slice(0, 6)}`;

    if (!isUsernameAvailable(desiredUsername)) {
      const base = desiredUsername.replace(/\s+/g, "");
      let attempt = 1;
      let candidate = `${base}${attempt}`;
      while (!isUsernameAvailable(candidate)) {
        attempt++;
        candidate = `${base}${attempt}`;
      }
      desiredUsername = candidate;
    }

    const displayName = payload.name?.trim() || desiredUsername;
    const newCreator: CreatorProfile = {
      id,
      name: displayName,
      username: desiredUsername,
      email: payload.email,
      role: enforcedRole,
      avatar:
        payload.avatar ??
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=B8DBD9`,
      bio:
        payload.bio ??
        (enforcedRole === "creator" || enforcedRole === "admin"
          ? "New creator on Ad Spark."
          : "New advertiser on Ad Spark."),
      focus: payload.focus,
      location: payload.location,
      stats: {
        videos: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        earnings: enforcedRole === "creator" || enforcedRole === "admin" ? 0 : undefined,
        jobsPosted: enforcedRole === "advertiser" ? 0 : undefined,
        pendingEarnings: enforcedRole === "creator" || enforcedRole === "admin" ? 0 : undefined,
        submittedJobs: enforcedRole === "creator" || enforcedRole === "admin" ? 0 : undefined,
      },
      videos: [],
      pinnedVideoIds: [],
      lastProfileUpdate: new Date().toISOString(),
      warnings: [],
      banInfo: { isBanned: false },
    };

    setCreators((prev) => {
      const exists = prev.some((creator) => creator.id === id);
      if (exists) {
        return prev.map((creator) => (creator.id === id ? newCreator : creator));
      }
      return [...prev, newCreator];
    });
    setFollowMap((prev) => ({ ...prev, [id]: prev[id] ?? new Set() }));

    void (async () => {
      const { error } = await supabase
        .from("users")
        .upsert(
          {
            id,
            username: desiredUsername,
            display_name: displayName,
            avatar_url: newCreator.avatar,
            bio: newCreator.bio,
            role: enforcedRole,
            focus: newCreator.focus,
            location: newCreator.location,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );
      if (error) {
        console.error("Failed to upsert user profile", error);
        toast.error("Failed to sync profile with Supabase");
      }
    })();

    return newCreator;
  }, [isUsernameAvailable]);

  const toggleFollow = useCallback<UserContextValue["toggleFollow"]>(
    async (targetId) => {
      if (targetId === currentUserId) return;

      const isCurrentlyFollowing = Boolean(followMap[targetId]?.has(currentUserId));

      setFollowMap((prev) => {
        const next = { ...prev };
        const followers = new Set(next[targetId] ?? []);
        if (followers.has(currentUserId)) {
          followers.delete(currentUserId);
        } else {
          followers.add(currentUserId);
        }
        next[targetId] = followers;
        return next;
      });

      if (isCurrentlyFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .match({ follower_id: currentUserId, following_id: targetId });
        if (error) {
          console.error("Failed to unfollow", error);
          toast.error("Unable to unfollow right now");
          setFollowMap((prev) => {
            const next = { ...prev };
            const followers = new Set(next[targetId] ?? []);
            followers.add(currentUserId);
            next[targetId] = followers;
            return next;
          });
        }
      } else {
        const { error } = await supabase.from("follows").insert({
          follower_id: currentUserId,
          following_id: targetId,
        });
        if (error) {
          console.error("Failed to follow", error);
          toast.error("Unable to follow right now");
          setFollowMap((prev) => {
            const next = { ...prev };
            const followers = new Set(next[targetId] ?? []);
            followers.delete(currentUserId);
            next[targetId] = followers;
            return next;
          });
        }
      }
    },
    [currentUserId, followMap],
  );

  const deleteCreatorById = useCallback<UserContextValue["deleteCreatorById"]>((id) => {
    let removed: CreatorProfile | null = null;
    let nextCreators: CreatorProfile[] | null = null;

    setCreators((prev) => {
      const index = prev.findIndex((creator) => creator.id === id);
      if (index === -1) {
        return prev;
      }
      removed = prev[index];
      nextCreators = prev.filter((creator) => creator.id !== id);
      return nextCreators!;
    });

    if (!removed) {
      return null;
    }

    setFollowMap((prev) => {
      const next: FollowMap = {};
      Object.entries(prev).forEach(([key, followers]) => {
        if (key === id) {
          return;
        }
        const updated = new Set(followers);
        updated.delete(id);
        next[key] = updated;
      });
      return next;
    });

    setCurrentUserId((prevId) => {
      if (prevId === id) {
        if (nextCreators && nextCreators.length > 0) {
          return nextCreators[0].id;
        }
        return creatorsSeed[0]?.id ?? prevId;
      }
      return prevId;
    });

    void (async () => {
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) {
        console.error("Failed to delete user profile", error);
        toast.error("Unable to remove profile from Supabase");
      }
    })();

    return removed;
  }, []);

  const isFollowing = useCallback<UserContextValue["isFollowing"]>((targetId) => {
    return followMap[targetId]?.has(currentUserId) ?? false;
  }, [followMap, currentUserId]);

  const getFollowersCount = useCallback<UserContextValue["getFollowersCount"]>((targetId) => {
    return followMap[targetId]?.size ?? 0;
  }, [followMap]);

  const getFollowingCount = useCallback<UserContextValue["getFollowingCount"]>((sourceId) => {
    return Object.values(followMap).reduce((acc, followers) => (followers.has(sourceId) ? acc + 1 : acc), 0);
  }, [followMap]);

  const findCreatorByUsername = useCallback(
    (username: string) => {
      const normalized = normalizeUsername(username);
      return creators.find((creator) => normalizeUsername(creator.username) === normalized);
    },
    [creators, normalizeUsername],
  );

  const findCreatorById = useCallback((id: string) => creators.find((creator) => creator.id === id), [creators]);

  const deleteCreatorByUsername = useCallback<UserContextValue["deleteCreatorByUsername"]>(
    (username) => {
      const target = findCreatorByUsername(username.trim());
      if (!target) {
        return null;
      }
      return deleteCreatorById(target.id);
    },
    [deleteCreatorById, findCreatorByUsername],
  );

  const issueWarning = useCallback<UserContextValue["issueWarning"]>(
    (username, reason, issuedBy) => {
      const trimmedReason = reason.trim();
      if (!trimmedReason) {
        toast.error("Provide a reason for the warning");
        return false;
      }
      const target = findCreatorByUsername(username);
      if (!target) {
        toast.error("Account not found");
        return false;
      }

      const warning: CreatorWarning = {
        id: createId(),
        reason: trimmedReason,
        issuedAt: new Date().toISOString(),
        issuedBy,
      };

      setCreators((prev) =>
        prev.map((creator) =>
          creator.id === target.id
            ? {
                ...creator,
                warnings: [...creator.warnings, warning],
              }
            : creator,
        ),
      );

      toast.success(`Warning issued to @${target.username}`);
      return true;
    },
    [findCreatorByUsername],
  );

  const banAccount = useCallback<UserContextValue["banAccount"]>(
    (username, reason, bannedUntil = null, issuedBy) => {
      const target = findCreatorByUsername(username);
      if (!target) {
        toast.error("Account not found");
        return false;
      }

      setCreators((prev) =>
        prev.map((creator) =>
          creator.id === target.id
            ? {
                ...creator,
                banInfo: {
                  isBanned: true,
                  reason,
                  bannedUntil,
                  issuedAt: new Date().toISOString(),
                  issuedBy,
                },
              }
            : creator,
        ),
      );

      toast.success(`@${target.username} has been banned${bannedUntil ? " until " + new Date(bannedUntil).toLocaleDateString() : ""}`);
      return true;
    },
    [findCreatorByUsername],
  );

  const unbanAccount = useCallback<UserContextValue["unbanAccount"]>(
    (username) => {
      const target = findCreatorByUsername(username);
      if (!target) {
        toast.error("Account not found");
        return false;
      }

      setCreators((prev) =>
        prev.map((creator) =>
          creator.id === target.id
            ? {
                ...creator,
                banInfo: { isBanned: false },
              }
            : creator,
        ),
      );

      toast.success(`@${target.username} is no longer banned`);
      return true;
    },
    [findCreatorByUsername],
  );

  const deleteVideo = useCallback<UserContextValue["deleteVideo"]>(
    (username, videoId) => {
      const target = findCreatorByUsername(username);
      if (!target) {
        toast.error("Account not found");
        return false;
      }

      const hasVideo = target.videos.some((video) => video.id === videoId);
      if (!hasVideo) {
        toast.error("Video not found");
        return false;
      }

      setCreators((prev) =>
        prev.map((creator) => {
          if (creator.id !== target.id) {
            return creator;
          }

          const remainingVideos = creator.videos.filter((video) => video.id !== videoId);
          return {
            ...creator,
            videos: remainingVideos,
            pinnedVideoIds: creator.pinnedVideoIds.filter((id) => id !== videoId),
            stats: {
              ...creator.stats,
              videos: Math.max(0, remainingVideos.length),
            },
          };
        }),
      );

      toast.success("Video deleted");
      return true;
    },
    [findCreatorByUsername],
  );

  const banVideo = useCallback<UserContextValue["banVideo"]>(
    (username, videoId, reason, bannedUntil = null, issuedBy) => {
      const target = findCreatorByUsername(username);
      if (!target) {
        toast.error("Account not found");
        return false;
      }

      const hasVideo = target.videos.some((video) => video.id === videoId);
      if (!hasVideo) {
        toast.error("Video not found");
        return false;
      }

      setCreators((prev) =>
        prev.map((creator) => {
          if (creator.id !== target.id) {
            return creator;
          }

          const updatedVideos = creator.videos.map((video) =>
            video.id === videoId
              ? {
                  ...video,
                  banInfo: {
                    isBanned: true,
                    reason,
                    bannedUntil,
                    issuedAt: new Date().toISOString(),
                    issuedBy,
                  },
                }
              : video,
          );

          return {
            ...creator,
            videos: updatedVideos,
          };
        }),
      );

      toast.success("Video banned");
      return true;
    },
    [findCreatorByUsername],
  );

  const unbanVideo = useCallback<UserContextValue["unbanVideo"]>(
    (username, videoId) => {
      const target = findCreatorByUsername(username);
      if (!target) {
        toast.error("Account not found");
        return false;
      }

      const hasVideo = target.videos.some((video) => video.id === videoId);
      if (!hasVideo) {
        toast.error("Video not found");
        return false;
      }

      setCreators((prev) =>
        prev.map((creator) => {
          if (creator.id !== target.id) {
            return creator;
          }

          const updatedVideos = creator.videos.map((video) =>
            video.id === videoId
              ? {
                  ...video,
                  banInfo: { isBanned: false },
                }
              : video,
          );

          return {
            ...creator,
            videos: updatedVideos,
          };
        }),
      );

      toast.success("Video unbanned");
      return true;
    },
    [findCreatorByUsername],
  );

  const value = useMemo<UserContextValue>(
    () => ({
      currentUser,
      creators,
      isContentRequester: currentUser.role === "advertiser",
      setUserRole,
      updateProfile,
      updatePinnedVideos,
      registerCreator,
      setCurrentUserId,
      toggleFollow,
      isFollowing,
      getFollowersCount,
      getFollowingCount,
      findCreatorByUsername,
      findCreatorById,
      deleteCreatorById,
      deleteCreatorByUsername,
      issueWarning,
      banAccount,
      unbanAccount,
      deleteVideo,
      banVideo,
      unbanVideo,
    }),
    [
      currentUser,
      creators,
      setUserRole,
      updateProfile,
      updatePinnedVideos,
      registerCreator,
      setCurrentUserId,
      toggleFollow,
      isFollowing,
      getFollowersCount,
      getFollowingCount,
      findCreatorByUsername,
      findCreatorById,
      deleteCreatorById,
      deleteCreatorByUsername,
      issueWarning,
      banAccount,
      unbanAccount,
      deleteVideo,
      banVideo,
      unbanVideo,
    ],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
