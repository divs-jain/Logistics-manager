import { useState, useEffect } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/api";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import TableContainer from "../components/ui/TableContainer";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useToast } from "../contexts/ToastContext";
import { CustomSelect } from "../components/ui/CustomSelect";
import { Lock, Unlock, Users, Shield, Plus, Trash2 } from "lucide-react";

export default function ManageAccountsPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();
  
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "CATEGORY",
    category_name: ""
  });
  
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users");
      setUsers(res.data);
    } catch {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlockDemands = async (userId, currentStatus) => {
    const newValue = !currentStatus;
    try {
      await api.put(`/users/${userId}/block-demands`, { block_demands: newValue });
      showToast(newValue ? "Demand entering blocked for category" : "Demand entering unlocked for category");
      loadData();
    } catch {
      showToast("Failed to update block status", "error");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post("/users", form);
      showToast("User created successfully");
      setForm({ email: "", password: "", role: "CATEGORY", category_name: "" });
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create user", "error");
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.id) return;
    try {
      await api.delete(`/users/${deleteDialog.id}`);
      showToast("User deleted successfully");
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete user", "error");
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const roleOptions = [
    { value: "CATEGORY", label: "Category" },
    { value: "OC", label: "OC" },
    { value: "CC", label: "CC" }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Manage Accounts</h1>
          <p className="text-sm text-slate-500 mt-1">Create users, manage roles, and toggle demand access</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column: Forms and Settings */}
          <div className="space-y-6">
            
            {/* Create User Form */}
            <Card className="border border-slate-100 shadow-sm rounded-2xl">
              <CardHeader className="border-b border-slate-50/80 pb-4">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Shield size={18} className="text-indigo-600" />
                  Create New Account
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Role</label>
                    <CustomSelect
                      options={roleOptions}
                      value={form.role}
                      onChange={(val) => setForm({...form, role: val})}
                      placeholder="Select Role"
                    />
                  </div>
                  
                  {form.role === "CATEGORY" && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Category Name</label>
                      <input
                        className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-md px-3 py-2 text-sm outline-none transition-all focus:ring-1 focus:ring-slate-900"
                        placeholder="e.g. Arts, Sports"
                        value={form.category_name}
                        onChange={(e) => setForm({...form, category_name: e.target.value})}
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Email Address</label>
                    <input
                      type="email"
                      className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-md px-3 py-2 text-sm outline-none transition-all focus:ring-1 focus:ring-slate-900"
                      placeholder="user@logistics.com"
                      value={form.email}
                      onChange={(e) => setForm({...form, email: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Password</label>
                    <input
                      type="password"
                      className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-md px-3 py-2 text-sm outline-none transition-all focus:ring-1 focus:ring-slate-900"
                      placeholder="Min 6 characters"
                      value={form.password}
                      onChange={(e) => setForm({...form, password: e.target.value})}
                      required
                      minLength={6}
                    />
                  </div>

                  <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white mt-2">
                    <Plus size={16} className="mr-2"/> Create Account
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: User List */}
          <div className="xl:col-span-2">
            <Card className="border border-slate-100 shadow-sm rounded-2xl h-full flex flex-col">
              <CardHeader className="border-b border-slate-50/80 pb-4">
                <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Users size={18} className="text-slate-600" />
                  System Users
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 relative">
                {loading ? (
                  <div className="p-8 text-center text-slate-400">Loading...</div>
                ) : (
                  <TableContainer>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="p-4 text-left font-bold text-slate-600 uppercase tracking-wider text-[11px]">Email</th>
                          <th className="p-4 text-left font-bold text-slate-600 uppercase tracking-wider text-[11px]">Role</th>
                          <th className="p-4 text-left font-bold text-slate-600 uppercase tracking-wider text-[11px]">Category</th>
                          <th className="p-4 text-left font-bold text-slate-600 uppercase tracking-wider text-[11px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.map(user => (
                          <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-semibold text-slate-900">{user.email}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wide ${
                                user.role === 'CC' ? 'bg-purple-100 text-purple-700' :
                                user.role === 'OC' ? 'bg-blue-100 text-blue-700' :
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="p-4 text-slate-500 font-medium">{user.category_name || "—"}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {user.role === 'CATEGORY' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleBlockDemands(user.id, user.block_demands)}
                                    className={`h-7 px-2 text-[10px] uppercase font-bold tracking-wider ${
                                      user.block_demands 
                                        ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100" 
                                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                    }`}
                                  >
                                    {user.block_demands ? (
                                      <><Unlock size={12} className="mr-1" /> Unblock Demands</>
                                    ) : (
                                      <><Lock size={12} className="mr-1" /> Block Demands</>
                                    )}
                                  </Button>
                                )}
                                <button
                                  onClick={() => setDeleteDialog({ open: true, id: user.id })}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                                  title="Delete user"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <ConfirmDialog 
        isOpen={deleteDialog.open}
        title="Delete Account"
        message="Are you sure you want to permanently delete this account? This action cannot be undone."
        confirmText="Delete Account"
        isDestructive={true}
        onConfirm={handleDeleteUser}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
      />
    </DashboardLayout>
  );
}
