import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/api";
import { Card, CardContent } from "../components/ui/Card";
import { Link } from "react-router-dom";
import { 
  Warehouse, 
  FileText, 
  CheckSquare, 
  Map, 
  Truck, 
  BarChart3,
  ArrowRight,
  TrendingUp,
  Activity
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const role = user.role || "CATEGORY";

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.get("/admin/dashboard");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const roleConfig = {
    CC: [
      {
        to: "/inventory",
        title: "Inventory",
        desc: "Manage warehouse items",
        value: stats.inventoryItems || 0,
        icon: Warehouse,
        color: "violet"
      },
      {
        to: "/demands",
        title: "Demands",
        desc: "View submitted requests",
        value: stats.demandBatches || 0,
        icon: FileText,
        color: "blue"
      },
      {
        to: "/negotiations",
        title: "Negotiations",
        desc: "Review and approve requests",
        value: stats.demandBatches || 0, 
        icon: CheckSquare,
        color: "amber"
      },
      {
        to: "/mapping",
        title: "Mapping",
        desc: "Allocate approved stock",
        value: "Active",
        icon: Map,
        color: "emerald"
      },
      {
        to: "/deliveries",
        title: "Deliveries",
        desc: "Fulfill allocated items",
        value: stats.pendingDeliveries || 0,
        icon: Truck,
        color: "rose"
      },
      {
        to: "/analysis",
        title: "Analysis",
        desc: "Audit supply vs demand",
        value: stats.deficits ? `${stats.deficits} deficits` : "0",
        icon: BarChart3,
        color: "indigo"
      }
    ],
    OC: [
      {
        to: "/inventory",
        title: "Inventory",
        desc: "Manage warehouse items",
        value: stats.inventoryItems || 0,
        icon: Warehouse,
        color: "violet"
      }
    ],
    CATEGORY: [
      {
        to: "/demands",
        title: "My Demands",
        desc: "Request catalog items",
        value: stats.totalItems || 0,
        icon: FileText,
        color: "blue"
      },
      {
        to: "/deliveries",
        title: "My Deliveries",
        desc: "Track fulfillment",
        value: stats.pendingDeliveries || 0,
        icon: Truck,
        color: "emerald"
      }
    ]
  };

  const navCards = roleConfig[role] || roleConfig.CATEGORY;

  return (
    <DashboardLayout>
      <div className="space-y-8 font-sans">
        
        {/* Welcome Block */}
        <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-sm">
          <div className="p-6 sm:p-8 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wider mb-4 border border-slate-200">
              Overview Dashboard
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Welcome Back, {user?.email?.split("@")?.[0] || "User"}!
            </h1>
            <p className="text-slate-500 mt-2 max-w-xl text-sm leading-relaxed">
              You are signed in as a <strong className="text-slate-700">{role === "CC" ? "Central Coordinator" : role === "OC" ? "Operations Coordinator" : "Category Manager"}</strong>. Select a module below to get started.
            </p>
          </div>
        </div>

        {/* Navigation Cards Grid */}
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-violet-500" />
            Modules & Workflows
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-32 bg-slate-200/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {navCards.map((card, idx) => (
                <NavCard key={idx} {...card} />
              ))}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
}

function NavCard({ to, title, desc, value, icon: Icon, color }) {
  const colorMap = {
    violet: "text-violet-600 bg-violet-50 border-violet-100 group-hover:bg-violet-600 group-hover:text-white",
    blue: "text-blue-600 bg-blue-50 border-blue-100 group-hover:bg-blue-600 group-hover:text-white",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white",
    amber: "text-amber-600 bg-amber-50 border-amber-100 group-hover:bg-amber-600 group-hover:text-white",
    rose: "text-rose-600 bg-rose-50 border-rose-100 group-hover:bg-rose-600 group-hover:text-white",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white",
  };

  const iconClasses = colorMap[color] || colorMap.violet;

  return (
    <Link to={to} className="block group h-full">
      <Card className="h-full border border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg transition-all duration-300 rounded-xl shadow-sm">
        <CardContent className="p-6 h-full flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-lg border shadow-sm transition-all duration-300 ${iconClasses}`}>
              <Icon size={24} />
            </div>
            {title === "Inventory" && (
              <div className="text-right">
                <span className="block text-2xl font-black text-slate-800 tracking-tight">{value}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metric</span>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
              {title}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
