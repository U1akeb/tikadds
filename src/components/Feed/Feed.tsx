import { useState } from "react";
import { VideoCard } from "./VideoCard";
import { Comments } from "../Comments/Comments";

const mockVideos = [
  {
    id: "1",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    username: "creativepro",
    description: "Check out this amazing product ad! 🚀 #advertising #creative",
    likes: 12500,
    comments: 342,
    shares: 89,
  },
  {
    id: "2",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    username: "brandmaster",
    description: "New campaign for summer collection ☀️ What do you think?",
    likes: 8900,
    comments: 201,
    shares: 56,
  },
  {
    id: "3",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    username: "adgenius",
    description: "Behind the scenes of our latest shoot 🎬 #bts #production",
    likes: 15200,
    comments: 478,
    shares: 124,
  },
];

export function Feed() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  return (
    <>
      <div className="h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {mockVideos.map((video) => (
          <VideoCard
            key={video.id}
            {...video}
            onCommentClick={() => setSelectedVideo(video.id)}
          />
        ))}
      </div>

      <Comments
        isOpen={selectedVideo !== null}
        onClose={() => setSelectedVideo(null)}
        videoId={selectedVideo || ""}
      />
    </>
  );
}
