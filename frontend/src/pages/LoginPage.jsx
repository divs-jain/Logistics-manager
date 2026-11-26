import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { setAuth, getDefaultRoute } from "../lib/auth";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/Card";
import { Mail, Lock, LogIn, AlertCircle, Hexagon } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const res = await api.post("/auth/login", { email, password });
      setAuth(res.data.token, res.data.user);
      navigate(getDefaultRoute(res.data.user.role));
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="w-full max-w-[400px] z-10 transition-all duration-300">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-slate-900 text-white flex items-center justify-center rounded-xl mb-4 shadow-md">
            <Hexagon size={24} className="fill-white/10" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Logistics
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Sign in to your account to continue
          </p>
        </div>

        <Card className="border border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Email Address
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-md pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:ring-1 focus:ring-slate-900"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <a href="#" className="text-xs font-medium text-slate-500 hover:text-slate-900">
                    Forgot password?
                  </a>
                </div>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 group-focus-within:text-slate-900 transition-colors">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-md pl-9 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:ring-1 focus:ring-slate-900"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-md p-3">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 rounded-md shadow-sm transition-all flex items-center justify-center gap-2 mt-2"
                disabled={loading}
              >
                {loading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign In
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
