import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { getUser, logout } from "../lib/auth";
import { Button } from "../components/ui/button";
import {
  LayoutDashboard,
  Warehouse,
  FileText,
  Scale,
  GitMerge,
  Truck,
  BarChart3,
  LogOut,
  Menu,
  X,
  Package,
  Users,
} from "lucide-react";

const allNavItems = [
  { name: "Dashboard", path: "/dashboard", roles: ["CC", "OC", "CATEGORY"], icon: LayoutDashboard },
  { name: "Inventory", path: "/inventory", roles: ["CC", "OC"], icon: Warehouse },
  { name: "Demands", path: "/demands", roles: ["CC", "CATEGORY"], icon: FileText },
  { name: "Negotiations", path: "/negotiations", roles: ["CC"], icon: Scale },
  { name: "Mapping", path: "/mapping", roles: ["CC"], icon: GitMerge },
  { name: "Deliveries", path: "/deliveries", roles: ["CC", "CATEGORY"], icon: Truck },
  { name: "Analysis", path: "/analysis", roles: ["CC"], icon: BarChart3 },
  { name: "Manage Accounts", path: "/accounts", roles: ["CC"], icon: Users },
];

export default function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const user = getUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = allNavItems.filter((item) =>
    item.roles.includes(user?.role ?? "")
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header Panel */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-slate-900 flex items-center justify-center text-white">
                <Package size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Logistics
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 ml-4">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        isActive
                          ? "bg-slate-100 text-slate-900 font-semibold"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      }`
                    }
                  >
                    <IconComponent size={16} />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* User Profile Block */}
            <div className="hidden md:flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{user?.email}</p>
                <p className="text-[10px] text-slate-500 flex items-center justify-end gap-1 font-mono uppercase tracking-wider">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-900"></span>
                  {user?.role}
                  {user?.category_name ? ` · ${user.category_name}` : ""}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                {initials}
              </div>
            </div>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hidden sm:flex text-slate-500 hover:text-slate-900 hover:bg-slate-100 gap-1.5 rounded-md"
            >
              <LogOut size={15} />
              Logout
            </Button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2">
            <div className="py-2 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{user?.email}</p>
                <p className="text-xs text-slate-500 font-mono">
                  {user?.role} {user?.category_name ? `(${user.category_name})` : ""}
                </p>
              </div>
            </div>
            
            <nav className="space-y-1 py-2">
              {navItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                        isActive
                          ? "bg-slate-100 text-slate-900 font-semibold"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      }`
                    }
                  >
                    <IconComponent size={16} />
                    {item.name}
                  </NavLink>
                );
              })}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all text-left mt-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
}
