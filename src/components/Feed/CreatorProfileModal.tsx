import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreatorProfile } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface CreatorProfileModalProps {
  creator: CreatorProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatorProfileModal({ creator, open, onOpenChange }: CreatorProfileModalProps) {
  const navigate = useNavigate();
  const { sessionMode } = useAuth();

  if (!creator) {
    return null;
  }

  const pinnedVideos = creator.pinnedVideoIds
    .map((id) => creator.videos.find((video) => video.id === id))
    .filter((video): video is NonNullable<typeof video> => Boolean(video));

  const handleViewProfile = () => {
    if (sessionMode === "guest") {
      toast.info("Sign in to view full profiles");
      navigate("/login");
      onOpenChange(false);
      return;
    }
    navigate(`/profile?view=${creator.username}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg overflow-hidden p-0">
        <DialogHeader className="p-6 pb-3 text-left">
          <DialogTitle className="text-2xl font-bold">{creator.name}</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>@{creator.username}</span>
            <Badge variant="secondary" className="capitalize">
              {creator.role}
            </Badge>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 px-6 pb-6">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-primary/20">
                <img src={creator.avatar} alt={creator.name} className="h-full w-full object-cover" />
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed">
                {creator.bio}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Stat label="Videos" value={creator.stats.videos ?? 0} />
              <Stat label="Likes" value={creator.stats.likes ?? 0} />
              <Stat label="Shares" value={creator.stats.shares ?? 0} />
              <Stat label="Comments" value={creator.stats.comments ?? 0} />
            </div>

            {creator.stats.earnings !== undefined && (
              <StatCard
                title="Total Earnings"
                value={`$${creator.stats.earnings.toLocaleString()}`}
                description={`Pending: $${(creator.stats.pendingEarnings ?? 0).toLocaleString()}`}
              />
            )}

            {creator.stats.jobsPosted !== undefined && creator.stats.jobsPosted > 0 && (
              <StatCard
                title="Jobs Posted"
                value={creator.stats.jobsPosted}
                description="Open collaborations available"
              />
            )}

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {creator.focus && <Badge variant="outline">Focus: {creator.focus}</Badge>}
              {creator.location && <Badge variant="outline">{creator.location}</Badge>}
            </div>

            {pinnedVideos.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Pinned Videos
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {pinnedVideos.map((video, index) => (
                    <div key={video.id} className="relative overflow-hidden rounded-xl border border-border/60">
                      <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" />
                      <span className="absolute left-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-xs font-semibold">
                        #{index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button className="w-full gradient-primary text-white" onClick={handleViewProfile}>
              View Full Profile
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border p-4 text-center">
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string | number;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
      {description && <div className="text-xs text-muted-foreground mt-1">{description}</div>}
    </div>
  );
}
