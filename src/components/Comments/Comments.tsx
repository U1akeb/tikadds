import { useState } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] p-0">
        <SheetHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle>{comments.length} Comments</SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-[calc(80vh-5rem)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 animate-fade-in">
                <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {comment.username[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{comment.username}</span>
                    <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                  </div>
                  <p className="text-sm mt-1">{comment.text}</p>
                  <button className="text-xs text-muted-foreground hover:text-foreground mt-2">
                    {comment.likes > 0 && `${comment.likes} likes`}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-card">
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
      </SheetContent>
    </Sheet>
  );
}
