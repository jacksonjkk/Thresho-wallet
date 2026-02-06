import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { 
  ArrowLeft, 
  Copy, 
  QrCode, 
  Shield, 
  User, 
  CheckCircle2,
  ExternalLink,
  Wallet
} from "lucide-react";
import { useEffect, useState } from "react";
import { authService } from "@/services/auth.service";
import { accountService } from "@/services/account.service";
import { useAuth } from "@/app/context/AuthContext";

interface Signer {
  address: string;
  name: string;
  weight: number;
  status: "active" | "inactive";
  addedDate?: string;
}

interface WalletAccountProps {
  onNavigate: (page: string) => void;
}

const accountInfo = {
  publicKey: "",
  balance: "0.00",
  asset: "XLM",
  network: "Stellar Testnet",
  created: ""
};

const thresholds = {
  low: 1,
  medium: 2,
  high: 3
};

export function WalletAccount({ onNavigate }: WalletAccountProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [wallet, setWallet] = useState(accountInfo);
  const [signers, setSigners] = useState<Signer[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const loadWallet = async () => {
      try {
        const info = await authService.getWalletInfo();
        const native = info.balances.find((b) => b.asset_type === 'native');
        setWallet({
          publicKey: info.publicKey,
          balance: native ? Number(native.balance).toLocaleString() : "0.00",
          asset: "XLM",
          network: "Stellar Testnet",
          created: "",
        });
      } catch (err) {
        console.error('Failed to load wallet info', err);
      }
    };

    loadWallet();
  }, []);

  useEffect(() => {
    const loadSigners = async () => {
      let accountId = user?.accountId;
      try {
        if (!accountId) {
          const accounts = await accountService.getUserAccounts();
          accountId = accounts?.[0]?.id;
        }

        if (!accountId) return;

        const members = await accountService.getMembers(accountId);
        const mapped = (members || []).map((s) => ({
          address: s.publicKey,
          name: s.name,
          weight: s.weight,
          status: "active" as const,
          addedDate: undefined,
        }));
        setSigners(mapped);
      } catch (err) {
        console.error('Failed to load signers', err);
      }
    };

    loadSigners();
  }, [user?.accountId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet.publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAddress = (address: string) => {
    if (!address) return;
    navigator.clipboard.writeText(address);
  };

  const formatPublicKey = (key: string) => {
    if (!key) return "-";
    if (key.length <= 12) return key;
    return `${key.slice(0, 4)}...${key.slice(-6)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => onNavigate("dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl">Wallet Account</h1>
          <p className="text-muted-foreground">View your wallet details and settings</p>
        </div>
      </div>

      {/* Account Overview */}
      <Card className="border-0 bg-gradient-to-br from-blue-600 via-cyan-500 to-purple-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardDescription className="text-blue-100">Account Balance</CardDescription>
              <CardTitle className="text-4xl mt-2">{wallet.balance} {wallet.asset}</CardTitle>
            </div>
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Wallet className="w-8 h-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm text-blue-100">
            <span>Network</span>
            <span className="font-medium text-white">{wallet.network}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-blue-100">
            <span>Created</span>
            <span className="font-medium text-white">{wallet.created || "-"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Public Key & QR Code */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Public Address</CardTitle>
            <CardDescription>Your Stellar wallet address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted border font-mono text-sm break-all">
              {wallet.publicKey || "-"}
            </div>
            <div className="flex space-x-3">
              <Button onClick={handleCopy} className="flex-1">
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Address
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowQR(!showQR)}>
                <QrCode className="w-4 h-4 mr-2" />
                {showQR ? "Hide" : "Show"} QR
              </Button>
              <Button variant="outline">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
            <CardDescription>Scan to receive</CardDescription>
          </CardHeader>
          <CardContent>
            {showQR ? (
              <div className="aspect-square bg-white rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                {/* Mock QR Code */}
                <div className="grid grid-cols-8 gap-1 p-4">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 ${
                        Math.random() > 0.5 ? "bg-foreground" : "bg-background"
                      }`}
                    ></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                <QrCode className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Multi-Sig Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Multi-Signature Configuration</CardTitle>
              <CardDescription>Current threshold and signer settings</CardDescription>
            </div>
            <Button variant="outline" onClick={() => onNavigate("settings")}>
              Manage
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Thresholds */}
          <div>
            <h4 className="mb-4">Signature Thresholds</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Low Security</span>
                  <Badge variant="outline">Transactions &lt; 100 XLM</Badge>
                </div>
                <div className="text-2xl font-medium">{thresholds.low} of {signers.length}</div>
              </div>
              <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Medium Security</span>
                  <Badge variant="outline" className="bg-white">Standard Operations</Badge>
                </div>
                <div className="text-2xl font-medium text-blue-600">{thresholds.medium} of {signers.length}</div>
              </div>
              <div className="p-4 rounded-lg border bg-purple-50 border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">High Security</span>
                  <Badge variant="outline" className="bg-white">Account Changes</Badge>
                </div>
                <div className="text-2xl font-medium text-purple-600">{thresholds.high} of {signers.length}</div>
              </div>
            </div>
          </div>

          {/* Signers List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4>Authorized Signers ({signers.length})</h4>
              <Button variant="outline" size="sm" onClick={() => onNavigate("settings")}>
                Add Signer
              </Button>
            </div>
            <div className="space-y-3">
              {signers.map((signer, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-medium flex items-center space-x-2">
                        <span>{signer.name}</span>
                        {signer.status === "active" && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono flex items-center space-x-2">
                        <span>{formatPublicKey(signer.address)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyAddress(signer.address)}
                          aria-label="Copy signer address"
                          title="Copy address"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Added {signer.addedDate}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-2">
                      Weight: {signer.weight}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      <Badge 
                        variant={signer.status === "active" ? "default" : "secondary"}
                        className={signer.status === "active" ? "bg-green-100 text-green-700" : ""}
                      >
                        {signer.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Multi-Sig Diagram */}
          <div className="p-6 rounded-lg border bg-gradient-to-br from-blue-50 to-purple-50">
            <h4 className="mb-4 text-center">Multi-Signature Approval Flow</h4>
            <div className="flex items-center justify-center space-x-4">
              {signers.map((signer, idx) => (
                <div key={idx} className="flex items-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-lg mb-2 mx-auto">
                      <Shield className="w-8 h-8" />
                    </div>
                    <div className="text-xs font-medium">{signer.name.split(" ")[0]}</div>
                  </div>
                  {idx < signers.length - 1 && (
                    <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 mx-2"></div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-4 text-sm text-muted-foreground">
              Requires {thresholds.medium} signatures for standard transactions
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>Manage your wallet settings and security</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button variant="outline" className="justify-start" onClick={() => onNavigate("settings")}>
              <Shield className="w-4 h-4 mr-2" />
              Security Settings
            </Button>
            <Button variant="outline" className="justify-start" onClick={() => onNavigate("history")}>
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </Button>
            <Button variant="outline" className="justify-start">
              <Copy className="w-4 h-4 mr-2" />
              Export Private Key
            </Button>
            <Button variant="outline" className="justify-start text-red-600 border-red-200 hover:bg-red-50">
              Disconnect Wallet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
