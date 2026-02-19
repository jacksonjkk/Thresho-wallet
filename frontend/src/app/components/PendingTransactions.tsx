import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { ArrowLeft, Check, Clock, Shield, User, AlertCircle, Trash2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { transactionService, Transaction } from "@/services/transaction.service";
import { accountService, Account } from "@/services/account.service";
import { freighterService } from "@/services/freighter.service";
import { useAuth } from "@/app/context/AuthContext";

interface PendingTransactionsProps {
  onNavigate: (page: string) => void;
}

export function PendingTransactions({ onNavigate }: PendingTransactionsProps) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadData = async () => {
    if (!user?.accountId) return;
    try {
      setLoading(true);
      setError("");

      const [acc, txs] = await Promise.all([
        accountService.getAccount(user.accountId),
        transactionService.getTransactionsByAccount(user.accountId)
      ]);

      setAccount(acc);
      // Show pending and approved (but not executed/rejected)
      setTransactions(txs.filter(t => t.status === 'pending' || t.status === 'approved'));
    } catch (err) {
      console.error('Failed to load pending transactions:', err);
      setError("Failed to sync with the network. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.accountId]);

  const handleApprove = async (txId: string) => {
    if (!user?.publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    setActionLoading(`approve-${txId}`);
    try {
      const tx = await transactionService.getTransaction(txId);
      if (!tx.xdr) throw new Error("Transaction data is missing");

      const networkPassphrase = import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";

      toast.info("Please sign the transaction in Freighter");
      const signedXdr = await freighterService.signChallenge(tx.xdr, networkPassphrase);

      await transactionService.signTransaction(txId, {
        signedXdr,
        signerPublicKey: user.publicKey,
      });

      toast.success("Transaction approved successfully!");
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Approval failed";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (txId: string) => {
    if (!confirm("Are you sure you want to reject this transaction? This will notify other signers.")) return;

    setActionLoading(`reject-${txId}`);
    try {
      await transactionService.rejectTransaction(txId);
      toast.success("Transaction rejected");
      await loadData();
    } catch (err) {
      toast.error("Failed to reject transaction");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (txId: string) => {
    if (!confirm("Delete this transaction? This will remove it for all signers.")) return;

    setActionLoading(`delete-${txId}`);
    try {
      await transactionService.deleteTransaction(txId);
      toast.success("Transaction deleted");
      await loadData();
    } catch (err) {
      toast.error("Failed to delete transaction");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExecute = async (txId: string) => {
    setActionLoading(`execute-${txId}`);
    try {
      const result = await transactionService.executeTransaction(txId);
      toast.success("Transaction executed successfully! Hash: " + result.txHash?.slice(0, 8) + "...");
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Execution failed");
    } finally {
      setActionLoading(null);
    }
  };

  const stats = useMemo(() => {
    const total = transactions.length;
    const ready = transactions.filter(t => t.status === 'approved').length;
    const pending = total - ready;
    return { pending, ready, total };
  }, [transactions]);

  if (loading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Clock className="w-12 h-12 text-blue-200 mb-4" />
        <p className="text-muted-foreground">Fetching pending transactions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Fancy Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate("dashboard")}
            className="rounded-full hover:bg-white/5 border border-white/5"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Pending <span className="text-primary">Approvals</span></h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60 mt-1">Transactions waiting for your signature</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl">
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-0.5">Total Pending</div>
            <div className="text-xl font-bold tracking-tighter text-primary">{stats.total}</div>
          </div>
          <div className="px-4 py-2 bg-status-success/5 border border-status-success/20 rounded-xl">
            <div className="text-[10px] font-bold uppercase tracking-widest text-status-success/70 mb-0.5">Ready to Send</div>
            <div className="text-xl font-bold tracking-tighter text-status-success">{stats.ready}</div>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="bg-red-50 border-red-100 text-red-800 text-left">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Transactions Grid/List */}
      <div className="grid gap-6">
        <AnimatePresence mode="popLayout">
          {transactions.map((tx) => {
            const isCreator = tx.creator?.id === user?.id;
            const hasSigned = tx.signatures?.includes(user?.publicKey || "");
            const isReady = tx.status === 'approved';

            return (
              <motion.div
                key={tx.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card className={`group border border-white/5 bg-white/5 backdrop-blur-sm shadow-2xl hover:border-primary/30 transition-all duration-500 overflow-hidden relative ${isReady ? 'ring-1 ring-status-success/30' : ''}`}>
                  <div className={`h-1 w-full absolute top-0 left-0 ${isReady ? 'bg-status-success shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-status-pending shadow-[0_0_15px_rgba(245,158,11,0.3)]'}`} />

                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1.5 text-left">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-2xl font-bold tracking-tighter text-white">
                            {tx.amount} <span className="text-primary/80">{tx.asset}</span>
                          </CardTitle>
                          <Badge variant="outline" className={`text-[10px] uppercase tracking-widest px-3 py-1 border-none ${isReady ? 'bg-status-success/10 text-status-success' : 'bg-status-pending/10 text-status-pending'}`}>
                            {isReady ? <Check className="w-3 h-3 mr-1.5" /> : <Clock className="w-3 h-3 mr-1.5" />}
                            {isReady ? "Ready to Send" : "Pending Signatures"}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5" />
                          Created by <span className="font-medium text-foreground">{isCreator ? "You" : `${tx.creator?.firstName} ${tx.creator?.lastName}`}</span>
                          <span className="text-xs text-muted-foreground">• {new Date(tx.createdAt).toLocaleDateString()}</span>
                        </CardDescription>
                      </div>

                      {isCreator && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-status-error hover:bg-status-error/10 rounded-full transition-colors"
                          onClick={() => handleDelete(tx.id)}
                          disabled={actionLoading === `delete-${tx.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 pt-0 text-left">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Recipient info */}
                      <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3 group/field transition-colors hover:border-white/10">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em] opacity-50">Recipient Address</label>
                        <div className="font-mono text-xs break-all text-primary/90 bg-black/40 p-3 rounded-xl border border-white/5">
                          {tx.to}
                        </div>
                      </div>

                      {/* Memo info */}
                      <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3 group/field transition-colors hover:border-white/10">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em] opacity-50">Transaction Memo</label>
                        <div className="text-xs font-medium text-white/70 italic bg-black/40 p-3 rounded-xl border border-white/5 min-h-[46px] flex items-center">
                          {tx.memo || "NO MEMO PROVIDED"}
                        </div>
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest opacity-60">Approval Status</span>
                        <div className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-bold font-mono text-primary">
                          {tx.signatureCount} / {account?.threshold || "?"} Signed
                        </div>
                      </div>

                      <div className="flex gap-2 p-1 bg-black/20 rounded-full border border-white/5">
                        {Array.from({ length: account?.threshold || 1 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < tx.signatureCount ? 'bg-primary shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/5'}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      {isReady ? (
                        <Button
                          onClick={() => handleExecute(tx.id)}
                          disabled={actionLoading === `execute-${tx.id}`}
                          className="flex-1 shadow-lg"
                          size="lg"
                        >
                          <Shield className="w-5 h-5 mr-3 shrink-0" />
                          {actionLoading === `execute-${tx.id}` ? "SENDING..." : "SEND TO NETWORK"}
                        </Button>
                      ) : !isCreator ? (
                        <>
                          {!hasSigned ? (
                            <Button
                              onClick={() => handleApprove(tx.id)}
                              disabled={actionLoading === `approve-${tx.id}`}
                              className="flex-1 shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all"
                              size="lg"
                            >
                              <Check className="w-5 h-5 mr-2 shrink-0" />
                              {actionLoading === `approve-${tx.id}` ? "SIGNING..." : "APPROVE & SIGN"}
                            </Button>
                          ) : (
                            <div className="flex-1 flex items-center justify-center p-4 rounded-xl border border-status-success/20 bg-status-success/5 text-status-success text-[10px] font-bold uppercase tracking-[0.2em] italic">
                              <Check className="w-4 h-4 mr-2" />
                              SIGNATURE RECORDED
                            </div>
                          )}
                          <Button
                            variant="outline"
                            onClick={() => handleReject(tx.id)}
                            disabled={actionLoading === `reject-${tx.id}`}
                            className="bg-white/5 border-white/10 text-status-error hover:bg-status-error/10 uppercase text-[10px] font-bold tracking-widest px-8 h-12"
                          >
                            <XCircle className="w-4 h-4 mr-2 shrink-0" />
                            REJECT
                          </Button>
                        </>
                      ) : (
                        <div className="flex-1 flex items-center justify-center p-6 rounded-xl border border-dashed border-white/10 bg-white/5 text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-40">
                          Waiting for more signatures...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {transactions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 px-6 rounded-[2rem] border border-white/5 bg-white/2 backdrop-blur-sm relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-primary/2 blur-[80px] rounded-full"></div>
            <div className="w-24 h-24 rounded-[2rem] bg-[#1D1D26] border border-white/10 flex items-center justify-center mb-10 shadow-3xl relative z-10 transition-transform hover:scale-110">
              <Clock className="w-12 h-12 text-primary/40" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight italic">Clear Horizon</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-12 text-sm font-medium tracking-tight opacity-70">
              Your approval queue is empty. No pending transactions require your cryptographic signature at this stage.
            </p>
            <Button
              onClick={() => onNavigate("dashboard")}
              className="rounded-xl px-10 h-14 bg-white/5 border border-white/10 hover:border-primary/50 text-white font-bold uppercase tracking-[0.2em] text-[10px] transition-all"
            >
              Return to Dashboard
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
