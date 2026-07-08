import { useEffect, useState, Fragment } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/api";
import TableContainer from "../components/ui/TableContainer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { formatUnit } from "../lib/utils";
import { usePagination } from "../hooks/usePagination";
import {
  GitMerge,
  Box,
  Trash2,
  AlertTriangle,
  Check,
  Plus,
  ChevronDown,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { CustomSelect } from "../components/ui/CustomSelect";

export default function MappingPage() {
  const [approvedItems, setApprovedItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [inventory, setInventory] = useState([]);
  const [allMappings, setAllMappings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  // Row expansion state
  const [expandedRows, setExpandedRows] = useState({});

  // For mapping modal
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mappingItem, setMappingItem] = useState(null); // The demand item being mapped
  const [isEditingMapping, setIsEditingMapping] = useState(false);
  const [skuSearch, setSkuSearch] = useState("");
  const [skuDropdownOpen, setSkuDropdownOpen] = useState(false);
  
  const [form, setForm] = useState({
    inventory_item_id: "",
    issued_qty: "",
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [demandsRes, invRes, mappingsRes] = await Promise.all([
        api.get("/categories/demands"),
        api.get("/inventory"),
        api.get("/admin/mappings")
      ]);

      const flat = [];
      const cats = new Set();
      demandsRes.data.forEach((batch) => {
        cats.add(batch.category_name);
        batch.items
          .filter((item) => item.status === "APPROVED")
          .forEach((item) => {
            flat.push({
              ...item,
              category_name: batch.category_name,
            });
          });
      });
      setApprovedItems(flat);
      setCategories(Array.from(cats));
      setInventory(invRes.data);
      setAllMappings(mappingsRes.data);
    } catch {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const reloadMappingsAndInventory = async () => {
    try {
      const [invRes, mappingsRes] = await Promise.all([
        api.get("/inventory"),
        api.get("/admin/mappings")
      ]);
      setInventory(invRes.data);
      setAllMappings(mappingsRes.data);
    } catch {
      showToast("Failed to sync data", "error");
    }
  };

  const showToast = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleMap = async (e) => {
    e.preventDefault();
    if (!form.inventory_item_id) {
      showToast("Please select a stock SKU", "error");
      return;
    }
    
    try {
      await api.post("/admin/mapping", {
        demand_item_id: Number(mappingItem.id),
        inventory_item_id: Number(form.inventory_item_id),
        issued_qty: Number(form.issued_qty),
      });
      setForm({ inventory_item_id: "", issued_qty: "" });
      setSkuSearch("");
      setMapModalOpen(false);
      showToast("Mapping saved successfully");
      reloadMappingsAndInventory();
      
      // Auto expand to see the new mapping
      setExpandedRows(prev => ({ ...prev, [mappingItem.id]: true }));
    } catch (err) {
      showToast(err.response?.data?.message || "Mapping failed", "error");
    }
  };

  const handleDelete = async (mappingId) => {
    if (!window.confirm("Are you sure you want to delete this mapping?")) return;
    try {
      const res = await api.delete(`/admin/mappings/${mappingId}`);
      showToast(res.data.message || "Mapping deleted");
      reloadMappingsAndInventory();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete mapping", "error");
    }
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredItems = approvedItems.filter(i => i.category_name === selectedCategory);
  const { currentItems, renderPagination, setCurrentPage } = usePagination(filteredItems, 10);

  useEffect(() => {
    setCurrentPage(1); // Reset on category change
    setExpandedRows({});
  }, [selectedCategory, setCurrentPage]);

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        {/* Header Block */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Inventory Mapping</h1>
          <p className="text-sm text-slate-500 mt-1">
            Allocate warehouse stock to approved category demands
          </p>
        </div>

        {/* Custom Notifications */}
        {message && (
          <div
            className={`flex items-center gap-2 text-sm font-semibold rounded-lg px-4 py-3 border shadow-sm transition-all ${
              message.type === "error"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-slate-900 text-white border-slate-800"
            }`}
          >
            {message.type === "error" ? <AlertTriangle size={16} /> : <Check size={16} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Category Selector */}
        <Card className="border border-slate-200 shadow-sm rounded-lg relative z-20">
          <CardHeader className="border-b border-slate-50/80 pb-4">
            <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <ClipboardList size={18} className="text-indigo-600" />
              Select Category
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="space-y-1 w-full sm:w-80">
                <CustomSelect
                  options={[
                    { value: "", label: "Select Category..." },
                    ...categories.map(c => ({ value: c, label: c }))
                  ]}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content list */}
        {loading ? (
          <div className="h-64 bg-slate-100 rounded-lg animate-pulse" />
        ) : !selectedCategory ? (
          <Card className="border border-slate-200 shadow-sm rounded-lg p-12 text-center bg-slate-50/50">
            <GitMerge size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1">No Category Selected</h3>
            <p className="text-slate-500 text-sm">Please select a category to view and map its demands.</p>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card className="border border-slate-200 shadow-sm rounded-lg p-8 text-center bg-slate-50/50">
            <p className="text-slate-500 text-sm">No approved demands found for this category.</p>
          </Card>
        ) : (
          <TableContainer>
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="p-4 w-12 text-center"></th>
                  <th className="p-4 w-1/4 text-left font-bold text-slate-600 uppercase tracking-wider text-[10px]">Demand Item</th>
                  <th className="p-4 w-1/4 text-left font-bold text-slate-600 uppercase tracking-wider text-[10px]">CC Remarks</th>
                  <th className="p-4 w-1/6 text-left font-bold text-slate-600 uppercase tracking-wider text-[10px]">Negotiated Qty</th>
                  <th className="p-4 w-1/6 text-left font-bold text-slate-600 uppercase tracking-wider text-[10px]">Total Mapped</th>
                  <th className="p-4 w-1/6 text-left font-bold text-slate-600 uppercase tracking-wider text-[10px]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentItems.map((item) => {
                  const itemMappings = allMappings.filter(m => m.demand_item_id === item.id);
                  const totalMapped = itemMappings.reduce((s, m) => s + m.issued_qty, 0);
                  const maxQty = item.negotiated_qty ?? item.requested_qty;
                  const remaining = maxQty - totalMapped;
                  const isExpanded = expandedRows[item.id];

                  return (
                    <Fragment key={item.id}>
                      {/* Main Item Row */}
                      <tr className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => toggleRow(item.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-slate-900">{item.raw_item_name}</p>
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-500 mt-1 inline-block">
                            {formatUnit(item.unit)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="bg-slate-50 border border-slate-100 rounded p-2 text-xs text-slate-600 italic max-w-xs break-words">
                            {item.remarks || "No remarks"}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-900 text-base">{maxQty}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700">{totalMapped}</span>
                            {totalMapped < maxQty && (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                                {remaining} pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[11px] px-3 rounded-md bg-slate-900 text-white hover:bg-slate-800 hover:text-white border-transparent flex items-center gap-1 shadow-sm font-semibold"
                            onClick={() => {
                              setMappingItem({ ...item, remaining });
                              setIsEditingMapping(false);
                              setSkuSearch("");
                              setForm({ inventory_item_id: "", issued_qty: "" });
                              setMapModalOpen(true);
                            }}
                          >
                            <Plus size={14} />
                            Add Mapping
                          </Button>
                        </td>
                      </tr>

                      {/* Expanded Mappings Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={6} className="p-0 bg-slate-50 border-b border-slate-100">
                            <div className="p-4 pl-12 flex justify-start">
                              <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                      <th className="p-3 text-left font-bold text-slate-600">Inventory SKU</th>
                                      <th className="p-3 text-left font-bold text-slate-600">Mapped Qty</th>
                                      <th className="p-3 text-left font-bold text-slate-600">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {itemMappings.length === 0 ? (
                                      <tr>
                                        <td colSpan={3} className="p-4 text-center text-slate-400 text-xs">
                                          No inventory items mapped yet.
                                        </td>
                                      </tr>
                                    ) : (
                                      itemMappings.map((m) => (
                                        <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                          <td className="p-3">
                                            <div className="flex items-center gap-2">
                                              <Box size={14} className="text-indigo-500" />
                                              <span className="font-semibold text-slate-800 text-sm">{m.inventory_name}</span>
                                            </div>
                                          </td>
                                        <td className="px-4 py-3 font-bold text-slate-700 text-sm">
                                          {m.issued_qty}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                          <div className="flex justify-end gap-2">
                                            <button 
                                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100"
                                              onClick={() => {
                                                setMappingItem({ ...item, remaining });
                                                setIsEditingMapping(true);
                                                const inv = inventory.find(i => i.id === m.inventory_item_id);
                                                setSkuSearch(inv ? inv.name : "");
                                                setForm({ inventory_item_id: m.inventory_item_id, issued_qty: m.issued_qty });
                                                setMapModalOpen(true);
                                              }}
                                            >
                                              Edit
                                            </button>
                                            <button 
                                              className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 flex items-center gap-1"
                                              onClick={() => handleDelete(m.id)}
                                            >
                                              <Trash2 size={12} /> Remove
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            {renderPagination()}
          </TableContainer>
        )}
      </div>

      {/* Mapping Dialog */}
      <Dialog open={mapModalOpen} onOpenChange={setMapModalOpen}>
        <DialogContent className="sm:max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Box size={18} className="text-slate-700" />
              {isEditingMapping ? "Edit Mapping" : "Map Inventory"}
            </DialogTitle>
          </DialogHeader>
          
          {mappingItem && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 rounded-lg p-3 text-sm border border-slate-200">
                <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Mapping Target</p>
                <p className="font-semibold text-slate-900">{mappingItem.raw_item_name}</p>
                <p className="text-slate-600 mt-1">Remaining to Map: <span className="font-bold text-slate-900">{mappingItem.remaining} {formatUnit(mappingItem.unit)}</span></p>
              </div>

              <form onSubmit={handleMap} className="space-y-4">
                <div className="space-y-1 relative">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Stock SKU (Searchable)</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-md px-3 py-2 text-sm outline-none transition-all focus:ring-1 focus:ring-slate-900 font-medium text-slate-900"
                    placeholder="Type to search inventory..."
                    value={skuSearch}
                    onChange={(e) => {
                      setSkuSearch(e.target.value);
                      setSkuDropdownOpen(true);
                      setForm(prev => ({ ...prev, inventory_item_id: "" })); // reset selected if they type
                    }}
                    onFocus={() => setSkuDropdownOpen(true)}
                    disabled={isEditingMapping}
                  />
                  {skuDropdownOpen && !isEditingMapping && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-xl max-h-48 overflow-auto py-1">
                      {inventory.filter(i => i.name.toLowerCase().includes(skuSearch.toLowerCase())).length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-500">No matching SKUs found.</div>
                      ) : (
                        inventory
                          .filter(i => i.name.toLowerCase().includes(skuSearch.toLowerCase()))
                          .map((inv) => (
                            <button
                              key={inv.id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors flex justify-between"
                              onClick={() => {
                                setSkuSearch(inv.name);
                                setForm({ ...form, inventory_item_id: inv.id });
                                setSkuDropdownOpen(false);
                              }}
                            >
                              <span className="font-semibold text-slate-800">{inv.name} ({inv.unit})</span>
                              <span className="text-slate-500 text-xs border border-slate-200 rounded px-1.5 bg-slate-50 font-bold">Stock: {inv.quantity}</span>
                            </button>
                          ))
                      )}
                    </div>
                  )}
                  {form.inventory_item_id && (
                     <div className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                       <Check size={10} /> SKU selected
                     </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Allocation Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-md px-3 py-2 text-sm outline-none transition-all focus:ring-1 focus:ring-slate-900 font-bold"
                    placeholder={isEditingMapping ? "Enter new total allocated quantity" : `Suggested default: ${mappingItem.remaining > 0 ? mappingItem.remaining : '0'}`}
                    value={form.issued_qty}
                    onChange={(e) => setForm({ ...form, issued_qty: e.target.value })}
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-200 text-slate-600"
                    onClick={() => setMapModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-6"
                  >
                    Save Mapping
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
