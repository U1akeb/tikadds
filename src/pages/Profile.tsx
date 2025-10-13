import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Video, DollarSign, TrendingUp } from "lucide-react";
import { Sidebar } from "@/components/Sidebar/Sidebar";

export default function Profile() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 p-6 pl-28">
      <div className="max-w-4xl mx-auto">
        <Card className="border-border/50 animate-fade-in-up">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6 mb-8">
              <div className="h-24 w-24 rounded-full gradient-primary flex items-center justify-center text-white text-4xl font-bold">
                C
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">CreativePro</h1>
                <p className="text-muted-foreground mb-4">
                  Professional advertising content creator
                </p>
                <div className="flex gap-2">
                  <Badge className="bg-primary text-primary-foreground">Creator</Badge>
                  <Badge variant="outline">Verified</Badge>
                </div>
              </div>
              <Button className="gradient-primary text-white border-0">
                Edit Profile
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/20 mx-auto mb-2">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <p className="text-2xl font-bold">48</p>
                <p className="text-sm text-muted-foreground">Videos</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-secondary/20 mx-auto mb-2">
                  <TrendingUp className="h-6 w-6 text-secondary" />
                </div>
                <p className="text-2xl font-bold">234K</p>
                <p className="text-sm text-muted-foreground">Views</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-accent/20 mx-auto mb-2">
                  <Star className="h-6 w-6 text-accent" />
                </div>
                <p className="text-2xl font-bold">4.8</p>
                <p className="text-sm text-muted-foreground">Rating</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-secondary/20 mx-auto mb-2">
                  <DollarSign className="h-6 w-6 text-secondary" />
                </div>
                <p className="text-2xl font-bold">$12.5K</p>
                <p className="text-sm text-muted-foreground">Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 mt-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <CardHeader>
            <CardTitle>Recent Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-video rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:scale-105 transition-smooth cursor-pointer"
                >
                  <Video className="h-8 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
