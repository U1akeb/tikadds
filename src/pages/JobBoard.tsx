import { useState } from "react";
import { Briefcase, Clock, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/Sidebar/Sidebar";

interface Campaign {
  id: string;
  title: string;
  company: string;
  budget: string;
  deadline: string;
  submissionsCount: number;
  submissionsLimit: number;
  description: string;
  status: "open" | "closing-soon" | "closed";
}

const mockCampaigns: Campaign[] = [
  {
    id: "1",
    title: "Summer Fashion Collection",
    company: "TrendyWear",
    budget: "$500 - $1,000",
    deadline: "3 days left",
    submissionsCount: 12,
    submissionsLimit: 20,
    description: "Create engaging 15-30 second videos showcasing our new summer collection. Must include product features and styling tips.",
    status: "open",
  },
  {
    id: "2",
    title: "Tech Product Launch",
    company: "GadgetCo",
    budget: "$1,000 - $2,500",
    deadline: "5 days left",
    submissionsCount: 8,
    submissionsLimit: 15,
    description: "Innovative unboxing and review videos for our latest smartphone. Focus on unique features and user experience.",
    status: "open",
  },
  {
    id: "3",
    title: "Fitness App Promotion",
    company: "FitLife",
    budget: "$300 - $700",
    deadline: "1 day left",
    submissionsCount: 18,
    submissionsLimit: 20,
    description: "Show your fitness journey using our app. Before/after transformations and workout routines preferred.",
    status: "closing-soon",
  },
];

export default function JobBoard() {
  const [campaigns] = useState<Campaign[]>(mockCampaigns);

  const getStatusBadge = (status: Campaign["status"]) => {
    switch (status) {
      case "open":
        return <Badge className="bg-secondary text-secondary-foreground">Open</Badge>;
      case "closing-soon":
        return <Badge className="bg-destructive text-destructive-foreground">Closing Soon</Badge>;
      case "closed":
        return <Badge variant="outline">Closed</Badge>;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 p-6 pl-28">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Campaign Job Board
          </h1>
          <p className="text-muted-foreground">
            Browse available campaigns and submit your creative videos
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign, index) => (
            <Card 
              key={campaign.id} 
              className="transition-smooth hover:shadow-card hover:scale-105 animate-fade-in-up border-border/50"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-xl">{campaign.title}</CardTitle>
                  {getStatusBadge(campaign.status)}
                </div>
                <CardDescription className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {campaign.company}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {campaign.description}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-secondary" />
                    <span className="font-medium">{campaign.budget}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{campaign.deadline}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-accent" />
                    <span>
                      {campaign.submissionsCount} / {campaign.submissionsLimit} submissions
                    </span>
                  </div>

                  <div className="pt-4">
                    <Button 
                      className="w-full gradient-primary text-white border-0"
                      disabled={campaign.status === "closed"}
                    >
                      {campaign.status === "closed" ? "Campaign Closed" : "Submit Video"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
