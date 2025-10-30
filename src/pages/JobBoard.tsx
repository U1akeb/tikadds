import { useMemo, useState, ComponentType } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Briefcase,
  CalendarRange,
  Clock,
  DollarSign,
  Filter,
  Heart,
  MessageCircle,
  Share2,
  Users,
  Search as SearchIcon,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useJobs, JobPosting } from "@/context/JobContext";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/context/UserContext";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useSearch } from "@/context/SearchContext";

type SortOption =
  | "performance"
  | "likes"
  | "comments"
  | "shares"
  | "reward"
  | "deadline"
  | "recent";

const SORT_LABELS: Record<SortOption, string> = {
  performance: "Top performing",
  likes: "Most likes",
  comments: "Most comments",
  shares: "Most shares",
  reward: "Highest reward",
  deadline: "Closest deadline",
  recent: "Most recent",
};

export default function JobBoard() {
  const { jobs } = useJobs();
  const { currentUser } = useUser();
  const { input, setInput, submit, activeQuery, clear } = useSearch();
  const [sort, setSort] = useState<SortOption>("performance");
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const highlightId = searchParams.get("highlight");
  const normalizedQuery = activeQuery.trim().toLowerCase();

  const sortedJobs = useMemo(() => {
    const cloned = [...jobs];

    const performanceScore = (job: JobPosting) =>
      job.performance.likes * 1.2 + job.performance.comments * 0.8 + job.performance.shares * 0.9;

    const deadlineValue = (job: JobPosting) => new Date(job.deadline).getTime();

    cloned.sort((a, b) => {
      switch (sort) {
        case "likes":
          return b.performance.likes - a.performance.likes;
        case "comments":
          return b.performance.comments - a.performance.comments;
        case "shares":
          return b.performance.shares - a.performance.shares;
        case "reward":
          return b.reward - a.reward;
        case "deadline":
          return deadlineValue(a) - deadlineValue(b);
        case "recent":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "performance":
        default:
          return performanceScore(b) - performanceScore(a);
      }
    });

    return cloned;
  }, [jobs, sort]);

  const filteredJobs = useMemo(() => {
    if (!normalizedQuery) {
      return sortedJobs;
    }
    return sortedJobs.filter((job) => {
      const haystack = [
        job.title,
        job.description,
        job.requesterName,
        job.requesterRole,
        ...job.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [sortedJobs, normalizedQuery]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  const handleClearSearch = () => {
    clear();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pt-20 md:pt-0 md:pl-[clamp(12rem,12.5vw,16rem)]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold md:text-4xl">Campaign Job Board</h1>
              <p className="text-muted-foreground mt-2">
                Discover briefs from advertisers and viewers looking for fresh video content.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center md:justify-end md:gap-4">
              <form
                className="relative w-full md:w-64"
                onSubmit={handleSearchSubmit}
                role="search"
              >
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Search jobs"
                  className="w-full rounded-full bg-background/70 pl-9 pr-9 text-sm"
                />
                {normalizedQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  aria-label="Search job board"
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
                >
                  <SearchIcon className="h-3.5 w-3.5" />
                </button>
              </form>

              <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort jobs" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                    <SelectItem key={option} value={option}>
                      {SORT_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => navigate(currentUser.role === "creator" ? "/upload" : "/create-job")}
              >
                {currentUser.role === "creator" ? "Submit a Video" : "Create a Job"}
              </Button>
            </div>
          </header>

          <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filteredJobs.length === 0 ? (
              <div className="col-span-full flex h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-border/60 bg-muted/10 text-center text-sm text-muted-foreground">
                <SearchIcon className="h-6 w-6" />
                No jobs match “{activeQuery}”. Try another search term.
                <Button variant="ghost" size="sm" onClick={handleClearSearch}>
                  Reset search
                </Button>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onSelect={setSelectedJob}
                  isHighlighted={highlightId === job.id}
                />
              ))
            )}
          </section>
        </div>
      </main>

      <JobDetailModal job={selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)} />
    </div>
  );
}

function JobCard({
  job,
  onSelect,
  isHighlighted,
}: {
  job: JobPosting;
  onSelect: (job: JobPosting) => void;
  isHighlighted: boolean;
}) {
  const primaryMedia = job.media[0];
  const deadlineIn = formatDistanceToNow(new Date(job.deadline), { addSuffix: true });
  const slotsRemaining = Math.max(job.submissionsLimit - job.submissionsCount, 0);

  return (
    <Card
      className={cn(
        "group h-full cursor-pointer border-border/60 transition-smooth hover:-translate-y-1 hover:shadow-card",
        isHighlighted && "ring-2 ring-secondary"
      )}
      onClick={() => onSelect(job)}
    >
      <CardHeader className="space-y-4">
        <div className="relative h-40 overflow-hidden rounded-xl border border-border/50">
          {primaryMedia ? (
            primaryMedia.type === "image" ? (
              <img src={primaryMedia.url} alt={job.title} className="h-full w-full object-cover" />
            ) : (
              <video
                src={primaryMedia.url}
                poster={primaryMedia.thumbnail}
                className="h-full w-full object-cover"
                muted
                loop
                autoPlay
              />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
              <Briefcase className="h-10 w-10" />
            </div>
          )}
          <Badge className="absolute right-3 top-3 bg-background/80 text-xs font-semibold backdrop-blur">
            {job.tags[0] ?? "brief"}
          </Badge>
        </div>
        <div>
          <CardTitle className="text-xl leading-tight">{job.title}</CardTitle>
          <CardDescription className="mt-1 flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            {job.requesterName} · {job.requesterRole}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>

        <div className="grid grid-cols-3 gap-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Stat icon={Heart} label="Likes" value={job.performance.likes} />
          <Stat icon={MessageCircle} label="Comments" value={job.performance.comments} />
          <Stat icon={Share2} label="Shares" value={job.performance.shares} />
        </div>

        <Separator />

        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4 text-secondary" /> Reward
            </span>
            <strong>${job.reward.toLocaleString()}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" /> Due
            </span>
            <span className="font-medium">{deadlineIn}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4 text-accent" /> Submissions
            </span>
            <span className="font-medium">
              {job.submissionsCount}/{job.submissionsLimit} ({slotsRemaining} left)
            </span>
          </div>
        </div>

        <Button
          className="w-full gradient-primary text-white"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(job);
          }}
        >
          Submit Video
        </Button>
      </CardContent>
    </Card>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon className="h-5 w-5" />
      <span>{value.toLocaleString()}</span>
      <span>{label}</span>
    </div>
  );
}

function JobDetailModal({
  job,
  onOpenChange,
}: {
  job: JobPosting | null;
  onOpenChange: (open: boolean) => void;
}) {
  const open = Boolean(job);
  if (!job) return null;

  const deadlineText = formatDistanceToNow(new Date(job.deadline), { addSuffix: true });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-hidden p-0">
        <DialogHeader className="p-6 pb-3 text-left">
          <DialogTitle className="text-2xl font-semibold">{job.title}</DialogTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{job.requesterName}</span>
            <Badge variant="secondary" className="capitalize">
              {job.requesterRole}
            </Badge>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh]">
          <div className="space-y-6 px-6 pb-6">
            <div className="grid gap-4 md:grid-cols-2">
              {job.media.map((media) => (
                <div key={media.id} className="overflow-hidden rounded-xl border border-border/60">
                  {media.type === "image" ? (
                    <img src={media.url} alt={job.title} className="h-full w-full object-cover" />
                  ) : (
                    <video src={media.url} className="h-full w-full object-cover" controls poster={media.thumbnail} />
                  )}
                </div>
              ))}
              {job.media.length === 0 && (
                <div className="col-span-2 flex h-48 items-center justify-center rounded-xl border border-dashed border-border/60 text-muted-foreground">
                  No reference media provided
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Brief</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{job.description}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <InfoBlock icon={DollarSign} label="Reward" value={`$${job.reward.toLocaleString()}`} />
              <InfoBlock icon={CalendarRange} label="Deadline" value={deadlineText} />
              <InfoBlock
                icon={Users}
                label="Submissions"
                value={`${job.submissionsCount}/${job.submissionsLimit}`}
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="capitalize">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>

            <Button className="w-full gradient-primary text-white">Submit Video</Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function InfoBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}
