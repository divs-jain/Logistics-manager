import { AlertTriangle, X } from "lucide-react";
import { Button } from "./button";

export default function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isDestructive = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-full ${isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
              <AlertTriangle size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            {message}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={onCancel}
            >
              {cancelText}
            </Button>
            <Button
              className={isDestructive ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}
              onClick={onConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
