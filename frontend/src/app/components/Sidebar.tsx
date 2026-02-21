import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  LayoutDashboard,
  Send,
  Clock,
  History,
  Wallet,
  Settings,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { accountService } from "@/services/account.service";
import { transactionService } from "@/services/transaction.service";

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  pendingCount?: number;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "transaction-form", label: "New Transaction", icon: Send },
  { id: "pending", label: "Pending", icon: Clock, hasBadge: true },
  { id: "history", label: "History", icon: History },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "settings", label: "Settings", icon: Settings }
];

export function Sidebar({ currentPage, onNavigate, pendingCount: initialPendingCount }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { logout, user } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [pendingCount, setPendingCount] = useState(initialPendingCount || 0);

  useEffect(() => {
    const fetchStats = async () => {
      if (user?.accountId) {
        try {
          const [acc, pending] = await Promise.all([
            accountService.getAccount(user.accountId),
            transactionService.getPendingTransactions(user.accountId)
          ]);
          setIsOwner(acc.owner.id === user.id);
          setPendingCount(pending.length);
        } catch (err) {
          console.error("Failed to fetch sidebar stats", err);
        }
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [user?.accountId, user?.id]);

  const signerCount = user?.account?.signers?.length ?? 0;

  const handleLogout = async () => {
    await logout();
    onNavigate("login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/5 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/40 blur-xl rounded-full opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <img src="/logo.png" alt="Thresho Logo" className="w-30 h-29 relative z-10 transition-transform group-hover:scale-110 duration-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tighter leading-none">Thresho</h2>
            <p className="text-[9px] text-primary/70 uppercase tracking-[0.2em] font-bold mt-1 opacity-80">Secure Multi-sig</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start rounded-xl h-10 px-3 transition-all duration-300 group ${isActive
                ? "shadow-lg bg-primary hover:bg-primary"
                : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                }`}
              onClick={() => {
                onNavigate(item.id);
                setIsMobileOpen(false);
              }}
            >
              <Icon className={`w-3.5 h-3.5 mr-2.5 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-primary/60 group-hover:text-primary'}`} />
              <span className={`flex-1 text-left text-[10px] font-bold uppercase tracking-[0.1em] ${isActive ? 'text-white' : ''}`}>{item.label}</span>
              {item.hasBadge && pendingCount > 0 && (
                <Badge
                  variant="secondary"
                  className={`h-4 min-w-[18px] px-1 text-[8px] font-bold ${isActive ? "bg-white/20 text-white border-white/30" : "bg-primary/10 text-primary border-primary/20"}`}
                >
                  {pendingCount}
                </Badge>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Account Info */}
      <div className="p-4 border-t border-white/5 space-y-4 shrink-0">
        <div className="p-3 rounded-2xl border border-white/5 bg-white/5 group hover:border-primary/20 transition-all duration-500">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-[#1D1D26] border border-white/10 flex items-center justify-center text-primary overflow-hidden shadow-xl shrink-0">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-primary">
                  {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-xs tracking-tight text-white truncate text-[11px]">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-[8px] text-muted-foreground uppercase font-bold tracking-tight opacity-40 truncate">{user?.email || 'NOT CONNECTED'}</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase font-bold text-muted-foreground tracking-[0.2em] opacity-40">Wallet Status</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse"></div>
              <span className="text-[8px] font-bold text-status-success uppercase tracking-widest">{signerCount} Members</span>
            </div>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start rounded-xl text-muted-foreground hover:bg-status-error/10 hover:text-status-error h-10 transition-all"
        >
          <LogOut className="w-3.5 h-3.5 mr-2.5" />
          <span className="font-bold text-[9px] uppercase tracking-[0.2em]">Logout</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden fixed top-4 right-4 z-50 bg-card"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isMobileOpen ? 0 : -300 }}
        transition={{ type: "spring", damping: 20 }}
        className="lg:hidden fixed left-0 top-0 w-64 border-r border-white/5 bg-black/60 backdrop-blur-2xl h-screen z-40"
      >
        <SidebarContent />
      </motion.aside>
    </>
  );
}
