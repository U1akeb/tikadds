import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Video, Eye, TrendingUp, Briefcase, Users } from "lucide-react";
import { Sidebar } from "@/components/Sidebar/Sidebar";

export default function Dashboard() {
  const [role] = useState<"creator" | "advertiser">("creator");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 p-6 pl-28">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your performance and earnings
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border/50 animate-fade-in-up">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$12,543</div>
                  <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Videos Created</CardTitle>
                  <Video className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">48</div>
                  <p className="text-xs text-muted-foreground">+12 this month</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">234.5K</div>
                  <p className="text-xs text-muted-foreground">+18.5% from last month</p>
                </CardContent>
              </Card>

              <Card className="border-border/50 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8.2%</div>
                  <p className="text-xs text-muted-foreground">+2.1% from last month</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-border/50 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
                <CardHeader>
                  <CardTitle>Recent Submissions</CardTitle>
                  <CardDescription>Your latest campaign submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { campaign: "Summer Fashion Collection", status: "Approved", amount: "$750" },
                      { campaign: "Tech Product Launch", status: "Under Review", amount: "$1,200" },
                      { campaign: "Fitness App Promotion", status: "Approved", amount: "$500" },
                    ].map((submission, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{submission.campaign}</p>
                          <p className="text-xs text-muted-foreground">{submission.status}</p>
                        </div>
                        <span className="font-semibold text-secondary">{submission.amount}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 animate-fade-in-up" style={{ animationDelay: "500ms" }}>
                <CardHeader>
                  <CardTitle>Active Campaigns</CardTitle>
                  <CardDescription>Campaigns you're currently working on</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: "Beauty Product Review", deadline: "2 days left", progress: 75 },
                      { name: "Restaurant Promotion", deadline: "5 days left", progress: 40 },
                      { name: "App Tutorial Series", deadline: "1 week left", progress: 20 },
                    ].map((campaign, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{campaign.name}</p>
                          <span className="text-xs text-muted-foreground">{campaign.deadline}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div 
                            className="h-full gradient-primary transition-smooth"
                            style={{ width: `${campaign.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>Detailed insights coming soon</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Analytics charts will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Earnings History</CardTitle>
                <CardDescription>Your payment history and pending earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { date: "Jan 15, 2024", campaign: "Summer Fashion", amount: "$750", status: "Paid" },
                    { date: "Jan 10, 2024", campaign: "Tech Launch", amount: "$1,200", status: "Processing" },
                    { date: "Jan 5, 2024", campaign: "Fitness Promo", amount: "$500", status: "Paid" },
                    { date: "Dec 28, 2023", campaign: "Holiday Special", amount: "$650", status: "Paid" },
                  ].map((payment, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
                      <div>
                        <p className="font-medium">{payment.campaign}</p>
                        <p className="text-sm text-muted-foreground">{payment.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-secondary">{payment.amount}</p>
                        <p className="text-xs text-muted-foreground">{payment.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </div>
  );
}
