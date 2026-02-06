import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { ArrowLeft, Send, Info, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/app/components/ui/alert";

interface TransactionFormProps {
  onNavigate: (page: string) => void;
}

export function TransactionForm({ onNavigate }: TransactionFormProps) {
  const [asset, setAsset] = useState("XLM");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [memo, setMemo] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onNavigate("pending");
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-0 shadow-xl">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
            </div>
            <h2 className="text-2xl mb-2">Transaction Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Your transaction has been created and is pending approvals.
            </p>
            <div className="flex justify-center space-x-3">
              <Button onClick={() => onNavigate("pending")} className="bg-gradient-to-r from-blue-600 to-purple-600">
                View Pending Transactions
              </Button>
              <Button variant="outline" onClick={() => onNavigate("dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => onNavigate("dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl">New Transaction</h1>
          <p className="text-muted-foreground">Create a transaction for multi-sig approval</p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="w-4 h-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          This transaction will require 2 out of 3 signatures before it can be executed on the blockchain.
        </AlertDescription>
      </Alert>

      {/* Transaction Form */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>Fill in the transaction information below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Asset Selection */}
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
                Available balance: 45,328.50 XLM
              </p>
            </div>

            {/* Recipient Address */}
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

            {/* Amount */}
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
                  onClick={() => setAmount("45328.50")}
                >
                  Send Max
                </Button>
              </div>
            </div>

            {/* Memo (Optional) */}
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

            {/* Transaction Summary */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="font-medium mb-2">Transaction Summary</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network Fee</span>
                  <span>0.00001 XLM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Required Signatures</span>
                  <span>2 of 3</span>
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

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit for Approval
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate("dashboard")}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
