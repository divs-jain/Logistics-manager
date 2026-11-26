import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/api";
import { getRole } from "../lib/auth";
import TableContainer from "../components/ui/TableContainer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { formatUnit, fuzzyMatch } from "../lib/utils";
import { usePagination } from "../hooks/usePagination";
import { useToast } from "../contexts/ToastContext";
import {
  Inbox,
  AlertTriangle,
  ClipboardList,
  History,
  Send,
  PackageOpen
} from "lucide-react";
import { CustomSelect } from "../components/ui/CustomSelect";

export default function DeliveriesPage() {
  const role = getRole();
  const isCC = role === "CC";

  if (isCC) return <CCDeliveries />;
  return <CategoryDeliveries />;
}

function CCDeliveries() {
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const showToast = useToast();

  const [deliveryInputs, setDeliveryInputs] = useState({});
  const [receiverName, setReceiverName] = useState("");
  
  const [colFilters, setColFilters] = useState({ name: "", mapped: "", delivered: "", remaining: "" });

  useEffect(() => {
    api.get("/admin/category-users").then((res) => setCategories(res.data));
  }, []);

  const loadDashboard = async () => {
    if (!categoryId) return;
    try {
      setLoading(true);
      const [dashRes, histRes] = await Promise.all([
        api.get(`/admin/deliveries/${categoryId}`),
        api.get(`/admin/deliveries/${categoryId}/history`)
      ]);
      setRows(dashRes.data);
      setHistory(histRes.data);
      setDeliveryInputs({});
      setReceiverName("");
    } catch {
      showToast("Failed to load deliveries", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [categoryId]);

  useEffect(() => {
    setFilteredRows(
      rows.filter((r) => {
        const matchName = fuzzyMatch(r.item_name, colFilters.name);
        const matchMapped = colFilters.mapped ? String(r.mapped_qty).includes(colFilters.mapped) : true;
        const matchDel = colFilters.delivered ? String(r.delivered_qty).includes(colFilters.delivered) : true;
        const matchRem = colFilters.remaining ? String(r.to_deliver).includes(colFilters.remaining) : true;
        return matchName && matchMapped && matchDel && matchRem;
      })
    );
  }, [rows, colFilters]);

  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    if (!categoryId) return;
    if (!receiverName) {
      showToast("Receiver name is required", "error");
      return;
    }

    const items = Object.entries(deliveryInputs)
      .filter(([, qty]) => qty && Number(qty) > 0)
      .map(([mapping_id, qty]) => ({
        mapping_id: Number(mapping_id),
        delivered_qty: Number(qty)
      }));

    if (items.length === 0) {
      showToast("No quantities entered for delivery", "error");
      return;
    }

    try {
      await api.post("/admin/deliveries/batch", {
        category_user_id: Number(categoryId),
        receiver_name: receiverName,
        items
      });
      showToast("Delivery batch recorded successfully");
      loadDashboard();
    } catch (err) {
      showToast(err.response?.data?.message || "Delivery batch failed", "error");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Deliveries & Fulfillment</h1>
          <p className="text-sm text-slate-500 mt-1">
            Dispatch items and maintain delivery logs
          </p>
        </div>

        <Card className="border border-slate-100 shadow-sm rounded-2xl relative z-20">
          <CardHeader className="border-b border-slate-50/80 pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <ClipboardList size={16} className="text-indigo-600" />
              Select Category
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 px-4">
            <div className="w-full sm:w-80">
              <CustomSelect
                options={[
                  { value: "", label: "Select Category..." },
                  ...categories.map(c => ({ value: c.id, label: c.category_name }))
                ]}
                value={categoryId}
                onChange={setCategoryId}
              />
            </div>
          </CardContent>
        </Card>

        {categoryId && (
          <div className="grid grid-cols-1 gap-6">
            
            {/* Active Demands Table for Dispatch */}
            <Card className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden flex flex-col max-h-[70vh]">
              <CardHeader className="border-b border-slate-50/80 bg-white">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PackageOpen size={18} className="text-emerald-600"/> 
                    Prepare Delivery
                  </div>
                </CardTitle>
              </CardHeader>
              
              <div className="flex-1 overflow-auto bg-slate-50/30">
                {loading ? (
                  <div className="p-8 text-center text-slate-400">Loading demands...</div>
                ) : filteredRows.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">No demands available for this category.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-100 shadow-sm">
                      <tr className="align-top">
                        <th className="p-3 text-left w-1/3">
                          <div className="font-bold text-slate-600 uppercase tracking-wider text-[10px] mb-2">Item</div>
                          <input 
                            className="w-full h-7 text-xs border border-slate-200 rounded px-2 font-normal focus:border-slate-900 outline-none"
                            placeholder="Filter item..."
                            value={colFilters.name}
                            onChange={(e) => setColFilters({...colFilters, name: e.target.value})}
                          />
                        </th>
                        <th className="p-3 text-left w-24">
                          <div className="font-bold text-slate-600 uppercase tracking-wider text-[10px] mb-2">Allocated</div>
                          <input 
                            className="w-full h-7 text-xs border border-slate-200 rounded px-2 font-normal focus:border-slate-900 outline-none"
                            placeholder="Filter..."
                            value={colFilters.mapped}
                            onChange={(e) => setColFilters({...colFilters, mapped: e.target.value})}
                          />
                        </th>
                        <th className="p-3 text-left w-24">
                          <div className="font-bold text-slate-600 uppercase tracking-wider text-[10px] mb-2">Delivered</div>
                          <input 
                            className="w-full h-7 text-xs border border-slate-200 rounded px-2 font-normal focus:border-slate-900 outline-none"
                            placeholder="Filter..."
                            value={colFilters.delivered}
                            onChange={(e) => setColFilters({...colFilters, delivered: e.target.value})}
                          />
                        </th>
                        <th className="p-3 text-left w-24">
                          <div className="font-bold text-slate-600 uppercase tracking-wider text-[10px] mb-2">Remaining</div>
                          <input 
                            className="w-full h-7 text-xs border border-slate-200 rounded px-2 font-normal focus:border-slate-900 outline-none"
                            placeholder="Filter..."
                            value={colFilters.remaining}
                            onChange={(e) => setColFilters({...colFilters, remaining: e.target.value})}
                          />
                        </th>
                        <th className="p-3 text-left w-32">
                          <div className="font-bold text-slate-600 uppercase tracking-wider text-[10px] mb-2">Status</div>
                        </th>
                        <th className="p-3 text-left w-32">
                          <div className="font-bold text-slate-600 uppercase tracking-wider text-[10px] mb-2">Delivering Qty</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredRows.map((r) => {
                        const isComplete = r.to_deliver <= 0;
                        return (
                          <tr key={r.mapping_id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3">
                              <p className="font-semibold text-slate-900">{r.item_name}</p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{formatUnit(r.unit)} • {r.location}</p>
                            </td>
                            <td className="p-3 font-bold text-slate-800">{r.mapped_qty}</td>
                            <td className="p-3 font-bold text-slate-800">{r.delivered_qty}</td>
                            <td className="p-3 font-bold text-slate-800">{r.to_deliver}</td>
                            <td className="p-3">
                              {isComplete ? (
                                <span className="text-xs font-bold text-emerald-600">Complete</span>
                              ) : (
                                <span className="text-xs font-bold text-amber-600">Pending</span>
                              )}
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                disabled={isComplete}
                                max={r.to_deliver}
                                min="0"
                                className="w-20 bg-slate-50 border border-slate-200 focus:border-slate-900 rounded-md px-2 py-1.5 text-sm outline-none font-bold disabled:opacity-50"
                                placeholder="0"
                                value={deliveryInputs[r.mapping_id] || ""}
                                onChange={(e) => setDeliveryInputs({ ...deliveryInputs, [r.mapping_id]: e.target.value })}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              
              <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1 w-full sm:w-auto flex items-center gap-2">
                  <label className="text-sm font-bold text-slate-700 whitespace-nowrap">Receiver's Name:</label>
                  <input
                    type="text"
                    className="w-full sm:max-w-xs bg-white border border-slate-300 focus:border-slate-900 rounded-md px-3 py-2 text-sm outline-none"
                    placeholder="Enter full name..."
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleDeliverySubmit}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold"
                  disabled={!receiverName || Object.values(deliveryInputs).every(v => !v || Number(v) === 0)}
                >
                  <Send size={16} className="mr-2"/> Submit Delivery
                </Button>
              </div>
            </Card>

            {/* Delivery Logs */}
            <Card className="border border-slate-100 shadow-sm rounded-2xl">
              <CardHeader className="border-b border-slate-50/80">
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                  <History size={18} className="text-violet-600" />
                  Delivery Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 bg-slate-50/50">
                {loading ? (
                  <div className="p-8 text-center text-slate-400">Loading logs...</div>
                ) : history.length === 0 ? (
                  <div className="text-center text-slate-400 p-8">No delivery logs found.</div>
                ) : (
                  <div className="space-y-6">
                    {history.map((log) => (
                      <div key={log.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {new Date(log.delivered_at).toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Delivered by: <span className="font-semibold text-slate-700">{log.delivered_by}</span>
                            </p>
                          </div>
                          <div className="text-sm font-medium text-slate-700 bg-white px-3 py-1.5 rounded-lg border shadow-sm self-start sm:self-auto">
                            Receiver: <span className="font-bold text-slate-900">{log.receiver_name}</span>
                          </div>
                        </div>
                        <div className="p-4">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-100 text-left text-xs text-slate-500 uppercase">
                                <th className="pb-2 font-bold">Item (Inventory)</th>
                                <th className="pb-2 font-bold">Demand Match</th>
                                <th className="pb-2 font-bold text-right">Qty Delivered</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {log.items.map((item, idx) => (
                                <tr key={idx}>
                                  <td className="py-2 font-semibold text-slate-800">{item.inventory_name}</td>
                                  <td className="py-2 text-slate-500">{item.demand_name}</td>
                                  <td className="py-2 text-right font-bold text-emerald-600">+{item.delivered_qty}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function CategoryDeliveries() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/categories/my-deliveries")
      .then((res) => setRows(res.data))
      .finally(() => setLoading(false));
  }, []);

  const { currentItems: currentRows, renderPagination } = usePagination(rows, 10);

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Delivery Status</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track fulfillment levels and shipment metrics for your category demands
          </p>
        </div>

        {loading ? (
          <div className="h-64 bg-slate-100 rounded-lg animate-pulse" />
        ) : rows.length === 0 ? (
          <div className="border border-slate-200 rounded-lg p-10 text-center bg-white shadow-sm">
            <Inbox size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500 text-sm">No approved demands under delivery yet.</p>
          </div>
        ) : (
          <TableContainer>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {["Item Requested", "Total Approved", "Delivered Qty", "Shipment Metrics"].map(
                    (h) => (
                      <th
                        key={h}
                        className="p-4 bg-slate-50 text-left font-bold text-slate-600 uppercase tracking-wider text-[10px]"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentRows.map((r) => {
                  const isShipped = r.pending <= 0;
                  const ratio = r.approved_qty > 0 ? Math.min((r.delivered_qty / r.approved_qty) * 100, 100) : 0;
                  return (
                    <tr key={r.demand_item_id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{r.item_name}</p>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-500 mt-1 inline-block">
                          {formatUnit(r.unit)}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">{r.approved_qty}</td>
                      <td className="p-4 font-bold text-slate-900">{r.delivered_qty}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-slate-900 h-full rounded-full transition-all duration-300"
                              style={{ width: `${ratio}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-600">{Math.round(ratio)}%</span>
                          {isShipped ? (
                            <span className="text-xs font-bold text-emerald-600">Complete</span>
                          ) : (
                            <span className="text-xs font-bold text-amber-600">{r.pending} pending</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {renderPagination()}
          </TableContainer>
        )}
      </div>
    </DashboardLayout>
  );
}
