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
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

export function inputClass(error?: string) {
  return cn(
    "w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-gray-50/50 transition-all font-medium",
    error ? "border-red-300" : "border-gray-200"
  );
}

export function selectClass() {
  return "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50/50 transition-all font-medium";
}
