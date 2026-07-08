import DashboardLayout from "../layouts/DashboardLayout";
import { useEffect, useState } from "react";
import api from "../api/api";
import { Card, CardContent } from "../components/ui/Card";
import TableContainer from "../components/ui/TableContainer";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { formatUnit } from "../lib/utils";
import {
  BarChart3,
  Download,
  AlertTriangle,
  CheckCircle,
  Layers,
  Inbox,
  Info,
  Calendar,
  Warehouse,
} from "lucide-react";

export default function ProcurementAnalysisPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadAnalysis();
  }, []);

  const showToast = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/analysis/inventory");
      setRows(res.data);
    } catch {
      showToast("Failed to load analysis", "error");
    } finally {
      setLoading(false);
    }
  };

  const openBreakdown = async (inventoryId) => {
    try {
      const res = await api.get(`/admin/analysis/inventory/${inventoryId}`);
      setBreakdown(res.data);
      setBreakdownOpen(true);
    } catch {
      showToast("Failed to load breakdown details", "error");
    }
  };

  const exportCsv = async () => {
    try {
      const res = await api.get("/admin/analysis/inventory/export", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "procurement_analysis.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast("Procurement report exported successfully");
    } catch {
      showToast("Export report failed", "error");
    }
  };

  const deficitCount = rows.filter((r) => r.status < 0).length;
  const surplusCount = rows.filter((r) => r.status >= 0).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Procurement Analysis
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Audit stock surplus/deficit counts calculated against active department demands
            </p>
          </div>
          <Button
            variant="outline"
            onClick={exportCsv}
            className="flex items-center gap-1.5 border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl self-start sm:self-auto shadow-sm"
          >
            <Download size={15} />
            Export CSV Report
          </Button>
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
            {message.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Overview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-slate-100 bg-gradient-to-br from-indigo-500/10 to-blue-500/5 text-indigo-700 rounded-xl shadow-sm hover:shadow transition-all duration-300">
            <CardContent className="p-4 flex justify-between items-center">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cataloged Items</p>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{rows.length}</h3>
              </div>
              <div className="p-2 bg-white rounded-lg border border-white shadow-sm text-slate-700">
                <Layers size={16} />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 bg-gradient-to-br from-rose-500/10 to-pink-500/5 text-rose-700 rounded-xl shadow-sm hover:shadow transition-all duration-300">
            <CardContent className="p-4 flex justify-between items-center">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deficit SKUs</p>
                <h3 className="text-2xl font-black text-rose-600 tracking-tight">{deficitCount}</h3>
              </div>
              <div className="p-2 bg-white rounded-lg border border-white shadow-sm text-rose-500">
                <AlertTriangle size={16} />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-100 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 text-emerald-700 rounded-xl shadow-sm hover:shadow transition-all duration-300">
            <CardContent className="p-4 flex justify-between items-center">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Surplus SKUs</p>
                <h3 className="text-2xl font-black text-emerald-600 tracking-tight">{surplusCount}</h3>
              </div>
              <div className="p-2 bg-white rounded-lg border border-white shadow-sm text-emerald-500">
                <CheckCircle size={16} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis table */}
        <div>
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 mb-4">
            <BarChart3 size={20} className="text-slate-500" />
            <h3 className="font-bold text-slate-800 text-base">Surplus/Deficit (S/D) Ledger</h3>
          </div>

          {loading ? (
            <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ) : rows.length === 0 ? (
            <div className="border border-dashed border-slate-200 rounded-2xl p-10 text-center bg-slate-50/20">
              <Inbox size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-400 text-sm">No analysis ledger found.</p>
            </div>
          ) : (
            <TableContainer>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {[
                      "ID",
                      "Item Details",
                      "Unit",
                      "Total Stock",
                      "Total Demand",
                      "Delivered",
                      "Net Ledger (S/D)",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="p-3.5 bg-slate-50 text-left font-bold text-slate-600 uppercase tracking-wider text-[10px]"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => {
                    const isDeficit = row.status < 0;
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-3.5 font-mono text-slate-400 text-xs">#{row.id}</td>
                        <td className="p-3.5 font-bold text-slate-950">{row.item_name}</td>
                        <td className="p-3.5 text-slate-600 font-medium">
                          <span className="bg-slate-100 px-2.5 py-0.5 rounded-md text-xs font-mono">
                            {formatUnit(row.unit)}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-800 font-bold">{row.total_inventory}</td>
                        <td className="p-3.5 text-slate-800 font-bold">{row.total_demand}</td>
                        <td className="p-3.5 text-emerald-600 font-extrabold">{row.delivered}</td>
                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold border ${
                              isDeficit
                                ? "bg-rose-50 text-rose-700 border-rose-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-100"
                            }`}
                          >
                            {isDeficit ? `Deficit: ${row.status}` : `Surplus: +${row.status}`}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] px-3.5 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center gap-1 font-semibold"
                            onClick={() => openBreakdown(row.id)}
                          >
                            <Info size={11} />
                            Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableContainer>
          )}
        </div>

        {/* Demand breakdown modal overlay */}
        <Dialog open={breakdownOpen} onOpenChange={setBreakdownOpen}>
          <DialogContent className="max-w-2xl border border-slate-100 shadow-2xl rounded-2xl overflow-hidden p-6 font-sans">
            <DialogHeader className="border-b border-slate-50 pb-4">
              <DialogTitle className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <Warehouse size={20} className="text-violet-600" />
                {breakdown?.inventory?.name} — Mapped Allocation details
              </DialogTitle>
            </DialogHeader>

            {breakdown && (
              <div className="space-y-5 mt-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-600 grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div>
                    <span className="text-slate-400">Total Stock Available:</span>
                    <strong className="block text-slate-800 text-sm font-bold mt-0.5">
                      {breakdown.inventory.quantity} {breakdown.inventory.unit}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Warehouse Location:</span>
                    <strong className="block text-slate-800 text-sm font-bold mt-0.5">
                      {breakdown.inventory.location || "Not assigned"}
                    </strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Allocated Demands</span>
                  <TableContainer>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          {["Category User", "Mapped Qty", "Fulfill Delivered"].map((h) => (
                            <th key={h} className="p-3 bg-slate-50 text-left font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {breakdown.demands.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="p-4 text-center text-slate-400 text-xs">
                              No department demands currently mapped to this item.
                            </td>
                          </tr>
                        ) : (
                          breakdown.demands.map((d, i) => (
                            <tr key={i} className="hover:bg-slate-50/20">
                              <td className="p-3 font-semibold text-slate-700">{d.category_name}</td>
                              <td className="p-3 font-bold text-violet-600">{d.mapped_qty}</td>
                              <td className="p-3 font-bold text-emerald-600">{d.delivered_qty}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </TableContainer>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
