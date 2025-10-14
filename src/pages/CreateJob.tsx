import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Image as ImageIcon, UploadCloud, VideoIcon } from "lucide-react";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useUser } from "@/context/UserContext";
import { useJobs, JobMedia } from "@/context/JobContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const DEFAULT_TAGS = ["ad", "promo", "tutorial", "review", "launch", "ugc", "bts"];

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export default function CreateJob() {
  const { authUser } = useAuth();
  const { currentUser, isContentRequester } = useUser();
  const { createJob } = useJobs();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState(500);
  const [deadline, setDeadline] = useState<string>(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [tags, setTags] = useState<string[]>(["promo"]);
  const [customTag, setCustomTag] = useState("");
  const [submissionsLimit, setSubmissionsLimit] = useState(10);

  const [videoMedia, setVideoMedia] = useState<JobMedia | null>(null);
  const [imageMedia, setImageMedia] = useState<JobMedia | null>(null);

  useEffect(() => {
    return () => {
      if (videoMedia?.url?.startsWith("blob:")) URL.revokeObjectURL(videoMedia.url);
      if (imageMedia?.url?.startsWith("blob:")) URL.revokeObjectURL(imageMedia.url);
    };
  }, [videoMedia, imageMedia]);

  const canSubmit = useMemo(() => title.trim() && description.trim(), [title, description]);

  const handleTagToggle = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  };

  const handleCustomTagAdd = () => {
    if (!customTag.trim()) return;
    const cleanTag = customTag.trim().toLowerCase();
    setTags((prev) => (prev.includes(cleanTag) ? prev : [...prev, cleanTag]));
    setCustomTag("");
  };

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>, type: "video" | "image") => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const media: JobMedia = {
      id: generateId(),
      type,
      url,
    };

    if (type === "video") {
      if (videoMedia?.url?.startsWith("blob:")) URL.revokeObjectURL(videoMedia.url);
      setVideoMedia(media);
    } else {
      if (imageMedia?.url?.startsWith("blob:")) URL.revokeObjectURL(imageMedia.url);
      setImageMedia(media);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      toast.error("Please add a title and description for the job");
      return;
    }

    const media = [videoMedia, imageMedia].filter(Boolean) as JobMedia[];

    const job = createJob(
      {
        title,
        description,
        reward: Number.isFinite(reward) ? reward : 0,
        deadline: new Date(deadline).toISOString(),
        tags,
        submissionsLimit,
        media,
      },
      {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      }
    );

    toast.success("Job released! Creators can now submit their videos.");
    navigate(`/jobs?highlight=${job.id}`);
  };

  if (!authUser) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 pt-20 md:pt-0 md:pl-28">
          <div className="mx-auto max-w-xl px-4 py-16">
            <Card className="border-border/60 text-center">
              <CardHeader>
                <CardTitle>Sign in required</CardTitle>
                <CardDescription>Log in as an advertiser to release new campaign briefs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full gradient-primary text-white" onClick={() => navigate("/login") }>
                  Go to login
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pt-20 md:pt-0 md:pl-28">
        <div className="mx-auto w-full max-w-4xl px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold md:text-4xl">Create a Job Request</h1>
            <p className="text-muted-foreground mt-2">
              Share the brief and optional reference media to invite creators to collaborate.
            </p>
          </div>

          {!isContentRequester && (
            <Card className="mb-8 border-dashed border-2 border-border/60 bg-muted/30">
              <CardHeader>
                <CardTitle className="text-xl">Looking to hire creators?</CardTitle>
                <CardDescription>
                  Switch your role to advertiser to publish job requests and manage submissions.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Job Basics</CardTitle>
                <CardDescription>Give your job a clear direction so the right creators apply.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Job Title</label>
                    <Input
                      placeholder="e.g. Summer product teaser"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reward Amount (USD)</label>
                    <Input
                      type="number"
                      min={0}
                      value={reward}
                      onChange={(event) => setReward(Number(event.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    rows={5}
                    placeholder="Explain what you're looking for, tone, key deliverables, and must-have shots."
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Deadline
                    </label>
                    <Input
                      type="date"
                      value={deadline}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(event) => setDeadline(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Submission Limit</label>
                    <Input
                      type="number"
                      min={1}
                      value={submissionsLimit}
                      onChange={(event) => setSubmissionsLimit(Math.max(1, Number(event.target.value)))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Reference Media</CardTitle>
                <CardDescription>
                  Attach optional reference assets to help creators understand your vision.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <VideoIcon className="h-4 w-4" /> Video Brief (optional)
                  </label>
                  <label className="group flex h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/60 p-6 text-center transition-smooth hover:border-primary">
                    <UploadCloud className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                    <span className="text-sm font-medium">Upload video brief</span>
                    <span className="text-xs text-muted-foreground">MP4, MOV up to 150MB</span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(event) => handleMediaChange(event, "video")}
                    />
                  </label>
                  {videoMedia && (
                    <video
                      src={videoMedia.url}
                      controls
                      className="h-40 w-full rounded-lg border border-border object-cover"
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" /> Reference Image (optional)
                  </label>
                  <label className="group flex h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/60 p-6 text-center transition-smooth hover:border-primary">
                    <UploadCloud className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                    <span className="text-sm font-medium">Upload reference image</span>
                    <span className="text-xs text-muted-foreground">PNG, JPG up to 15MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => handleMediaChange(event, "image")}
                    />
                  </label>
                  {imageMedia && (
                    <img
                      src={imageMedia.url}
                      alt="Job reference"
                      className="h-40 w-full rounded-lg border border-border object-cover"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Tags & Categories</CardTitle>
                <CardDescription>Select up to three tags so creators can find this job easily.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_TAGS.map((tag) => (
                    <Badge
                      key={tag}
                      variant={tags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer capitalize"
                      onClick={() => handleTagToggle(tag)}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom tag"
                    value={customTag}
                    onChange={(event) => setCustomTag(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        handleCustomTagAdd();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleCustomTagAdd}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Selected: {tags.map((tag) => `#${tag}`).join(", ")}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-3 pb-12">
              <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" className="gradient-primary text-white" disabled={!canSubmit || !isContentRequester}>
                Publish Job
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
