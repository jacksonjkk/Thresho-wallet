import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Eye, EyeOff, Network } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { authService } from "@/services/auth.service";

interface SignupPageProps {
  onLoginClick?: () => void;
}

export function SignupPage({ onLoginClick }: SignupPageProps) {
  const { isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation
    if (!firstName || !lastName || !email || !password) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    // Check if email already exists before signing up
    try {
      const emailCheck = await authService.checkEmailExists(email);
      if (emailCheck.exists) {
        setError("This email is already registered. Please login or use a different email.");
        setLoading(false);
        return;
      }
    } catch (err) {
      setError("Unable to verify email. Please try again.");
      setLoading(false);
      return;
    }

    try {
      // Create account immediately
      await authService.register(firstName, lastName, email, password);
      setSuccess(true);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        if (onLoginClick) onLoginClick();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] -ml-64 -mb-64"></div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-16 items-center relative z-10">
        {/* Left Side - Illustration */}
        <div className="hidden lg:flex flex-col space-y-12">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/80">Secure Multi-sig Network</span>
            </div>
            <h1 className="text-7xl font-bold tracking-tighter leading-[0.9] text-white">
              Securing your <span className="text-primary italic">digital</span> assets.
            </h1>
            <p className="text-lg text-muted-foreground/60 max-w-md font-medium tracking-tight">
              A better way to manage team funds. Enterprise-grade security meets human-centric design.
            </p>
          </div>under

          <div className="grid grid-cols-2 gap-8 pt-8">
            <div className="p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm group hover:border-primary/20 transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Network className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-2">Multi-sig Wallet</h3>
              <p className="text-xs text-muted-foreground opacity-60 leading-relaxed font-medium">Shared control and high security for your funds.</p>
            </div>
            <div className="p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm group hover:border-primary/20 transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-2">Read-only Access</h3>
              <p className="text-xs text-muted-foreground opacity-60 leading-relaxed font-medium">Track every transaction and activity as it happens.</p>
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md border border-white/5 bg-white/5 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-colors group-hover:bg-primary/10"></div>
            <CardHeader className="space-y-1 relative z-10 pt-8 pb-4">
              <div className="flex items-center justify-center mb-6 lg:hidden">
                <div className="relative group/logo">
                  <div className="absolute inset-0 bg-primary/40 blur-xl rounded-full opacity-40"></div>
                  <img src="/logo.png" alt="Thresho" className="w-16 h-16 relative z-10" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold tracking-tighter text-center uppercase">Create Account</CardTitle>
              <CardDescription className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                Join our secure network
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="JOHN"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={isLoading || success}
                      className="h-12 bg-white/5 border-white/5 hover:border-white/10 focus:border-primary/50 transition-all rounded-xl text-xs font-medium"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="DOE"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={isLoading || success}
                      className="h-12 bg-white/5 border-white/5 hover:border-white/10 focus:border-primary/50 transition-all rounded-xl text-xs font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="YOUR@EMAIL.COM"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || success}
                    className="h-12 bg-white/5 border-white/5 hover:border-white/10 focus:border-primary/50 transition-all rounded-xl text-xs font-medium"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading || success}
                      className="h-12 bg-white/5 border-white/5 hover:border-white/10 focus:border-primary/50 transition-all rounded-xl text-xs font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                      disabled={isLoading || success}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading || success}
                      className="h-12 bg-white/5 border-white/5 hover:border-white/10 focus:border-primary/50 transition-all rounded-xl text-xs font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                      disabled={loading || success}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl border border-status-error/20 bg-status-error/5 text-[10px] uppercase font-bold tracking-widest text-status-error animate-in fade-in slide-in-from-top-2">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-4 rounded-xl border border-status-success/20 bg-status-success/5 text-[10px] uppercase font-bold tracking-widest text-status-success animate-in fade-in zoom-in">
                    ACCOUNT CREATED SUCCESSFULLY. REDIRECTING...
                  </div>
                )}

                <div className="flex justify-center pt-2">
                  <Button
                    type="submit"
                    className="w-full max-w-xs h-14 bg-primary hover:bg-primary shadow-lg text-[11px] font-bold uppercase tracking-[0.2em]"
                    disabled={loading || success}
                  >
                    {loading ? "CREATING ACCOUNT..." : "SIGN UP"}
                  </Button>
                </div>

                <div className="text-center pt-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={onLoginClick}
                      className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
                    >
                      LOGIN
                    </button>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
