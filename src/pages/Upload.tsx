import { useState } from "react";
import { Upload as UploadIcon, Film, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sidebar } from "@/components/Sidebar/Sidebar";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith("video/")) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
    } else {
      toast.error("Please select a valid video file");
    }
  };

  const handleUpload = () => {
    if (!file || !title) {
      toast.error("Please add a video and title");
      return;
    }

    toast.success("Video uploaded successfully!");
    setFile(null);
    setTitle("");
    setDescription("");
    setPreview("");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 pt-20 md:pt-0 md:pl-28">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Upload Video
          </h1>
          <p className="text-muted-foreground">
            Share your creative advertising content
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border/50 animate-fade-in-up">
            <CardHeader>
              <CardTitle>Video File</CardTitle>
              <CardDescription>Upload your video file (MP4, MOV, AVI)</CardDescription>
            </CardHeader>
            <CardContent>
              {!preview ? (
                <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary transition-smooth">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <UploadIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum file size: 100MB
                  </p>
                </label>
              ) : (
                <div className="relative">
                  <video
                    src={preview}
                    controls
                    className="w-full h-64 object-cover rounded-xl"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setFile(null);
                      setPreview("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <CardHeader>
              <CardTitle>Video Details</CardTitle>
              <CardDescription>Add information about your video</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title</label>
                <Input
                  placeholder="Give your video a catchy title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="Describe your video and what makes it special"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  className="w-full gradient-primary text-white border-0"
                  onClick={handleUpload}
                  disabled={!file || !title}
                >
                  <Film className="mr-2 h-4 w-4" />
                  Upload Video
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}
