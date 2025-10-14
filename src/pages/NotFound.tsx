import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar/Sidebar";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 text-center pt-20 md:pt-0 md:pl-[clamp(12rem,12.5vw,16rem)]">
        <h1 className="text-5xl font-bold">404</h1>
        <p className="text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist.</p>
        <a href="/" className="text-primary underline">
          Return to Home
        </a>
      </main>
    </div>
  );
};

export default NotFound;
