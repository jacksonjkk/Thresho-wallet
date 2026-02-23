import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Wallet, Copy, Check, ArrowRight, ShieldCheck, Cpu } from "lucide-react";
import { useState } from "react";
import SignClient from "@walletconnect/sign-client";
import { WalletConnectModal } from "@walletconnect/modal";
import { useAuth } from "@/app/context/AuthContext";
import { authService } from "@/services/auth.service";
import { freighterService } from "@/services/freighter.service";
import { motion } from "motion/react";
import { toast } from "sonner";

// WalletConnect v2 Project ID — set VITE_WALLETCONNECT_PROJECT_ID in your .env.local
const WC_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? "";

// Stellar CAIP-2 chain IDs
const STELLAR_CHAIN = "stellar:pubnet"; // use "stellar:testnet" for testnet


interface ConnectWalletPageProps {
  onNext: () => void;
  onSkip: () => void;
}

export function ConnectWalletPage({ onNext, onSkip }: ConnectWalletPageProps) {
  const { connectWallet, isLoading } = useAuth();
  const [publicKey, setPublicKey] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5 }
    }
  };

  const handleConnectWallet = async () => {
    setError("");

    if (!publicKey.trim()) {
      setError("Input valid cryptographic key");
      return;
    }

    if (!publicKey.startsWith("G") || publicKey.length !== 56) {
      setError("Invalid key signature format");
      return;
    }

    try {
      await connectWallet(publicKey, "");
      setIsConnected(true);
      toast.success("Wallet Synchronized");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Synchronization failed");
    }
  };

  const handleConnectFreighterOrWalletConnect = async () => {
    setError("");
    // Try Freighter extension first
    try {
      const freighterPublicKey = await freighterService.connect();
      const challenge = await authService.getChallenge(freighterPublicKey);
      const signedXdr = await freighterService.signChallenge(
        challenge.challengeXdr,
        challenge.networkPassphrase
      );
      await connectWallet(freighterPublicKey, signedXdr);
      setPublicKey(freighterPublicKey);
      setIsConnected(true);
      toast.success("Freighter Node Connected");
      return;
    } catch (err) {
      // If Freighter fails, fallback to WalletConnect
      console.log("Freighter not available, falling back to WalletConnect", err);
    }

    // ── WalletConnect v2 + Stellar SEP-10 flow ──────────────────────────────
    let modal: WalletConnectModal | null = null;

    try {
      if (!WC_PROJECT_ID) {
        setError("WalletConnect project ID is not configured. Set VITE_WALLETCONNECT_PROJECT_ID in .env.local");
        return;
      }

      // 1. Create the QR modal instance
      modal = new WalletConnectModal({
        projectId: WC_PROJECT_ID,
        themeMode: "dark",
        chains: [STELLAR_CHAIN],
      });

      // 2. Init SignClient
      const signClient = await SignClient.init({
        projectId: WC_PROJECT_ID,
        metadata: {
          name: "Thresho Multisig Wallet",
          description: "Stellar multisignature wallet powered by Thresho",
          url: window.location.origin,
          icons: [`${window.location.origin}/favicon.ico`],
        },
      });

      // 3. Create a WalletConnect session for Stellar
      const { uri, approval } = await signClient.connect({
        requiredNamespaces: {
          stellar: {
            methods: ["stellar_signTransaction", "stellar_signAndSendTransaction"],
            chains: [STELLAR_CHAIN],
            events: [],
          },
        },
      });

      // 4. Show QR code modal so the user can scan with their mobile wallet
      if (uri) {
        await modal.openModal({ uri });
        toast("Scan the QR code with your Stellar wallet app");
      }

      // 5. Wait for the user to approve the session on their wallet
      const session = await approval();
      modal.closeModal();

      // 6. Extract public key from CAIP-10 account string
      //    Format: "stellar:pubnet:GABCD..." → take last segment
      const accounts = session.namespaces.stellar?.accounts ?? [];
      if (accounts.length === 0) throw new Error("No Stellar account returned from WalletConnect session");
      const wcPublicKey = accounts[0].split(":").pop();
      if (!wcPublicKey || !wcPublicKey.match(/^G[A-Z2-7]{55}$/)) {
        throw new Error("WalletConnect returned an invalid Stellar public key");
      }

      toast("Connected — requesting SEP-10 challenge signature…");

      // 7. Get SEP-10 challenge XDR from the backend
      const { challengeXdr, networkPassphrase } = await authService.getChallenge(wcPublicKey);

      // 8. Ask the wallet to sign the challenge XDR via WalletConnect
      const signResult = await signClient.request<{ signedXdr: string }>({
        topic: session.topic,
        chainId: STELLAR_CHAIN,
        request: {
          method: "stellar_signTransaction",
          params: {
            xdr: challengeXdr,
            networkPassphrase,
          },
        },
      });

      const signedXdr =
        typeof signResult === "string"
          ? signResult
          : signResult?.signedXdr ?? "";

      if (!signedXdr) throw new Error("WalletConnect wallet did not return a signed XDR");

      // 9. Verify challenge with backend and complete wallet connection
      await connectWallet(wcPublicKey, signedXdr);
      setPublicKey(wcPublicKey);
      setIsConnected(true);
      toast.success("WalletConnect wallet linked successfully!");
    } catch (err) {
      modal?.closeModal();
      setError("WalletConnect failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full scale-150 pointer-events-none"></div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-xl relative z-10"
        >
          <Card className="border border-white/5 bg-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-status-success/50 via-status-success to-status-success/50"></div>

            <CardHeader className="text-center space-y-6 pt-12">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-status-success/20 blur-2xl rounded-full scale-150"></div>
                  <div className="bg-black/40 rounded-3xl p-5 border border-white/10 relative z-10">
                    <ShieldCheck className="w-16 h-16 text-status-success" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-bold tracking-tight">Success!</CardTitle>
                <CardDescription className="text-xs uppercase font-bold tracking-[0.2em] text-status-success/70">
                  Your wallet is now linked
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-10 px-8 pb-12">
              <div className="bg-white/5 p-5 rounded-2xl border border-white/10 group">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50 mb-3">Linked Public Key</p>
                <div className="flex items-center gap-4 bg-black/20 p-3 rounded-xl border border-white/5">
                  <code className="text-xs font-mono text-primary/90 truncate flex-1">
                    {publicKey}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(publicKey)}
                    className="h-8 w-8 rounded-lg hover:bg-white/10"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-status-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                onClick={onNext}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-sm font-bold uppercase tracking-widest rounded-xl shadow-xl group"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
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

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-xl relative z-10"
      >
        <Card className="border border-white/5 bg-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50"></div>

          <CardHeader className="text-center space-y-6 pt-12">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150"></div>
                <div className="bg-black/40 rounded-3xl p-5 border border-white/10 relative z-10">
                  <Cpu className="w-16 h-16 text-primary" />
                </div>
              </div>
            </div>
            <div className="space-y-2 text-center">
              <CardTitle className="text-3xl font-bold tracking-tight">Protect Your Wallet</CardTitle>
              <CardDescription className="text-xs uppercase font-bold tracking-[0.2em] text-muted-foreground opacity-60">
                Link your Stellar account to get started
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 px-6 sm:px-12 pb-12">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="public-key" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">Enter Public Key</Label>
                <Input
                  id="public-key"
                  placeholder="G..."
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  disabled={isLoading}
                  className="h-12 bg-white/5 border-white/5 font-mono text-xs focus:ring-primary/50 rounded-xl"
                />
                {error && (
                  <div className="text-[10px] font-bold text-status-error uppercase tracking-widest bg-status-error/5 p-3 rounded-lg border border-status-error/10">
                    {error}
                  </div>
                )}
              </div>

              <div className="grid gap-4">
                <Button
                  onClick={handleConnectWallet}
                  disabled={isLoading || !publicKey.trim()}
                  className="w-full h-14 bg-primary hover:bg-primary/90 text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg"
                >
                  {isLoading ? "Connecting..." : "Connect Key"}
                </Button>

                <div className="relative flex items-center gap-4 py-2">
                  <div className="h-px bg-white/5 flex-1"></div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-30">OR</span>
                  <div className="h-px bg-white/5 flex-1"></div>
                </div>

                <Button
                  type="button"
                  onClick={handleConnectFreighterOrWalletConnect}
                  disabled={isLoading}
                  className="w-full h-14 bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center px-4"
                >
                  <Wallet className="w-5 h-5 mr-3 text-primary opacity-70" />
                  <span className="truncate">Connect with Freighter</span>
                </Button>
              </div>
            </div>

            <div className="text-center">
              <Button
                variant="link"
                onClick={onSkip}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors h-auto p-0"
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
