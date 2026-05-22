"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string | number;
}

export function DataTable<T>({ columns, data, keyExtractor }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const av = (a as Record<string, unknown>)[sortKey];
    const bv = (b as Record<string, unknown>)[sortKey];
    if (av == null) return sortDir === "asc" ? -1 : 1;
    if (bv == null) return sortDir === "asc" ? 1 : -1;
    if (typeof av === "number" && typeof bv === "number") {
      return sortDir === "asc" ? av - bv : bv - av;
    }
    return sortDir === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });

  return (
    <div className="overflow-x-auto border border-[var(--border-subtle)] rounded-xl">
      <table className="w-full text-sm text-left">
        <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors"
                onClick={() => handleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {sortKey === col.key && (
                    sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={keyExtractor(row)}
              className="border-t border-[var(--border-subtle)] hover:bg-white/[0.02] transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-[var(--text-primary)]">
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-[var(--text-secondary)]">
                Veri bulunamadı
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
