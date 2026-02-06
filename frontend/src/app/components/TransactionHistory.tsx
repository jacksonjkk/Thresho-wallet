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
import { useState } from "react";

interface Transaction {
  id: string;
  hash: string;
  type: "send" | "receive";
  amount: string;
  asset: string;
  from: string;
  to: string;
  timestamp: string;
  date: string;
  status: "completed" | "failed";
  memo?: string;
  fee: string;
}

interface TransactionHistoryProps {
  onNavigate: (page: string) => void;
}

const mockHistory: Transaction[] = [
  {
    id: "1",
    hash: "a1b2c3d4e5f6g7h8i9j0",
    type: "send",
    amount: "1,500.00",
    asset: "XLM",
    from: "GABC...XYZ789 (You)",
    to: "GDXYZ...ABC123",
    timestamp: "10:45 AM",
    date: "Today",
    status: "completed",
    memo: "Invoice #12345",
    fee: "0.00001"
  },
  {
    id: "2",
    hash: "k1l2m3n4o5p6q7r8s9t0",
    type: "receive",
    amount: "5,000.00",
    asset: "XLM",
    from: "GMNOP...QRS789",
    to: "GABC...XYZ789 (You)",
    timestamp: "08:20 AM",
    date: "Today",
    status: "completed",
    fee: "0.00001"
  },
  {
    id: "3",
    hash: "u1v2w3x4y5z6a7b8c9d0",
    type: "send",
    amount: "750.50",
    asset: "USDC",
    from: "GABC...XYZ789 (You)",
    to: "GDEF...MNO456",
    timestamp: "04:15 PM",
    date: "Yesterday",
    status: "completed",
    memo: "Payment for services",
    fee: "0.00001"
  },
  {
    id: "4",
    hash: "e1f2g3h4i5j6k7l8m9n0",
    type: "receive",
    amount: "2,300.75",
    asset: "XLM",
    from: "GHIJ...PQR012",
    to: "GABC...XYZ789 (You)",
    timestamp: "11:30 AM",
    date: "Yesterday",
    status: "completed",
    fee: "0.00001"
  },
  {
    id: "5",
    hash: "o1p2q3r4s5t6u7v8w9x0",
    type: "send",
    amount: "450.00",
    asset: "XLM",
    from: "GABC...XYZ789 (You)",
    to: "GSTU...VWX345",
    timestamp: "03:45 PM",
    date: "Jan 25",
    status: "failed",
    memo: "Refund",
    fee: "0.00001"
  },
  {
    id: "6",
    hash: "y1z2a3b4c5d6e7f8g9h0",
    type: "receive",
    amount: "8,900.00",
    asset: "XLM",
    from: "GABC...DEF678",
    to: "GABC...XYZ789 (You)",
    timestamp: "09:15 AM",
    date: "Jan 24",
    status: "completed",
    memo: "Monthly payment",
    fee: "0.00001"
  },
  {
    id: "7",
    hash: "i1j2k3l4m5n6o7p8q9r0",
    type: "send",
    amount: "1,250.25",
    asset: "USDC",
    from: "GABC...XYZ789 (You)",
    to: "GHIJ...KLM901",
    timestamp: "02:30 PM",
    date: "Jan 23",
    status: "completed",
    fee: "0.00001"
  }
];

export function TransactionHistory({ onNavigate }: TransactionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterAsset, setFilterAsset] = useState("all");

  const filteredTransactions = mockHistory.filter(tx => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => onNavigate("dashboard")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl">Transaction History</h1>
          <p className="text-muted-foreground">View all your completed transactions</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Total Sent</div>
            <div className="text-2xl">3,950.75 XLM</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Total Received</div>
            <div className="text-2xl">16,200.75 XLM</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Completed</div>
            <div className="text-2xl">{mockHistory.filter(tx => tx.status === "completed").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">This Month</div>
            <div className="text-2xl">{mockHistory.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by hash, address, or memo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="send">Sent Only</SelectItem>
                <SelectItem value="receive">Received Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAsset} onValueChange={setFilterAsset}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assets</SelectItem>
                <SelectItem value="XLM">XLM</SelectItem>
                <SelectItem value="USDC">USDC</SelectItem>
                <SelectItem value="BTC">BTC</SelectItem>
                <SelectItem value="ETH">ETH</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Showing {filteredTransactions.length} of {mockHistory.length} transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-center space-x-4 flex-1">
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    tx.type === "send"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-green-100 text-green-600"
                  }`}>
                    {tx.type === "send" ? (
                      <ArrowUpRight className="w-6 h-6" />
                    ) : (
                      <ArrowDownLeft className="w-6 h-6" />
                    )}
                  </div>

                  {/* Transaction Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <div className="font-medium">
                        {tx.type === "send" ? "Sent" : "Received"} {tx.amount} {tx.asset}
                      </div>
                      <Badge
                        variant={tx.status === "completed" ? "default" : "destructive"}
                        className={tx.status === "completed" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
                      >
                        {tx.status === "completed" ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {tx.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tx.type === "send" ? "To:" : "From:"} {tx.type === "send" ? tx.to : tx.from}
                    </div>
                    {tx.memo && (
                      <div className="text-sm text-muted-foreground mt-1">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          {tx.memo}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Date/Time */}
                  <div className="text-right hidden md:block">
                    <div className="text-sm font-medium">{tx.date}</div>
                    <div className="text-sm text-muted-foreground">{tx.timestamp}</div>
                  </div>

                  {/* Hash & Link */}
                  <div className="text-right hidden lg:block">
                    <div className="text-sm text-muted-foreground font-mono mb-1">
                      {tx.hash.substring(0, 10)}...
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-lg mb-2">No transactions found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
