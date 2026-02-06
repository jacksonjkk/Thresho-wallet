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
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

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

export function Sidebar({ currentPage, onNavigate, pendingCount = 2 }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { logout, user } = useAuth();
  const signerCount = user?.account?.signers?.length ?? 0;

  const handleLogout = () => {
    logout();
    onNavigate("login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="Thresho Logo" className="w-20 h-20 rounded-lg" />
          <div>
            <h2 className="font-semibold text-lg">Thresho</h2>
            <p className="text-xs text-muted-foreground">Multi-Sig Wallet</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start ${
                isActive 
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700" 
                  : ""
              }`}
              onClick={() => {
                onNavigate(item.id);
                setIsMobileOpen(false);
              }}
            >
              <Icon className="w-4 h-4 mr-3" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.hasBadge && pendingCount > 0 && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Badge 
                    variant="secondary"
                    className={isActive ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700"}
                  >
                    {pendingCount}
                  </Badge>
                </motion.div>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Account Info */}
      <div className="p-4 border-t space-y-3">
        <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 border">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold">
                  {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-muted-foreground truncate">{user?.email || 'user@example.com'}</div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Signers {signerCount}</span>
            <Badge variant="outline" className="text-xs">Active</Badge>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r bg-card flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isMobileOpen ? 0 : -300 }}
        transition={{ type: "spring", damping: 20 }}
        className="lg:hidden fixed left-0 top-0 w-64 border-r bg-card h-screen z-40 shadow-xl"
      >
        <SidebarContent />
      </motion.aside>
    </>
  );
}
