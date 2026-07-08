// reusable table wrapper
export default function TableContainer({ children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col">
      <div className="max-h-[500px] overflow-auto custom-scrollbar">
        {children}
      </div>
    </div>
  );
}
