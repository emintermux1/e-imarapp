"use client";

import * as React from "react";
import { Download, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getBackendReport } from "@/lib/api/backend-client";

interface Props {
  reportId: number;
  pdfUrl?: string;
  className?: string;
}

export function ReportDownloadButton({ reportId, pdfUrl, className }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDownload = async () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
      return;
    }
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const report = await getBackendReport(reportId);
      if (report.pdf_url) {
        window.open(report.pdf_url, "_blank");
      } else {
        setError("PDF linki henüz oluşmadı. Rapor işlenme aşamasında.");
      }
    } catch {
      setError("Rapor durumu alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Button
        onClick={handleDownload}
        disabled={loading}
        size="sm"
        className="gap-1.5"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="h-3.5 w-3.5" />
        )}
        {loading ? "Kontrol ediliyor…" : "PDF İndir"}
      </Button>
      {error && (
        <p className="text-[10px] text-status-error/80 flex items-center gap-1">
          <FileText className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
