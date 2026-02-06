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
              
              {/* Visual Multi-Sig Illustration */}
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

        {/* Right Side - Signup Form */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md border-0 shadow-2xl">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4 lg:hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-3">
                  <img src="/logo.png" alt="Thresho" className="w-16 h-16" />
                </div>
              </div>
              <CardTitle className="text-center">Create Account</CardTitle>
              <CardDescription className="text-center">
                Join Thresho to manage secure multi-sig transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={isLoading || success}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={isLoading || success}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || success}
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
                      disabled={isLoading || success}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                      disabled={isLoading || success}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading || success}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                      disabled={loading || success}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
                    Account created successfully! Redirecting to login...
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={loading || success}
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>

                <div className="text-center text-sm pt-4">
                  <p className="text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={onLoginClick}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Sign in here
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
