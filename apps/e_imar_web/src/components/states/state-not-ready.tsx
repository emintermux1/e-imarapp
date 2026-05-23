"use client";

import * as React from "react";
import { StateCard } from "./state-card";

export function StateNotReady({
  title = "Servis hazır değil",
  description = "Bu endpoint için gerekli canlı veri veya altyapı henüz bağlı değil.",
  action,
  className,
  compact
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return <StateCard kind="not_ready" title={title} description={description} action={action} className={className} compact={compact} />;
}
