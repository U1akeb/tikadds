import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, Film, Users } from "lucide-react";
import { useSearch } from "@/context/SearchContext";
import { useUser } from "@/context/UserContext";

function renderEmptyState(title: string, description: string) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
      <SearchIcon className="h-6 w-6" />
      <p className="text-sm font-medium">{title}</p>
      <p className="px-6 text-center text-xs text-muted-foreground/80">{description}</p>
    </div>
  );
}

export default function Search() {
  const { input, setInput, submit, activeQuery, clear } = useSearch();
  const { creators } = useUser();
  const navigate = useNavigate();

  const normalizedQuery = activeQuery.trim().toLowerCase();
  const hasQuery = normalizedQuery.length > 0;

  const { filteredCreators, filteredVideos } = useMemo(() => {
    const matchText = (value?: string | null) => (value ? value.toLowerCase().includes(normalizedQuery) : false);

    const creatorMatches = creators.filter((creator) => {
      if (!hasQuery) return false;
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
      if (!hasQuery) return false;
      return matchText(video.title) || matchText(video.creatorName);
    });

    return {
      filteredCreators: creatorMatches,
      filteredVideos: videoMatches,
    };
  }, [creators, hasQuery, normalizedQuery]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = input.trim();
    if (!next) {
      clear();
      navigate("/search");
      return;
    }
    submit(next);
    navigate(`/search?q=${encodeURIComponent(next)}`);
  };

  const handleClear = () => {
    clear();
    navigate("/search");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pt-20 md:pt-0 md:pl-[clamp(12rem,12.5vw,16rem)]">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
          <header className="space-y-4">
            <h1 className="text-3xl font-bold md:text-4xl">Search results</h1>
            <form className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4" onSubmit={handleSubmit}>
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Search creators, campaigns, or videos"
                  className="w-full rounded-full border-border/60 bg-background/70 pl-11 pr-24 text-sm shadow-sm backdrop-blur"
                />
                {input && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-12 top-1/2 -translate-y-1/2 text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                >
                  <SearchIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </header>

          {!hasQuery ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-border/60 bg-muted/10 text-center">
              <SearchIcon className="h-8 w-8 text-muted-foreground" />
              <p className="text-base font-semibold">Find creators and campaigns faster</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Enter a keyword to see matching videos, creators, and collaborations available on Tikadds.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Film className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold">Videos</h2>
                      <p className="text-xs text-muted-foreground">{filteredVideos.length} match{filteredVideos.length === 1 ? "" : "es"}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{filteredVideos.length}</Badge>
                </div>

                {filteredVideos.length === 0 ? (
                  renderEmptyState("No videos found", "Try another keyword or check back later.")
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {filteredVideos.map((video) => (
                      <Card key={`${video.creatorId}-${video.id}`} className="overflow-hidden border-border/60">
                        <div className="relative aspect-video overflow-hidden">
                          <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" />
                        </div>
                        <CardHeader className="space-y-2">
                          <CardTitle className="line-clamp-2 text-base font-semibold leading-tight">{video.title}</CardTitle>
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
                )}
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                      <Users className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold">Creators</h2>
                      <p className="text-xs text-muted-foreground">{filteredCreators.length} match{filteredCreators.length === 1 ? "" : "es"}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{filteredCreators.length}</Badge>
                </div>

                {filteredCreators.length === 0 ? (
                  renderEmptyState("No creators found", "Try searching a different name or brand.")
                ) : (
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
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
