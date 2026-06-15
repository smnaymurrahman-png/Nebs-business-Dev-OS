"use client";

import { exportToCSV, exportToExcel } from "@/lib/export";
import { FileDown } from "lucide-react";

interface ExportButtonsProps {
  data: Record<string, unknown>[];
  filename: string;
}

const btnClass = "flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-all";

export function ExportButtons({ data, filename }: ExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <button onClick={() => exportToCSV(data, filename)} className={btnClass}>
        <FileDown className="w-3.5 h-3.5" />
        CSV
      </button>
      <button onClick={() => exportToExcel(data, filename)} className={btnClass}>
        <FileDown className="w-3.5 h-3.5" />
        Excel
      </button>
    </div>
  );
}
