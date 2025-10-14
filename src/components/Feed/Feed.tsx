import { useEffect, useMemo, useRef, useState } from "react";
import { VideoCard } from "./VideoCard";
import { Comments } from "../Comments/Comments";
import { CreatorProfileModal } from "./CreatorProfileModal";
import { useUser } from "@/context/UserContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface VideoItem {
  id: string;
  creatorId: string;
  videoUrl: string;
  username: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
}

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const baseVideos: VideoItem[] = [
  {
    id: "video-1",
    creatorId: "creator-pro",
    videoUrl: "https://cdn.coverr.co/videos/coverr-a-beautiful-river-6767/1080p.mp4",
    username: "creativepro",
    description: "Check out this amazing product ad! 🚀 #advertising #creative",
    likes: 12500,
    comments: 342,
    shares: 89,
  },
  {
    id: "video-2",
    creatorId: "brand-master",
    videoUrl: "https://cdn.coverr.co/videos/coverr-city-skyscrapers-1582/1080p.mp4",
    username: "brandmaster",
    description: "New campaign for summer collection ☀️ What do you think?",
    likes: 8900,
    comments: 201,
    shares: 56,
  },
  {
    id: "video-3",
    creatorId: "ad-genius",
    videoUrl: "https://cdn.coverr.co/videos/coverr-camera-pan-over-mountains-8230/1080p.mp4",
    username: "adgenius",
    description: "Behind the scenes of our latest shoot 🎬 #bts #production",
    likes: 15200,
    comments: 478,
    shares: 124,
  },
];

export function Feed() {
  const { creators, findCreatorByUsername } = useUser();
  const [videos, setVideos] = useState<VideoItem[]>(baseVideos);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);
  const isMobile = useIsMobile();
  const commentsOpen = selectedVideo !== null;

  const creatorLookup = useMemo(() => {
    return creators.reduce<Record<string, typeof creators[number]>>((acc, creator) => {
      acc[creator.id] = creator;
      return acc;
    }, {});
  }, [creators]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!containerRef.current || isLoadingMoreRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        isLoadingMoreRef.current = true;
        setTimeout(() => {
          setVideos((prev) => {
            const startIndex = prev.length;
            const nextBatch = Array.from({ length: 3 }, (_, index) => {
              const source = baseVideos[index % baseVideos.length];
              return {
                ...source,
                id: `${source.id}-${startIndex + index}-${createId()}`,
                likes: Math.max(1000, source.likes + Math.floor(Math.random() * 5000)),
                comments: Math.max(100, source.comments + Math.floor(Math.random() * 300)),
                shares: Math.max(50, source.shares + Math.floor(Math.random() * 150)),
              };
            });
            return [...prev, ...nextBatch];
          });
          isLoadingMoreRef.current = false;
        }, 400);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const handleProfileOpen = (creatorId: string) => {
    setSelectedCreator(creatorId);
  };

  const toggleComments = (videoId: string) => {
    setSelectedVideo((current) => (current === videoId ? null : videoId));
  };

  const handleCommentProfileNavigate = (username: string) => {
    const creator = findCreatorByUsername(username);
    if (!creator) {
      return;
    }
    setSelectedCreator(creator.id);
  };

  const activeCreator = selectedCreator ? creatorLookup[selectedCreator] ?? null : null;

  return (
    <>
      <div className="flex h-[calc(100vh-5rem)] flex-col transition-smooth md:h-screen md:flex-row md:gap-6">
        <div
          ref={containerRef}
          className={cn(
            "flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide transition-smooth min-h-0",
            commentsOpen && !isMobile ? "md:pr-0" : "",
          )}
        >
          {videos.map((video) => {
            const creator = creatorLookup[video.creatorId];
            if (!creator) return null;

            return (
              <VideoCard
                key={video.id}
                {...video}
                creator={creator}
                onCommentClick={toggleComments}
                onProfileClick={() => handleProfileOpen(video.creatorId)}
              />
            );
          })}
        </div>

        <Comments
          isOpen={commentsOpen}
          onClose={() => setSelectedVideo(null)}
          videoId={selectedVideo || ""}
          onProfileNavigate={handleCommentProfileNavigate}
        />
      </div>

      <CreatorProfileModal
        creator={activeCreator}
        open={selectedCreator !== null && !!activeCreator}
        onOpenChange={(open) => {
          if (!open) setSelectedCreator(null);
        }}
      />
    </>
  );
}
