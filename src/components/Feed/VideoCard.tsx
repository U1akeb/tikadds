import { useEffect, useState } from "react";
import { Heart, MessageCircle, Share2, Music, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CreatorProfile } from "@/context/UserContext";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
import { useAuth } from "@/context/AuthContext";

interface VideoCardProps {
  id: string;
  videoUrl: string;
  username: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  onCommentClick: (videoId: string) => void;
  onProfileClick: () => void;
  creator: CreatorProfile;
  dataVideoId?: string;
}

export function VideoCard({
  id,
  videoUrl,
  username,
  description,
  likes,
  comments,
  shares,
  onCommentClick,
  onProfileClick,
  creator,
  dataVideoId,
}: VideoCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [showHeart, setShowHeart] = useState(false);
  const [shareCount, setShareCount] = useState(shares);
  const { toggleFollow, isFollowing } = useUser();
  const { authUser } = useAuth();

  useEffect(() => {
    setShareCount(shares);
  }, [shares]);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/?video=${id}` : videoUrl;

  const handleShare = async () => {
    const shareData: ShareData = {
      title: `${username} on Ad Spark Feed`,
      text: description,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareCount((count) => count + 1);
        toast.success("Shared successfully");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setShareCount((count) => count + 1);
        toast.success("Link copied to clipboard");
      } else {
        throw new Error("Sharing not supported");
      }
    } catch (error) {
      console.error("Share error", error);
      toast.error("Unable to share this video");
    }
  };

  const handleLike = () => {
    if (isLiked) {
      setLikeCount((count) => Math.max(count - 1, 0));
      setIsLiked(false);
    } else {
      setLikeCount((count) => count + 1);
      setIsLiked(true);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
  };

  const handleDoubleClick = () => {
    if (!isLiked) {
      setLikeCount((count) => count + 1);
      setIsLiked(true);
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
  };

  const alreadyFollowing = creator.id === authUser?.creatorId || isFollowing(creator.id);

  const handleFollow = async () => {
    if (!authUser) {
      toast.info("Sign in to follow creators");
      return;
    }

    if (alreadyFollowing) {
      return;
    }

    await toggleFollow(creator.id);
    toast.success(`You're now following ${creator.name}`);
  };

  return (
    <div
      className="relative h-full min-h-[calc(100vh-5rem)] w-full snap-start snap-always md:h-screen md:min-h-0"
      data-video-id={dataVideoId ?? id}
    >
      <div className="absolute inset-0 bg-card" onDoubleClick={handleDoubleClick}>
        <video
          className="h-full w-full object-cover"
          src={videoUrl}
          loop
          autoPlay
          muted
          playsInline
        />

        {showHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart className="h-32 w-32 fill-primary text-primary animate-like-pop" />
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-16 bg-gradient-to-t from-background/85 via-background/20 to-transparent p-4 pb-24 md:right-20 md:p-6 md:pb-10">
        <div className="mb-3 flex items-center gap-3">
          <button
            onClick={onProfileClick}
            className="h-12 w-12 rounded-full overflow-hidden border-2 border-primary/40 transition-smooth hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`View ${creator.name}'s profile`}
          >
            {creator.avatar ? (
              <img src={creator.avatar} alt={creator.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                {username[0].toUpperCase()}
              </div>
            )}
          </button>
          <span className="font-semibold text-lg">{username}</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className={cn(
                "border-0 h-8",
                alreadyFollowing ? "bg-muted text-muted-foreground" : "gradient-primary text-white"
              )}
              onClick={handleFollow}
              disabled={alreadyFollowing}
            >
              {alreadyFollowing ? "Following" : "Follow"}
            </Button>
            <Button size="sm" variant="outline" className="h-8" onClick={onProfileClick}>
              View profile
            </Button>
          </div>
        </div>

        <p className="mb-3 max-w-[75%] text-sm leading-relaxed line-clamp-3 md:max-w-[60%]">{description}</p>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Music className="h-4 w-4" />
          <span>Original Sound - {username}</span>
        </div>
      </div>

      <div className="absolute right-4 bottom-28 flex flex-col items-center gap-6 md:bottom-24">
        <button
          onClick={onProfileClick}
          className="flex flex-col items-center gap-1 transition-smooth"
          aria-label={`View ${creator.name}'s profile`}
        >
          <div className="h-12 w-12 rounded-full border-2 border-border overflow-hidden bg-background/40 backdrop-blur">
            {creator.avatar ? (
              <img src={creator.avatar} alt={creator.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-muted">
                <UserCircle2 className="h-7 w-7" />
              </div>
            )}
          </div>
          <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">Profile</span>
        </button>

        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 transition-smooth"
          type="button"
          aria-label={isLiked ? "Unlike video" : "Like video"}
        >
          <div
            className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center transition-smooth",
              isLiked ? "bg-primary/20" : "bg-background/20 backdrop-blur-sm"
            )}
          >
            <Heart
              className={cn("h-7 w-7 transition-smooth", isLiked && "fill-primary text-primary")}
            />
          </div>
          <span className="text-xs font-medium">{likeCount.toLocaleString()}</span>
        </button>

        <button
          onClick={() => onCommentClick(id)}
          className="flex flex-col items-center gap-1 transition-smooth"
          type="button"
          aria-label="Open comments"
        >
          <div className="h-12 w-12 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="h-7 w-7" />
          </div>
          <span className="text-xs font-medium">{comments.toLocaleString()}</span>
        </button>

        <button
          className="flex flex-col items-center gap-1 transition-smooth"
          type="button"
          aria-label="Share video"
          onClick={handleShare}
        >
          <div className="h-12 w-12 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="h-7 w-7" />
          </div>
          <span className="text-xs font-medium">{shareCount.toLocaleString()}</span>
        </button>
      </div>
    </div>
  );
}
