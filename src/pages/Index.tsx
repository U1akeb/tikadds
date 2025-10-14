import { Feed } from "@/components/Feed/Feed";
import { Sidebar } from "@/components/Sidebar/Sidebar";

const Index = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 pt-20 md:pt-0 md:pl-[clamp(12rem,12.5vw,16rem)]">
        <Feed />
      </main>
    </div>
  );
};

export default Index;
