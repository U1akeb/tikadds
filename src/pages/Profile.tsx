import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  MessageCircle,
  PenLine,
  UploadCloud,
  Video,
  Heart,
  Share2,
  MessageSquare,
  DollarSign,
  Briefcase,
  Users,
  UserPlus,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useUser, UserRole, CreatorStats, CreatorVideo, CreatorProfile } from "@/context/UserContext";
import { useJobs } from "@/context/JobContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BASE_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "creator", label: "Creator" },
  { value: "advertiser", label: "Advertiser" },
];

const chatThread = [
  {
    id: "1",
    author: "You",
    message: "Hey! I love your latest product trailer. I'd like to commission something similar.",
    timestamp: "2m ago",
  },
  {
    id: "2",
    author: "Creative Pro",
    message: "Thanks! Happy to collaborate. Do you have a brief or mood board ready?",
    timestamp: "1m ago",
  },
];

export default function Profile() {
  const [searchParams] = useSearchParams();
  const viewUsername = searchParams.get("view");
  const navigate = useNavigate();
  const {
    currentUser,
    setUserRole,
    findCreatorByUsername,
    toggleFollow,
    isFollowing,
    getFollowersCount,
    getFollowingCount,
    deleteCreatorById,
  } = useUser();
  const { authUser, isAdmin, sessionMode, deleteAccountByCreatorId } = useAuth();
  const { jobs } = useJobs();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const profileUser = viewUsername ? findCreatorByUsername(viewUsername) ?? currentUser : currentUser;
  const isOwnProfile = profileUser.id === currentUser.id;

  useEffect(() => {
    if (sessionMode === "guest" && !authUser && !viewUsername) {
      toast.info("Sign in to access your profile");
      navigate("/login");
    }
  }, [sessionMode, authUser, viewUsername, navigate]);

  const requesterJobs = useMemo(
    () => jobs.filter((job) => job.requesterId === profileUser.id),
    [jobs, profileUser.id]
  );

  const stats = profileUser.stats;
  const isCreator = profileUser.role === "creator";
  const pinnedVideos = useMemo(
    () =>
      profileUser.pinnedVideoIds
        .map((id) => profileUser.videos.find((video) => video.id === id))
        .filter((video): video is CreatorVideo => Boolean(video)),
    [profileUser],
  );
  const availableVideos = profileUser.videos;
  const followersCount = getFollowersCount(profileUser.id);
  const followingCount = getFollowingCount(profileUser.id);
  const alreadyFollowing = !isOwnProfile && isFollowing(profileUser.id);
  const roleOptions = useMemo(() => {
    if (isAdmin) {
      return [...BASE_ROLE_OPTIONS, { value: "admin", label: "Admin" }];
    }
    return BASE_ROLE_OPTIONS;
  }, [isAdmin]);

  const handleFollowToggle = () => {
    if (!authUser) {
      toast.info("Sign in to follow creators");
      navigate("/login");
      return;
    }
    void toggleFollow(profileUser.id);
  };

  const handleAdminDeleteAccount = () => {
    if (!isAdmin || isOwnProfile) return;
    const confirmed = window.confirm(`Delete @${profileUser.username}'s account? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    const removed = deleteCreatorById(profileUser.id);
    if (!removed) {
      toast.error("Unable to delete this account");
      return;
    }

    deleteAccountByCreatorId(profileUser.id);
    toast.success(`Deleted @${profileUser.username}`);
    navigate("/");
  };

  const showMessageButton = !isOwnProfile;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pt-20 md:pt-0 md:pl-[clamp(12rem,12.5vw,16rem)]">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
          <Card className="border-border/60">
            <CardContent className="flex flex-col gap-6 py-6 md:flex-row md:gap-10">
              <div className="relative flex-shrink-0">
                <div className="h-28 w-28 overflow-hidden rounded-3xl border-4 border-primary/20 md:h-32 md:w-32">
                  <img src={profileUser.avatar} alt={profileUser.name} className="h-full w-full object-cover" />
                </div>
                <BadgeCheck className="absolute -right-2 -bottom-2 h-8 w-8 text-primary" />
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold md:text-4xl">{profileUser.name}</h1>
                    <p className="text-muted-foreground">@{profileUser.username}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="capitalize">{profileUser.role}</Badge>
                    {profileUser.focus && <Badge variant="outline">{profileUser.focus}</Badge>}
                    {profileUser.location && <Badge variant="outline">{profileUser.location}</Badge>}
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">{profileUser.bio}</p>

                <div className="flex flex-wrap gap-3">
                  {isOwnProfile && (
                    <Select value={profileUser.role} onValueChange={(value) => setUserRole(value as UserRole)}>
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {isOwnProfile && profileUser.role === "creator" && (
                    <Button onClick={() => navigate("/upload")} className="gradient-primary text-white">
                      <UploadCloud className="mr-2 h-4 w-4" /> Upload new video
                    </Button>
                  )}

                  {isOwnProfile && profileUser.role !== "creator" && (
                    <Button onClick={() => navigate("/create-job")} className="gradient-primary text-white">
                      <Briefcase className="mr-2 h-4 w-4" /> Create job
                    </Button>
                  )}

                  {showMessageButton && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant={alreadyFollowing ? "secondary" : "default"}
                        className={alreadyFollowing ? "bg-muted text-foreground" : "gradient-primary text-white"}
                        onClick={handleFollowToggle}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        {alreadyFollowing ? "Following" : "Follow"}
                      </Button>
                      <Button variant="outline" onClick={() => setIsChatOpen(true)}>
                        <MessageCircle className="mr-2 h-4 w-4" /> Message
                      </Button>
                      {isAdmin && (
                        <Button variant="destructive" onClick={handleAdminDeleteAccount}>
                          Delete account
                        </Button>
                      )}
                    </div>
                  )}

                  {isOwnProfile && (
                    <Button variant="ghost" onClick={() => setIsEditOpen(true)}>
                      <PenLine className="mr-2 h-4 w-4" /> Edit profile
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <StatsGrid
            stats={stats}
            role={profileUser.role}
            followersCount={followersCount}
            followingCount={followingCount}
          />

          <Tabs defaultValue={isCreator ? "videos" : "jobs"}>
            <TabsList className="mb-4">
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
            </TabsList>

            <TabsContent value="videos" className="space-y-4">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>{isCreator ? "Pinned Videos" : "Featured Work"}</CardTitle>
                </CardHeader>
                <CardContent>
                  {pinnedVideos.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center gap-3 text-muted-foreground">
                      <Video className="h-10 w-10" />
                      {isOwnProfile
                        ? "Pin up to three videos to showcase on your profile."
                        : "No pinned videos yet."}
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {pinnedVideos.map((video, index) => (
                        <div key={video.id} className="group relative aspect-video overflow-hidden rounded-xl border border-border/50">
                          <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover transition-smooth group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-smooth group-hover:opacity-100" />
                          <span className="absolute left-2 top-2 rounded-full bg-background/80 px-2 py-0.5 text-xs font-semibold">
                            #{index + 1}
                          </span>
                          <span className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition-smooth group-hover:opacity-100">
                            {video.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {availableVideos.length > 0 && (
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle>All Videos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {availableVideos.map((video) => (
                        <div key={video.id} className="relative aspect-video overflow-hidden rounded-xl border border-border/50">
                          <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-xs text-white">
                            {video.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

          <TabsContent value="jobs" className="space-y-4">
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>{profileUser.role === "creator" ? "Submitted Jobs" : "Active Job Briefs"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profileUser.role === "creator" ? (
                    <CreatorJobSummary submittedJobs={stats.submittedJobs ?? 0} pending={stats.pendingEarnings ?? 0} />
                  ) : requesterJobs.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center gap-3 text-muted-foreground">
                      <Briefcase className="h-10 w-10" />
                      {isOwnProfile ? "Release your first job to start receiving submissions." : "No jobs published yet."}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {requesterJobs.map((job) => (
                        <div
                          key={job.id}
                          className="flex flex-col gap-3 rounded-xl border border-border/60 p-4 md:flex-row md:items-center md:justify-between"
                        >
                          <div>
                            <p className="font-semibold">{job.title}</p>
                            <p className="text-sm text-muted-foreground">{job.tags.map((tag) => `#${tag}`).join(" ")}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <DollarSign className="h-4 w-4 text-secondary" /> ${job.reward.toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-4 w-4 text-primary" />
                              {job.submissionsCount}/{job.submissionsLimit} submissions
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <ChatDialog open={isChatOpen} onOpenChange={setIsChatOpen} />
      {isOwnProfile && (
        <EditProfileDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          profile={profileUser}
        />
      )}
    </div>
  );
}

function StatsGrid({
  stats,
  role,
  followersCount,
  followingCount,
}: {
  stats: CreatorStats;
  role: UserRole;
  followersCount: number;
  followingCount: number;
}) {
  const entries = [
    {
      label: "Videos",
      value: stats.videos ?? 0,
      icon: Video,
    },
    {
      label: "Likes",
      value: stats.likes ?? 0,
      icon: Heart,
    },
    {
      label: "Shares",
      value: stats.shares ?? 0,
      icon: Share2,
    },
    {
      label: "Comments",
      value: stats.comments ?? 0,
      icon: MessageSquare,
    },
    {
      label: "Followers",
      value: followersCount,
      icon: Users,
    },
    {
      label: "Following",
      value: followingCount,
      icon: UserPlus,
    },
  ];

  if (role === "creator" || role === "admin") {
    entries.push(
      {
        label: "Earnings",
        value: `$${(stats.earnings ?? 0).toLocaleString()}`,
        icon: DollarSign,
      },
      {
        label: "Pending",
        value: `$${(stats.pendingEarnings ?? 0).toLocaleString()}`,
        icon: Briefcase,
      }
    );
  } else {
    entries.push(
      {
        label: "Jobs Posted",
        value: stats.jobsPosted ?? 0,
        icon: Briefcase,
      }
    );
  }

  return (
    <Card className="border-border/60">
      <CardContent className="grid gap-4 py-6 md:grid-cols-3 lg:grid-cols-4">
        {entries.map((entry) => (
          <div key={entry.label} className="rounded-xl border border-border/60 p-4">
            <div className="flex items-center gap-3">
              <entry.icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">{entry.label}</span>
            </div>
            <div className="mt-2 text-2xl font-bold">
              {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CreatorJobSummary({ submittedJobs, pending }: { submittedJobs: number; pending: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-border/60 p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Submitted Jobs</p>
        <p className="mt-2 text-2xl font-bold">{submittedJobs}</p>
        <p className="text-sm text-muted-foreground">Opportunities you&apos;ve responded to with finished videos.</p>
      </div>
      <div className="rounded-xl border border-border/60 p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pending Earnings</p>
        <p className="mt-2 text-2xl font-bold">${pending.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground">Awaiting approval or payment release from advertisers.</p>
      </div>
    </div>
  );
}

function ChatDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="border-b border-border px-6 py-4 text-left">
          <DialogTitle className="text-xl font-semibold">Conversation</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] px-6 py-4">
          <div className="space-y-4">
            {chatThread.map((message) => (
              <div key={message.id} className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {message.author}
                  <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                </div>
                <div className="rounded-2xl bg-muted/60 p-4 text-sm text-foreground">
                  {message.message}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <Separator />
        <div className="flex items-center gap-3 px-6 py-4">
          <input
            className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Write a message..."
          />
          <Button className="gradient-primary text-white">Send</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: CreatorProfile;
}

function EditProfileDialog({ open, onOpenChange, profile }: EditProfileDialogProps) {
  const { updateProfile, updatePinnedVideos } = useUser();
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [selectedVideos, setSelectedVideos] = useState<string[]>(profile.pinnedVideoIds);

  useEffect(() => {
    if (open) {
      setName(profile.name);
      setUsername(profile.username);
      setAvatar(profile.avatar);
      setSelectedVideos(profile.pinnedVideoIds);
    }
  }, [open, profile]);

  const canPinVideos = profile.role === "creator" && profile.videos.length > 0;

  const toggleVideoSelection = (videoId: string) => {
    setSelectedVideos((prev) => {
      if (prev.includes(videoId)) {
        return prev.filter((id) => id !== videoId);
      }
      if (prev.length >= 3) {
        toast.warning("You can only pin up to three videos");
        return prev;
      }
      return [...prev, videoId];
    });
  };

  const moveVideo = (videoId: string, direction: "up" | "down") => {
    setSelectedVideos((prev) => {
      const index = prev.indexOf(videoId);
      if (index === -1) return prev;
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= prev.length) return prev;
      const updated = [...prev];
      [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
      return updated;
    });
  };

  const removeVideo = (videoId: string) => {
    setSelectedVideos((prev) => prev.filter((id) => id !== videoId));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedUsername = username.trim();
    const trimmedName = name.trim();
    const trimmedAvatar = avatar.trim();

    if (!trimmedUsername) {
      toast.error("Username is required");
      return;
    }

    updateProfile({
      name: trimmedName || profile.name,
      username: trimmedUsername,
      avatar: trimmedAvatar || profile.avatar,
    });

    if (canPinVideos) {
      updatePinnedVideos(selectedVideos);
    }

    toast.success("Profile updated");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="display-name">
                Display Name
              </label>
              <Input
                id="display-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="username">
                Username
              </label>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="username"
              />
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="text-sm font-medium" htmlFor="avatar">
                Profile Image URL
              </label>
              <Input
                id="avatar"
                value={avatar}
                onChange={(event) => setAvatar(event.target.value)}
                placeholder="https://..."
              />
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      return;
                    }

                    if (file.size > 5 * 1024 * 1024) {
                      toast.error("Choose an image smaller than 5MB");
                      event.target.value = "";
                      return;
                    }

                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") {
                        setAvatar(reader.result);
                      } else {
                        toast.error("Unable to read image file");
                      }
                      event.target.value = "";
                    };
                    reader.onerror = () => {
                      toast.error("Failed to load image");
                      event.target.value = "";
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <label htmlFor="avatar-upload" className="text-xs text-muted-foreground">
                  Upload a JPG/PNG (max 5MB) or paste a URL above.
                </label>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <div className="h-16 w-16 overflow-hidden rounded-xl border border-border/60">
                  <img
                    src={avatar || profile.avatar}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      (event.currentTarget as HTMLImageElement).src = profile.avatar;
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste an image URL to update your profile picture.
                </p>
              </div>
            </div>
          </div>

          {canPinVideos && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Pin Videos (max 3)
                </h3>
                <span className="text-xs text-muted-foreground">
                  {selectedVideos.length}/3 selected
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {profile.videos.map((video) => {
                  const selectedIndex = selectedVideos.indexOf(video.id);
                  const isSelected = selectedIndex !== -1;
                  return (
                    <button
                      type="button"
                      key={video.id}
                      onClick={() => toggleVideoSelection(video.id)}
                      className={cn(
                        "group relative overflow-hidden rounded-xl border transition-smooth",
                        isSelected ? "border-primary ring-2 ring-primary/60" : "border-border/60"
                      )}
                    >
                      <img src={video.thumbnail} alt={video.title} className="h-40 w-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2 text-left text-xs text-white">
                        {video.title}
                      </div>
                      {isSelected && (
                        <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                          {selectedIndex + 1}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedVideos.length > 0 && (
                <div className="rounded-xl border border-border/60 p-4">
                  <h4 className="text-sm font-semibold text-muted-foreground">Pinned order</h4>
                  <div className="mt-3 space-y-2">
                    {selectedVideos.map((videoId, index) => {
                      const video = profile.videos.find((item) => item.id === videoId);
                      if (!video) return null;
                      return (
                        <div
                          key={video.id}
                          className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">#{index + 1}</span>
                            <span>{video.title}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => moveVideo(video.id, "up")}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => moveVideo(video.id, "down")}
                              disabled={index === selectedVideos.length - 1}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => removeVideo(video.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-primary text-white">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
