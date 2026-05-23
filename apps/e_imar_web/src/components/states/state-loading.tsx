"use client";

import * as React from "react";
import { StateCard } from "./state-card";

export function StateLoading({
  title = "Veri yükleniyor",
  description = "Canlı backend yanıtı bekleniyor.",
  className,
  compact
}: {
  title?: string;
  description?: string;
  className?: string;
  compact?: boolean;
}) {
  return <StateCard kind="loading" title={title} description={description} className={className} compact={compact} />;
}
