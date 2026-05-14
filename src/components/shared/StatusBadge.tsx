import { cn, STATUS_COLORS } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold gap-1.5",
        STATUS_COLORS[status] ?? "bg-slate-100 text-slate-600"
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 shrink-0" />
      {label}
    </span>
  );
}
