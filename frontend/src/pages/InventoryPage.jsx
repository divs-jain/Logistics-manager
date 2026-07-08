import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../api/api";
import TableContainer from "../components/ui/TableContainer";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { formatUnit, fuzzyMatch } from "../lib/utils";
import { usePagination } from "../hooks/usePagination";
import { useToast } from "../contexts/ToastContext";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import {
  Plus,
  Settings,
  MapPin,
  PackageOpen,
  AlertTriangle,
  Trash2,
  X,
  Edit2,
  Save,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";

export default function InventoryPage() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();
  
  // Filters, Sorting and Visibility
  const [columnFilters, setColumnFilters] = useState({ name: "", unit: "", location: "", quantity: "" });
  const [visibleCols, setVisibleCols] = useState({ name: true, unit: true, location: true, quantity: true, actions: true });
  const [showColDropdown, setShowColDropdown] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    unit: "",
    quantity: "",
    location: "",
  });
  const [openNameDropdown, setOpenNameDropdown] = useState(false);
  
  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", unit: "", location: "" });
  const [adjustChange, setAdjustChange] = useState("");
  
  // Delete State
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await api.get("/inventory");
      setItems(res.data);
    } catch {
      showToast("Failed to load inventory", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post("/inventory", {
        name: form.name,
        unit: formatUnit(form.unit),
        quantity: Number(form.quantity),
        location: form.location || null,
      });
      setForm({ name: "", unit: "", quantity: "", location: "" });
      setIsAddModalOpen(false);
      showToast("Item added successfully");
      loadItems();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add item", "error");
    }
  };

  const handleUpdateDetails = async (id) => {
    try {
      await api.put(`/inventory/details/${id}`, editForm);
      if (adjustChange && !isNaN(Number(adjustChange)) && Number(adjustChange) !== 0) {
        await api.put(`/inventory/${id}`, { change: Number(adjustChange) });
      }
      setEditingId(null);
      setAdjustChange("");
      showToast("Item updated successfully");
      loadItems();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update item", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      await api.delete(`/inventory/${deleteDialog.id}`);
      showToast("Item deleted successfully");
      loadItems();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete item", "error");
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    let filtered = items.filter((item) => {
      const matchName = fuzzyMatch(item.name, columnFilters.name);
      const matchUnit = fuzzyMatch(item.unit, columnFilters.unit);
      const matchLoc = fuzzyMatch(item.location || "", columnFilters.location);
      const matchQty = columnFilters.quantity ? String(item.quantity).includes(columnFilters.quantity) : true;
      return matchName && matchUnit && matchLoc && matchQty;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (aVal === null) aVal = "";
      if (bVal === null) bVal = "";

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredItems(filtered);
  }, [columnFilters, items, sortConfig]);

  const { currentItems, renderPagination, setCurrentPage } = usePagination(filteredItems, 10);

  useEffect(() => {
    setCurrentPage(1);
  }, [columnFilters, sortConfig, setCurrentPage]);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown size={12} className="text-slate-300 inline ml-1 cursor-pointer" onClick={() => handleSort(columnKey)} />;
    if (sortConfig.direction === 'asc') return <ArrowUp size={12} className="text-slate-600 inline ml-1 cursor-pointer" onClick={() => handleSort(columnKey)} />;
    return <ArrowDown size={12} className="text-slate-600 inline ml-1 cursor-pointer" onClick={() => handleSort(columnKey)} />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 font-sans">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Inventory</h1>
            <p className="text-sm text-slate-500 mt-1">Manage, search, and adjust warehouse stock levels</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Button
                variant="outline"
                className="h-9 px-3 flex items-center gap-2 border-slate-200 text-slate-600 hover:text-slate-900 bg-white shadow-sm rounded-md"
                onClick={() => setShowColDropdown(!showColDropdown)}
              >
                <Settings size={14} />
                <span className="text-xs font-semibold">Columns</span>
              </Button>
              
              {showColDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 px-2">Show/Hide</div>
                  {Object.keys(visibleCols).map(colKey => (
                    <label key={colKey} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded-md cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={visibleCols[colKey]}
                        onChange={() => setVisibleCols(prev => ({ ...prev, [colKey]: !prev[colKey] }))}
                        className="rounded text-slate-900 focus:ring-slate-900"
                      />
                      <span className="text-sm font-medium text-slate-700 capitalize">{colKey}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2"
            >
              <Plus size={16} />
              Add Stock Item
            </Button>
          </div>
        </div>

        {/* Catalog / Overview */}
        <div className="space-y-4">

          {loading ? (
            <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          ) : filteredItems.length === 0 ? (
            <Card className="border border-slate-100 shadow-sm rounded-2xl p-8 text-center">
              <p className="text-slate-400 text-sm">No inventory items matched your search.</p>
            </Card>
          ) : (
            <TableContainer>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 align-top">
                    {visibleCols.name && (
                      <th className="p-3 bg-slate-50 text-left w-1/3">
                        <div className="font-bold text-slate-600 uppercase tracking-wider text-[10px] mb-2 flex items-center">
                          Item Details <SortIcon columnKey="name" />
                        </div>
                        <input 
                          className="w-full h-7 text-xs border border-slate-200 rounded px-2 font-normal focus:border-slate-900 outline-none"
                          placeholder="Filter name..."
                          value={columnFilters.name}
                          onChange={(e) => setColumnFilters({...columnFilters, name: e.target.value})}
                        />
                      </th>
                    )}
                    {visibleCols.unit && (
                      <th className="p-3 bg-slate-50 text-left w-24">
                        <div className="font-bold text-slate-600 uppercase tracking-wider text-[10px] mb-2 flex items-center">
                          Unit <SortIcon columnKey="unit" />
                        </div>
                        <input 
                          className="w-full h-7 text-xs border border-slate-200 rounded px-2 font-normal focus:border-slate-900 outline-none"
                          placeholder="Filter..."
                          value={columnFilters.unit}
                          onChange={(e) => setColumnFilters({...columnFilters, unit: e.target.value})}
                        />
                      </th>
                    )}
                    {visibleCols.location && (
                      <th className="p-3 bg-slate-50 text-left w-32">
                        <div className="font-bold text-slate-600 uppercase tracking-wider text-[10px] mb-2 flex items-center">
                          Location <SortIcon columnKey="location" />
                        </div>
                        <input 
                          className="w-full h-7 text-xs border border-slate-200 rounded px-2 font-normal focus:border-slate-900 outline-none"
                          placeholder="Filter..."
                          value={columnFilters.location}
                          onChange={(e) => setColumnFilters({...columnFilters, location: e.target.value})}
                        />
                      </th>
                    )}
                    {visibleCols.quantity && (
                      <th className="p-3 bg-slate-50 text-left w-28">
                        <div className="font-bold text-slate-600 uppercase tracking-wider text-[10px] mb-2 flex items-center">
                          Stock Level <SortIcon columnKey="quantity" />
                        </div>
                        <input 
                          className="w-full h-7 text-xs border border-slate-200 rounded px-2 font-normal focus:border-slate-900 outline-none"
                          placeholder="Qty..."
                          value={columnFilters.quantity}
                          onChange={(e) => setColumnFilters({...columnFilters, quantity: e.target.value})}
                        />
                      </th>
                    )}
                    {visibleCols.actions && (
                      <th className="p-3 bg-slate-50 text-left w-32">
                        <div className="font-bold text-slate-600 uppercase tracking-wider text-[10px] mb-2">Actions</div>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentItems.map((item) => {
                    const isLowStock = item.quantity <= 10;
                    const isEditing = editingId === item.id;
                    
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        {visibleCols.name && (
                          <td className="p-3 font-semibold text-slate-900">
                            {isEditing ? (
                              <input
                                className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                                value={editForm.name}
                                onChange={e => setEditForm({...editForm, name: e.target.value})}
                              />
                            ) : item.name}
                          </td>
                        )}
                        {visibleCols.unit && (
                          <td className="p-3 text-slate-600 font-medium">
                            {isEditing ? (
                              <input
                                className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                                value={editForm.unit}
                                onChange={e => setEditForm({...editForm, unit: e.target.value})}
                              />
                            ) : (
                              <span className="bg-slate-100 px-2.5 py-0.5 rounded-md text-xs font-mono">{formatUnit(item.unit)}</span>
                            )}
                          </td>
                        )}
                        {visibleCols.location && (
                          <td className="p-3 text-slate-600 font-medium">
                            {isEditing ? (
                              <input
                                className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                                value={editForm.location}
                                onChange={e => setEditForm({...editForm, location: e.target.value})}
                              />
                            ) : item.location ? (
                              <span className="inline-flex items-center gap-1 text-slate-600">
                                <MapPin size={12} className="text-slate-400" />
                                {item.location}
                              </span>
                            ) : <span className="text-slate-400">—</span>}
                          </td>
                        )}
                        {visibleCols.quantity && (
                          <td className="p-3">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-slate-500 font-mono w-6">{item.quantity}</span>
                                <span className="text-xs text-slate-400">+</span>
                                <input
                                  type="number"
                                  className="w-16 border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                                  placeholder="+/-"
                                  value={adjustChange}
                                  onChange={e => setAdjustChange(e.target.value)}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-sm ${isLowStock ? "text-amber-600" : "text-slate-800"}`}>
                                  {item.quantity}
                                </span>
                                {isLowStock && (
                                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                    <AlertTriangle size={10} /> Low
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        )}
                        {visibleCols.actions && (
                          <td className="p-3">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <button
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                                  onClick={() => handleUpdateDetails(item.id)}
                                  title="Save"
                                >
                                  <Save size={14} />
                                </button>
                                <button
                                  className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
                                  onClick={() => {
                                    setEditingId(null);
                                    setAdjustChange("");
                                  }}
                                  title="Cancel"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <button
                                  className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                  onClick={() => {
                                    setEditingId(item.id);
                                    setEditForm({ name: item.name, unit: item.unit, location: item.location || "" });
                                    setAdjustChange("");
                                  }}
                                  title="Edit"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                  onClick={() => setDeleteDialog({ open: true, id: item.id })}
                                  title="Delete"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {renderPagination()}
            </TableContainer>
          )}
        </div>
      </div>

      {/* Add Stock Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Plus size={18} className="text-indigo-600" />
                Add Stock Item
              </h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5">
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-1 relative">
                  <label className="text-xs font-medium text-slate-700">Item Name</label>
                  <input
                    className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-md px-3 py-2 text-sm outline-none transition-all focus:ring-1 focus:ring-slate-900"
                    placeholder="e.g. Paint Brush"
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      setOpenNameDropdown(true);
                    }}
                    onFocus={() => setOpenNameDropdown(true)}
                    onBlur={() => setTimeout(() => setOpenNameDropdown(false), 200)}
                    required
                    autoComplete="off"
                  />
                  {openNameDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-auto">
                      {Array.from(new Map(items.map(item => [item.name, item])).values())
                        .filter((item) => item.name.toLowerCase().includes(form.name.toLowerCase()))
                        .map((item) => (
                          <div
                            key={item.id}
                            className="px-3 py-2 text-sm hover:bg-slate-100 cursor-pointer"
                            onClick={() => {
                              setForm({ ...form, name: item.name, unit: item.unit });
                              setOpenNameDropdown(false);
                            }}
                          >
                            {item.name} <span className="text-slate-400 text-xs ml-2">({item.unit})</span>
                          </div>
                        ))}
                      {!items.some(item => item.name.toLowerCase() === form.name.toLowerCase()) && form.name && (
                        <div 
                          className="px-3 py-2 text-sm text-slate-900 hover:bg-slate-50 cursor-pointer border-t border-slate-100 font-medium"
                          onClick={() => {
                            setOpenNameDropdown(false);
                          }}
                        >
                          <Plus size={14} className="inline mr-1"/> Create "{form.name}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Unit</label>
                    <input
                      className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-md px-3 py-2 text-sm outline-none transition-all focus:ring-1 focus:ring-slate-900"
                      placeholder="e.g. pc, ml"
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-md px-3 py-2 text-sm outline-none transition-all focus:ring-1 focus:ring-slate-900"
                      placeholder="0"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Warehouse Location</label>
                  <input
                    className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-md px-3 py-2 text-sm outline-none transition-all focus:ring-1 focus:ring-slate-900"
                    placeholder="e.g. Section A4"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    className="border-slate-200 text-slate-600"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-6"
                  >
                    Save Item
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog 
        isOpen={deleteDialog.open}
        title="Delete Item"
        message="Are you sure you want to delete this inventory item?"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialog({ open: false, id: null })}
      />
    </DashboardLayout>
  );
}
