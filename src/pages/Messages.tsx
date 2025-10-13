import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { Sidebar } from "@/components/Sidebar/Sidebar";

export default function Messages() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 p-6 pl-28">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Messages
          </h1>
          <p className="text-muted-foreground">
            Chat with advertisers and creators
          </p>
        </div>

        <Card className="border-border/50 animate-fade-in-up">
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Messaging Feature</p>
              <p className="text-sm text-muted-foreground max-w-md">
                Direct messaging between creators and advertisers will be available soon.
                Stay tuned for updates!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
