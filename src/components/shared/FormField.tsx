import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, required, error, children, className }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
    </div>
  );
}

export function inputClass(error?: string) {
  return cn(
    "w-full px-3.5 py-2.5 text-sm font-medium border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-300 bg-white placeholder:text-slate-300 text-slate-700 transition-all shadow-sm",
    error ? "border-red-300" : "border-[#E2E8F0]"
  );
}

export function selectClass() {
  return "w-full px-3.5 py-2.5 text-sm font-medium border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-300 bg-white text-slate-700 transition-all shadow-sm";
}
