import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Wallet, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { authService } from "@/services/auth.service";
import { freighterService } from "@/services/freighter.service";

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

  const handleConnectWallet = async () => {
    setError("");
    
    if (!publicKey.trim()) {
      setError("Please enter a valid Stellar public key");
      return;
    }

    // Basic validation: Stellar public keys start with 'G' and are 56 characters
    if (!publicKey.startsWith("G") || publicKey.length !== 56) {
      setError("Invalid Stellar public key format");
      return;
    }

    try {
      // Manual input: connect without signature verification
      await connectWallet(publicKey, "");
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  };

  const handleConnectFreighter = async () => {
    setError("");
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect with Freighter");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-cyan-50 to-purple-50">
        <div className="w-full max-w-2xl">
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full p-3">
                  <Check className="w-12 h-12 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl">Wallet Connected!</CardTitle>
              <CardDescription>
                Your Stellar wallet has been successfully connected
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-100">
                <p className="text-sm text-muted-foreground mb-2">Connected Wallet Public Key:</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-foreground truncate">
                    {publicKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(publicKey)}
                    className="p-2 hover:bg-white rounded"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                onClick={onNext}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-lg py-6"
              >
                Continue to Account Setup
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
            <div className="flex justify-center">
              <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full p-3">
                <Wallet className="w-12 h-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl">Connect Your Stellar Wallet</CardTitle>
            <CardDescription>
              Link your Stellar wallet to enable transaction management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertDescription>
                We recommend using Freighter, the official Stellar wallet browser extension.
                <a
                  href="https://freighter.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Download Freighter →
                </a>
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label htmlFor="public-key" className="text-base">
                  Stellar Public Key
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Enter your Stellar public key (starts with 'G' and is 56 characters long)
                </p>
                <Input
                  id="public-key"
                  placeholder="GBRPYHIL2CI3WHZDTOOQFC6EB4RBEZA4F64IDWF4XZQD4VRLTVH7LWHD"
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  disabled={isLoading}
                  className="font-mono text-sm"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleConnectWallet}
                disabled={isLoading || !publicKey.trim()}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-lg py-6"
              >
                {isLoading ? "Connecting..." : "Connect Wallet"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleConnectFreighter}
                disabled={isLoading}
                className="w-full text-lg py-6"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Freighter Wallet
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={onSkip}
              className="w-full text-muted-foreground"
            >
              Skip for now
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
