import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Eye, EyeOff, Network, Mail, Twitter, Shield, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { authService } from "@/services/auth.service";
import { motion } from "motion/react";
import { toast } from "sonner";

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

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const emailCheck = await authService.checkEmailExists(email);
      if (emailCheck.exists) {
        setError("This email is already in use");
        setLoading(false);
        return;
      }

      await authService.register(firstName, lastName, email, password);
      setSuccess(true);
      toast.success("Account created successfully!");

      // Redirect after success
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
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -ml-32 -mb-32"></div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-16 items-center relative z-10">
        {/* Left Side - Editorial Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex flex-col space-y-12"
        >
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/80">Secure Multi-sig Network</span>
            </div>
            <h1 className="text-7xl font-bold tracking-tighter leading-[0.85] text-white" style={{ fontFamily: 'var(--font-serif)' }}>
              Securing your <br />
              <span className="text-primary italic">digital assets.</span>
            </h1>
            <p className="text-lg text-muted-foreground/60 max-w-md font-medium tracking-tight leading-relaxed">
              Precision infrastructure for shared wealth. Join the collaborative era of sovereign custody.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-4">
            <div className="p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm group hover:border-primary/20 transition-all">
              <Network className="w-5 h-5 text-primary mb-4 opacity-60 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-2">Team Wallet</h3>
              <p className="text-xs text-muted-foreground opacity-60 leading-relaxed font-medium">Shared control and high security for your team funds.</p>
            </div>
            <div className="p-6 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm group hover:border-primary/20 transition-all">
              <ArrowRight className="w-5 h-5 text-primary mb-4 opacity-60 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-2">Safe Access</h3>
              <p className="text-xs text-muted-foreground opacity-60 leading-relaxed font-medium">Track every activity with full transparency and safety.</p>
            </div>
          </div>
        </motion.div>

        {/* Right Side - Signup Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center"
        >
          <Card className="w-full max-w-md border border-white/5 bg-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50"></div>

            <CardHeader className="space-y-4 pt-10 pb-6">
              <div className="flex items-center justify-center mb-2 lg:hidden">
                <div className="relative group/logo">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150"></div>
                  <img src="/logo.png" alt="Thresho" className="w-16 h-16 relative z-10" />
                </div>
              </div>
              <div className="space-y-1.5 text-center">
                <CardTitle className="text-3xl font-bold tracking-tight">Create Account</CardTitle>
                <CardDescription className="text-xs uppercase font-bold tracking-[0.2em] text-muted-foreground opacity-60">
                  Join our secure network
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="px-6 sm:px-10 pb-10">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest opacity-70">First Name</Label>
                    <Input
                      placeholder="JOHN"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={loading || success}
                      className="h-12 bg-white/5 border-white/5 rounded-xl text-xs font-medium"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest opacity-70">Last Name</Label>
                    <Input
                      placeholder="DOE"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={loading || success}
                      className="h-12 bg-white/5 border-white/5 rounded-xl text-xs font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest opacity-70">Email</Label>
                  <Input
                    type="email"
                    placeholder="YOUR@EMAIL.COM"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading || success}
                    className="h-12 bg-white/5 border-white/5 rounded-xl text-xs font-medium"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest opacity-70">Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading || success}
                      className="h-12 bg-white/5 border-white/5 rounded-xl text-xs font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest opacity-70">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading || success}
                      className="h-12 bg-white/5 border-white/5 rounded-xl text-xs font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3.5 rounded-lg border border-status-error/20 bg-status-error/5 text-[10px] font-bold text-status-error animate-shake">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3.5 rounded-lg border border-status-success/20 bg-status-success/5 text-[10px] font-bold text-status-success text-center">
                    Success! Redirecting you now...
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-xs font-bold uppercase tracking-widest rounded-xl shadow-xl"
                  disabled={loading || success}
                >
                  {loading ? "Creating..." : "Sign Up"}
                </Button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                  <div className="relative flex justify-center text-[8px] uppercase tracking-[0.3em] font-bold text-muted-foreground opacity-30"><span className="bg-transparent px-4 italic">Social Join</span></div>
                </div>

                <div className="flex gap-4 justify-center">
                  <Button type="button" variant="outline" size="icon" className="rounded-full w-12 h-12 bg-white/5 hover:border-primary/50 transition-all">
                    <Mail className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="rounded-full w-12 h-12 bg-white/5 hover:border-primary/50 transition-all">
                    <Twitter className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                  </Button>
                </div>

                <div className="text-center pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={onLoginClick}
                      className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
                    >
                      Login
                    </button>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
