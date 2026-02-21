import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Link2, AlertCircle, Plus, ShieldCheck, Cpu, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { inviteService } from "@/services/invite.service";
import { motion } from "motion/react";
import { toast } from "sonner";

interface AccountSetupPageProps {
  onComplete: () => void;
}

export function AccountSetupPage({ onComplete }: AccountSetupPageProps) {
  const { user, isLoading, completeOnboarding, saveAccountData, refreshAccountData } = useAuth();

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[AccountSetupPage] user:', user);
  }, [user]);

  const [activeTab, setActiveTab] = useState("create");
  const [accountName, setAccountName] = useState("");
  const [threshold, setThreshold] = useState("2");
  const [invitationCode, setInvitationCode] = useState("");
  const [error, setError] = useState("");

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.98, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

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
    setError("");

    if (!accountName.trim()) {
      setError("Please name your Vault");
      return;
    }

    const thresholdNum = parseInt(threshold);
    if (isNaN(thresholdNum) || thresholdNum < 1 || thresholdNum > 15) {
      setError("Consensus must be between 1 and 15");
      return;
    }

    try {
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

      await completeOnboarding();
      toast.success("Vault Initialized");
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Vault creation failed");
    }
  };

  const handleJoinAccount = async () => {
    setError("");

    if (!invitationCode.trim()) {
      setError("Input valid activation code");
      return;
    }

    try {
      if (!user?.publicKey) {
        setError("Cryptographic identity not found");
        return;
      }

      await inviteService.joinWithInvite(invitationCode, {
        publicKey: user.publicKey,
        name: `${user.firstName} ${user.lastName}`,
      });

      localStorage.removeItem('pendingInviteCode');
      await completeOnboarding();
      await refreshAccountData();
      toast.success("Successfully joined the Vault");
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Access request failed");
    }
  };

  if (!user?.walletConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-status-error/5 blur-[120px] rounded-full scale-150 pointer-events-none"></div>
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-xl relative z-10">
          <Card className="border border-status-error/20 bg-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <CardHeader className="text-center space-y-6 pt-12 pb-8">
              <div className="flex justify-center">
                <div className="bg-status-error/10 rounded-full p-5 border border-status-error/20">
                  <AlertCircle className="w-16 h-16 text-status-error" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight">Need Wallet</CardTitle>
              <CardDescription className="uppercase font-bold tracking-widest text-[10px] text-status-error/60">
                Please connect your Stellar wallet to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-12">
              <Button onClick={() => window.location.reload()} className="w-full h-14 bg-status-error/10 hover:bg-status-error/20 text-status-error border border-status-error/30 rounded-xl font-bold uppercase tracking-widest text-xs">
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full scale-150 pointer-events-none"></div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-2xl relative z-10">
        <Card className="border border-white/5 bg-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50"></div>

          <CardHeader className="text-center space-y-2 pt-12 pb-6">
            <CardTitle className="text-3xl font-bold tracking-tight">Wallet Setup</CardTitle>
            <CardDescription className="text-xs uppercase font-bold tracking-[0.2em] text-muted-foreground opacity-60">
              Create a new shared wallet or join an existing one
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 sm:px-12 pb-12">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-10 h-14 p-1.5 bg-black/40 border border-white/5 rounded-2xl">
                <TabsTrigger value="create" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">New Wallet</TabsTrigger>
                <TabsTrigger value="join" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-bold text-xs uppercase tracking-widest">Join Team</TabsTrigger>
              </TabsList>

              <TabsContent value="create" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex gap-4 items-center mb-8">
                  <Cpu className="w-6 h-6 text-primary shrink-0" />
                  <p className="text-xs text-primary/80 font-medium">Create a high-security shared vault with custom consensus protocols.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2.5">
                    <Label htmlFor="account-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70 ml-1">Wallet Name</Label>
                    <Input
                      id="account-name"
                      placeholder="e.g., Team Savings"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      disabled={isLoading}
                      className="h-12 bg-white/5 border-white/5 hover:border-white/10 focus:ring-primary/50 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <Label htmlFor="threshold" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70 ml-1">Approvals Required</Label>
                    <p className="text-[10px] text-muted-foreground font-medium opacity-50 ml-1 italic">Number of people needed to confirm a transaction.</p>
                    <Input
                      id="threshold"
                      type="number"
                      min="1"
                      max="15"
                      placeholder="2"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      disabled={isLoading}
                      className="h-12 bg-white/5 border-white/5 hover:border-white/10 focus:ring-primary/50 rounded-xl text-xs font-medium"
                    />
                  </div>

                  {error && (
                    <div className="text-[10px] font-bold text-status-error uppercase tracking-widest bg-status-error/5 p-3 rounded-lg border border-status-error/10">
                      {error}
                    </div>
                  )}

                  <div className="pt-6">
                    <Button
                      onClick={handleCreateAccount}
                      disabled={isLoading || !accountName.trim() || !threshold}
                      className="w-full h-14 bg-primary hover:bg-primary/90 text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-xl group"
                    >
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      {isLoading ? "Creating..." : "Create Shared Wallet"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="join" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-blue-400/5 p-4 rounded-xl border border-blue-400/20 flex gap-4 items-center mb-8">
                  <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0" />
                  <p className="text-xs text-blue-400/80 font-medium">Request permission to join a vault using an authorized activation code.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <Label htmlFor="invitation-code" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70 ml-1">Invite Code</Label>
                    <Input
                      id="invitation-code"
                      placeholder="Enter your invite code..."
                      value={invitationCode}
                      onChange={(e) => setInvitationCode(e.target.value)}
                      disabled={isLoading}
                      className="h-12 bg-white/5 border-white/5 hover:border-white/10 focus:ring-primary/50 rounded-xl text-xs font-medium font-mono"
                    />
                  </div>

                  {error && (
                    <div className="text-[10px] font-bold text-status-error uppercase tracking-widest bg-status-error/5 p-3 rounded-lg border border-status-error/10">
                      {error}
                    </div>
                  )}

                  <div className="pt-4">
                    <Button
                      onClick={handleJoinAccount}
                      disabled={isLoading || !invitationCode.trim()}
                      className="w-full h-14 bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all"
                    >
                      <Link2 className="w-4 h-4 mr-2 text-primary opacity-60" />
                      {isLoading ? "Joining..." : "Join Team Wallet"}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
