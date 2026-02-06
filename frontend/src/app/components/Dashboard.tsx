import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Send,
  Download,
  Shield,
  AlertCircle
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { authService } from "@/services/auth.service";
import { ApprovalIndicator } from "@/app/components/ApprovalIndicator";

interface Transaction {
  id: string;
  type: "send" | "receive";
  amount: string;
  asset: string;
  recipient: string;
  timestamp: string;
  status: "completed" | "pending" | "rejected";
  approvals?: number;
  required?: number;
}

interface DashboardProps {
  onNavigate: (page: string) => void;
}

const recentTransactions: Transaction[] = [
  {
    id: "1",
    type: "send",
    amount: "1,500.00",
    asset: "XLM",
    recipient: "GDXYZ...ABC123",
    timestamp: "2 hours ago",
    status: "pending",
    approvals: 1,
    required: 2
  },
  {
    id: "2",
    type: "receive",
    amount: "5,000.00",
    asset: "XLM",
    recipient: "GABC...XYZ789",
    timestamp: "5 hours ago",
    status: "completed"
  },
  {
    id: "3",
    type: "send",
    amount: "750.50",
    asset: "USDC",
    recipient: "GDEF...MNO456",
    timestamp: "1 day ago",
    status: "completed"
  }
];

const pendingApprovals = [
  {
    id: "p1",
    amount: "1,500.00",
    asset: "XLM",
    recipient: "GDXYZ...ABC123",
    approvals: 1,
    required: 2,
    timestamp: "2 hours ago"
  },
  {
    id: "p2",
    amount: "3,200.00",
    asset: "XLM",
    recipient: "GMNOP...QRS789",
    approvals: 0,
    required: 3,
    timestamp: "4 hours ago"
  }
];

export function Dashboard({ onNavigate }: DashboardProps) {
  const [balance, setBalance] = useState("0.00");

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const info = await authService.getWalletInfo();
        const native = info.balances.find((b) => b.asset_type === 'native');
        setBalance(native ? Number(native.balance).toLocaleString() : "0.00");
      } catch (err) {
        console.error('Failed to load wallet balance', err);
      }
    };

    loadBalance();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-1">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to your multi-sig wallet</p>
      </div>

      {/* Balance Card with Gradient */}
      <Card className="border-0 bg-gradient-to-br from-blue-600 via-cyan-500 to-purple-600 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <CardHeader className="relative">
          <CardDescription className="text-blue-100">Total Balance</CardDescription>
          <CardTitle className="text-4xl">{balance} XLM</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-center space-x-2 text-sm text-blue-100 mb-6">
            <TrendingUp className="w-4 h-4" />
            <span>+5.2% from last month</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button 
              onClick={() => onNavigate("transaction-form")}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
            <Button 
              onClick={() => onNavigate("wallet")}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20"
            >
              <Download className="w-4 h-4 mr-2" />
              Request
            </Button>
            <Button 
              onClick={() => onNavigate("pending")}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20"
            >
              <Shield className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Pending Approvals</CardDescription>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Clock className="w-5 h-5 text-purple-600" />
              </motion.div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-2">2</div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-purple-600 hover:text-purple-700"
              onClick={() => onNavigate("pending")}
            >
              Review now →
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Completed Today</CardDescription>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-2">8</div>
            <p className="text-sm text-muted-foreground">+2 from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription>Active Signers</CardDescription>
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl mb-2">3/5</div>
            <p className="text-sm text-muted-foreground">2-of-3 threshold</p>
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
            {pendingApprovals.map((tx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 rounded-lg border bg-purple-50 border-purple-200"
              >
                <div className="flex items-center space-x-4">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white"
                  >
                    <AlertCircle className="w-5 h-5" />
                  </motion.div>
                  <div>
                    <div className="font-medium">
                      {tx.amount} {tx.asset}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      To: {tx.recipient} • {tx.timestamp}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="bg-white">
                    {tx.approvals}/{tx.required} approvals
                  </Badge>
                  <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600">
                    Approve
                  </Button>
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
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest transaction activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("history")}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === "send" 
                      ? "bg-blue-100 text-blue-600" 
                      : "bg-green-100 text-green-600"
                  }`}>
                    {tx.type === "send" ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">
                      {tx.type === "send" ? "Sent" : "Received"} {tx.amount} {tx.asset}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tx.type === "send" ? "To:" : "From:"} {tx.recipient} • {tx.timestamp}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {tx.status === "pending" && tx.approvals !== undefined && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      {tx.approvals}/{tx.required}
                    </Badge>
                  )}
                  <Badge
                    variant={tx.status === "completed" ? "default" : tx.status === "pending" ? "secondary" : "destructive"}
                    className={
                      tx.status === "completed" 
                        ? "bg-green-100 text-green-700 hover:bg-green-100" 
                        : tx.status === "pending"
                        ? "bg-purple-100 text-purple-700 hover:bg-purple-100"
                        : ""
                    }
                  >
                    {tx.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}