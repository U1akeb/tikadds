import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const Register = () => {
  const navigate = useNavigate();
  const { registerWithEmail, loginWithProvider } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stage, setStage] = useState<"form" | "verify">("form");
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [verificationExpiry, setVerificationExpiry] = useState<number | null>(null);
  const [pendingPayload, setPendingPayload] = useState<{ name: string; username: string; email: string; password: string } | null>(null);
  const [isGooglePickerOpen, setIsGooglePickerOpen] = useState(false);

  const googleAccounts = [
    "creativepro@gmail.com",
    "brandmaster.agency@gmail.com",
    "adgenius.creator@gmail.com",
  ];

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const payload = { name, username, email, password };
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setIsSubmitting(true);
    setPendingPayload(payload);
    setVerificationCode(code);
    setVerificationExpiry(Date.now() + 5 * 60 * 1000);
    setCodeInput("");
    setStage("verify");
    setIsSubmitting(false);
    toast.success(`Verification code sent to ${email}`);
    toast.info(`Use ${code} to verify your email (demo).`);
  };

  const handleVerifySubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingPayload || !verificationCode) {
      toast.error("No verification in progress");
      return;
    }

    if (verificationExpiry && Date.now() > verificationExpiry) {
      toast.error("Verification code expired. Request a new one.");
      setStage("form");
      setVerificationCode(null);
      setPendingPayload(null);
      setVerificationExpiry(null);
      setCodeInput("");
      return;
    }

    if (codeInput.trim() !== verificationCode) {
      toast.error("Invalid verification code");
      return;
    }

    setIsSubmitting(true);
    const success = registerWithEmail(pendingPayload);
    setIsSubmitting(false);
    if (success) {
      setStage("form");
      setVerificationCode(null);
      setPendingPayload(null);
      setVerificationExpiry(null);
      setCodeInput("");
      navigate("/profile");
    }
  };

  const handleResendCode = () => {
    if (!pendingPayload) {
      toast.error("Enter account details first");
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code);
    setVerificationExpiry(Date.now() + 5 * 60 * 1000);
    setCodeInput("");
    toast.success(`New code sent to ${pendingPayload.email}`);
    toast.info(`Use ${code} to verify your email (demo).`);
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

  const handleEditDetails = () => {
    setStage("form");
    setVerificationCode(null);
    setPendingPayload(null);
    setVerificationExpiry(null);
    setCodeInput("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg border-border/60">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold">Create your account</CardTitle>
          <CardDescription>Join Ad Spark Feed to collaborate with brands and creators.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {stage === "form" ? (
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
                  />
                </div>
              </div>

              <Button type="submit" className="w-full gradient-primary text-white" disabled={isSubmitting}>
                {isSubmitting ? "Preparing verification..." : "Create account"}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleVerifySubmit}>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Verify your email
                </h3>
                <p className="text-sm text-muted-foreground">
                  Enter the 6-digit code we sent to <span className="font-medium">{pendingPayload?.email ?? email}</span>.
                  Codes expire in 5 minutes.
                </p>
              </div>
              <Input
                id="verification-code"
                value={codeInput}
                onChange={(event) => setCodeInput(event.target.value)}
                placeholder="123456"
                maxLength={6}
                required
              />
              <Button type="submit" className="w-full gradient-primary text-white" disabled={isSubmitting}>
                {isSubmitting ? "Verifying..." : "Verify and create account"}
              </Button>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="outline" onClick={handleResendCode}>
                  Resend code
                </Button>
                <Button type="button" variant="ghost" onClick={handleEditDetails}>
                  Edit details
                </Button>
              </div>
              {verificationCode && (
                <p className="text-xs text-muted-foreground">
                  Demo note: your code is <span className="font-semibold">{verificationCode}</span>.
                </p>
              )}
            </form>
          )}

          <div className="space-y-3">
            <p className="text-center text-xs uppercase tracking-wide text-muted-foreground">Or sign up with</p>
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
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>

      <Dialog open={isGooglePickerOpen} onOpenChange={setIsGooglePickerOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Select a Google account</DialogTitle>
            <DialogDescription>Choose the account you'd like to continue with.</DialogDescription>
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

export default Register;
