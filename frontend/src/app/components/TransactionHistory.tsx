import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  ExternalLink
} from "lucide-react";
import { transactionService, Transaction as apiTransaction } from "@/services/transaction.service";
import { accountService } from "@/services/account.service";
import { useAuth } from "@/app/context/AuthContext";
import { format } from "date-fns";
import { useEffect, useState } from "react";

interface Transaction {
  id: string;
  hash: string;
  type: "send" | "receive" | "deposit";
  amount: string;
  asset: string;
  from: string;
  to: string;
  timestamp: string;
  date: string;
  status: "completed" | "failed" | "pending";
  memo?: string;
  fee: string;
  onChain?: boolean;
  rawDate: Date;
}

interface TransactionHistoryProps {
  onNavigate: (page: string) => void;
}

export function TransactionHistory({ onNavigate }: TransactionHistoryProps) {
  const { user } = useAuth();
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterAsset, setFilterAsset] = useState("all");

  const truncateAddress = (addr: string) => {
    if (!addr || addr.length < 20) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.accountId) return;
      try {
        setLoading(true);
        const [info, acc] = await Promise.all([
          accountService.getAccountWalletInfo(user.accountId),
          accountService.getAccount(user.accountId)
        ]);

        const [txs, onChain] = await Promise.all([
          transactionService.getTransactionsByAccount(user.accountId),
          transactionService.getOnChainHistory(info.publicKey)
        ]);

        const mappedInternal: Transaction[] = txs.map(tx => ({
          id: tx.id,
          hash: tx.id,
          type: tx.creator.id === user.id ? "send" : "receive",
          amount: tx.amount,
          asset: tx.asset || "XLM",
          from: tx.creator.firstName,
          to: tx.to,
          timestamp: format(new Date(tx.createdAt), "hh:mm a"),
          date: format(new Date(tx.createdAt), "MMM dd, yyyy"),
          status: tx.status === 'executed' ? "completed" : tx.status === 'rejected' ? "failed" : "pending",
          memo: tx.memo,
          fee: "0.00001",
          rawDate: new Date(tx.createdAt)
        }));

        const mappedOnChain: Transaction[] = (onChain || [])
          .filter(tx => tx.type === 'payment' || tx.type === 'create_account' || tx.type === 'path_payment_strict_receive' || tx.type === 'path_payment_strict_send')
          .map(tx => {
            const dest = tx.to || tx.account || '';
            const src = tx.from || tx.funder || '';
            const amt = tx.amount || tx.starting_balance || '0';
            const isIncoming = dest === info.publicKey;
            return {
              id: tx.id,
              hash: tx.id,
              type: isIncoming ? "deposit" as const : "send" as const,
              amount: amt,
              asset: tx.asset_type === 'native' ? "XLM" : (tx.asset_code || "XLM"),
              from: src,
              to: dest,
              timestamp: format(new Date(tx.created_at), "hh:mm a"),
              date: format(new Date(tx.created_at), "MMM dd, yyyy"),
              status: "completed" as const,
              memo: "",
              fee: tx.fee_charged || "0.00001",
              onChain: true,
              rawDate: new Date(tx.created_at)
            };
          });

        const allTxs = [...mappedInternal.filter(t => t.status !== 'completed'), ...mappedOnChain]
          .sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

        setHistory(allTxs);
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user?.accountId]);

  const stats = {
    totalSent: history.filter(tx => tx.type === "send" && tx.status === "completed")
      .reduce((acc, tx) => acc + Number(tx.amount), 0),
    totalReceived: history.filter(tx => (tx.type === "receive" || tx.type === "deposit") && tx.status === "completed")
      .reduce((acc, tx) => acc + Number(tx.amount), 0),
    completedCount: history.filter(tx => tx.status === "completed").length,
    totalCount: history.length
  };

  const filteredTransactions = history.filter(tx => {
    const matchesSearch =
      tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.memo && tx.memo.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === "all" || tx.type === filterType;
    const matchesAsset = filterAsset === "all" || tx.asset === filterAsset;

    return matchesSearch && matchesType && matchesAsset;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center">
        <div className="flex-1">
          <h1 className="text-4xl font-bold tracking-tight">Transaction <span className="text-primary">History</span></h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60 mt-1">Full record of all wallet activity</p>
        </div>
        <Button variant="outline" className="hidden sm:flex bg-white/5 border-white/5 hover:border-primary/50 text-[10px] font-bold uppercase tracking-widest px-6 h-10">
          <Download className="w-4 h-4 mr-2" />
          EXPORT DATA
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Sent', value: stats.totalSent.toLocaleString(), suffix: 'XLM' },
          { label: 'Total Received', value: stats.totalReceived.toLocaleString(), suffix: 'XLM' },
          { label: 'Confirmed', value: stats.completedCount, suffix: 'TXS' },
          { label: 'All Transactions', value: stats.totalCount, suffix: 'TXS' },
        ].map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/2 rounded-full blur-2xl -mr-12 -mt-12 transition-colors group-hover:bg-primary/5"></div>
            <CardContent className="p-6">
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-40 mb-3">{stat.label}</div>
              <div className="text-2xl font-bold tracking-tighter">
                {stat.value} <span className="text-[10px] opacity-40 uppercase ml-0.5">{stat.suffix}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-[#17171C]/50 border-white/5">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="SEARCH BY HASH OR ADDRESS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-white/5 border-white/10 hover:border-white/20 focus:border-primary/50 transition-all rounded-xl text-[10px] font-bold uppercase tracking-widest"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-12 bg-white/5 border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest px-4">
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-3 opacity-40" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ALL ACTIVITY</SelectItem>
                <SelectItem value="send">SENT</SelectItem>
                <SelectItem value="receive">RECEIVED</SelectItem>
                <SelectItem value="deposit">DEPOSITS</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAsset} onValueChange={setFilterAsset}>
              <SelectTrigger className="h-12 bg-white/5 border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest px-4">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ALL ASSETS</SelectItem>
                <SelectItem value="XLM">XLM</SelectItem>
                <SelectItem value="USDC">USDC (BRIDGED)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Activity Log</CardTitle>
              <CardDescription>
                Showing {filteredTransactions.length} of {history.length} transactions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl opacity-40">
              <div className="flex justify-center mb-6">
                <Search className="w-12 h-12 text-muted-foreground/50" />
              </div>
              <h3 className="text-xs uppercase font-bold tracking-[0.2em] mb-2">No Transactions Found</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 group gap-4 sm:gap-6"
                >
                  <div className="flex items-center space-x-4 sm:space-x-6 flex-1 min-w-0">
                    {/* Icon */}
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

                    {/* Transaction Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                        <span className="font-bold text-[10px] sm:text-sm uppercase tracking-tight truncate">
                          {tx.type === "deposit" ? "DEPOSIT" : tx.type === "send" ? "OUTGOING" : "INCOMING"}
                        </span>
                        <div
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${tx.status === "completed"
                            ? "bg-status-success/10 text-status-success border border-status-success/20"
                            : tx.status === "pending"
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : "bg-status-error/10 text-status-error border border-status-error/20"
                            }`}
                        >
                          {tx.status}
                        </div>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-2">
                        <span className="font-mono text-primary/70 truncate">{truncateAddress(tx.type === "send" ? tx.to : tx.from)}</span>
                        {tx.onChain && (
                          <div className="hidden xs:flex items-center gap-1 shrink-0">
                            <div className="w-1 h-1 rounded-full bg-status-success"></div>
                            <span className="text-[8px] font-bold text-status-success/60 uppercase tracking-widest">ON-CHAIN</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8">
                    {/* Date/Time (Mobile) */}
                    <div className="text-left sm:hidden">
                      <div className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground opacity-60 mb-0.5">{tx.date}</div>
                      <div className="text-[8px] text-muted-foreground font-bold opacity-30">{tx.timestamp}</div>
                    </div>

                    {/* Date/Time (Desktop) */}
                    <div className="text-right hidden md:block">
                      <div className="text-[10px] font-bold uppercase tracking-widest mb-1">{tx.date}</div>
                      <div className="text-[10px] text-muted-foreground font-bold opacity-40">{tx.timestamp}</div>
                    </div>

                    {/* Amount & Link */}
                    <div className="text-right sm:min-w-[120px]">
                      <div className="text-base sm:text-lg font-bold tracking-tighter sm:mb-1">
                        {tx.amount} <span className="text-[10px] font-medium opacity-40 uppercase ml-0.5">{tx.asset}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hidden sm:flex h-8 text-[9px] font-bold uppercase tracking-widest bg-white/5 border-white/5 hover:border-primary/50 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                        onClick={() => window.open(`https://stellar.expert/explorer/testnet/tx/${tx.id}`, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 mr-2" />
                        EXPLORER
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
