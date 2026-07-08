import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/api";
import { getRole, getUser } from "../lib/auth";
import TableContainer from "../components/ui/TableContainer";
import { Button } from "../components/ui/button";
import { formatUnit } from "../lib/utils";
import { usePagination } from "../hooks/usePagination";
import {
  FileText,
  Plus,
  Inbox,
  Clock,
  Check,
  AlertTriangle,
  FolderOpen,
  Calendar,
  Trash2,
} from "lucide-react";
import { CustomSelect } from "../components/ui/CustomSelect";

export default function DemandsPage() {
  const role = getRole();
  const isCC = role === "CC";
  const currentUser = getUser();

  const [demands, setDemands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [itemForm, setItemForm] = useState({
    raw_item_name: "",
    unit: "",
    requested_qty: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const requests = [api.get("/categories/demands")];
      if (isCC) requests.push(api.get("/admin/category-users"));

      const [demandsRes, categoriesRes] = await Promise.all(requests);
      setDemands(demandsRes.data);
      if (categoriesRes) setCategories(categoriesRes.data);
    } catch {
      showToast("Failed to load demands", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const submitDemand = async (e) => {
    e.preventDefault();

    if (!itemForm.raw_item_name || !itemForm.requested_qty) {
      showToast("Item name and quantity are required", "error");
      return;
    }

    try {
      let demandId;

      if (isCC) {
        if (!selectedCategory) {
          showToast("Select a category first", "error");
          return;
        }

        const categoryName = categories.find((c) => String(c.id) === String(selectedCategory))?.category_name;
        const existingBatch = demands.find((batch) => batch.category_name === categoryName);

        demandId = existingBatch?.demand_id;
        if (!demandId) {
          const batchRes = await api.post("/categories/demands", {
            category_user_id: Number(selectedCategory),
          });
          demandId = batchRes.data.demand_id;
        }
      } else {
        const existingBatch = demands.find((batch) => batch.category_name === currentUser?.category_name);
        demandId = existingBatch?.demand_id;
        if (!demandId) {
          const batchRes = await api.post("/categories/demands", {});
          demandId = batchRes.data.demand_id;
        }
      }

      await api.post(`/categories/demands/${demandId}/items`, {
        raw_item_name: itemForm.raw_item_name,
        unit: itemForm.unit || "TBD",
        requested_qty: Number(itemForm.requested_qty),
      });

      setSelectedCategory("");
      setItemForm({ raw_item_name: "", unit: "", requested_qty: "" });
      showToast("Demand item captured successfully");
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to capture demand", "error");
    }
  };

  const deleteDemand = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this demand item?")) return;
    try {
      await api.delete(`/categories/demands/items/${itemId}`);
      showToast("Demand item deleted successfully");
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete item", "error");
    }
  };

  const filteredDemands = isCC && filterCategory 
    ? demands.filter(d => String(d.category_user_id) === String(filterCategory)) 
    : demands;

  const { currentItems: currentBatches, renderPagination } = usePagination(filteredDemands, 5); // 5 batches per page

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        {/* Header Block */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Demands</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isCC
              ? "Create demand batches on behalf of categories or review active batches"
              : "Submit, track and view demand items assigned to your category"}
          </p>
        </div>

        {/* Custom Notifications */}
        {message && (
          <div
            className={`flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-3 border shadow-sm transition-all ${
              message.type === "error"
                ? "bg-rose-50 text-rose-700 border-rose-100"
                : "bg-emerald-50 text-emerald-700 border-emerald-100"
            }`}
          >
            {message.type === "error" ? <AlertTriangle size={16} /> : <Check size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Submit Demand Section */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-700">
              <Plus size={16} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-base">Submit demand item</h2>
              <p className="text-xs text-slate-500">
                {isCC
                  ? "Log demand items for a specific category. The request will join the category's batch."
                  : "Submit a request to your category batch for coordinator approval."}
              </p>
            </div>
          </div>

          <form onSubmit={submitDemand} className="grid gap-3 sm:grid-cols-1 md:grid-cols-4 lg:grid-cols-5 items-end">
            {isCC && (
              <div className="space-y-1 relative z-20">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category User</label>
                <CustomSelect
                  options={[
                    { value: "", label: "Select Category" },
                    ...categories.map(c => ({ value: c.id, label: `${c.category_name} (${c.email})` }))
                  ]}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                />
              </div>
            )}
            <div className="space-y-1 lg:col-span-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Item Name</label>
              <input
                className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-md px-3 py-2 text-sm outline-none transition-all focus:ring-1 focus:ring-slate-900"
                placeholder="e.g. Marker Pen"
                value={itemForm.raw_item_name}
                onChange={(e) => setItemForm({ ...itemForm, raw_item_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit</label>
              <input
                className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-md px-3 py-2 text-sm outline-none transition-all focus:ring-1 focus:ring-slate-900"
                placeholder="e.g. pc, box"
                value={itemForm.unit}
                onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</label>
              <input
                type="number"
                min="1"
                className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-md px-3 py-2 text-sm outline-none transition-all focus:ring-1 focus:ring-slate-900"
                placeholder="Qty"
                value={itemForm.requested_qty}
                onChange={(e) => setItemForm({ ...itemForm, requested_qty: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-4 lg:col-span-1 mt-2">
              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 rounded-md border-0">
                Log Demand
              </Button>
            </div>
          </form>
        </div>

        {/* Demand Batches List */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-2 gap-4">
            <div className="flex items-center gap-2">
              <FolderOpen size={20} className="text-slate-500" />
              <h3 className="text-lg font-bold text-slate-800">Departmental Batches</h3>
            </div>
            {isCC && (
              <div className="flex items-center gap-2 w-full sm:w-64 relative z-10">
                <label className="text-xs font-semibold text-slate-500 uppercase whitespace-nowrap">Filter:</label>
                <CustomSelect
                  options={[
                    { value: "", label: "All Categories" },
                    ...categories.map(c => ({ value: c.id, label: c.category_name }))
                  ]}
                  value={filterCategory}
                  onChange={setFilterCategory}
                />
              </div>
            )}
          </div>

          {loading ? (
            <div className="h-48 bg-slate-100 rounded-2xl animate-pulse" />
          ) : demands.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-2xl p-10 text-center bg-slate-50/20">
              <Inbox size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-400 text-sm">No demands logged yet.</p>
            </div>
          ) : (
            currentBatches.map((batch) => (
              <div key={batch.demand_id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-50 pb-3 gap-2">
                  <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-xs font-mono border border-slate-200">
                      Batch #{batch.demand_id}
                    </span>
                    {batch.category_name}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(batch.created_at).toLocaleString()}
                  </p>
                </div>

                <TableContainer>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {["Item Demanded", "Unit", "Qty Requested", "Qty Negotiated", "Approval Status", "CC Remarks", ...(isCC ? ["Action"] : [])].map((h) => (
                          <th key={h} className="p-3 bg-slate-50 text-left font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {batch.items.length === 0 ? (
                        <tr>
                          <td colSpan={isCC ? 7 : 6} className="p-4 text-center text-slate-400 text-xs">
                            No items in this batch
                          </td>
                        </tr>
                      ) : (
                        batch.items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="p-3 font-semibold text-slate-900">{item.raw_item_name}</td>
                            <td className="p-3 text-slate-500">
                              <span className="bg-slate-100 px-2 py-0.5 rounded-md text-xs font-mono">
                                {formatUnit(item.unit)}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-slate-800">{item.requested_qty}</td>
                            <td className="p-3 font-bold text-slate-700">{item.negotiated_qty ?? "—"}</td>
                            <td className="p-3">
                              <StatusBadge status={item.status} />
                            </td>
                            <td className="p-3 text-slate-500 italic max-w-xs truncate" title={item.remarks}>
                              {item.remarks || "—"}
                            </td>
                            {isCC && (
                              <td className="p-3">
                                <button
                                  className="text-slate-400 hover:text-rose-600 transition-colors"
                                  onClick={() => deleteDemand(item.id)}
                                  title="Delete item"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </TableContainer>
              </div>
            ))
          )}
          {!loading && demands.length > 0 && renderPagination()}
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatusBadge({ status }) {
  const styles = {
    UNDER_REVIEW: "bg-amber-50 text-amber-700 border-amber-100/60",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-100/60",
    REJECTED: "bg-rose-50 text-rose-700 border-rose-100/60",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        styles[status] || "bg-slate-100 text-slate-700 border-slate-200"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${
        status === "APPROVED" ? "bg-emerald-500" : status === "REJECTED" ? "bg-rose-500" : "bg-amber-500"
      }`} />
      {status}
    </span>
  );
}
