import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Fingerprint, Eye, EyeOff, Wallet, Network, Mail, Twitter } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { authService } from "@/services/auth.service";

interface LoginPageProps {
  onLogin: () => void;
  onSignupClick: () => void;
}

export function LoginPage({ onLogin, onSignupClick }: LoginPageProps) {
  const { login, biometricLogin, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Signup state
  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      await login(email, password);
      onLogin();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    setSignupSuccess(false);

    if (!signupFirstName.trim()) {
      setSignupError("First name is required");
      return;
    }

    if (!signupLastName.trim()) {
      setSignupError("Last name is required");
      return;
    }

    if (!signupEmail.trim()) {
      setSignupError("Email is required");
      return;
    }

    if (signupPassword !== confirmPassword) {
      setSignupError("Passwords do not match");
      return;
    }

    if (signupPassword.length < 6) {
      setSignupError("Password must be at least 6 characters");
      return;
    }

    setSignupLoading(true);

    try {
      const emailCheck = await authService.checkEmailExists(signupEmail);
      if (emailCheck.exists) {
        setSignupError("This email is already registered. Please login or use a different email.");
        return;
      }

      await authService.register(signupFirstName, signupLastName, signupEmail, signupPassword);
      setSignupSuccess(true);
      setSignupFirstName("");
      setSignupLastName("");
      setSignupEmail("");
      setSignupPassword("");
      setConfirmPassword("");
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setSignupLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setLoginError("");
    try {
      await biometricLogin();
      onLogin();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Biometric login not available");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Illustration */}
        <div className="hidden lg:flex flex-col items-center justify-center space-y-8">
          <div className="relative w-full max-w-md">
            <div className="glass-card rounded-2xl p-12 border border-white/10 relative overflow-hidden group">
              {/* Decorative Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-500"></div>
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all duration-500"></div>

              <div className="flex items-center justify-center mb-8 animate-float">
                <div className="p-4 relative">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
                  <img src="/logo.png" alt="Thresho" className="w-32 h-32 relative z-10" />
                </div>
              </div>
              <h1 className="text-5xl text-center mb-4 tracking-tighter" style={{ fontFamily: 'var(--font-serif)' }}>
                Thresho
              </h1>
              <p className="text-center text-muted-foreground mb-8 text-sm font-medium tracking-widest uppercase">
                Secure Multi-Signature Wallet
              </p>

              {/* Visual Multi-Sig Illustration */}
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-xl bg-secondary/50 backdrop-blur-md flex items-center justify-center border border-white/5">
                    <img src="/logo.png" alt="Thresho" className="w-8 h-8 opacity-80" />
                  </div>
                  <div className="h-px w-8 bg-gradient-to-r from-border to-transparent"></div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white shadow-[0_0_30px_rgba(99,102,241,0.4)]">
                  <Network className="w-7 h-7" />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-px w-8 bg-gradient-to-l from-border to-transparent"></div>
                  <div className="w-10 h-10 rounded-xl bg-secondary/50 backdrop-blur-md flex items-center justify-center border border-white/5">
                    <img src="/logo.png" alt="Thresho" className="w-8 h-8 opacity-80" />
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                  <span className="font-medium">Secure multi-signature transactions</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
                  <span className="font-medium">Enterprise-grade security</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]"></div>
                  <span className="font-medium">Collaborative wallet management</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4 lg:hidden">
                <div className="p-3">
                  <img src="/logo.png" alt="Thresho" className="w-16 h-16" />
                </div>
              </div>
              <CardTitle className="text-center text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
              <CardDescription className="text-center">
                Securely sign into your wallet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                          disabled={isLoading}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {loginError && (
                      <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-sm text-sm text-destructive">
                        {loginError}
                      </div>
                    )}

                    <div className="flex justify-center pt-2">
                      <Button type="submit" className="w-full max-w-xs" size="lg" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign In"}
                      </Button>
                    </div>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t"></span>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full max-w-xs"
                        onClick={handleBiometricLogin}
                        disabled={isLoading}
                      >
                        <Fingerprint className="w-4 h-4 mr-2 text-primary" />
                        Biometric Login
                      </Button>
                    </div>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/5"></span>
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                        <span className="bg-card px-4 text-muted-foreground">Social Connect</span>
                      </div>
                    </div>

                    <div className="flex gap-4 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-full w-12 h-12 hover:border-primary/50 transition-all"
                        disabled={isLoading}
                        title="Continue with Gmail"
                      >
                        <Mail className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-full w-12 h-12 hover:border-primary/50 transition-all"
                        disabled={isLoading}
                        title="Continue with X"
                      >
                        <Twitter className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignupSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="signup-first-name">First Name</Label>
                        <Input
                          id="signup-first-name"
                          type="text"
                          placeholder="John"
                          value={signupFirstName}
                          onChange={(e) => setSignupFirstName(e.target.value)}
                          disabled={signupLoading || isLoading}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-last-name">Last Name</Label>
                        <Input
                          id="signup-last-name"
                          type="text"
                          placeholder="Doe"
                          value={signupLastName}
                          onChange={(e) => setSignupLastName(e.target.value)}
                          disabled={signupLoading || isLoading}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        disabled={signupLoading || isLoading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        disabled={signupLoading || isLoading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={signupLoading || isLoading}
                        required
                      />
                    </div>

                    {signupError && (
                      <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-sm text-sm text-destructive">
                        {signupError}
                      </div>
                    )}

                    {signupSuccess && (
                      <div className="p-3 bg-[#065F46]/5 border border-[#065F46]/20 rounded-sm text-sm text-[#065F46]">
                        Account created successfully! You can now log in.
                      </div>
                    )}

                    <div className="flex justify-center pt-2">
                      <Button
                        type="submit"
                        className="w-full max-w-xs"
                        size="lg"
                        disabled={signupLoading || isLoading}
                      >
                        {signupLoading ? "Processing..." : "Create Account"}
                      </Button>
                    </div>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/5"></span>
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                        <span className="bg-card px-4 text-muted-foreground">Traditional Auth</span>
                      </div>
                    </div>

                    <div className="flex gap-4 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-full w-12 h-12 hover:border-primary/50 transition-all"
                        disabled={signupLoading || isLoading}
                        title="Continue with Gmail"
                      >
                        <Mail className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-full w-12 h-12 hover:border-primary/50 transition-all"
                        disabled={signupLoading || isLoading}
                        title="Continue with X"
                      >
                        <Twitter className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
