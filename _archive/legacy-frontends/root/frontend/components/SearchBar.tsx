"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, onSubmit, placeholder = "Ara..." }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        placeholder={placeholder}
        className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-cyan)]/50 transition-colors"
      />
    </div>
  );
}
