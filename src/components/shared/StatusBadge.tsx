import { cn, STATUS_COLORS } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        STATUS_COLORS[status] ?? "bg-gray-100 text-gray-800"
      )}
    >
      {label}
    </span>
  );
}
