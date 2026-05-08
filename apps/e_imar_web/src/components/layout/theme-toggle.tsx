"use client";

import * as React from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/use-mounted";
import { IconButton } from "@/components/ui/icon-button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  function cycle() {
    const order = ["light", "dark", "system"] as const;
    const current = (theme ?? "system") as (typeof order)[number];
    const idx = order.indexOf(current);
    const next = order[(idx + 1) % order.length];
    setTheme(next);
  }

  if (!mounted) {
    return (
      <span
        aria-hidden
        className="h-8 w-8 inline-flex items-center justify-center rounded text-fg-muted/70 border border-transparent"
      >
        <Laptop className="h-4 w-4" />
      </span>
    );
  }

  const label =
    theme === "dark"
      ? "Tema: Karanlık"
      : theme === "light"
      ? "Tema: Aydınlık"
      : "Tema: Sistem";

  const icon =
    theme === "system" ? (
      <Laptop className="h-4 w-4" />
    ) : (resolvedTheme ?? theme) === "dark" ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Sun className="h-4 w-4" />
    );

  return (
    <IconButton label={label} variant="ghost" onClick={cycle} aria-label={label}>
      {icon}
    </IconButton>
  );
}
