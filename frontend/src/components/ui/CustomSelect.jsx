import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export function CustomSelect({ value, onChange, options, placeholder = "Select an option", className = "", required = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 rounded-md px-3 py-2 text-sm text-left flex items-center justify-between transition-all outline-none ${!selectedOption && required ? 'invalid:border-rose-500' : ''}`}
      >
        <span className={selectedOption ? "text-slate-900 font-medium truncate pr-2" : "text-slate-500 truncate pr-2"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={16} className={`text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Hidden input to allow form validation if required */}
      {required && (
        <input 
          type="text" 
          value={value} 
          onChange={() => {}} 
          className="absolute opacity-0 w-0 h-0 pointer-events-none" 
          required={required} 
        />
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto py-1 animate-in fade-in zoom-in-95 duration-100">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-500 text-center">No options</div>
          ) : (
            options.map((option) => {
              const isSelected = String(option.value) === String(value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    isSelected ? "bg-slate-50 text-slate-900 font-semibold" : "text-slate-700"
                  }`}
                >
                  <span className="truncate pr-4">{option.label}</span>
                  {isSelected && <Check size={14} className="text-slate-900 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
