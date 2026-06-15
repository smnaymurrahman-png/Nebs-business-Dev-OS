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
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
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
    "w-full px-3.5 py-2.5 text-sm font-medium border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white placeholder:text-gray-300 text-gray-700 transition-all",
    error ? "border-red-300" : "border-gray-200"
  );
}

export function selectClass() {
  return "w-full px-3.5 py-2.5 text-sm font-medium border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 bg-white text-gray-700 transition-all";
}
