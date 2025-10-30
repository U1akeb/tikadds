import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { loginWithEmail, loginWithProvider, authUser, continueAsGuest } = useAuth();
  const [email, setEmail] = useState(authUser?.email ?? "");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProviderLoading, setIsProviderLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const success = await loginWithEmail(email, password);
    setIsSubmitting(false);
    if (success) {
      navigate("/profile");
    }
  };

  const handleProvider = async (provider: "google" | "facebook") => {
    setIsProviderLoading(true);
    const success = await loginWithProvider(provider);
    setIsProviderLoading(false);
    if (success) {
      navigate("/profile");
    }
  };

  const handleGuest = async () => {
    setIsGuestLoading(true);
    try {
      await continueAsGuest();
      navigate("/");
    } finally {
      setIsGuestLoading(false);
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
              <Button variant="outline" onClick={() => handleProvider("google")} disabled={isProviderLoading}>
                Google
              </Button>
              <Button variant="outline" onClick={() => handleProvider("facebook")} disabled={isProviderLoading}>
                Facebook
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            className="w-full"
            onClick={handleGuest}
            disabled={isGuestLoading}
          >
            {isGuestLoading ? "Preparing guest session..." : "Continue as guest"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Need an account?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
