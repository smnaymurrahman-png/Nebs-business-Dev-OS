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
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        CSV
      </button>
      <button
        onClick={() => exportToExcel(data, filename)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Excel
      </button>
    </div>
  );
}
