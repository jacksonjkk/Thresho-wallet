import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { ArrowLeft, Check, X, Clock, Shield, User, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface Signer {
  address: string;
  name: string;
  approved: boolean;
}

interface PendingTransaction {
  id: string;
  amount: string;
  asset: string;
  recipient: string;
  recipientName?: string;
  memo: string;
  timestamp: string;
  approvals: number;
  required: number;
  signers: Signer[];
  networkFee: string;
}

interface PendingTransactionsProps {
  onNavigate: (page: string) => void;
}

const mockTransactions: PendingTransaction[] = [
  {
    id: "tx_001",
    amount: "1,500.00",
    asset: "XLM",
    recipient: "GDXYZ...ABC123",
    recipientName: "Vendor Payment",
    memo: "Invoice #12345 - Q4 Marketing Services",
    timestamp: "2 hours ago",
    approvals: 1,
    required: 2,
    networkFee: "0.00001",
    signers: [
      { address: "GABC...001", name: "Alice (You)", approved: true },
      { address: "GDEF...002", name: "Bob", approved: false },
      { address: "GHIJ...003", name: "Charlie", approved: false }
    ]
  },
  {
    id: "tx_002",
    amount: "3,200.00",
    asset: "XLM",
    recipient: "GMNOP...QRS789",
    recipientName: "Salary Payment",
    memo: "December Salary - Engineering Team",
    timestamp: "4 hours ago",
    approvals: 0,
    required: 3,
    networkFee: "0.00001",
    signers: [
      { address: "GABC...001", name: "Alice (You)", approved: false },
      { address: "GDEF...002", name: "Bob", approved: false },
      { address: "GHIJ...003", name: "Charlie", approved: false }
    ]
  },
  {
    id: "tx_003",
    amount: "850.75",
    asset: "USDC",
    recipient: "GSTU...VWX456",
    recipientName: "Office Supplies",
    memo: "Quarterly office equipment purchase",
    timestamp: "6 hours ago",
    approvals: 2,
    required: 2,
    networkFee: "0.00001",
    signers: [
      { address: "GABC...001", name: "Alice (You)", approved: true },
      { address: "GDEF...002", name: "Bob", approved: true },
      { address: "GHIJ...003", name: "Charlie", approved: false }
    ]
  }
];

export function PendingTransactions({ onNavigate }: PendingTransactionsProps) {
  const [transactions, setTransactions] = useState(mockTransactions);

  const handleApprove = (txId: string) => {
    setTransactions(prev =>
      prev.map(tx => {
        if (tx.id === txId) {
          const updatedSigners = tx.signers.map(signer =>
            signer.name.includes("You") ? { ...signer, approved: true } : signer
          );
          return {
            ...tx,
            approvals: tx.approvals + 1,
            signers: updatedSigners
          };
        }
        return tx;
      })
    );
  };

  const handleReject = (txId: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== txId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => onNavigate("dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl">Pending Transactions</h1>
          <p className="text-muted-foreground">Review and approve multi-signature transactions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Awaiting Your Approval</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <AlertCircle className="w-5 h-5 text-purple-600" />
              </motion.div>
            </div>
            <div className="text-3xl">2</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Ready to Execute</span>
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl">1</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Pending</span>
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-3xl">{transactions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {transactions.map((tx, index) => {
          const isReadyToExecute = tx.approvals >= tx.required;
          const needsYourApproval = !tx.signers.find(s => s.name.includes("You"))?.approved;

          return (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={isReadyToExecute ? "border-green-200 bg-green-50" : needsYourApproval ? "border-purple-200 bg-purple-50" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-3">
                        <CardTitle className="text-xl">
                          {tx.amount} {tx.asset}
                        </CardTitle>
                        {isReadyToExecute ? (
                          <Badge className="bg-green-600">
                            <Check className="w-3 h-3 mr-1" />
                            Ready to Execute
                          </Badge>
                        ) : needsYourApproval ? (
                          <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Needs Your Approval
                            </Badge>
                          </motion.div>
                        ) : (
                          <Badge variant="outline">
                            Waiting for others
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        To: {tx.recipient} {tx.recipientName && `(${tx.recipientName})`}
                      </CardDescription>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {tx.timestamp}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Memo */}
                  {tx.memo && (
                    <div className="p-3 rounded-lg bg-background border">
                      <div className="text-sm font-medium mb-1">Memo</div>
                      <div className="text-sm text-muted-foreground">{tx.memo}</div>
                    </div>
                  )}

                  {/* Approval Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium">Approval Status</div>
                      <Badge variant="outline" className="bg-background">
                        {tx.approvals} / {tx.required} required
                      </Badge>
                    </div>

                    {/* Signers with Visual Indicators */}
                    <div className="space-y-2">
                      {tx.signers.map((signer, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center space-x-3 p-3 rounded-lg border ${
                            signer.approved
                              ? "bg-green-50 border-green-200"
                              : "bg-background"
                          }`}
                        >
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              signer.approved
                                ? "bg-green-600 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {signer.approved ? (
                                <Check className="w-5 h-5" />
                              ) : (
                                <User className="w-5 h-5" />
                              )}
                            </div>
                            {idx < tx.signers.length - 1 && (
                              <div className={`absolute left-1/2 top-full w-0.5 h-2 -translate-x-1/2 ${
                                signer.approved ? "bg-green-300" : "bg-border"
                              }`}></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{signer.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{signer.address}</div>
                          </div>
                          {signer.approved && (
                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                              Approved
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-background border text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">Network Fee</div>
                      <div className="font-medium">{tx.networkFee} {tx.asset}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Transaction ID</div>
                      <div className="font-medium font-mono text-xs">{tx.id}</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {needsYourApproval && !isReadyToExecute && (
                    <div className="flex space-x-3 pt-2">
                      <Button
                        onClick={() => handleApprove(tx.id)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve Transaction
                      </Button>
                      <Button
                        onClick={() => handleReject(tx.id)}
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {isReadyToExecute && (
                    <Button
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Execute Transaction
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {transactions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-lg mb-2">No Pending Transactions</h3>
            <p className="text-muted-foreground mb-6">
              All transactions have been processed
            </p>
            <Button onClick={() => onNavigate("dashboard")}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
