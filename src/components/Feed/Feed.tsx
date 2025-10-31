import { useEffect, useMemo, useRef, useState } from "react";
import { VideoCard } from "./VideoCard";
import { Comments } from "../Comments/Comments";
import { CreatorProfileModal } from "./CreatorProfileModal";
import { useUser } from "@/context/UserContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "@/context/SearchContext";

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
    videoUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdnkwY3RxcXBocHNxcnk4OWl4MHRoYjR6anQwd3Z6bzM0bXRwdXZ4biZlcD12MV9naWZzX3NlYXJjaCZjdD1n/26tn3lRKHYk3RrC6A/giphy.mp4",
    username: "creativepro",
    description: "Check out this amazing product ad! 🚀 #advertising #creative",
    likes: 12500,
    comments: 342,
    shares: 89,
  },
  {
    id: "video-2",
    creatorId: "brand-master",
    videoUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmVqand2Zmt6NHl0dWs2YmlyNGZleXFtNXNvOTBwbmRieGpoOWI4cyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l0MYwONBGDS7aPGOk/giphy.mp4",
    username: "brandmaster",
    description: "New campaign for summer collection ☀️ What do you think?",
    likes: 8900,
    comments: 201,
    shares: 56,
  },
  {
    id: "video-3",
    creatorId: "ad-genius",
    videoUrl: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdmxrZ2FvY2ltcTY0a2p3Z3I4MGU5NTIyNGd6NWt1dnBpYmh6Y3FsUSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3ov9jNziFTMfzSumAw/giphy.mp4",
    username: "adgenius",
    description: "Behind the scenes of our latest shoot 🎬 #bts #production",
    likes: 15200,
    comments: 478,
    shares: 124,
  },
  {
    id: "video-4",
    creatorId: "spotlight-brand",
    videoUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExa2Rud2FzdTVkaTdpMW1lbmttb2hwMXN3bHhybGxsajd6YXZudWl2NSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o7btPCcdNniyf0ArS/giphy.mp4",
    username: "spotlight",
    description: "Spotlighting this week's most creative food collab. 🍜✨",
    likes: 7600,
    comments: 188,
    shares: 92,
  },
  {
    id: "video-5",
    creatorId: "creator-pro",
    videoUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWp0YzM0Z293NHJidXB3NDlsZ3F2MnRqNXA2dWtwYmN0M3NjdHF5ciZlcD12MV9naWZzX3NlYXJjaCZjdD1n/l0HlQ7LRalQpMtmsA/giphy.mp4",
    username: "creativepro",
    description: "Motion graphics concept for a tech-focused launch teaser.",
    likes: 11240,
    comments: 264,
    shares: 118,
  },
  {
    id: "video-6",
    creatorId: "ad-genius",
    videoUrl:
      "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMnVoOW1wemRrc2YrYWZnbzV1ajJkMzEyMXAxNjZvbTBnaWlpbnhqYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/26u4nJPf0JtQPdStq/giphy.mp4",
    username: "adgenius",
    description: "Looping GIF concepts for a high-energy sports brand sprint.",
    likes: 9800,
    comments: 236,
    shares: 134,
  },
];

export function Feed() {
  const { creators, findCreatorByUsername } = useUser();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoItem[]>(baseVideos);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(baseVideos[0]?.id ?? null);
  const { input: searchInput, setInput: setSearchInput, submit: submitSearch, clear } = useSearch();
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);
  const activeVideoRef = useRef<string | null>(baseVideos[0]?.id ?? null);
  const isMobile = useIsMobile();
  const commentsOpen = selectedVideo !== null;

  const creatorLookup = useMemo(() => {
    return creators.reduce<Record<string, typeof creators[number]>>((acc, creator) => {
      acc[creator.id] = creator;
      return acc;
    }, {});
  }, [creators]);

  useEffect(() => {
    activeVideoRef.current = activeVideoId;
  }, [activeVideoId]);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!activeVideoId && videos.length > 0) {
      setActiveVideoId(videos[0].id);
      activeVideoRef.current = videos[0].id;
    }
  }, [videos, activeVideoId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (!containerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      if (!isLoadingMoreRef.current && scrollTop + clientHeight >= scrollHeight - 200) {
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

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 2;
      const candidates = Array.from(
        containerRef.current.querySelectorAll<HTMLDivElement>("[data-video-id]"),
      );
      let closestId: string | null = null;
      let minDistance = Number.POSITIVE_INFINITY;
      candidates.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const elementCenter = rect.top + rect.height / 2;
        const distance = Math.abs(elementCenter - containerCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestId = element.dataset.videoId ?? null;
        }
      });

      if (closestId && closestId !== activeVideoRef.current) {
        activeVideoRef.current = closestId;
        setActiveVideoId(closestId);
      }
    };

    container.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const handleProfileOpen = (creatorId: string) => {
    setSelectedCreator(creatorId);
  };

  const toggleComments = (videoId: string) => {
    setSelectedVideo((current) => {
      const next = current === videoId ? null : videoId;
      if (next) {
        setActiveVideoId(next);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!commentsOpen) return;
    if (activeVideoId && selectedVideo !== activeVideoId) {
      setSelectedVideo(activeVideoId);
    }
  }, [commentsOpen, activeVideoId, selectedVideo]);

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
        <div className={cn("flex-1 min-h-0 flex flex-col", commentsOpen && !isMobile ? "md:pr-0" : "")}
        >
          <div className="hidden md:block border-b border-border/60 bg-background/85 px-6 py-5">
            <form
              className="flex items-center justify-between gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                const next = searchInput.trim();
                if (next.length === 0) {
                  clear();
                  navigate("/search");
                  return;
                }
                submitSearch(next);
                navigate(`/search?q=${encodeURIComponent(next)}`);
              }}
            >
              <div className="relative w-full max-w-xl">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search creators, campaigns, or videos"
                  className="w-full rounded-full border-border/60 bg-background/70 pl-11 pr-20 text-sm shadow-sm backdrop-blur"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-smooth hover:brightness-110"
                >
                  <SearchIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>

          <div
            ref={containerRef}
            className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide transition-smooth"
          >
            <div className="flex flex-col">
              {videos.map((video) => {
                const creator = creatorLookup[video.creatorId];
                if (!creator) return null;

                if (creator.banInfo?.isBanned) {
                  return (
                    <div
                      key={video.id}
                      data-video-id={video.id}
                      className="relative flex h-[calc(100vh-5rem)] min-h-[calc(100vh-5rem)] w-full snap-start items-center justify-center bg-background/90 text-center text-sm text-muted-foreground md:h-[100vh] md:min-h-[100vh]"
                    >
                      Creator content is unavailable.
                    </div>
                  );
                }

                return (
                  <VideoCard
                    key={video.id}
                    {...video}
                    creator={creator}
                    onCommentClick={toggleComments}
                    onProfileClick={() => handleProfileOpen(video.creatorId)}
                    dataVideoId={video.id}
                  />
                );
              })}
            </div>
          </div>
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
