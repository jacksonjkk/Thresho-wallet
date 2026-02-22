import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Fingerprint, Eye, EyeOff, Network, Mail, Twitter, Shield, ArrowRight, Github } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { authService } from "@/services/auth.service";
import { motion } from "motion/react";
import { toast } from "sonner";

interface LoginPageProps {
  onLogin: () => void;
  onSignupClick: () => void;
}

export function LoginPage({ onLogin, onSignupClick }: LoginPageProps) {
  const { login, biometricLogin, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [signupFirstName, setSignupFirstName] = useState("");
  const [signupLastName, setSignupLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.6 }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    try {
      await login(email, password);
      toast.success("Welcome back!");
      onLogin();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Invalid email or password");
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    setSignupSuccess(false);

    if (signupPassword !== confirmPassword) {
      setSignupError("Passwords don't match");
      return;
    }

    setSignupLoading(true);
    try {
      const emailCheck = await authService.checkEmailExists(signupEmail);
      if (emailCheck.exists) {
        setSignupError("This email is already in use");
        return;
      }

      await authService.register(signupFirstName, signupLastName, signupEmail, signupPassword);
      setSignupSuccess(true);
      toast.success("Account created successfully!");

      setSignupFirstName("");
      setSignupLastName("");
      setSignupEmail("");
      setSignupPassword("");
      setConfirmPassword("");
    } catch (err) {
      setSignupError(err instanceof Error ? err.message : "Registration failed");
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
      setLoginError("Biometric login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px] pointer-events-none -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -ml-32 -mb-32"></div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 lg:gap-24 items-center relative z-10">

        {/* Left Side: Editorial Content */}
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
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/80">Secured Entry Point</span>
            </div>

            <h1 className="text-7xl font-bold tracking-tighter leading-[0.85] text-white" style={{ fontFamily: 'var(--font-serif)' }}>
              Access your <br />
              <span className="text-primary italic">Digital Vault.</span>
            </h1>

            <p className="text-lg text-muted-foreground/60 max-w-md font-medium tracking-tight leading-relaxed">
              Precision multi-signature infrastructure for the collaborative era. Secure, transparent, and sovereign.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 max-w-lg">
            {[
              { icon: Network, label: "Consensus", value: "Multi-sig 2.0" },
              { icon: Fingerprint, label: "Identity", value: "Biometric Auth" }
            ].map((stat, i) => (
              <div key={i} className="p-5 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm group hover:border-primary/20 transition-all">
                <stat.icon className="w-5 h-5 text-primary mb-3 opacity-60 group-hover:opacity-100 transition-opacity" />
                <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-50 mb-1">{stat.label}</div>
                <div className="text-sm font-bold text-white tracking-tight">{stat.value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Side: Auth Card */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex items-center justify-center w-full"
        >
          <Card className="w-full max-w-md border border-white/5 bg-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50"></div>

            <CardHeader className="space-y-4 pt-12 pb-6">
              <div className="flex items-center justify-center lg:hidden mb-2">
                <div className="relative group/logo">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150"></div>
                  <img src="/logo.png" alt="Thresho" className="w-16 h-16 relative z-10" />
                </div>
              </div>
              <div className="space-y-1.5 text-center">
                <CardTitle className="text-3xl font-bold tracking-tight">Welcome back</CardTitle>
                <CardDescription className="text-xs uppercase font-bold tracking-[0.2em] text-muted-foreground opacity-50">
                  Securely sign into your account
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="px-6 sm:px-10 pb-10">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 h-12 p-1 bg-black/40 border border-white/5 rounded-xl">
                  <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white text-[10px] font-bold uppercase tracking-widest">Login</TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white text-[10px] font-bold uppercase tracking-widest">Signup</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2.5">
                      <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70 ml-1">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-40" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="example@gmail.com"
                          className="h-12 pl-12 bg-white/5 border-white/5 hover:border-white/10 focus:ring-primary/50 rounded-xl text-xs font-medium transition-all"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70 ml-1">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="h-12 bg-white/5 border-white/5 hover:border-white/10 focus:ring-primary/50 rounded-xl text-xs font-medium transition-all"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
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

                    {loginError && (
                      <div className="p-3.5 rounded-lg border border-status-error/20 bg-status-error/5 text-[10px] font-bold uppercase tracking-widest text-status-error animate-shake">
                        {loginError}
                      </div>
                    )}

                    <Button type="submit" disabled={isLoading} className="w-full h-14 bg-primary hover:bg-primary/90 text-xs font-bold uppercase tracking-widest rounded-xl shadow-xl group transition-all">
                      {isLoading ? "Signing in..." : "Login"}
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>

                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                      <div className="relative flex justify-center text-[8px] uppercase tracking-[0.3em] font-bold text-muted-foreground opacity-30"><span className="bg-transparent px-4 italic">Or continue with</span></div>
                    </div>

                    <div className="space-y-4">
                      <Button type="button" variant="outline" onClick={handleBiometricLogin} className="w-full h-12 bg-white/5 border-white/5 hover:bg-white/10 rounded-xl text-[9px] font-bold uppercase tracking-widest">
                        <Fingerprint className="w-4 h-4 mr-2 text-primary" />
                        Biometric Login
                      </Button>

                      <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                        <div className="relative flex justify-center text-[8px] uppercase tracking-[0.3em] font-bold text-muted-foreground opacity-30"><span className="bg-transparent px-4 italic">Social Connect</span></div>
                      </div>

                      <div className="flex gap-4 justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="rounded-full w-12 h-12 hover:border-primary/50 transition-all bg-white/5"
                          disabled={isLoading}
                        >
                          <Mail className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="rounded-full w-12 h-12 hover:border-primary/50 transition-all bg-white/5"
                          disabled={isLoading}
                        >
                          <Twitter className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                        </Button>
                      </div>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <form onSubmit={handleSignupSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2.5">
                        <Label className="text-[10px] uppercase tracking-widest opacity-70">First Name</Label>
                        <Input
                          placeholder="first name"
                          className="h-12 bg-white/5 border-white/5 rounded-xl text-xs font-medium"
                          value={signupFirstName}
                          onChange={(e) => setSignupFirstName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2.5">
                        <Label className="text-[10px] uppercase tracking-widest opacity-70">Last Name</Label>
                        <Input
                          placeholder="last name"
                          className="h-12 bg-white/5 border-white/5 rounded-xl text-xs font-medium"
                          value={signupLastName}
                          onChange={(e) => setSignupLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-[10px] uppercase tracking-widest opacity-70">Email</Label>
                      <Input
                        placeholder="examople@gmail.com"
                        className="h-12 bg-white/5 border-white/5 rounded-xl text-xs font-medium"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-[10px] uppercase tracking-widest opacity-70">Password</Label>
                      <div className="relative">
                        <Input
                          type={showSignupPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="h-12 bg-white/5 border-white/5 rounded-xl text-xs font-medium"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-[10px] uppercase tracking-widest opacity-70">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="h-12 bg-white/5 border-white/5 rounded-xl text-xs font-medium"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {signupError && <div className="p-3.5 rounded-lg border border-status-error/20 bg-status-error/5 text-[10px] font-bold text-status-error">{signupError}</div>}

                    <Button type="submit" disabled={signupLoading} className="w-full h-14 bg-primary hover:bg-primary/90 text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-xl">
                      {signupLoading ? "Creating..." : "Sign Up"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>

                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                      <div className="relative flex justify-center text-[8px] uppercase tracking-[0.3em] font-bold text-muted-foreground opacity-30"><span className="bg-transparent px-4 italic">Social Connect</span></div>
                    </div>

                    <div className="flex gap-4 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-full w-12 h-12 hover:border-primary/50 transition-all bg-white/5"
                        disabled={isLoading}
                      >
                        <Mail className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="rounded-full w-12 h-12 hover:border-primary/50 transition-all bg-white/5"
                        disabled={isLoading}
                      >
                        <Twitter className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>

    </div>
  );
}
