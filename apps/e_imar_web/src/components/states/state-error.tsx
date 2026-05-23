"use client";

import * as React from "react";
import { StateCard } from "./state-card";

export function StateError({
  title = "İstek tamamlanamadı",
  description = "İşlem sırasında hata oluştu.",
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
  return <StateCard kind="error" title={title} description={description} action={action} className={className} compact={compact} />;
}
