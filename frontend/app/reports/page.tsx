"use client";

import { ReportGenerator } from "@/components/ReportGenerator";
import { FileText } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <FileText size={20} className="text-[var(--accent-cyan)]" />
        <h1 className="text-2xl font-bold">Raporlar</h1>
      </div>
      <ReportGenerator />
    </div>
  );
}
