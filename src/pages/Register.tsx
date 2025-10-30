import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const Register = () => {
  const navigate = useNavigate();
  const { registerWithEmail, loginWithProvider, continueAsGuest } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProviderLoading, setIsProviderLoading] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState<string | null>(null);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    const success = await registerWithEmail({ name, username, email, password });
    setIsSubmitting(false);
    if (success) {
      const normalized = email.trim().toLowerCase();
      setVerificationNotice(
        `A verification link has been sent to ${normalized}. Click the link in your inbox to activate your account.`,
      );
      setName("");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
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
      <Card className="w-full max-w-lg border-border/60">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold">Create your account</CardTitle>
          <CardDescription>Join Ad Spark Feed to collaborate with brands and creators.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form className="space-y-4" onSubmit={handleFormSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="name">
                  Display Name
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Taylor Swift"
                  disabled={Boolean(verificationNotice)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="username">
                  Username
                </label>
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="taylor"
                  required
                  disabled={Boolean(verificationNotice)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                disabled={Boolean(verificationNotice)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={Boolean(verificationNotice)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="confirm-password">
                  Confirm Password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  disabled={Boolean(verificationNotice)}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full gradient-primary text-white"
              disabled={isSubmitting || Boolean(verificationNotice)}
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-xs text-muted-foreground">
              We’ll send you a verification email right after sign up.
            </p>
            {verificationNotice && (
              <div className="rounded-md border border-primary/40 bg-primary/5 p-4 text-sm">
                <p className="font-medium text-primary">{verificationNotice}</p>
                <p className="mt-2 text-muted-foreground">
                  After verifying, return to the login page and sign in with your email and password.
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => navigate("/login")}>Go to login</Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setVerificationNotice(null);
                      setEmail("");
                      setName("");
                      setUsername("");
                    }}
                  >
                    Create another account
                  </Button>
                </div>
              </div>
            )}
          </form>

          <div className="space-y-3">
            <p className="text-center text-xs uppercase tracking-wide text-muted-foreground">Or sign up with</p>
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
            disabled={isGuestLoading || Boolean(verificationNotice)}
          >
            {isGuestLoading ? "Preparing guest session..." : "Continue as guest"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
