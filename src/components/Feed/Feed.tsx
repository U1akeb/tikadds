import { useEffect, useMemo, useRef, useState } from "react";
import { VideoCard } from "./VideoCard";
import { Comments } from "../Comments/Comments";
import { CreatorProfileModal } from "./CreatorProfileModal";
import { useUser } from "@/context/UserContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search as SearchIcon, Users, Film, ArrowLeft, ArrowRight } from "lucide-react";
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
  const { input: searchInput, setInput: setSearchInput, activeQuery, submit: submitSearch } = useSearch();
  const containerRef = useRef<HTMLDivElement>(null);
  const isLoadingMoreRef = useRef(false);
  const activeVideoRef = useRef<string | null>(baseVideos[0]?.id ?? null);
  const videosSectionRef = useRef<HTMLDivElement | null>(null);
  const usersSectionRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();
  const commentsOpen = selectedVideo !== null;

  const creatorLookup = useMemo(() => {
    return creators.reduce<Record<string, typeof creators[number]>>((acc, creator) => {
      acc[creator.id] = creator;
      return acc;
    }, {});
  }, [creators]);

  const normalizedQuery = activeQuery.trim().toLowerCase();
  const hasQuery = normalizedQuery.length > 0;

  const { filteredCreators, filteredVideos } = useMemo(() => {
    const matchText = (value?: string | null) =>
      value ? value.toLowerCase().includes(normalizedQuery) : false;

    const creatorMatches = creators.filter((creator) => {
      if (!hasQuery) return true;
      return (
        matchText(creator.name) ||
        matchText(creator.username) ||
        matchText(creator.bio) ||
        matchText(creator.focus) ||
        matchText(creator.location)
      );
    });

    const searchVideos = creators.flatMap((creator) =>
      creator.videos.map((video) => ({
        ...video,
        creatorId: creator.id,
        creatorName: creator.name,
        creatorUsername: creator.username,
      })),
    );

    const videoMatches = searchVideos.filter((video) => {
      if (!hasQuery) return true;
      return matchText(video.title);
    });

    return {
      filteredCreators: creatorMatches,
      filteredVideos: videoMatches,
    };
  }, [creators, hasQuery, normalizedQuery]);

  const scrollToSection = (target: "videos" | "users") => {
    const element = target === "videos" ? videosSectionRef.current : usersSectionRef.current;
    element?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  const renderEmptyState = (title: string, description: string) => (
    <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
      <SearchIcon className="h-6 w-6" />
      <p className="text-sm font-medium">{title}</p>
      <p className="px-6 text-center text-xs text-muted-foreground/80">{description}</p>
    </div>
  );

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
        <div
          ref={containerRef}
          className={cn(
            "flex-1 overflow-y-scroll scrollbar-hide transition-smooth min-h-0",
            commentsOpen && !isMobile ? "md:pr-0" : "",
          )}
        >
          <div className="mx-auto w-full px-4 pb-10">
            <div className="hidden md:block">
              <div className="sticky top-0 z-30 -mx-4 mb-6 border-b border-border/60 bg-background/55 px-4 py-5 backdrop-blur">
                <form
                  className="relative flex items-center gap-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitSearch();
                  }}
                >
                  <div className="relative flex-1">
                    <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchInput}
                      onChange={(event) => {
                        const value = event.target.value;
                        setSearchInput(value);
                        submitSearch(value);
                      }}
                      placeholder="Search creators or video titles..."
                      className="w-full rounded-full border-border/60 bg-background/70 pl-11 pr-16 text-sm shadow-md shadow-black/10 backdrop-blur transition-smooth"
                    />
                    <button
                      type="submit"
                      aria-label="Search"
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-smooth hover:brightness-110"
                    >
                      <SearchIcon className="h-4 w-4" />
                    </button>
                  </div>
                </form>
                {!hasQuery && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Start typing to explore creators, videos and collaborations.
                  </p>
                )}
              </div>
            </div>

            {hasQuery && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-border/60 bg-card">
                  <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 text-xs text-muted-foreground">
                    <span className="font-medium">Swipe sideways to browse videos or users</span>
                    <div className="hidden gap-2 md:flex">
                      <Button variant="outline" size="icon" onClick={() => scrollToSection("videos")}>
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => scrollToSection("users")}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth">
                    <section
                      ref={videosSectionRef}
                      className="flex w-full min-w-full snap-center flex-col gap-4 p-5 md:min-w-[560px]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Film className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold">Videos</h2>
                            <p className="text-xs text-muted-foreground">
                              {filteredVideos.length} matching result{filteredVideos.length === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">{filteredVideos.length}</Badge>
                      </div>

                      {filteredVideos.length === 0 ? (
                        renderEmptyState("No videos found", "Try another keyword or check back later.")
                      ) : (
                        <ScrollArea className="h-[360px]">
                          <div className="grid gap-4 sm:grid-cols-2">
                            {filteredVideos.map((video) => (
                              <Card key={`${video.creatorId}-${video.id}`} className="overflow-hidden border-border/60">
                                <div className="relative aspect-video overflow-hidden">
                                  <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" />
                                </div>
                                <CardHeader className="space-y-2">
                                  <CardTitle className="text-base font-semibold leading-tight line-clamp-2">
                                    {video.title}
                                  </CardTitle>
                                  <CardDescription className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <button
                                      type="button"
                                      className="font-medium text-foreground transition-colors hover:text-primary"
                                      onClick={() => navigate(`/profile?view=${video.creatorUsername}`)}
                                    >
                                      @{video.creatorUsername}
                                    </button>
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <Button
                                    className="w-full gradient-primary text-white"
                                    onClick={() => navigate(`/profile?view=${video.creatorUsername}`)}
                                  >
                                    View profile
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </section>

                    <section
                      ref={usersSectionRef}
                      className="flex w-full min-w-full snap-center flex-col gap-4 p-5 md:min-w-[560px]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold">Users</h2>
                            <p className="text-xs text-muted-foreground">
                              {filteredCreators.length} match{filteredCreators.length === 1 ? "" : "es"}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">{filteredCreators.length}</Badge>
                      </div>

                      {filteredCreators.length === 0 ? (
                        renderEmptyState("No users found", "Try searching a different name or username.")
                      ) : (
                        <ScrollArea className="h-[360px]">
                          <div className="grid gap-4 sm:grid-cols-2">
                            {filteredCreators.map((creator) => (
                              <Card key={creator.id} className="border-border/60">
                                <CardHeader className="items-center text-center">
                                  <div className="relative mb-3 h-20 w-20 overflow-hidden rounded-full border-4 border-primary/20">
                                    <img src={creator.avatar} alt={creator.name} className="h-full w-full object-cover" />
                                  </div>
                                  <CardTitle className="text-lg">{creator.name}</CardTitle>
                                  <CardDescription className="text-sm text-muted-foreground">
                                    @{creator.username}
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm text-muted-foreground">
                                  {creator.focus && (
                                    <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wide">
                                      <Badge variant="outline">{creator.focus}</Badge>
                                    </div>
                                  )}
                                  <p className="line-clamp-3 text-center text-muted-foreground/90">{creator.bio}</p>
                                  <Button
                                    className="w-full gradient-primary text-white"
                                    onClick={() => navigate(`/profile?view=${creator.username}`)}
                                  >
                                    View profile
                                  </Button>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </section>
                  </div>
              </div>
            )}
          </div>

          <div className="flex flex-col snap-y snap-mandatory">
            {videos.map((video) => {
              const creator = creatorLookup[video.creatorId];
              if (!creator) return null;

              if (creator.banInfo?.isBanned) {
                return (
                  <div
                    key={video.id}
                    data-video-id={video.id}
                    className="relative flex h-full min-h-[calc(100vh-5rem)] w-full snap-start snap-always items-center justify-center bg-background/90 text-center text-sm text-muted-foreground md:h-screen md:min-h-0"
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
