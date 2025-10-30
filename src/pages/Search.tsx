import { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/context/UserContext";
import { Search as SearchIcon, Users, Film, ArrowRight, ArrowLeft } from "lucide-react";

export default function Search() {
  const { creators } = useUser();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const videosSectionRef = useRef<HTMLDivElement | null>(null);
  const usersSectionRef = useRef<HTMLDivElement | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const hasQuery = normalizedQuery.length > 0;

  const { filteredCreators, filteredVideos } = useMemo(() => {
    const matchText = (value?: string | null) =>
      value ? value.toLowerCase().includes(normalizedQuery) : false;

    const creatorsMatches = creators.filter((creator) => {
      if (!hasQuery) return true;
      return (
        matchText(creator.name) ||
        matchText(creator.username) ||
        matchText(creator.bio) ||
        matchText(creator.focus) ||
        matchText(creator.location)
      );
    });

    const videos = creators.flatMap((creator) =>
      creator.videos.map((video) => ({
        ...video,
        creatorId: creator.id,
        creatorName: creator.name,
        creatorUsername: creator.username,
        creatorAvatar: creator.avatar,
      })),
    );

    const videoMatches = videos.filter((video) => {
      if (!hasQuery) return true;
      return matchText(video.title);
    });

    return {
      filteredCreators: creatorsMatches,
      filteredVideos: videoMatches,
    };
  }, [creators, hasQuery, normalizedQuery]);

  const scrollTo = (target: "videos" | "users") => {
    const element = target === "videos" ? videosSectionRef.current : usersSectionRef.current;
    element?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  const renderEmptyState = (title: string, description: string) => (
    <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
      <SearchIcon className="h-6 w-6" />
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground/80">{description}</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pt-20 md:pt-0 md:pl-[clamp(12rem,12.5vw,16rem)]">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
          <header className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold md:text-4xl">Search</h1>
                <p className="text-sm text-muted-foreground">
                  Discover creators and explore their videos in one place.
                </p>
              </div>
              <div className="hidden gap-2 md:flex">
                <Button variant="outline" size="icon" onClick={() => scrollTo("videos")}
                  aria-label="Jump to videos results">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => scrollTo("users")}
                  aria-label="Jump to user results">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search creators or video titles..."
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 md:hidden">
              <Button variant="outline" className="flex-1" onClick={() => scrollTo("videos")}>
                Videos
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => scrollTo("users")}>
                Users
              </Button>
            </div>
          </header>

          <div className="overflow-hidden rounded-2xl border border-border/60">
            <div className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth bg-card">
              <section
                ref={videosSectionRef}
                className="flex w-full min-w-full snap-center flex-col gap-4 p-6 md:min-w-[640px] lg:min-w-[720px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Film className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Videos</h2>
                      <p className="text-sm text-muted-foreground">
                        {hasQuery ? "Matching results" : "Browse every video from our creators"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{filteredVideos.length}</Badge>
                </div>

                {filteredVideos.length === 0 ? (
                  renderEmptyState("No videos found", "Try a different keyword or check back later.")
                ) : (
                  <ScrollArea className="h-[420px]">
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
                                className="font-medium text-foreground hover:text-primary"
                                onClick={() => navigate(`/profile?view=${video.creatorUsername}`)}
                              >
                                @{video.creatorUsername}
                              </button>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex items-center justify-between gap-2">
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/profile?view=${video.creatorUsername}`)}
                            >
                              View creator
                            </Button>
                            <Button
                              className="gradient-primary text-white"
                              onClick={() => navigate(`/?video=${video.id}`)}
                            >
                              Watch
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
                className="flex w-full min-w-full snap-center flex-col gap-4 p-6 md:min-w-[640px] lg:min-w-[720px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Users</h2>
                      <p className="text-sm text-muted-foreground">
                        {hasQuery ? "People matching your search" : "Meet the creators and advertisers on Tikadds"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{filteredCreators.length}</Badge>
                </div>

                {filteredCreators.length === 0 ? (
                  renderEmptyState("No users found", "Try another name or username keyword.")
                ) : (
                  <ScrollArea className="h-[420px]">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {filteredCreators.map((creator) => (
                        <Card key={creator.id} className="border-border/60">
                          <CardHeader className="items-center text-center">
                            <div className="relative mb-3 h-20 w-20 overflow-hidden rounded-full border-4 border-primary/20">
                              <img src={creator.avatar} alt={creator.name} className="h-full w-full object-cover" />
                            </div>
                            <CardTitle className="text-lg">{creator.name}</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">@{creator.username}</CardDescription>
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
        </div>
      </main>
    </div>
  );
}
