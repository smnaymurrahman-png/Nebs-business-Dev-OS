"use client";

import { exportToCSV, exportToExcel } from "@/lib/export";
import { Download } from "lucide-react";

interface ExportButtonsProps {
  data: Record<string, unknown>[];
  filename: string;
}

export function ExportButtons({ data, filename }: ExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => exportToCSV(data, filename)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 transition-all"
      >
        <Download className="w-3.5 h-3.5" />
        CSV
      </button>
      <button
        onClick={() => exportToExcel(data, filename)}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 transition-all"
      >
        <Download className="w-3.5 h-3.5" />
        Excel
      </button>
    </div>
  );
}
