import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Send,
  Download,
  Shield,
  AlertCircle
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { authService } from "@/services/auth.service";
import { accountService } from "@/services/account.service";
import { transactionService, Transaction as apiTransaction } from "@/services/transaction.service";
import { freighterService } from "@/services/freighter.service";
import { marketService, MarketData } from "@/services/market.service";
import { useAuth } from "@/app/context/AuthContext";
import { ApprovalIndicator } from "@/app/components/ApprovalIndicator";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Transaction {
  id: string;
  type: "send" | "receive" | "deposit";
  amount: string;
  asset: string;
  recipient: string;
  timestamp: string;
  status: "completed" | "pending" | "rejected" | "executed";
  approvals?: number;
  required?: number;
  xdr?: string;
  signedByMe?: boolean;
  onChain?: boolean;
  rawDate: Date;
}

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const [balance, setBalance] = useState("0.00");
  const [isOwner, setIsOwner] = useState(false);
  const [account, setAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [market, setMarket] = useState<MarketData | null>(null);

  const truncateAddress = (addr: string) => {
    if (!addr || addr.length < 20) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const loadData = async (isRefresh = false) => {
    try {
      if (user?.accountId) {
        if (!isRefresh) setLoading(true);
        const [info, acc, marketData] = await Promise.all([
          accountService.getAccountWalletInfo(user.accountId),
          accountService.getAccount(user.accountId),
          marketService.getXLMPrice()
        ]);

        const [txs, pending, onChain] = await Promise.all([
          transactionService.getTransactionsByAccount(user.accountId),
          transactionService.getPendingTransactions(user.accountId),
          transactionService.getOnChainHistory(info.publicKey)
        ]);
        setMarket(marketData);

        const native = info.balances.find((b) => b.asset_type === 'native');
        setBalance(native ? Number(native.balance).toLocaleString() : "0.00");

        setAccount(acc);
        setIsOwner(acc.owner.id === user.id);

        const mapTxs = (list: apiTransaction[]): Transaction[] => list.map(tx => ({
          id: tx.id,
          type: tx.creator.id === user.id ? "send" : "receive",
          amount: tx.amount,
          asset: tx.asset || "XLM",
          recipient: tx.creator.id === user.id ? tx.to : tx.creator.firstName,
          timestamp: formatDistanceToNow(new Date(tx.createdAt), { addSuffix: true }),
          status: tx.status as any,
          approvals: tx.signatureCount,
          required: acc.threshold,
          xdr: tx.xdr,
          signedByMe: tx.signatures?.some(sig => sig === user?.publicKey),
          rawDate: new Date(tx.createdAt)
        }));

        const mapOnChain = (list: any[]): Transaction[] => {
          // Normalize Horizon operation fields (create_account uses account/funder, payment uses to/from)
          return list
            .filter(tx => tx.type === 'payment' || tx.type === 'create_account' || tx.type === 'path_payment_strict_receive' || tx.type === 'path_payment_strict_send')
            .map(tx => {
              const dest = tx.to || tx.account || '';
              const src = tx.from || tx.funder || '';
              const amt = tx.amount || tx.starting_balance || '0';
              const isIncoming = dest === info.publicKey;
              return {
                id: tx.id,
                type: isIncoming ? "deposit" as const : "send" as const,
                amount: amt,
                asset: tx.asset_type === 'native' ? "XLM" : (tx.asset_code || "XLM"),
                recipient: isIncoming ? src : dest,
                timestamp: formatDistanceToNow(new Date(tx.created_at), { addSuffix: true }),
                status: "completed" as const,
                onChain: true,
                rawDate: new Date(tx.created_at)
              };
            });
        };

        const internalTxs = mapTxs(txs);
        const externalTxs = mapOnChain(onChain || []);

        // Filter out internal txs that are already shown in onChain to avoid duplicates
        const allTxs = [...internalTxs.filter(t => t.status !== 'executed'), ...externalTxs]
          .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

        setTransactions(allTxs.slice(0, 4));
        setPendingApprovals(mapTxs(pending));
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds to keep balance and list up to date
    const interval = setInterval(() => {
      loadData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.accountId, user?.id]);

  const handleApprove = async (txId: string, xdr: string) => {
    if (!account) return;

    try {
      toast.loading("Signing transaction...");
      const networkPassphrase = import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";
      const signedXdr = await freighterService.signChallenge(xdr, networkPassphrase);

      await transactionService.signTransaction(txId, {
        signedXdr,
        signerPublicKey: user?.publicKey || ""
      });

      toast.dismiss();
      toast.success("Transaction approved!");
      loadData();
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.message || "Failed to approve transaction");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">Account <span className="text-primary">Dashboard</span></h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">Status: Account Connected</p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-3 rounded-2xl backdrop-blur-sm">
          <div className="text-right">
            <div className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">Wallet Address</div>
            <div className="text-[10px] font-mono font-bold tracking-tight text-primary/80">{user?.publicKey ? `${user.publicKey.slice(0, 6)}...${user.publicKey.slice(-4)}` : "DISCONNECTED"}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
          </div>
        </div>
      </div>

      {/* Balance Card with Gradient */}
      <Card className="border border-white/5 bg-[#17171C] text-white overflow-hidden relative shadow-2xl group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] -mr-40 -mt-40 transition-opacity group-hover:bg-primary/20 duration-700"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-[80px] -ml-24 -mb-24"></div>

        <CardHeader className="relative z-10 space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
            <CardDescription className="text-primary/70 font-bold uppercase tracking-[0.2em] text-[10px]">Total Available Balance</CardDescription>
          </div>
          <CardTitle className="text-4xl xs:text-5xl sm:text-6xl font-bold tracking-tighter mt-1 truncate">
            {balance} <span className="text-primary opacity-80">XLM</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 pt-4">
          {market && (
            <div className={`flex items-center space-x-3 text-[10px] mb-10 px-4 py-2 rounded-xl w-fit backdrop-blur-md border ${market.change24h >= 0
              ? 'bg-status-success/5 text-status-success border-status-success/10'
              : 'bg-status-error/5 text-status-error border-status-error/10'
              }`}>
              {market.change24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span className="font-bold uppercase tracking-widest">{market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}% <span className="opacity-40 ml-1">PRICE TREND (24H)</span></span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Button
              onClick={() => onNavigate("transaction-form")}
              className="h-14 text-sm font-bold uppercase tracking-widest shadow-lg"
              size="lg"
            >
              <Send className="w-4 h-4 mr-2 shrink-0" />
              SEND ASSETS
            </Button>
            <Button
              onClick={() => onNavigate("wallet")}
              variant="outline"
              className="h-14 text-sm font-bold uppercase tracking-widest bg-white/5 border-white/5 hover:bg-white/10"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2 shrink-0 text-primary" />
              RECEIVE ASSETS
            </Button>
            <Button
              onClick={() => onNavigate("pending")}
              variant="outline"
              className="h-14 text-sm font-bold uppercase tracking-widest bg-white/5 border-white/5 hover:bg-white/10"
              size="lg"
            >
              <Shield className="w-4 h-4 mr-2 shrink-0 text-primary" />
              PENDING
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:border-primary/20 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors"></div>
          <CardHeader className="pb-3 pt-6">
            <div className="flex items-center justify-between">
              <CardDescription className="font-bold uppercase tracking-widest text-[9px] text-muted-foreground opacity-60">Pending Signatures</CardDescription>
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="w-4 h-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-6 pt-0">
            <div className="text-4xl font-bold tracking-tighter mb-2">{pendingApprovals.length} <span className="text-sm font-medium opacity-40 uppercase">Pending</span></div>
            <Button
              variant="link"
              className="p-0 h-auto text-primary hover:text-primary decoration-primary/20 hover:decoration-primary font-bold text-[10px] uppercase tracking-[0.2em]"
              onClick={() => onNavigate("pending")}
            >
              VERIFY NOW →
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:border-status-success/20 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-status-success/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-status-success/10 transition-colors"></div>
          <CardHeader className="pb-3 pt-6">
            <div className="flex items-center justify-between">
              <CardDescription className="font-bold uppercase tracking-widest text-[9px] text-muted-foreground opacity-60">Completed History</CardDescription>
              <div className="p-2 rounded-lg bg-status-success/10">
                <CheckCircle2 className="w-4 h-4 text-status-success" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-6 pt-0">
            <div className="text-4xl font-bold tracking-tighter mb-2">
              {transactions.filter(tx => tx.status === 'executed' || tx.status === 'completed').length}
            </div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-status-success"></div>
              <p className="text-[9px] uppercase font-bold text-status-success tracking-widest">Network Confirmed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/20 transition-all group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors"></div>
          <CardHeader className="pb-3 pt-6">
            <div className="flex items-center justify-between">
              <CardDescription className="font-bold uppercase tracking-widest text-[9px] text-muted-foreground opacity-60">Wallet Signers</CardDescription>
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="w-4 h-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-6 pt-0">
            <div className="text-4xl font-bold tracking-tighter mb-2">
              {account?.signers?.length || 0}
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/5 border border-primary/20 rounded w-fit">
              <span className="text-[8px] font-bold uppercase tracking-widest text-primary opacity-80">{account?.threshold || 1} OF {account?.signers?.length || 0} REQUIRED</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Section */}
      {pendingApprovals.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Transactions awaiting your signature</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate("pending")}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingApprovals.map((tx: Transaction) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border border-white/5 bg-primary/5 hover:bg-primary/10 transition-all duration-300 gap-4"
              >
                <div className="flex items-center space-x-4 sm:space-x-5">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] shrink-0">
                    <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base sm:text-lg font-bold tracking-tight truncate">
                      {tx.amount} <span className="text-xs sm:text-sm font-normal text-muted-foreground">{tx.asset}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight truncate">
                      To: {truncateAddress(tx.recipient)} • {tx.timestamp}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end space-x-4 shrink-0">
                  <Badge variant="outline" className="bg-background/50 border-white/10 text-[9px] sm:text-[10px] uppercase font-bold tracking-tight">
                    {tx.approvals}/{tx.required} approvals
                  </Badge>
                  {tx.signedByMe ? (
                    <Badge variant="secondary" className="bg-white/5 text-muted-foreground border-white/10 text-[9px] sm:text-[10px] uppercase font-bold tracking-tight whitespace-nowrap">
                      Awaiting Others
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 rounded-lg shadow-lg h-8 sm:h-9 px-4 text-[10px] sm:text-xs"
                      onClick={() => handleApprove(tx.id, tx.xdr || "")}
                      disabled={loading}
                    >
                      Approve
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Recent Activity</CardTitle>
                <CardDescription>Real-time transaction history</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-[10px] font-bold uppercase tracking-widest bg-white/5 border-white/5 rounded-lg h-8"
              onClick={() => onNavigate("history")}
            >
              VIEW FULL HISTORY
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-white/5 rounded-2xl opacity-40">
                <div className="text-[10px] font-bold uppercase tracking-widest">Registry Clear</div>
              </div>
            ) : transactions.map((tx: Transaction) => (
              <div key={tx.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 gap-4">
                <div className="flex items-center space-x-4 min-w-0">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center relative transition-transform group-hover:scale-110 shrink-0 ${tx.type === "send"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-status-success/10 text-status-success border border-status-success/20"
                    }`}>
                    {tx.type === "send" ? (
                      <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-bold tracking-tight text-xs sm:text-sm uppercase truncate">
                      {tx.type === "deposit" ? "Inbound Deposit" : tx.type === "send" ? "Outgoing Proposal" : "Incoming Node"}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-2">
                      <span className="opacity-60">{tx.type === "send" ? "TO:" : "FROM:"}</span>
                      <span className="font-mono text-primary/70 truncate">{truncateAddress(tx.recipient || tx.from || "")}</span>
                      <span className="opacity-30 hidden xs:inline">•</span>
                      <span className="uppercase hidden xs:inline">{tx.timestamp}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0 border-t border-white/5 pt-3 sm:border-0 sm:pt-0">
                  <div className="text-sm sm:text-base font-bold tracking-tighter">
                    {tx.amount} <span className="text-[10px] opacity-40 uppercase ml-0.5">{tx.asset}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {tx.status === "pending" && tx.approvals !== undefined && (
                      <div className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[8px] font-bold text-amber-500 uppercase tracking-widest">
                        {tx.approvals}/{tx.required} SIGS
                      </div>
                    )}
                    <div
                      className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${tx.status === "executed" || tx.status === "completed"
                        ? "bg-status-success/10 text-status-success border border-status-success/20"
                        : tx.status === "pending"
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-status-error/10 text-status-error border border-status-error/20"
                        }`}
                    >
                      {tx.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}