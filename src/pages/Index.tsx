import { Feed } from "@/components/Feed/Feed";
import { Sidebar } from "@/components/Sidebar/Sidebar";

const Index = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pl-20">
        <Feed />
      </main>
    </div>
  );
};

export default Index;
