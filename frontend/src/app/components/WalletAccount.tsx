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
  Wallet,
  Trash2
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

export function WalletAccount({ onNavigate }: WalletAccountProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [thresholds, setThresholds] = useState({ low: 1, medium: 1, high: 1 });
  const [wallet, setWallet] = useState({
    publicKey: "",
    balance: "0.00",
    asset: "XLM",
    network: "Stellar Testnet",
    created: ""
  });
  const [signers, setSigners] = useState<Signer[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      let accountId = user?.accountId;
      try {
        if (!accountId) {
          const accounts = await accountService.getUserAccounts();
          accountId = accounts?.[0]?.id;
        }

        if (accountId) {
          const [info, account, members] = await Promise.all([
            accountService.getAccountWalletInfo(accountId),
            accountService.getAccount(accountId),
            accountService.getMembers(accountId)
          ]);

          const native = info.balances.find((b) => b.asset_type === 'native');
          setWallet({
            publicKey: info.publicKey,
            balance: native ? Number(native.balance).toLocaleString() : "0.00",
            asset: "XLM",
            network: 'Test Network',
            created: new Date(account.createdAt).toLocaleDateString(),
          });

          setIsOwner(account.owner.id === user?.id);
          setThresholds({
            low: 1,
            medium: account.threshold,
            high: account.threshold
          });

          const mapped = (members || []).map((s) => ({
            address: s.publicKey,
            name: s.name,
            weight: s.weight,
            status: "active" as const,
            addedDate: undefined,
          }));
          setSigners(mapped);
        } else {
          // No account assigned yet, show base wallet if connected
          const info = await authService.getWalletInfo();
          const native = info.balances.find((b) => b.asset_type === 'native');
          setWallet(prev => ({
            ...prev,
            publicKey: info.publicKey,
            balance: native ? Number(native.balance).toLocaleString() : "0.00",
          }));
        }
      } catch (err) {
        console.error('Failed to load wallet/signer info', err);
      }
    };

    loadData();
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onNavigate("dashboard")}
          className="rounded-full hover:bg-white/5 border border-white/5"
        >
          <ArrowLeft className="w-5 h-5 text-primary" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Wallet <span className="text-primary">Details</span></h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60 mt-1">Multi-sig account information</p>
        </div>
      </div>

      {/* Account Overview */}
      <Card className="relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[80px] -mr-24 -mt-24"></div>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1 text-left">
              <CardDescription>WALLET BALANCE</CardDescription>
              <CardTitle className="text-5xl font-bold tracking-tighter text-primary">{wallet.balance} {wallet.asset}</CardTitle>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 border-t border-white/5">
          <div className="grid grid-cols-2 gap-8 text-left">
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Network</div>
              <div className="font-bold tracking-tight">{wallet.network}</div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Created On</div>
              <div className="font-bold tracking-tight">{wallet.created || "INITIATING..."}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Public Key & QR Code */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 relative overflow-hidden">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Shield className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <CardTitle className="text-xl">Wallet Address</CardTitle>
                <CardDescription>Your public address on the Stellar network</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-5 rounded-2xl bg-[#0D0D11] border border-white/10 font-mono text-xs sm:text-sm break-all group relative overflow-hidden transition-all hover:border-primary/30">
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
              <span className="relative z-10 text-primary/90 leading-relaxed tracking-tight">{wallet.publicKey || "NOT CONNECTED"}</span>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button onClick={handleCopy} className="flex-1 min-w-full sm:min-w-[160px] shadow-lg">
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    COPIED
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    <span>COPY ADDRESS</span>
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowQR(!showQR)} className="flex-1 min-w-[calc(50%-8px)] sm:min-w-[120px] bg-white/5 border-white/10">
                <QrCode className="w-4 h-4 mr-2" />
                <span>{showQR ? "HIDE" : "SHOW"} QR</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(`https://stellar.expert/explorer/testnet/account/${wallet.publicKey}`, '_blank')}
                className="flex-1 min-w-[calc(50%-8px)] sm:min-w-[120px] bg-white/5 border-white/10"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                EXPLORER
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
                      className={`w-2 h-2 ${Math.random() > 0.5 ? "bg-foreground" : "bg-background"
                        }`}
                    ></div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="aspect-square bg-secondary/50 rounded-2xl flex items-center justify-center border border-white/5">
                <QrCode className="w-16 h-16 text-primary/50" />
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
              <div className="flex items-center gap-2 mb-1">
                <CardTitle>Multi-Signature Setup</CardTitle>
                {!isOwner && <Badge variant="outline">View Only</Badge>}
              </div>
              <CardDescription>Current approval requirements and signer settings</CardDescription>
            </div>
            {isOwner && (
              <Button variant="outline" onClick={() => onNavigate("settings")}>
                Manage
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Thresholds */}
          {/* Thresholds */}
          <div className="space-y-6 pt-2">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">Approval Thresholds</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Low Threshold', desc: 'Basic Tasks', value: thresholds.low },
                { label: 'Medium Threshold', desc: 'Standard Transfers', value: thresholds.medium },
                { label: 'High Threshold', desc: 'Secure Changes', value: thresholds.high },
              ].map((tier) => (
                <div key={tier.label} className="p-6 rounded-2xl border border-white/5 bg-white/5 hover:border-primary/20 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">{tier.label}</span>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest border-primary/20 text-primary">{tier.desc}</Badge>
                  </div>
                  <div className="text-3xl font-bold tracking-tighter">
                    {tier.value} <span className="text-sm font-medium text-muted-foreground opacity-40 uppercase">OF {signers.length} SIGNERS</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signers List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4>Authorized Signers ({signers.length})</h4>
              {isOwner && (
                <Button variant="outline" size="sm" onClick={() => onNavigate("settings")}>
                  Add Signer
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {signers.map((signer, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-white/5 bg-secondary/10 hover:bg-secondary/20 transition-all duration-300 gap-4 group">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white flex-shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.3)] group-hover:scale-110 transition-transform">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold flex items-center space-x-2 truncate text-base">
                        <span>{signer.name}</span>
                        {signer.status === "active" && (
                          <div className="w-2 h-2 rounded-full bg-status-success shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono flex items-center space-x-2">
                        <span className="truncate opacity-70">{formatPublicKey(signer.address)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleCopyAddress(signer.address)}
                          aria-label="Copy signer address"
                          title="Copy address"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t border-white/5 sm:border-t-0 pt-3 sm:pt-0">
                    <Badge variant="outline" className="sm:mb-2 whitespace-nowrap bg-primary/5 border-primary/20">
                      Weight: {signer.weight}
                    </Badge>
                    <Badge
                      variant={signer.status === "active" ? "default" : "secondary"}
                      className="capitalize px-3"
                    >
                      {signer.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Multi-Sig Diagram */}
          <div className="p-8 rounded-3xl border border-white/5 bg-[#0D0D11]/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/2 blur-[100px] rounded-full pointer-events-none"></div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60 text-center mb-10">Signer Network</h4>

            <div className="flex flex-wrap items-center justify-center gap-8 relative z-10">
              {signers.map((signer, idx) => (
                <div key={idx} className="flex items-center">
                  <div className="text-center group/node">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/40 blur-xl rounded-full opacity-0 group-hover/node:opacity-30 transition-opacity"></div>
                      <div className="w-20 h-20 rounded-2xl bg-[#1D1D26] flex items-center justify-center text-primary mb-4 mx-auto border border-white/10 shadow-2xl relative z-10 transition-transform duration-500 group-hover/node:scale-110 group-hover/node:bg-[#252530]">
                        <Shield className="w-10 h-10" />
                      </div>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-primary opacity-60 transition-opacity group-hover/node:opacity-100">{signer.name.split(" ")[0]}</div>
                    <div className="text-[8px] font-mono text-muted-foreground opacity-40 mt-1 uppercase">Weight: {signer.weight}</div>
                  </div>
                  {idx < signers.length - 1 && (
                    <div className="hidden sm:block w-16 h-px bg-gradient-to-r from-primary/40 via-primary/10 to-transparent mx-2 opacity-50 relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary/20 border border-primary/40 animate-pulse"></div>
                    </div>
                  )}
                </div>
              ))}

              {/* The Target */}
              <div className="flex items-center">
                <div className="hidden sm:block w-16 h-px bg-gradient-to-l from-status-success/40 via-status-success/10 to-transparent mx-2 opacity-50"></div>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-status-success/10 flex items-center justify-center text-status-success mx-auto border border-status-success/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-status-success mt-4">SUCCESS</div>
                </div>
              </div>
            </div>

            <p className="text-center mt-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40 max-w-sm mx-auto leading-relaxed text-left">
              Transactions require at least <span className="text-primary">{thresholds.medium} signatures</span> from the members above.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Wallet Actions</CardTitle>
              <CardDescription>Manage your wallet settings and data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2 bg-white/5 border-white/10 hover:border-primary/50" onClick={() => onNavigate("settings")}>
              <Shield className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Security</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2 bg-white/5 border-white/10 hover:border-primary/50"
              onClick={() => window.open(`https://stellar.expert/explorer/testnet/account/${wallet.publicKey}`, '_blank')}
            >
              <ExternalLink className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Explore</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-white/5 border-white/10 hover:border-primary/50">
              <Copy className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Export</span>
            </Button>
            {isOwner && (
              <Button variant="outline" className="h-20 flex-col gap-2 bg-white/5 border-status-error/20 text-status-error hover:bg-status-error/10 hover:border-status-error/50">
                <Trash2 className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Delete</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
