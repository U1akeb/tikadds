import { useState } from "react";
import { Heart, MessageCircle, Share2, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface VideoCardProps {
  id: string;
  videoUrl: string;
  username: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  onCommentClick: () => void;
}

export function VideoCard({
  videoUrl,
  username,
  description,
  likes,
  comments,
  shares,
  onCommentClick,
}: VideoCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [showHeart, setShowHeart] = useState(false);

  const handleLike = () => {
    if (isLiked) {
      setLikeCount(likeCount - 1);
      setIsLiked(false);
    } else {
      setLikeCount(likeCount + 1);
      setIsLiked(true);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
    }
  };

  const handleDoubleClick = () => {
    if (!isLiked) {
      setLikeCount(likeCount + 1);
      setIsLiked(true);
    }
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
  };

  return (
    <div className="relative h-screen w-full snap-start snap-always">
      <div 
        className="absolute inset-0 bg-card"
        onDoubleClick={handleDoubleClick}
      >
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

      <div className="absolute bottom-0 left-0 right-20 p-6 bg-gradient-to-t from-background/80 to-transparent">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
            {username[0].toUpperCase()}
          </div>
          <span className="font-semibold text-lg">{username}</span>
          <Button size="sm" className="gradient-primary text-white border-0 h-8">
            Follow
          </Button>
        </div>
        
        <p className="text-sm mb-3 line-clamp-2">{description}</p>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Music className="h-4 w-4" />
          <span>Original Sound - {username}</span>
        </div>
      </div>

      <div className="absolute right-4 bottom-24 flex flex-col gap-6">
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 transition-smooth"
        >
          <div className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center transition-smooth",
            isLiked ? "bg-primary/20" : "bg-background/20 backdrop-blur-sm"
          )}>
            <Heart className={cn(
              "h-7 w-7 transition-smooth",
              isLiked && "fill-primary text-primary"
            )} />
          </div>
          <span className="text-xs font-medium">{likeCount.toLocaleString()}</span>
        </button>

        <button
          onClick={onCommentClick}
          className="flex flex-col items-center gap-1 transition-smooth"
        >
          <div className="h-12 w-12 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
            <MessageCircle className="h-7 w-7" />
          </div>
          <span className="text-xs font-medium">{comments.toLocaleString()}</span>
        </button>

        <button className="flex flex-col items-center gap-1 transition-smooth">
          <div className="h-12 w-12 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="h-7 w-7" />
          </div>
          <span className="text-xs font-medium">{shares.toLocaleString()}</span>
        </button>
      </div>
    </div>
  );
}
