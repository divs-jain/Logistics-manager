import { Fragment, useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/api";
import TableContainer from "../components/ui/TableContainer";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/Card";
import { formatUnit, fuzzyMatch } from "../lib/utils";
import { usePagination } from "../hooks/usePagination";
import {
  Scale,
  Search,
  SlidersHorizontal,
  CheckCircle,
  XCircle,
  Edit3,
  AlertTriangle,
  Check,
} from "lucide-react";

export default function NegotiationsPage() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    negotiated_qty: "",
    remarks: "",
    status: "UNDER_REVIEW",
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await api.get("/categories/demands");
      const flat = [];
      res.data.forEach((batch) => {
        batch.items.forEach((item) => {
          flat.push({
            ...item,
            demand_id: batch.demand_id,
            category_name: batch.category_name,
          });
        });
      });
      setItems(flat);
      setFilteredItems(flat);
    } catch {
      showToast("Failed to load demand items", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const startEdit = (item) => {
    setEditId(item.id);
    setForm({
      negotiated_qty: item.negotiated_qty ?? "",
      remarks: item.remarks ?? "",
      status: item.status,
    });
  };

  const saveEdit = async () => {
    try {
      const payload = {
        remarks: form.remarks || null,
        status: form.status,
      };
      if (form.negotiated_qty !== "") {
        payload.negotiated_qty = Number(form.negotiated_qty);
      } else {
        payload.negotiated_qty = null;
      }

      await api.put(`/admin/demand-items/${editId}`, payload);
      setEditId(null);
      showToast("Demand item updated successfully");
      loadItems();
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed", "error");
    }
  };

  useEffect(() => {
    setFilteredItems(
      items.filter((item) => {
        const matchesCategory = selectedCategory ? item.category_name === selectedCategory : false;
        const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
        const matchesQuery = fuzzyMatch(
          `${item.raw_item_name} ${item.remarks || ""}`,
          search
        );
        return matchesCategory && matchesStatus && matchesQuery;
      })
    );
  }, [search, statusFilter, items, selectedCategory]);

  const { currentItems, renderPagination, setCurrentPage } = usePagination(filteredItems, 10);

  useEffect(() => {
    setCurrentPage(1); // Reset page on filter changes
  }, [search, statusFilter, selectedCategory, setCurrentPage]);

  const uniqueCategories = Array.from(new Set(items.map(i => i.category_name)));

  const quickStatus = async (item, status) => {
    try {
      await api.put(`/admin/demand-items/${item.id}`, {
        status,
        negotiated_qty: item.negotiated_qty,
        remarks: item.remarks,
      });
      showToast(`Item marked as ${status.toLowerCase()}`);
      loadItems();
    } catch (err) {
      showToast(err.response?.data?.message || "Update failed", "error");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        {/* Header Block */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Negotiations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review demands from various categories, negotiate volumes, and approve/reject items
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

        {/* Filters Card */}
        <Card className="border border-slate-200 shadow-sm rounded-lg">
          <CardContent className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="space-y-1 w-full md:w-64">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Category</label>
                <select
                  className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-md px-3 py-2 text-sm outline-none transition-all focus:ring-1 focus:ring-slate-900"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">-- Choose Category --</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedCategory && (
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-end">
                <div className="relative flex-1 sm:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search size={16} />
                  </span>
                  <input
                    className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-md pl-9 pr-3 py-2 text-sm outline-none transition-all focus:ring-1 focus:ring-slate-900"
                    placeholder="Search item..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="relative">
                  <select
                    className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-md px-3 py-2 text-sm outline-none transition-all focus:ring-1 focus:ring-slate-900 appearance-none pr-8 font-medium text-slate-700"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <SlidersHorizontal size={14} />
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content list */}
        {loading ? (
          <div className="h-64 bg-slate-100 rounded-lg animate-pulse" />
        ) : !selectedCategory ? (
          <Card className="border border-slate-200 shadow-sm rounded-lg p-12 text-center bg-slate-50/50">
            <Scale size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">No Category Selected</h3>
            <p className="text-slate-500 text-sm">Please select a category from the dropdown above to view and negotiate its demands.</p>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card className="border border-slate-200 shadow-sm rounded-lg p-8 text-center bg-slate-50/50">
            <p className="text-slate-500 text-sm">No demands found for this category and filters.</p>
          </Card>
        ) : (
          <TableContainer>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {[
                    "Category",
                    "Item Demanded",
                    "Unit",
                    "Requested",
                    "Negotiated",
                    "Status",
                    "CC Remarks",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="p-4 bg-slate-50 text-left font-bold text-slate-600 uppercase tracking-wider text-[10px]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentItems.map((item) => (
                  <Fragment key={item.id}>
                    <tr className={`hover:bg-slate-50/40 transition-colors ${editId === item.id ? "bg-slate-50/20" : ""}`}>
                      <td className="p-4 font-semibold text-slate-700">{item.category_name}</td>
                      <td className="p-4 font-bold text-slate-900">{item.raw_item_name}</td>
                      <td className="p-4 text-slate-500 font-medium">
                        <span className="bg-slate-100 px-2.5 py-0.5 rounded-md text-xs font-mono">
                          {formatUnit(item.unit)}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">{item.requested_qty}</td>
                      <td className="p-4 font-bold text-slate-900">{item.negotiated_qty ?? "—"}</td>
                      <td className="p-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="p-4 text-slate-500 italic max-w-xs truncate" title={item.remarks}>
                        {item.remarks || "—"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] px-2.5 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center gap-1"
                            onClick={() => (editId === item.id ? setEditId(null) : startEdit(item))}
                          >
                            <Edit3 size={11} />
                            {editId === item.id ? "Close" : "Negotiate"}
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-[11px] px-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100/60 hover:bg-emerald-100 hover:text-emerald-800 shadow-none flex items-center gap-0.5 font-semibold"
                            onClick={() => quickStatus(item, "APPROVED")}
                          >
                            <CheckCircle size={11} />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            className="h-7 text-[11px] px-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-100/60 hover:bg-rose-100 hover:text-rose-800 shadow-none flex items-center gap-0.5 font-semibold"
                            onClick={() => quickStatus(item, "REJECTED")}
                          >
                            <XCircle size={11} />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {editId === item.id && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={8} className="p-4 border-t border-b border-slate-100">
                          <div className="bg-white border border-slate-150 rounded-xl p-4 shadow-inner space-y-3">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Update Negotiation Parameters (Item #{item.id})
                            </h4>
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-slate-500 uppercase">Negotiated Qty</label>
                                <input
                                  type="number"
                                  min="0"
                                  className="w-full lg:w-36 bg-white border border-slate-200 focus:border-slate-900 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-slate-900 font-bold"
                                  placeholder={`Max: ${item.requested_qty}`}
                                  value={form.negotiated_qty}
                                  onChange={(e) => setForm({ ...form, negotiated_qty: e.target.value })}
                                />
                              </div>
                              <div className="flex-1 space-y-1">
                                <label className="text-[10px] font-semibold text-slate-500 uppercase">Remarks</label>
                                <input
                                  className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-slate-900"
                                  placeholder="e.g. Approved partial shipment due to stock limits"
                                  value={form.remarks}
                                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-slate-500 uppercase">Set Status</label>
                                <select
                                  className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-md px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-slate-900 font-medium text-slate-700"
                                  value={form.status}
                                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                                >
                                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                                  <option value="APPROVED">APPROVED</option>
                                  <option value="REJECTED">REJECTED</option>
                                </select>
                              </div>
                              <div className="flex gap-2 lg:mb-0.5">
                                <Button
                                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs px-4 h-8 rounded-md"
                                  onClick={saveEdit}
                                >
                                  Save Configuration
                                </Button>
                                <Button
                                  variant="outline"
                                  className="h-8 text-xs px-4 rounded-md border-slate-200 hover:bg-slate-50 text-slate-600"
                                  onClick={() => setEditId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            {renderPagination()}
          </TableContainer>
        )}
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
