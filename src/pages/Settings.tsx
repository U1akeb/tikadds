import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Bell, Palette, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";

const SETTINGS_STORAGE_KEY = "adspark-user-settings";

interface Preferences {
  emailUpdates: boolean;
  productTips: boolean;
  autoplayFeed: boolean;
  compactLayout: boolean;
}

const defaultPreferences: Preferences = {
  emailUpdates: true,
  productTips: true,
  autoplayFeed: true,
  compactLayout: false,
};

export default function Settings() {
  const {
    authUser,
    logout,
    changePassword,
    isAdmin,
    deleteAccountByCreatorId,
    banAccountByCreatorId,
    unbanAccountByCreatorId,
  } = useAuth();
  const {
    deleteCreatorByUsername,
    issueWarning,
    banAccount,
    unbanAccount,
    deleteVideo,
    banVideo,
    unbanVideo,
    findCreatorByUsername,
  } = useUser();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<Preferences>(() => {
    if (typeof window === "undefined") {
      return defaultPreferences;
    }
    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) {
        return defaultPreferences;
      }
      const parsed = JSON.parse(raw);
      return { ...defaultPreferences, ...parsed } satisfies Preferences;
    } catch {
      return defaultPreferences;
    }
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteUsername, setDeleteUsername] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const computeBanUntil = (duration: string): string | null => {
    switch (duration) {
      case "24h":
        return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      case "7d":
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      case "30d":
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      case "permanent":
      default:
        return null;
    }
  };
  const [warningUsername, setWarningUsername] = useState("");
  const [warningReason, setWarningReason] = useState("");
  const [banUsername, setBanUsername] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("permanent");
  const [unbanUsername, setUnbanUsername] = useState("");
  const [videoUsername, setVideoUsername] = useState("");
  const [videoId, setVideoId] = useState("");
  const [videoBanReason, setVideoBanReason] = useState("");
  const [videoBanDuration, setVideoBanDuration] = useState("permanent");
  const [videoUnbanUsername, setVideoUnbanUsername] = useState("");
  const [videoUnbanId, setVideoUnbanId] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const handlePreferenceToggle = (key: keyof Preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePasswordChange = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser) {
      toast.error("Sign in to change your password");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("The new passwords do not match");
      return;
    }

    if (newPassword === currentPassword) {
      toast.error("Choose a password you haven't used before");
      return;
    }

    setIsSubmitting(true);
    const updated = changePassword(currentPassword, newPassword);
    setIsSubmitting(false);

    if (updated) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleAdminDelete = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser) {
      toast.error("Sign in to manage accounts");
      return;
    }

    const username = deleteUsername.trim();
    if (!username) {
      toast.error("Enter a username to delete");
      return;
    }

    setIsDeleting(true);
    const removed = deleteCreatorByUsername(username);
    if (!removed) {
      toast.error("No account found with that username");
      setIsDeleting(false);
      return;
    }

    deleteAccountByCreatorId(removed.id);
    setIsDeleting(false);
    setDeleteUsername("");
    toast.success(`Deleted @${removed.username}`);

    if (authUser.creatorId === removed.id) {
      navigate("/login");
    }
  };

  const handleIssueWarning = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser) {
      toast.error("Sign in to manage accounts");
      return;
    }

    const success = issueWarning(warningUsername.trim(), warningReason, authUser.email ?? "admin");
    if (success) {
      setWarningUsername("");
      setWarningReason("");
    }
  };

  const handleBanAccount = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser) {
      toast.error("Sign in to manage accounts");
      return;
    }

    const target = findCreatorByUsername(banUsername.trim());
    if (!target) {
      toast.error("Account not found");
      return;
    }

    const until = computeBanUntil(banDuration);
    const success = banAccount(target.username, banReason, until, authUser.email ?? "admin");
    if (success) {
      banAccountByCreatorId(target.id, banReason, until);
      setBanUsername("");
      setBanReason("");
      setBanDuration("permanent");
    }
  };

  const handleUnbanAccount = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser) {
      toast.error("Sign in to manage accounts");
      return;
    }

    const target = findCreatorByUsername(unbanUsername.trim());
    if (!target) {
      toast.error("Account not found");
      return;
    }

    const success = unbanAccount(target.username);
    if (success) {
      unbanAccountByCreatorId(target.id);
      setUnbanUsername("");
    }
  };

  const handleDeleteVideo = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser) {
      toast.error("Sign in to manage accounts");
      return;
    }

    const success = deleteVideo(videoUsername.trim(), videoId.trim());
    if (success) {
      setVideoUsername("");
      setVideoId("");
    }
  };

  const handleBanVideo = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser) {
      toast.error("Sign in to manage accounts");
      return;
    }

    const until = computeBanUntil(videoBanDuration);
    const success = banVideo(videoUsername.trim(), videoId.trim(), videoBanReason, until, authUser.email ?? "admin");
    if (success) {
      setVideoBanReason("");
      setVideoBanDuration("permanent");
    }
  };

  const handleUnbanVideo = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authUser) {
      toast.error("Sign in to manage accounts");
      return;
    }

    const success = unbanVideo(videoUnbanUsername.trim(), videoUnbanId.trim());
    if (success) {
      setVideoUnbanUsername("");
      setVideoUnbanId("");
    }
  };

  const accountInfo = useMemo(() => {
    if (!authUser) {
      return null;
    }
    const providerLabel = authUser.provider === "email" ? "Email" : authUser.provider === "google" ? "Google" : "Facebook";
    return {
      email: authUser.email,
      provider: providerLabel,
    };
  }, [authUser]);

  if (!authUser) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 pt-20 md:pt-0 md:pl-[clamp(12rem,12.5vw,16rem)]">
          <div className="mx-auto max-w-xl px-4 py-16">
            <Card className="border-border/60 text-center">
              <CardHeader>
                <CardTitle>Sign in to manage settings</CardTitle>
                <CardDescription>Access account controls and privacy options once you're signed in.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full gradient-primary text-white" onClick={() => navigate("/login")}>
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
      <main className="flex-1 pt-20 md:pt-0 md:pl-[clamp(12rem,12.5vw,16rem)]">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Personalize your experience, manage security, and control notifications across AdvidTok.
            </p>
          </header>

          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Palette className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Account preferences</CardTitle>
                  <CardDescription>Update how your feed and communication behave.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Autoplay content</p>
                  <p className="text-sm text-muted-foreground">Automatically play reels as you browse the feed.</p>
                </div>
                <Switch checked={preferences.autoplayFeed} onCheckedChange={() => handlePreferenceToggle("autoplayFeed")} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Compact layout</p>
                  <p className="text-sm text-muted-foreground">Reduce spacing in dashboards and tables.</p>
                </div>
                <Switch checked={preferences.compactLayout} onCheckedChange={() => handlePreferenceToggle("compactLayout")} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-secondary" />
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Control how we stay in touch.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Email updates</p>
                  <p className="text-sm text-muted-foreground">Product news, feature launches, and platform updates.</p>
                </div>
                <Switch checked={preferences.emailUpdates} onCheckedChange={() => handlePreferenceToggle("emailUpdates")} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Creator tips</p>
                  <p className="text-sm text-muted-foreground">Occasional insights to help you grow your reach.</p>
                </div>
                <Switch checked={preferences.productTips} onCheckedChange={() => handlePreferenceToggle("productTips")} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Privacy &amp; Security</CardTitle>
                  <CardDescription>Change your password and manage sensitive settings.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Authentication</h3>
                <div className="mt-2 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm">
                  <p><span className="font-semibold">Signed in as:</span> {accountInfo?.email}</p>
                  <p className="mt-1 text-muted-foreground">Provider: {accountInfo?.provider}</p>
                </div>
              </div>

              <Separator />

              <form className="space-y-4" onSubmit={handlePasswordChange}>
                <div>
                  <p className="font-semibold">Change password</p>
                  <p className="text-sm text-muted-foreground">
                    Use a strong, unique password with at least 8 characters.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium" htmlFor="current-password">
                      Current password
                    </label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="new-password">
                      New password
                    </label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="confirm-password">
                      Confirm new password
                    </label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" className="gradient-primary text-white" disabled={isSubmitting}>
                    {isSubmitting ? "Updating..." : "Update password"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    You will stay signed in after a successful change.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

      {isAdmin && (
        <Card className="border-border/60">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Trash2 className="h-5 w-5 text-destructive" />
              <div>
                <CardTitle>Account management</CardTitle>
                <CardDescription>Issue warnings, control access, or remove accounts.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Give warning</h3>
              <form className="space-y-4" onSubmit={handleIssueWarning}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="warning-username">
                      Username
                    </label>
                    <Input
                      id="warning-username"
                      value={warningUsername}
                      onChange={(event) => setWarningUsername(event.target.value)}
                      placeholder="creator username"
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium" htmlFor="warning-reason">
                      Warning note
                    </label>
                    <Textarea
                      id="warning-reason"
                      value={warningReason}
                      onChange={(event) => setWarningReason(event.target.value)}
                      placeholder="Explain the policy violation or reminder"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" variant="outline">
                  Send warning
                </Button>
              </form>
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Account bans</h3>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleBanAccount}>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="ban-username">
                    Username
                  </label>
                  <Input
                    id="ban-username"
                    value={banUsername}
                    onChange={(event) => setBanUsername(event.target.value)}
                    placeholder="creator username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="ban-duration">
                    Duration
                  </label>
                  <Select value={banDuration} onValueChange={setBanDuration}>
                    <SelectTrigger id="ban-duration">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 hours</SelectItem>
                      <SelectItem value="7d">7 days</SelectItem>
                      <SelectItem value="30d">30 days</SelectItem>
                      <SelectItem value="permanent">Permanent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium" htmlFor="ban-reason">
                    Reason
                  </label>
                  <Textarea
                    id="ban-reason"
                    value={banReason}
                    onChange={(event) => setBanReason(event.target.value)}
                    placeholder="Detail the violation prompting this ban"
                    required
                  />
                </div>
                <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                  <Button type="submit" variant="destructive">
                    Ban account
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Banned users are signed out immediately and cannot sign back in until the ban expires.
                  </p>
                </div>
              </form>

              <form className="space-y-4" onSubmit={handleUnbanAccount}>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="unban-username">
                    Remove ban for username
                  </label>
                  <Input
                    id="unban-username"
                    value={unbanUsername}
                    onChange={(event) => setUnbanUsername(event.target.value)}
                    placeholder="creator username"
                    required
                  />
                </div>
                <Button type="submit" variant="outline">
                  Lift ban
                </Button>
              </form>
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Video moderation</h3>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleDeleteVideo}>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="video-username">
                    Username
                  </label>
                  <Input
                    id="video-username"
                    value={videoUsername}
                    onChange={(event) => setVideoUsername(event.target.value)}
                    placeholder="creator username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="video-id">
                    Video ID
                  </label>
                  <Input
                    id="video-id"
                    value={videoId}
                    onChange={(event) => setVideoId(event.target.value)}
                    placeholder="e.g. cp-1"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" variant="outline">
                    Delete video
                  </Button>
                </div>
              </form>

              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleBanVideo}>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="video-ban-username">
                    Username
                  </label>
                  <Input
                    id="video-ban-username"
                    value={videoUsername}
                    onChange={(event) => setVideoUsername(event.target.value)}
                    placeholder="creator username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="video-ban-id">
                    Video ID
                  </label>
                  <Input
                    id="video-ban-id"
                    value={videoId}
                    onChange={(event) => setVideoId(event.target.value)}
                    placeholder="e.g. cp-1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="video-ban-duration">
                    Duration
                  </label>
                  <Select value={videoBanDuration} onValueChange={setVideoBanDuration}>
                    <SelectTrigger id="video-ban-duration">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 hours</SelectItem>
                      <SelectItem value="7d">7 days</SelectItem>
                      <SelectItem value="30d">30 days</SelectItem>
                      <SelectItem value="permanent">Permanent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium" htmlFor="video-ban-reason">
                    Reason
                  </label>
                  <Textarea
                    id="video-ban-reason"
                    value={videoBanReason}
                    onChange={(event) => setVideoBanReason(event.target.value)}
                    placeholder="Detail why the video is being removed from circulation"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" variant="destructive">
                    Ban video
                  </Button>
                </div>
              </form>

              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleUnbanVideo}>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="video-unban-username">
                    Username
                  </label>
                  <Input
                    id="video-unban-username"
                    value={videoUnbanUsername}
                    onChange={(event) => setVideoUnbanUsername(event.target.value)}
                    placeholder="creator username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="video-unban-id">
                    Video ID
                  </label>
                  <Input
                    id="video-unban-id"
                    value={videoUnbanId}
                    onChange={(event) => setVideoUnbanId(event.target.value)}
                    placeholder="e.g. cp-1"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" variant="outline">
                    Reinstate video
                  </Button>
                </div>
              </form>
            </section>

            <Separator />

            <section className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Delete account</h3>
              <form className="space-y-4" onSubmit={handleAdminDelete}>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="delete-username">
                    Username to delete
                  </label>
                  <Input
                    id="delete-username"
                    value={deleteUsername}
                    onChange={(event) => setDeleteUsername(event.target.value)}
                    placeholder="Enter username (without @)"
                    required
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" variant="destructive" disabled={isDeleting}>
                    {isDeleting ? "Deleting..." : "Delete account"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    This immediately removes the account and associated authentication. This action cannot be undone.
                  </p>
                </div>
              </form>
            </section>
          </CardContent>
        </Card>
      )}

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle>Session</CardTitle>
              <CardDescription>Manage your current session quickly.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="flex w-full items-center justify-center gap-2"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
