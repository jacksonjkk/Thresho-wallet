import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { ArrowLeft, Send, Info, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { transactionService } from "@/services/transaction.service";
import { freighterService } from "@/services/freighter.service";
import { accountService, Account } from "@/services/account.service";
import { useAuth } from "@/app/context/AuthContext";
import { useEffect } from "react";

interface TransactionFormProps {
  onNavigate: (page: string) => void;
}

export function TransactionForm({ onNavigate }: TransactionFormProps) {
  const { user } = useAuth();
  const [asset, setAsset] = useState("XLM");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [memo, setMemo] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);

  const [balance, setBalance] = useState("0.00");

  useEffect(() => {
    const loadData = async () => {
      if (user?.accountId) {
        try {
          const [acc, info] = await Promise.all([
            accountService.getAccount(user.accountId),
            accountService.getAccountWalletInfo(user.accountId)
          ]);
          setAccount(acc);
          const native = info.balances.find((b) => b.asset_type === 'native');
          setBalance(native ? native.balance : "0.00");
        } catch (err) {
          console.error("Failed to load account data in form", err);
        }
      }
    };
    loadData();
  }, [user?.accountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user?.accountId || !user.publicKey) {
      setError("Missing account or wallet connection");
      return;
    }

    if (asset !== "XLM") {
      setError("Only XLM is supported for now");
      return;
    }

    let createdTxId: string | null = null;
    try {
      setLoading(true);
      const created = await transactionService.createTransaction({
        accountId: user.accountId,
        to: recipient,
        amount,
        memo: memo || undefined,
      });
      createdTxId = created.transactionId;

      const signedXdr = await freighterService.signChallenge(
        created.xdr,
        created.networkPassphrase
      );

      await transactionService.signTransaction(created.transactionId, {
        signedXdr, // correct property name for backend
        signerPublicKey: user.publicKey,
      });

      setSubmitted(true);
      // Set navigation state to trigger toast on Pending page
      if (window.history && window.history.replaceState) {
        const newState = { ...window.history.state, showSuccessToast: true };
        window.history.replaceState(newState, '', window.location.pathname);
      }
      onNavigate("pending");
    } catch (err: any) {
      setError(err.message || "Failed to create transaction");
      // Cleanup: if we created a record but failed to sign/submit, delete it
      if (createdTxId) {
        transactionService.deleteTransaction(createdTxId).catch(console.error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Card className="border-0 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-status-success/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-status-success/10 transition-colors"></div>
          <CardContent className="pt-16 pb-12 text-center space-y-8">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-status-success/40 blur-2xl rounded-full opacity-40"></div>
                <div className="w-24 h-24 rounded-2xl bg-[#1D1D26] border border-status-success/20 flex items-center justify-center relative z-10 shadow-2xl">
                  <CheckCircle2 className="w-12 h-12 text-status-success" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">TRANSACTION <span className="text-status-success">CREATED</span></h2>
              <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px] opacity-60">Waiting for others to sign</p>
            </div>

            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Your transaction has been created and is now waiting for other members to approve and sign it.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Button onClick={() => onNavigate("pending")} className="w-full sm:w-auto sm:min-w-[200px] shadow-lg">
                VIEW PENDING
              </Button>
              <Button variant="outline" onClick={() => onNavigate("dashboard")} className="w-full sm:w-auto sm:min-w-[200px] border-white/5 bg-white/5">
                GO TO DASHBOARD
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">New <span className="text-primary">Transaction</span></h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60 mt-1">Create a multi-sig transaction</p>
        </div>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <Info className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          This transaction will require {account?.threshold || 2} out of {account?.signers?.length || 3} signatures before it can be executed on the blockchain.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>Fill in the transaction information below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="asset">Asset</Label>
              <Select value={asset} onValueChange={setAsset}>
                <SelectTrigger id="asset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="XLM">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>XLM (Stellar Lumens)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="USDC">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                      <span>USDC (USD Coin)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="BTC">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span>BTC (Bitcoin)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ETH">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      <span>ETH (Ethereum)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Available balance: {Number(balance).toLocaleString()} XLM
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                Enter a valid Stellar wallet address
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="pr-16"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {asset}
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  ${(parseFloat(amount || "0") * 0.12).toFixed(2)} USD
                </span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-blue-600"
                  onClick={() => setAmount(balance)}
                >
                  Send Max
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="memo">
                Memo <span className="text-muted-foreground font-normal">(Optional)</span>
              </Label>
              <Textarea
                id="memo"
                placeholder="Add a note for this transaction..."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                This note will be visible to all signers
              </p>
            </div>

            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="font-medium mb-2">Transaction Summary</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network Fee</span>
                  <span>0.00001 XLM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Required Signatures</span>
                  <span>{account?.threshold || 2} of {account?.signers?.length || 3}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Time</span>
                  <span>~5-10 minutes after approval</span>
                </div>
                <div className="h-px bg-border my-2"></div>
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{amount || "0.00"} {asset}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 max-w-xs shadow-lg"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? "SENDING..." : "SEND FOR APPROVAL"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1 max-w-xs border-white/5 bg-white/5"
                onClick={() => onNavigate("dashboard")}
              >
                CANCEL
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
