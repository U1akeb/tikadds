import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { loginWithEmail, loginWithProvider, authUser } = useAuth();
  const [email, setEmail] = useState(authUser?.email ?? "");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGooglePickerOpen, setIsGooglePickerOpen] = useState(false);

  const googleAccounts = [
    "creativepro@gmail.com",
    "brandmaster.agency@gmail.com",
    "adgenius.creator@gmail.com",
  ];

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const success = loginWithEmail(email, password);
    setIsSubmitting(false);
    if (success) {
      navigate("/profile");
    }
  };

  const handleProvider = (provider: "google" | "facebook") => {
    if (provider === "google") {
      setIsGooglePickerOpen(true);
      return;
    }
    const success = loginWithProvider(provider);
    if (success) {
      navigate("/profile");
    }
  };

  const handleGoogleSelection = (accountEmail: string) => {
    const success = loginWithProvider("google", accountEmail);
    if (success) {
      setIsGooglePickerOpen(false);
      navigate("/profile");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/60">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
          <CardDescription>Sign in to manage your feed, follow creators, and submit work.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full gradient-primary text-white" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="space-y-3">
            <p className="text-center text-xs uppercase tracking-wide text-muted-foreground">Or continue with</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="outline" onClick={() => handleProvider("google")}>
                Google
              </Button>
              <Button variant="outline" onClick={() => handleProvider("facebook")}>
                Facebook
              </Button>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Need an account?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>

      <Dialog open={isGooglePickerOpen} onOpenChange={setIsGooglePickerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Select a Google account</DialogTitle>
            <DialogDescription>Choose the Google account to continue with.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {googleAccounts.map((account) => (
              <Button
                key={account}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleGoogleSelection(account)}
              >
                {account}
              </Button>
            ))}
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleGoogleSelection("google@demo.adspark.dev")}
            >
              Use a different account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
