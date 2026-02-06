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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Illustration */}
        <div className="hidden lg:flex flex-col items-center justify-center space-y-8">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur-3xl opacity-20"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-blue-100">
              <div className="flex items-center justify-center mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-600 rounded-full blur-xl opacity-50"></div>
                  <div className="relative bg-white rounded-full p-6 shadow-lg">
                    <img src="/logo.png" alt="Thresho" className="w-32 h-32" />
                  </div>
                </div>
              </div>
              <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600 bg-clip-text text-transparent">
                Thresho
              </h1>
              <p className="text-center text-muted-foreground mb-8">
                Multi-Signature Blockchain Wallet
              </p>
              
              Visual Multi-Sig Illustration
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <img src="/logo.png" alt="Thresho" className="w-12 h-12" />
                  </div>
                  <div className="h-0.5 w-8 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-xl">
                  <Network className="w-6 h-6" />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-0.5 w-8 bg-gradient-to-r from-purple-500 to-purple-600"></div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <img src="/logo.png" alt="Thresho" className="w-12 h-12" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>Secure multi-signature transactions</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  <span>Enterprise-grade blockchain security</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span>Collaborative wallet management</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md border-0 shadow-2xl">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4 lg:hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-3">
                  <img src="/logo.png" alt="Thresho" className="w-16 h-16" />
                </div>
              </div>
              <CardTitle className="text-center">Welcome to Thresho</CardTitle>
              <CardDescription className="text-center">
                Sign in to your secure multi-sig wallet
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
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                        {loginError}
                      </div>
                    )}

                    <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t"></span>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleBiometricLogin}
                      disabled={isLoading}
                    >
                      <Fingerprint className="w-4 h-4 mr-2" />
                      Biometric Login
                    </Button>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t"></span>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={isLoading}
                        title="Continue with Gmail"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={isLoading}
                        title="Continue with X"
                      >
                        <Twitter className="w-4 h-4" />
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
                      <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                        {signupError}
                      </div>
                    )}

                    {signupSuccess && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                        Account created successfully! You can now log in.
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      disabled={signupLoading || isLoading}
                    >
                      {signupLoading ? "Creating account..." : "Create Account"}
                    </Button>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t"></span>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={signupLoading || isLoading}
                        title="Continue with Gmail"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={signupLoading || isLoading}
                        title="Continue with X"
                      >
                        <Twitter className="w-4 h-4" />
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
