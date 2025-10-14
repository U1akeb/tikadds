import { useEffect, useMemo, useState } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";

interface Comment {
  id: string;
  username: string;
  text: string;
  likes: number;
  timestamp: string;
}

interface CommentsProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
}

const mockComments: Comment[] = [
  {
    id: "1",
    username: "user123",
    text: "This is amazing! 🔥",
    likes: 24,
    timestamp: "2h ago",
  },
  {
    id: "2",
    username: "creator_pro",
    text: "Love the creativity here!",
    likes: 15,
    timestamp: "4h ago",
  },
  {
    id: "3",
    username: "adlover",
    text: "Where can I learn to make content like this?",
    likes: 8,
    timestamp: "6h ago",
  },
];

export function Comments({ isOpen, onClose, videoId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState("");
  const isMobile = useIsMobile();

  useEffect(() => {
    setComments(mockComments);
    setNewComment("");
  }, [videoId]);

  const containerClasses = useMemo(() => {
    if (isMobile) {
      return "flex w-full flex-col border-t border-border bg-card/95 text-foreground backdrop-blur h-[45vh]";
    }
    return "hidden bg-card/95 text-foreground backdrop-blur border-border/60 md:flex md:h-full md:w-[420px] md:flex-col md:border-l lg:w-[480px]";
  }, [isMobile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      username: "You",
      text: newComment,
      likes: 0,
      timestamp: "Just now",
    };

    setComments([comment, ...comments]);
    setNewComment("");
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={containerClasses}>
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Comments</p>
          <p className="text-lg font-bold">{comments.length}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close comments">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments.map((comment) => (
            <div key={`${videoId}-${comment.id}`} className="flex gap-3 animate-fade-in">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-white">
                {comment.username[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{comment.username}</span>
                  <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                </div>
                <p className="mt-1 text-sm">{comment.text}</p>
                <button className="mt-2 text-xs text-muted-foreground transition-colors hover:text-foreground">
                  {comment.likes > 0 && `${comment.likes} likes`}
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-border bg-card/90 p-4">
          <div className="flex gap-2">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1"
            />
            <Button type="submit" size="icon" className="gradient-primary text-white">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
