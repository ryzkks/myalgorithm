import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Sparkles, TrendingUp, Users, UserCircle, CreditCard, LogOut, Menu, X, Trophy } from "lucide-react";
import { useState } from "react";
import { LevelBadge, PlanBadge } from "@/components/GamificationPanel";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/dashboard/analyze", icon: Sparkles, label: "Analyze Content" },
  { to: "/dashboard/growth-plan", icon: TrendingUp, label: "Growth Plan" },
  { to: "/dashboard/competitors", icon: Users, label: "Competitors" },
  { to: "/dashboard/account", icon: UserCircle, label: "Account" },
  { to: "/dashboard/billing", icon: CreditCard, label: "Billing" },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-slate-800/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <div className="w-3 h-3 rounded-sm bg-cyan-400" />
          </div>
          <span className="font-['Outfit'] text-lg font-bold text-white">MyAlgorithm</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1" data-testid="dashboard-sidebar-nav">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`
            }
            data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800/50">
        <div className="flex items-center gap-3 px-4 py-2 mb-3">
          {user?.picture ? (
            <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || "User"}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} data-testid="logout-btn"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full">
          <LogOut className="w-[18px] h-[18px]" strokeWidth={1.5} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#030712] flex" data-testid="dashboard-layout">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 glass border-r border-slate-800/50 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 glass flex flex-col z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between p-4 glass border-b border-slate-800/50 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} data-testid="mobile-menu-btn"
            className="text-slate-400 hover:text-white p-1">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-['Outfit'] text-lg font-bold text-white">MyAlgorithm</span>
          <div className="w-8" />
        </header>

        <main className="p-6 lg:p-10 max-w-7xl">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
