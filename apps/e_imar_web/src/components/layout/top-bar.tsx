"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, HelpCircle, UserCircle2, Box, Database, Activity } from "lucide-react";
import { BrandMark } from "@/components/layout/brand-mark";
import { GlobalSearch } from "@/components/search/global-search";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { BasemapSwitcher } from "@/components/map/basemap-switcher";
import { HeaderBreadcrumb } from "@/components/layout/header-breadcrumb";
import { IconButton } from "@/components/ui/icon-button";
import { useUIStore } from "@/stores/ui-store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { useActiveAski, useSourceHealth } from "@/lib/api/hooks";
import { ASKI_LIST } from "@/data/aski-list";

export function TopBar({ onOpenMobileMenu }: { onOpenMobileMenu?: () => void }) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const askiQuery = useActiveAski();
  const healthQuery = useSourceHealth();
  const activeAskiCount = askiQuery.data?.ok ? askiQuery.data.data.count : ASKI_LIST.length;
  const backendAskiOffline = !askiQuery.data?.ok || askiQuery.data.data.status !== "ok";
  const healthRollup = healthQuery.data?.ok ? healthQuery.data.data.rollup : null;
  const okSources = healthRollup?.ok ?? 0;
  const totalSources = healthQuery.data?.ok ? healthQuery.data.data.total : 0;

  return (
    <header
      className="fixed top-0 inset-x-0 z-40 h-14 flex items-stretch bg-surface-2 border-b border-border-subtle"
      role="banner"
    >
      <div className="flex items-center gap-2 px-3 min-w-[280px] border-r border-border-subtle">
        <button
          type="button"
          aria-label="Menüyü aç"
          onClick={onOpenMobileMenu ?? toggleSidebar}
          className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-md text-fg-secondary hover:bg-surface-1"
        >
          <Menu className="h-4 w-4" />
        </button>
        <BrandMark />
      </div>

      <div className="hidden md:flex items-center gap-3 px-4 border-r border-border-subtle min-w-0">
        <HeaderBreadcrumb />
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-1 px-2 border-l border-border-subtle">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/kaynaklar"
              className="hidden md:inline-flex h-8 items-center gap-1.5 rounded-md border border-border-subtle bg-surface-1 px-2 text-[11px] text-fg-secondary hover:bg-surface-2"
            >
              <Activity className="h-3.5 w-3.5" />
              <span className="font-medium text-fg-primary">{okSources}/{totalSources || Object.keys(ASKI_LIST).length} kaynak aktif</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">Canlı kaynak sağlık özeti</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/kaynaklar"
              className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-md border border-border-subtle bg-surface-1 px-2 text-[11px] text-fg-secondary hover:bg-surface-2"
            >
              <Database className="h-3.5 w-3.5" />
              <span className="font-medium text-fg-primary">{activeAskiCount} aktif askı</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {backendAskiOffline ? "Backend offline; sayaç statik fallback gösteriyor" : "Backend agregasyonundan canlı askı sayısı"}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="hidden sm:inline-flex">
              <button
                type="button"
                aria-label="3D Mod (yakında)"
                disabled
                className="h-8 w-8 inline-flex items-center justify-center rounded text-fg-muted/70 border border-border-subtle bg-surface-1 cursor-not-allowed"
              >
                <Box className="h-4 w-4" />
              </button>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">3D modu — yakında</TooltipContent>
        </Tooltip>
        <span className="hidden sm:inline-flex">
          <BasemapSwitcher />
        </span>
        <ThemeToggle />
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <IconButton label="Yardım" variant="ghost">
                <HelpCircle className="h-4 w-4" />
              </IconButton>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">Yardım & Klavye Kısayolları</TooltipContent>
        </Tooltip>
        <IconButton label="Profil" variant="ghost">
          <UserCircle2 className="h-4 w-4" />
        </IconButton>
      </div>
    </header>
  );
}
