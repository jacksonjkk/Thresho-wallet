import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { CheckCircle2, Lock, Users, LogOut } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";

interface WelcomePageProps {
  onNext: () => void;
}

export function WelcomePage({ onNext }: WelcomePageProps) {
  const { logout } = useAuth();

  const handleSkip = () => {
    logout();
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50">
      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full p-3">
                <img src="/logo.png" alt="Thresho" className="w-20 h-20" />
              </div>
            </div>
            <CardTitle className="text-3xl">Welcome to Thresho</CardTitle>
            <CardDescription className="text-lg">
              Your secure multi-signature wallet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100">
                    <Lock className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Multi-Signature Security</h3>
                  <p className="text-muted-foreground">
                    Thresho uses Stellar's multi-signature (threshold) accounts to ensure secure collaborative management of shared funds. Multiple approvals are required for transactions.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-cyan-100">
                    <Users className="h-6 w-6 text-cyan-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Collaborative Management</h3>
                  <p className="text-muted-foreground">
                    Manage shared accounts with team members or family. Each participant can approve or reject transactions based on the configured threshold rules.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100">
                    <CheckCircle2 className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Full Control</h3>
                  <p className="text-muted-foreground">
                    You retain complete control. Connect your own Stellar wallet and set up custom approval requirements for your accounts.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-muted-foreground">
                Let's set up your account in just a few steps. You'll connect your Stellar wallet and configure your shared account settings.
              </p>
            </div>

            <Button
              onClick={onNext}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg py-6"
            >
              Continue to Wallet Setup
            </Button>

            <Button
              onClick={handleSkip}
              variant="outline"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
