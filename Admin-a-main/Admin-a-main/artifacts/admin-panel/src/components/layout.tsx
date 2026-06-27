import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  MapPin, 
  IndianRupee, 
  Wallet, 
  Bell, 
  Tag, 
  LifeBuoy, 
  Settings, 
  Image as ImageIcon,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useGetMe } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Users", href: "/users", icon: Users },
  { name: "Drivers", href: "/drivers", icon: Car },
  { name: "Rides", href: "/rides", icon: MapPin },
  { name: "Pricing & Fares", href: "/pricing", icon: IndianRupee },
  { name: "Payments", href: "/payments", icon: IndianRupee },
  { name: "Wallets", href: "/wallets", icon: Wallet },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Promos", href: "/promos", icon: Tag },
  { name: "Support Tickets", href: "/support", icon: LifeBuoy },
  { name: "Service Areas", href: "/service-areas", icon: MapPin },
  { name: "Content", href: "/content", icon: ImageIcon },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { data: admin } = useGetMe();
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    await signOut();
    setLocation("/login");
  };

  const displayName = admin?.name || user?.displayName || user?.email?.split("@")[0] || "Admin";
  const displayEmail = admin?.email || user?.email || "";
  const displayInitial = displayName.charAt(0).toUpperCase();

  const SidebarContent = () => (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white tracking-wider flex items-center gap-2">
          JAJPUR <span className="text-primary neon-text">JATRI</span>
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-4">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link 
                key={item.name} 
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-primary/10 text-primary border border-primary/20 neon-glow" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {displayInitial}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-card/30 border-r border-white/5 backdrop-blur-xl">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <aside className="relative w-72 flex flex-col bg-background border-r border-white/5 shadow-2xl h-full animate-in slide-in-from-left">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-4 lg:hidden border-b border-white/5 bg-card/30 backdrop-blur-md">
          <h1 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
            JAJPUR <span className="text-primary neon-text">JATRI</span>
          </h1>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)}>
            <Menu className="w-6 h-6 text-white" />
          </Button>
        </header>
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
