"use client";

import * as React from "react";
import { TimelinePanel } from "@/components/gis/timeline-panel";
import { PlanChangeCard } from "@/components/gis/plan-change-card";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function SectionGecmis() {
  return (
    <div className="flex flex-col gap-3">
      <TimelinePanel summary="2018 → 2024 arası 2 plan revizyonu" />
      <PlanChangeCard />
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">
            <Button variant="outline" disabled className="w-full">
              <History className="h-4 w-4" />
              Time Machine&apos;i Aç
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Yakında — Task 2&apos;de aktifleşecek
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
