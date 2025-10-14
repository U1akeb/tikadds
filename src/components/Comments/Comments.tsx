import { useEffect, useMemo, useState } from "react";
import { X, Send, ThumbsDown, ThumbsUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface CommentReply {
  id: string;
  username: string;
  text: string;
  timestamp: string;
}

interface Comment {
  id: string;
  username: string;
  text: string;
  likes: number;
  dislikes: number;
  timestamp: string;
  userReaction?: "like" | "dislike";
  replies: CommentReply[];
}

interface CommentsProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  onProfileNavigate: (username: string) => void;
}

const mockComments: Comment[] = [
  {
    id: "1",
    username: "brandmaster",
    text: "This is amazing! 🔥",
    likes: 24,
    dislikes: 1,
    timestamp: "2h ago",
    replies: [],
  },
  {
    id: "2",
    username: "adgenius",
    text: "Love the creativity here!",
    likes: 15,
    dislikes: 0,
    timestamp: "4h ago",
    replies: [
      {
        id: "2-r1",
        username: "creativepro",
        text: "Appreciate the support!",
        timestamp: "3h ago",
      },
    ],
  },
  {
    id: "3",
    username: "spotlight",
    text: "Where can I learn to make content like this?",
    likes: 8,
    dislikes: 0,
    timestamp: "6h ago",
    replies: [],
  },
];

export function Comments({ isOpen, onClose, videoId, onProfileNavigate }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState("");
  const isMobile = useIsMobile();
  const { authUser } = useAuth();
  const { findCreatorByUsername, currentUser } = useUser();
  const navigate = useNavigate();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setComments(
      mockComments.map((comment) => ({
        ...comment,
        userReaction: undefined,
        replies: [...comment.replies],
      })),
    );
    setNewComment("");
    setReplyDrafts({});
    setReplyingTo(null);
  }, [videoId]);

  const containerClasses = useMemo(() => {
    if (isMobile) {
      return "flex w-full flex-none flex-col border-t border-border bg-card/95 text-foreground backdrop-blur max-h-[45vh]";
    }
    return "hidden flex-none bg-card/95 text-foreground backdrop-blur border-border/60 md:flex md:h-full md:w-[420px] md:flex-col md:border-l lg:w-[480px]";
  }, [isMobile]);

  const requireAuth = () => {
    if (!authUser) {
      toast.info("Sign in to join the conversation");
      navigate("/login");
      return false;
    }
    return true;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed) return;
    if (!requireAuth()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      username: currentUser.username,
      text: trimmed,
      likes: 0,
      dislikes: 0,
      timestamp: "Just now",
      replies: [],
    };

    setComments((prev) => [comment, ...prev]);
    setNewComment("");
  };

  const handleReaction = (commentId: string, reaction: "like" | "dislike") => {
    if (!requireAuth()) return;
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id !== commentId) {
          return comment;
        }
        let likes = comment.likes;
        let dislikes = comment.dislikes;
        const userReaction = comment.userReaction;

        if (userReaction === reaction) {
          if (reaction === "like") {
            likes = Math.max(0, likes - 1);
          } else {
            dislikes = Math.max(0, dislikes - 1);
          }
          return { ...comment, likes, dislikes, userReaction: undefined };
        }

        if (userReaction === "like") {
          likes = Math.max(0, likes - 1);
        } else if (userReaction === "dislike") {
          dislikes = Math.max(0, dislikes - 1);
        }

        if (reaction === "like") {
          likes += 1;
        } else {
          dislikes += 1;
        }

        return { ...comment, likes, dislikes, userReaction: reaction };
      }),
    );
  };

  const handleReplyToggle = (commentId: string) => {
    if (!requireAuth()) return;
    setReplyingTo((current) => (current === commentId ? null : commentId));
  };

  const handleReplyChange = (commentId: string, value: string) => {
    setReplyDrafts((prev) => ({ ...prev, [commentId]: value }));
  };

  const handleReplySubmit = (event: React.FormEvent, commentId: string) => {
    event.preventDefault();
    if (!requireAuth()) return;
    const trimmed = (replyDrafts[commentId] ?? "").trim();
    if (!trimmed) {
      return;
    }

    const reply: CommentReply = {
      id: `${commentId}-reply-${Date.now()}`,
      username: currentUser.username,
      text: trimmed,
      timestamp: "Just now",
    };

    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              replies: [...comment.replies, reply],
            }
          : comment,
      ),
    );

    setReplyDrafts((prev) => {
      const next = { ...prev };
      delete next[commentId];
      return next;
    });
    setReplyingTo(null);
  };

  const handleProfileClick = (username: string) => {
    const creator = findCreatorByUsername(username);
    if (!creator) {
      toast.info("Profile not available yet");
      return;
    }
    onProfileNavigate(creator.username);
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
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {comments.map((comment) => {
            const likeActive = comment.userReaction === "like";
            const dislikeActive = comment.userReaction === "dislike";

            return (
              <div
                key={`${videoId}-${comment.id}`}
                className="animate-fade-in space-y-3 rounded-xl border border-border/60 bg-card/70 p-3"
              >
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleProfileClick(comment.username)}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-white"
                    aria-label={`View ${comment.username}'s profile`}
                  >
                    {comment.username[0].toUpperCase()}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleProfileClick(comment.username)}
                        className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
                      >
                        {comment.username}
                      </button>
                      <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                    </div>
                    <p className="mt-1 text-sm text-foreground">{comment.text}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => handleReaction(comment.id, "like")}
                        className={cn(
                          "flex items-center gap-1 rounded-full border px-3 py-1 transition-colors",
                          likeActive
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{comment.likes}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReaction(comment.id, "dislike")}
                        className={cn(
                          "flex items-center gap-1 rounded-full border px-3 py-1 transition-colors",
                          dislikeActive
                            ? "border-destructive/40 bg-destructive/10 text-destructive"
                            : "border-transparent text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <ThumbsDown className="h-4 w-4" />
                        <span>{comment.dislikes}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReplyToggle(comment.id)}
                        className="flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Reply
                      </button>
                    </div>
                  </div>
                </div>

                {comment.replies.length > 0 && (
                  <div className="space-y-3 pl-12">
                    {comment.replies.map((reply) => (
                      <div key={`${comment.id}-${reply.id}`} className="rounded-lg bg-muted/40 p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <button
                            type="button"
                            onClick={() => handleProfileClick(reply.username)}
                            className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
                          >
                            {reply.username}
                          </button>
                          <span>{reply.timestamp}</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground/90">{reply.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {replyingTo === comment.id && (
                  <form className="pl-12" onSubmit={(event) => handleReplySubmit(event, comment.id)}>
                    <div className="flex gap-2">
                      <Input
                        value={replyDrafts[comment.id] ?? ""}
                        onChange={(event) => handleReplyChange(comment.id, event.target.value)}
                        placeholder={`Reply to ${comment.username}`}
                        className="flex-1"
                      />
                      <Button type="submit" size="icon" className="gradient-primary text-white">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
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
