import { createContext, useContext, useMemo, useState, ReactNode, useCallback } from "react";

export type UserRole = "creator" | "advertiser";

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
}

export type CurrentUser = CreatorProfile;

interface RegisterCreatorPayload {
  name: string;
  username: string;
  email?: string;
  avatar?: string;
  role?: UserRole;
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
  toggleFollow: (targetId: string) => void;
  isFollowing: (targetId: string) => boolean;
  getFollowersCount: (targetId: string) => number;
  getFollowingCount: (sourceId: string) => number;
  findCreatorByUsername: (username: string) => CreatorProfile | undefined;
  findCreatorById: (id: string) => CreatorProfile | undefined;
}

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
  },
];

type FollowMap = Record<string, Set<string>>;

const followSeed: FollowMap = {
  "creator-pro": new Set(["ad-genius", "brand-master"]),
  "ad-genius": new Set(["creator-pro"]),
  "brand-master": new Set(["creator-pro"]),
};

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [creators, setCreators] = useState<CreatorProfile[]>(creatorsSeed);
  const [currentUserId, setCurrentUserId] = useState<string>(creatorsSeed[0].id);
  const [followMap, setFollowMap] = useState<FollowMap>(() => {
    const map: FollowMap = {};
    creatorsSeed.forEach((creator) => {
      map[creator.id] = new Set(followSeed[creator.id] ?? []);
    });
    return map;
  });

  const currentUser = useMemo<CurrentUser>(() => {
    const base = creators.find((creator) => creator.id === currentUserId);
    if (!base) {
      throw new Error("Current user not found");
    }
    return { ...base };
  }, [creators, currentUserId]);

  const setUserRole = useCallback((role: UserRole) => {
    setCreators((prev) =>
      prev.map((creator) =>
        creator.id === currentUserId
          ? {
              ...creator,
              role,
              stats:
                role === "creator"
                  ? { ...creator.stats, jobsPosted: creator.stats.jobsPosted ?? 0 }
                  : {
                      ...creator.stats,
                      earnings: creator.stats.earnings,
                      pendingEarnings: creator.stats.pendingEarnings,
                    },
            }
          : creator,
      ),
    );
  }, [currentUserId]);

  const updateProfile = useCallback<UserContextValue["updateProfile"]>((data) => {
    setCreators((prev) =>
      prev.map((creator) =>
        creator.id === currentUserId
          ? {
              ...creator,
              ...data,
            }
          : creator,
      ),
    );
  }, [currentUserId]);

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
    const id = createId();
    const role = payload.role ?? "creator";
    const newCreator: CreatorProfile = {
      id,
      name: payload.name,
      username: payload.username,
      email: payload.email,
      role,
      avatar:
        payload.avatar ??
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(payload.name)}&backgroundColor=B8DBD9`,
      bio: role === "creator" ? "New creator on Ad Spark." : "New advertiser on Ad Spark.",
      stats: {
        videos: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        earnings: role === "creator" ? 0 : undefined,
        jobsPosted: role === "advertiser" ? 0 : undefined,
        pendingEarnings: role === "creator" ? 0 : undefined,
        submittedJobs: role === "creator" ? 0 : undefined,
      },
      videos: [],
      pinnedVideoIds: [],
    };

    setCreators((prev) => [...prev, newCreator]);
    setFollowMap((prev) => ({ ...prev, [id]: new Set() }));
    return newCreator;
  }, []);

  const toggleFollow = useCallback<UserContextValue["toggleFollow"]>((targetId) => {
    if (targetId === currentUserId) return;
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
  }, [currentUserId]);

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
    (username: string) => creators.find((creator) => creator.username === username),
    [creators],
  );

  const findCreatorById = useCallback((id: string) => creators.find((creator) => creator.id === id), [creators]);

  const value = useMemo<UserContextValue>(
    () => ({
      currentUser,
      creators,
      isContentRequester: currentUser.role !== "creator",
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
