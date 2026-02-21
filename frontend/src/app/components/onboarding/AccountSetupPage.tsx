import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Link2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { inviteService } from "@/services/invite.service";

interface AccountSetupPageProps {
  onComplete: () => void;
}

export function AccountSetupPage({ onComplete }: AccountSetupPageProps) {
  const { user, isLoading, completeOnboarding, saveAccountData, refreshAccountData } = useAuth();
  // Debug: log token and user state
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[AccountSetupPage] user:', user);
    // eslint-disable-next-line no-console
    console.log('[AccountSetupPage] token:', localStorage.getItem('token'));
  }, [user]);
  const [activeTab, setActiveTab] = useState("create");
  const [accountName, setAccountName] = useState("");
  const [threshold, setThreshold] = useState("2");
  const [invitationCode, setInvitationCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite') || localStorage.getItem('pendingInviteCode');
    if (invite) {
      setInvitationCode(invite);
      setActiveTab('join');
      localStorage.setItem('pendingInviteCode', invite);
    }
  }, []);

  const handleCreateAccount = async () => {
    // Debug: log before API call
    // eslint-disable-next-line no-console
    console.log('[AccountSetupPage] handleCreateAccount: token:', localStorage.getItem('token'));
    setError("");

    if (!accountName.trim()) {
      setError("Please enter an account name");
      return;
    }

    const thresholdNum = parseInt(threshold);
    if (isNaN(thresholdNum) || thresholdNum < 1 || thresholdNum > 15) {
      setError("Threshold must be between 1 and 15");
      return;
    }

    try {
      // Add the account owner as the first signer
      const ownerSigner = {
        name: `${user?.firstName} ${user?.lastName}`,
        publicKey: user?.publicKey || `OWNER_${Date.now()}`,
        weight: 1,
        role: 'owner' as const
      };

      await saveAccountData({
        name: accountName,
        threshold: thresholdNum,
        signers: [ownerSigner]
      });

      // Mark onboarding as complete
      await completeOnboarding();
      
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    }
  };

  const handleJoinAccount = async () => {
    // Debug: log before API call
    // eslint-disable-next-line no-console
    console.log('[AccountSetupPage] handleJoinAccount: token:', localStorage.getItem('token'));
    setError("");

    if (!invitationCode.trim()) {
      setError("Please enter an invitation code");
      return;
    }

    try {
      if (!user?.publicKey) {
        setError("Please connect your wallet before joining an account");
        return;
      }

      await inviteService.joinWithInvite(invitationCode, {
        publicKey: user.publicKey,
        name: `${user.firstName} ${user.lastName}`,
      });

      localStorage.removeItem('pendingInviteCode');

      await completeOnboarding();
      await refreshAccountData();
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join account");
    }
  };

  if (!user?.walletConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50">
        <div className="w-full max-w-2xl">
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full p-3">
                  <AlertCircle className="w-12 h-12 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl">Wallet Connection Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <AlertDescription>
                  Please connect your Stellar wallet before setting up an account.
                </AlertDescription>
              </Alert>
              <Button onClick={onComplete} className="w-full">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50">
      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-3xl">Set Up Your Account</CardTitle>
            <CardDescription>
              Choose to create a new shared account or join an existing one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="create">Create New</TabsTrigger>
                <TabsTrigger value="join">Join Existing</TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-6">
                <Alert>
                  <AlertDescription>
                    Create a new shared account with configurable approval thresholds
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="account-name" className="text-base">
                      Account Name
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      A descriptive name for your shared account
                    </p>
                    <Input
                      id="account-name"
                      placeholder="e.g., Team Treasury, Family Fund"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="threshold" className="text-base">
                      Approval Threshold
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Number of signers required to approve transactions (can be modified later)
                    </p>
                    <Input
                      id="threshold"
                      type="number"
                      min="1"
                      max="15"
                      placeholder="2"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleCreateAccount}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-lg py-6"
                  >
                    Create Account
                  </Button>

                  <Alert>
                    <AlertDescription>
                      💡 You can add signers and manage permissions in Settings after account creation.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>

              <TabsContent value="join" className="space-y-6">
                <Alert>
                  <AlertDescription>
                    Join an existing shared account using an invitation code from the account creator
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="invitation-code" className="text-base">
                      Invitation Code
                    </Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Provided by the account creator
                    </p>
                    <Input
                      id="invitation-code"
                      placeholder="Enter your invitation code"
                      value={invitationCode}
                      onChange={(e) => setInvitationCode(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handleJoinAccount}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-lg py-6"
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    {isLoading ? "Joining Account..." : "Join Account"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
