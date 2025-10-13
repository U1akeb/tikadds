import { ReactNode, createContext, useContext, useMemo, useState } from "react";

export type JobMediaType = "video" | "image";

export interface JobMedia {
  id: string;
  type: JobMediaType;
  url: string;
  thumbnail?: string;
}

export interface JobPerformance {
  likes: number;
  comments: number;
  shares: number;
}

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  reward: number;
  deadline: string;
  tags: string[];
  requesterId: string;
  requesterName: string;
  requesterRole: "creator" | "advertiser";
  submissionsLimit: number;
  submissionsCount: number;
  createdAt: string;
  media: JobMedia[];
  performance: JobPerformance;
}

export interface CreateJobPayload {
  title: string;
  description: string;
  reward: number;
  deadline: string;
  tags: string[];
  submissionsLimit: number;
  media?: JobMedia[];
}

interface JobContextValue {
  jobs: JobPosting[];
  createJob: (payload: CreateJobPayload, requester: { id: string; name: string; role: "creator" | "advertiser" }) => JobPosting;
}

const createId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

const initialJobs: JobPosting[] = [
  {
    id: createId(),
    title: "Summer Collection Launch Video",
    description:
      "We need a vibrant 20-30 second reel highlighting the key pieces of our upcoming summer drop. Showcase movement, transitions, and include CTA to shop.",
    reward: 1500,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["fashion", "promo", "launch"],
    requesterId: "brand-master",
    requesterName: "Brand Master",
    requesterRole: "advertiser",
    submissionsLimit: 20,
    submissionsCount: 12,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    media: [
      {
        id: createId(),
        type: "video",
        url: "https://cdn.coverr.co/videos/coverr-dancing-in-the-desert-4976/1080p.mp4",
        thumbnail: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=480&q=80",
      },
    ],
    performance: {
      likes: 4850,
      comments: 328,
      shares: 194,
    },
  },
  {
    id: createId(),
    title: "Mobile App Tutorial Series",
    description:
      "Create a three-part tutorial explaining our fitness app flow: onboarding, tracking workouts, and community challenges. Energetic tone with on-screen text.",
    reward: 900,
    deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["tutorial", "fitness", "app"],
    requesterId: "spotlight-brand",
    requesterName: "Spotlight Brands",
    requesterRole: "advertiser",
    submissionsLimit: 15,
    submissionsCount: 7,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    media: [
      {
        id: createId(),
        type: "image",
        url: "https://images.unsplash.com/photo-1551817958-20204d6ab675?auto=format&fit=crop&w=480&q=80",
      },
    ],
    performance: {
      likes: 2390,
      comments: 148,
      shares: 87,
    },
  },
  {
    id: createId(),
    title: "Product Unboxing with Voiceover",
    description:
      "Scripted unboxing video for our smart home device. Focus on setup simplicity and unique features. Provide both horizontal and vertical versions.",
    reward: 1200,
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["tech", "unboxing", "voiceover"],
    requesterId: "brand-master",
    requesterName: "Brand Master",
    requesterRole: "advertiser",
    submissionsLimit: 10,
    submissionsCount: 5,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    media: [
      {
        id: createId(),
        type: "image",
        url: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?auto=format&fit=crop&w=480&q=80",
      },
    ],
    performance: {
      likes: 3210,
      comments: 204,
      shares: 126,
    },
  },
];

const JobContext = createContext<JobContextValue | null>(null);

export function JobProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<JobPosting[]>(initialJobs);

  const createJob: JobContextValue["createJob"] = (payload, requester) => {
    const job: JobPosting = {
      id: createId(),
      title: payload.title,
      description: payload.description,
      reward: payload.reward,
      deadline: payload.deadline,
      tags: payload.tags,
      requesterId: requester.id,
      requesterName: requester.name,
      requesterRole: requester.role,
      submissionsLimit: payload.submissionsLimit,
      submissionsCount: 0,
      createdAt: new Date().toISOString(),
      media: payload.media ?? [],
      performance: {
        likes: 0,
        comments: 0,
        shares: 0,
      },
    };

    setJobs((prev) => [job, ...prev]);
    return job;
  };

  const value = useMemo(
    () => ({
      jobs,
      createJob,
    }),
    [jobs]
  );

  return <JobContext.Provider value={value}>{children}</JobContext.Provider>;
}

export function useJobs() {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error("useJobs must be used within a JobProvider");
  }
  return context;
}
